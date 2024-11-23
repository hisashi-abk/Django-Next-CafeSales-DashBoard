from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Sum, Avg, F, Window
from django.db.models.functions import TruncHour, TruncDate, Cast,ExtractHour, Coalesce
from django.db.models.expressions import Value
from .models import Order, MenuItem, OrderItem, Category
from .serializers import(
    OrderSerializer, MenuItemSerializer, CategorySerializer,
    GenderSerializer, OrderTypeSerializer, WeatherTypeSerializer, TimeSlotSerializer
)


class DashboardViewSet(viewsets.ViewSet):
    """ダッシュボード表示用のビュー"""
    @action(detail=False, methods=['get'])
    def sales_summary(self, request):
        """売上統計を取得"""
        total_sales = Order.objects.aggregate(
            total_amount=Sum('total_price'),
            total_orders=Count('id'),
            avg_order_value=Avg('total_price'),
            total_discount=Sum('discount'),
            net_sales=Sum(F('total_price') - F('discount'))
        )
        return Response(total_sales)

    @action(detail=False, methods=['get'])
    def category_sales(self, request):
        """カテゴリー別の売上データを取得"""
        category_data = OrderItem.objects.values(
            'menu_item__category__name'
        ).annotate(
            total_sales=Sum('price'),
            items_sold=Count('id'),
            avg_item_price=Avg('price'),
        ).order_by('-total_sales')
        return Response(category_data)

    @action(detail=False, methods=['get'])
    def sales_by_weather(self, request):
        """天気別の売上データを取得"""
        weather_data = Order.objects.values(
            'weather__name'
        ).annotate(
            total_sales=Sum('total_price'),
            order_count=Count('id'),
            avg_order_value=Avg('total_price'),
            total_discount=Sum('discount'),
        ).order_by('-total_sales')
        return Response(weather_data)

    @action(detail=False, methods=['get'])
    def sales_by_gender(self, request):
        """性別別の売上分析を取得"""
        gender_data = Order.objects.values(
            'gender__name'
        ).annotate(
            total_sales=Sum('total_price'),
            order_count=Count('id'),
            avg_order_value=Avg('total_price'),
            total_discount=Sum('discount'),
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

    @action(detail=False, methods=['get'])
    def bestsellers(self, request):
        """ベストセラーランキングを取得"""
        bestsellers = OrderItem.objects.values(
            'menu_item__name',
            'menu_item__category__name'
        ).annotate(
            total_quantity=Count('id'),
            total_sales=Sum('price'),
            avg_price=Avg('price')
        ).order_by('-total_quantity')[:10]
        return Response(bestsellers)

    @action(detail=False, methods=['get'])
    def discount_analysis(self, request):
        """割引効果の分析を取得"""
        discount_data = Order.objects.exclude(discount=0).values(
            'time_slot__name'
        ).annotate(
            total_orders=Count('id'),
            total_discount=Sum('discount'),
            avg_discount=Avg('discount'),
            total_sales_before_discount= Sum('total_price'),
            total_sales_after_discount= Sum(F('total_price') - F('discount'))
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
    def combo_analysis(self, request):
        """よく一緒に注文される商品の組み合わせ分析を取得"""
        # 同じ注文ないの商品の組み合わせを分岐
        from django.db import Q

        combos = OrderItem.objects.values(
            'order_id'
        ).annotate(
            order_count=Count('id')
        ).filter(
            order_count__gte=2 # 二つ以上のアイテムがある注文に限定
        ).value_list('order_id', flat=True)

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
    """Order モデルとのリレーションを持つ ViewSet"""
    queryset = Order.objects.all().prefetch_related('items')
    serializer_class = OrderSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # 日付範囲でフィルタリング
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        if start_date and end_date:
            queryset = queryset.filter(timestamp__range= [start_date, end_date])

        # 時間帯でフィルタリング
        time_slot = self.request.query_params.get('time_slot', None)
        if time_slot:
            queryset = queryset.filter(time_slot_id=time_slot)

        # 性別でフィルタリング
        gender = self.request.query_params.get('gender', None)
        if gender:
            queryset = queryset.filter(gender_id=gender)

        # 天気でフィルタリング
        weather = self.request.query_params.get('weather', None)
        if weather:
            queryset = queryset.filter(weather_id=weather)

        # 注文種別でフィルタリング
        order_type = self.request.query_params.get('order_type', None)
        if order_type:
            queryset = queryset.filter(order_type_id=order_type)

        return queryset


class MenuItemViewSet(viewsets.ModelViewSet):
    """MenuItem モデルとのリレーションを持つ ViewSet"""
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
