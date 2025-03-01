from typing import Dict, List, Optional, TypedDict, Union, Any
from datetime import date, datetime, timedelta
from decimal import Decimal

from django.db.models import Sum, Count, Avg, F, ExpressionWrapper, DecimalField, Max, QuerySet
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth, ExtractHour
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from django.utils import timezone
from django.utils.dateparse import parse_date

from .models import Order, OrderItem, MenuItem, WeatherType, OrderType, Gender
from .serializers import OrderSerializer, MenuItemSerializer

# 型定義
class SalesSummary(TypedDict):
    total_amount: Decimal
    total_orders: int
    avg_order_value: Decimal
    total_discount: Decimal
    net_sales: Decimal

class CategorySummary(TypedDict):
    menu_item__category__name: str
    total_sales: Decimal
    items_sold: int

class OrderSummary(TypedDict):
    id: int
    timestamp: datetime
    total_price: Decimal
    final_price: Decimal
    order_type__name: str
    gender__name: str
    weather__name: str

class HourlySales(TypedDict):
    hour: int
    total_sales: Decimal
    order_count: int

class CustomerDemographics(TypedDict):
    gender_distribution: List[Dict[str, Union[str, int]]]

class DashboardViewSet(viewsets.ViewSet):
    """ダッシュボード表示用のビュー"""

    def _get_date_range(self, target_date: date, period: str) -> tuple[date, date]:
        """期間の開始日と終了日を計算"""
        if period == 'week':
            start_date = target_date - timedelta(days=target_date.weekday())
            end_date = start_date + timedelta(days=6)
        elif period == 'month':
            start_date = target_date.replace(day=1)
            end_date = (start_date + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        else:  # daily
            start_date = end_date = target_date
        return start_date, end_date

    def _get_orders_in_period(self, start_date: date, end_date: date) -> QuerySet:
        """
        指定された期間の注文クエリセットを取得

        Args:
            start_date (date): 取得開始日
            end_date (date): 取得最終日

        Returns:
            QuerySet: _description_
        """
        return Order.objects.filter(
            timestamp__date__range=[start_date, end_date]
        ).select_related(
            'order_type',
            'weather',
            'gender',
            'time_slot',
        ).prefetch_related(
            'items__menu_item__category'
        )

    def _get_sales_summary(self, start_date: Optional[date] = None, end_date: Optional[date] = None) -> SalesSummary:
        """基本的な売上サマリーを取得"""
        queryset = Order.objects.all()

        if start_date:
            queryset = queryset.filter(timestamp__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(timestamp__date__lte=end_date)

        return queryset.aggregate(
            total_amount=Sum('total_price'),
            total_orders=Count('id'),
            avg_order_value=Avg('total_price'),
            total_discount=Sum('discount'),
            net_sales=Sum(F('total_price') - F('discount'))
        )

    def _get_top_categories(
        self,
        limit: int = 5,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[CategorySummary]:
        """トップカテゴリーを取得"""
        queryset = OrderItem.objects.all()

        if start_date:
            queryset = queryset.filter(order__timestamp__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(order__timestamp__date__lte=end_date)

        return list(queryset.values(
            'menu_item__category__name'
        ).annotate(
            total_sales=Sum('price'),
            items_sold=Count('id')
        ).order_by('-total_sales')[:limit])

    def _get_weather_distribution(self, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """指定された期間の天気分布を取得"""
        return list(self._get_orders_in_period(start_date, end_date)
            .values('weather__name')
            .annotate(count=Count('id'))
            .order_by('-count'))

    def _calculate_takeout_rate(self, orders: QuerySet) -> float:
        """テイクアウト率を計算"""
        total_orders = orders.count()
        takeout_orders = orders.filter(order_type__name='テイクアウト').count()
        return (takeout_orders / total_orders * 100) if total_orders > 0 else 0

    def _get_orders_summary(self, orders: QuerySet) -> List[OrderSummary]:
        """
        注文一覧の詳細データを取得

        Args:
            orders (QuerySet): 注文のクエリセット

        Returns:
            List[Dict[str, Any]]: 注文の詳細データリスト
        """
        # 必要なリレーションを事前に取得
        orders = orders.prefetch_related(
            'items',
            'items__menu_item',
            'items__menu_item__category'
        ).select_related(
            'gender',
            'order_type',
            'weather',
            'time_slot',
        ).order_by('timestamp')

        # OrderSerializerを使用してシリアライズ
        serializer = OrderSerializer(orders, many=True)
        return serializer.data

    def _get_hourly_sales(self, orders: QuerySet) -> List[HourlySales]:
        """時間帯別の売上データを取得"""
        return list(orders.annotate(
            hour=ExtractHour('timestamp')
        ).values('hour').annotate(
            total_sales=Sum('total_price'),
            order_count=Count('id')
        ).order_by('hour'))

    def _get_customer_demographics(self, orders: QuerySet) -> CustomerDemographics:
        """顧客の人口統計学的分析"""
        return {
            'gender_distribution': list(orders.values('gender__name').annotate(
                count=Count('id')
            )),
        }

    def _get_period_sales(
        self,
        period: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """期間別の売上データを取得"""
        trunc_func = {
            'daily': TruncDate,
            'weekly': TruncWeek,
            'monthly': TruncMonth
        }.get(period, TruncDate)

        queryset = Order.objects.all()

        if start_date:
            start_date_obj = timezone.make_aware(
                datetime.combine(parse_date(start_date), datetime.min.time())
            )
            queryset = queryset.filter(timestamp__date__gte=start_date_obj)
        if end_date:
            end_date_obj = timezone.make_aware(
                datetime.combine(parse_date(end_date), datetime.max.time())
            )
            queryset = queryset.filter(timestamp__date__lte=end_date_obj)

        return list(queryset.annotate(
            period=trunc_func('timestamp')
        ).values('period').annotate(
            total_sales=Sum('total_price'),
            total_orders=Count('id'),
            avg_order_value=Avg('total_price'),
            total_discount=Sum('discount'),
            net_sales=Sum(
                ExpressionWrapper(
                    F('total_price') - F('discount'),
                    output_field=DecimalField()
                )
            )
        ).order_by('period'))

    @action(detail=False, methods=['get'])
    def daily_dashboard(self, request: Request) -> Response:
        """デイリーダッシュボード用のデータを取得"""
        latest_order_date = Order.objects.aggregate(
            latest_date=Max('timestamp__date')
        )['latest_date']

        date_str = request.query_params.get(
            'date',
            latest_order_date.isoformat() if latest_order_date else timezone.now().date().isoformat()
        )

        try:
            target_date = parse_date(date_str)
            orders = self._get_orders_in_period(target_date, target_date)
            sales_summary = self._get_sales_summary(target_date, target_date)

            return Response({
                'date': target_date,
                'sales_summary': sales_summary,
                'orders': self._get_orders_summary(orders),
                'takeout_rate': self._calculate_takeout_rate(orders),
                'popular_items': self._get_top_categories(limit=5, start_date=target_date, end_date=target_date),
                'customer_count': sales_summary['total_orders'],
                'avg_order_value': sales_summary['avg_order_value'],
                'total_discount': sales_summary['total_discount'],
                'hourly_sales': self._get_hourly_sales(orders),
                'customer_demographics': self._get_customer_demographics(orders)
            })
        except ValueError:
            return Response({"error": "Invalid date format"}, status=400)

    @action(detail=False, methods=['get'])
    def weekly_dashboard(self, request: Request) -> Response:
        """ウィークリーダッシュボード用のデータを取得"""
        latest_order_date = Order.objects.aggregate(
            latest_date=Max('timestamp__date')
        )['latest_date']

        date_str = request.query_params.get(
            'date',
            latest_order_date.isoformat() if latest_order_date else timezone.now().date().isoformat()
        )

        try:
            target_date = parse_date(date_str)
            start_date, end_date = self._get_date_range(target_date, 'week')
            orders = self._get_orders_in_period(start_date, end_date)
            sales_summary = self._get_sales_summary(start_date, end_date)

            return Response({
                'week_start': start_date,
                'week_end': end_date,
                'sales_summary': sales_summary,
                'weather_distribution': self._get_weather_distribution(start_date, end_date),
                'orders': self._get_orders_summary(orders),
                'takeout_rate': self._calculate_takeout_rate(orders),
                'popular_items': self._get_top_categories(limit=5, start_date=start_date, end_date=end_date),
                'customer_count': sales_summary['total_orders'],
                'avg_order_value': sales_summary['avg_order_value'],
                'total_discount': sales_summary['total_discount'],
                'daily_sales_breakdown': self._get_period_sales('daily', start_date.isoformat(), end_date.isoformat()),
                'customer_demographics': self._get_customer_demographics(orders)
            })
        except ValueError:
            return Response({"error": "Invalid date format"}, status=400)

    @action(detail=False, methods=['get'])
    def monthly_dashboard(self, request: Request) -> Response:
        """マンスリーダッシュボード用のデータを取得"""
        latest_order_date = Order.objects.aggregate(
            latest_date=Max('timestamp__date')
        )['latest_date']

        date_str = request.query_params.get(
            'date',
            latest_order_date.isoformat() if latest_order_date else timezone.now().date().isoformat()
        )

        try:
            target_date = parse_date(date_str)
            start_date, end_date = self._get_date_range(target_date, 'month')
            orders = self._get_orders_in_period(start_date, end_date)
            sales_summary = self._get_sales_summary(start_date, end_date)

            return Response({
                'month_start': start_date,
                'month_end': end_date,
                'sales_summary': sales_summary,
                'weather_distribution': self._get_weather_distribution(start_date, end_date),
                'orders': self._get_orders_summary(orders),
                'takeout_rate': self._calculate_takeout_rate(orders),
                'popular_items': self._get_top_categories(limit=5, start_date=start_date, end_date=end_date),
                'customer_count': sales_summary['total_orders'],
                'avg_order_value': sales_summary['avg_order_value'],
                'total_discount': sales_summary['total_discount'],
                'weekly_sales_breakdown': self._get_period_sales('weekly', start_date.isoformat(), end_date.isoformat()),
                'customer_demographics': self._get_customer_demographics(orders)
            })
        except ValueError:
            return Response({"error": "Invalid date format"}, status=400)

    @action(detail=False, methods=['get'])
    def daily_sales(self, request: Request) -> Response:
        """日次の売上データを取得"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        return Response(self._get_period_sales('daily', start_date, end_date))

    @action(detail=False, methods=['get'])
    def weekly_sales(self, request: Request) -> Response:
        """週次の売上データを取得"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        return Response(self._get_period_sales('weekly', start_date, end_date))

    @action(detail=False, methods=['get'])
    def monthly_sales(self, request: Request) -> Response:
        """月次の売上データを取得"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        return Response(self._get_period_sales('monthly', start_date, end_date))


class SalesAnalysisViewSet(viewsets.ViewSet):
    """売上分析用のビュー"""
    @action(detail=False, methods=['get'])
    def sales_summary(self, request):
        """売上サマリーを取得"""
        return Response(DashboardViewSet._get_sales_summary(self))

    @action(detail=False, methods=['get'])
    def category_sales(self, request):
        """カテゴリー別売上を取得"""
        category_data = OrderItem.objects.values(
            'menu_item__category__name'
        ).annotate(
            total_sales=Sum('price'),
            items_sold=Count('id'),
            avg_item_price=Avg('price')
        ).order_by('-total_sales')
        return Response(category_data)

    @action(detail=False, methods=['get'])
    def sales_by_weather(self, request):
        """天気別売上を取得"""
        weather_data = Order.objects.values(
            'weather__name'
        ).annotate(
            total_sales=Sum('total_price'),
            order_count=Count('id'),
            avg_order_value=Avg('total_price')
        ).order_by('-total_sales')
        return Response(weather_data)

    @action(detail=False, methods=['get'])
    def sales_by_gender(self, request):
        """性別別売上を取得"""
        gender_data = Order.objects.values(
            'gender__name'
        ).annotate(
            total_sales=Sum('total_price'),
            order_count=Count('id'),
            avg_order_value=Avg('total_price')
        ).order_by('-total_sales')
        return Response(gender_data)

    @action(detail=False, methods=['get'])
    def weather_timeslot_analysis(self, request):
        """天気と時間帯のクロス分析を取得"""
        cross_data = Order.objects.values(
            'weather__name', 'time_slot__name'
        ).annotate(
            total_sales=Sum('total_price'),
            order_count=Count('id'),
            avg_order_value=Avg('total_price'),
        ).order_by('weather__name', 'time_slot__name')
        return Response(cross_data)


class ProductAnalysisViewSet(viewsets.ViewSet):
    """商品分析用のビュー"""

    @action(detail=False, methods=['get'])
    def bestsellers(self, request):
        """ベストセラー商品を取得"""
        bestsellers = OrderItem.objects.values(
            'menu_item__category__name',
            'menu_item__name',
            'menu_item__price'
        ).annotate(
            total_quantity=Count('id'),
            total_sales=Sum('price')
        ).order_by('-total_quantity')[:10]
        return Response(bestsellers)

    @action(detail=False, methods=['get'])
    def discount_analysis(self, request):
        """割引分析を取得"""
        discount_data = Order.objects.exclude(discount=0).values(
            'time_slot__name'
        ).annotate(
            total_orders=Count('id'),
            total_discount=Sum('discount'),
            avg_discount=Avg('discount'),
            total_sales_before_discount=Sum('total_price'),
            total_sales_after_discount=Sum(F('total_price') - F('discount'))
        ).order_by('time_slot__name')
        return Response(discount_data)

    @action(detail=False, methods=['get'])
    def dine_in_popular_items(self, request):
        """店内飲食の時間帯ごとの人気メニューランキングを取得"""
        popular_items = OrderItem.objects.filter(
            order__order_type_id=1 # 店内飲食のorder_type_id
        ).values(
            'order__time_slot__name',
            'menu_item__name',
            'menu_item__category__name',
            'menu_item__price'
        ).annotate(
            total_orders=Count('id'),
            total_sales=Sum('price')
        ).order_by(
            'order__time_slot__name',
            '-total_orders'
        )

        # 時間帯ごとにTop5を抽出
        result={}
        current_slot = None
        current_items = []

        for item in popular_items:
            time_slot = item['order__time_slot__name']

            if current_slot != time_slot:
                if current_slot is not None:
                    result[current_slot] = current_items[:5]
                current_slot = time_slot
                current_items = []

            current_items.append({
                'category': item['menu_item__category__name'],
                'menu_item': item['menu_item__name'],
                'menu_item__price': item['menu_item__price'],
                'total_orders': item['total_orders'],
                'total_sales': item['total_sales'],
            })

        if current_slot is not None:
            result[current_slot] = current_items[:5]

        return Response(result)

    @action(detail=False, methods=['get'])
    def takeout_popular_items(self, request):
        """テイクアウトの人気メニューランキングを取得"""
        takeout_popular_items = OrderItem.objects.filter(
            order__order_type_id=2 # テイクアウトのorder_type_id
        ).values(
            'menu_item__category__name',
            'menu_item__name',
            'menu_item__price'
        ).annotate(
            total_orders=Count('id'),
            total_sales=Sum('price'),
        ).order_by(
            '-total_orders'
        )

        return Response(takeout_popular_items)

    @action(detail=False, methods=['get'])
    def dine_in_popular(self, request):
        """店内飲食の人気商品を取得"""
        popular_items = self._get_popular_items(order_type_id=1)
        return Response(popular_items)

    @action(detail=False, methods=['get'])
    def takeout_popular(self, request):
        """テイクアウトの人気商品を取得"""
        popular_items = self._get_popular_items(order_type_id=2)
        return Response(popular_items)

    def _get_popular_items(self, order_type_id):
        return OrderItem.objects.filter(
            order__order_type_id=order_type_id
        ).values(
            'menu_item__name',
            'menu_item__category__name',
            'menu_item__price'
        ).annotate(
            total_orders=Count('id'),
            total_sales=Sum('price')
        ).order_by('-total_orders')[:10]

    @action(detail=False, methods=['get'])
    def combo_analysis(self, request):
        """よく一緒に注文される商品の組み合わせ分析を取得"""
        # 同じ注文のない商品の組み合わせを分岐
        combos = OrderItem.objects.values(
            'order_id'
        ).annotate(
            order_count=Count('id')
        ).filter(
            order_count__gte=2 # 二つ以上のアイテムがある注文に限定
        ).values_list('order_id', flat=True)

        combo_results = []
        processed_pairs = set()

        for order_id in combos:
            items = OrderItem.objects.filter(
                order_id=order_id
            ).values_list('menu_item__name', flat=True)

            items = list(items)
            for i in range(len(items)):
                for j in range(i+1, len(items)):
                    pair = tuple(sorted([items[i], items[j]]))
                    if pair not in processed_pairs:
                        processed_pairs.add(pair)

                        # この組み合わせが出現する回数を計算
                        pair_count = OrderItem.objects.filter(
                            order_id__in=combos
                        ).filter(
                            menu_item__name__in=pair
                        ).values('order_id').annotate(
                            count=Count('id')
                        ).filter(count=2).count()

                        if pair_count >= 2: # 2回以上出現する組み合わせに限定
                            combo_results.append({
                                'items': pair,
                                'occurrence_count': pair_count
                            })

        return Response(sorted(combo_results, key=lambda x: x['occurrence_count'], reverse=True)[:10])


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().prefetch_related('items').order_by('timestamp')
    serializer_class = OrderSerializer


class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
