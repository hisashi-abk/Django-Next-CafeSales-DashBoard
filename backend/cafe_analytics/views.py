from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Sum, Avg, F, Window
from django.db.models.functions import TruncHour, TruncDate, Cast, ExtractHour, Coalesce
from django.db.models.expressions import Value
from .models import Order, MenuItem, OrderItem, Category
from .serializers import (
    OrderSerializer, MenuItemSerializer, CategorySerializer,
    GenderSerializer, OrderTypeSerializer, WeatherTypeSerializer, TimeSlotSerializer
)

class DashboardViewSet(viewsets.ViewSet):
    """ダッシュボード表示用のビュー"""

    @action(detail=False, methods=['get'])
    def overview(self, request):
        """ダッシュボード概要データを取得"""
        # 基本的な統計情報を取得
        overview_data = {
            'sales_summary': self._get_sales_summary(),
            'top_categories': self._get_top_categories(limit=5),
            'recent_orders': self._get_recent_orders(limit=5),
            'peak_hours': self._get_peak_hours()
        }
        return Response(overview_data)

    def _get_sales_summary(self):
        return Order.objects.aggregate(
            total_amount=Sum('total_price'),
            total_orders=Count('id'),
            avg_order_value=Avg('total_price'),
            total_discount=Sum('discount'),
            net_sales=Sum(F('total_price') - F('discount'))
        )

    def _get_top_categories(self, limit=5):
        return OrderItem.objects.values(
            'menu_item__category__name'
        ).annotate(
            total_sales=Sum('price'),
            items_sold=Count('id')
        ).order_by('-total_sales')[:limit]

    def _get_recent_orders(self, limit=5):
        return Order.objects.order_by('-timestamp')[:limit].values(
            'id', 'timestamp', 'total_price', 'order_type__name'
        )

    def _get_peak_hours(self):
        return Order.objects.annotate(
            hour=ExtractHour('timestamp')
        ).values('hour').annotate(
            order_count=Count('id'),
            total_sales=Sum('total_price')
        ).order_by('hour')

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
        """商品の組み合わせ分析を取得"""
        # 既存のcombo_analysis実装をそのまま使用
        return super().combo_analysis(request)

# 既存のViewSetはそのまま維持
class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().prefetch_related('items')
    serializer_class = OrderSerializer

class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
