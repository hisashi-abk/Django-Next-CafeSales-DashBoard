from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from .models import Order, MenuItem
from .serializers import OrderSerializer, MenuItemSerializer
from .services.dashboard_service import DashboardService
from .services.sales_service import SalesService
from .services.product_service import ProductService
from .services.order_service import OrderService


class DashboardViewSet(viewsets.ViewSet):
    """ダッシュボード表示用のビュー"""

    @action(detail=False, methods=['get'])
    def daily_dashboard(self, request: Request) -> Response:
        """デイリーダッシュボード用のデータを取得"""
        date_str = request.query_params.get('date')
        target_date = OrderService.get_target_date(date_str)

        if not target_date:
            return Response({"error": "Invalid date format"}, status=400)

        dashboard_data = DashboardService.get_daily_dashboard(target_date)
        return Response(dashboard_data)

    @action(detail=False, methods=['get'])
    def weekly_dashboard(self, request: Request) -> Response:
        """ウィークリーダッシュボード用のデータを取得"""
        date_str = request.query_params.get('date')
        target_date = OrderService.get_target_date(date_str)

        if not target_date:
            return Response({"error": "Invalid date format"}, status=400)

        dashboard_data = DashboardService.get_weekly_dashboard(target_date)
        return Response(dashboard_data)

    @action(detail=False, methods=['get'])
    def monthly_dashboard(self, request: Request) -> Response:
        """マンスリーダッシュボード用のデータを取得"""
        date_str = request.query_params.get('date')
        target_date = OrderService.get_target_date(date_str)

        if not target_date:
            return Response({"error": "Invalid date format"}, status=400)

        dashboard_data = DashboardService.get_monthly_dashboard(target_date)
        return Response(dashboard_data)

    @action(detail=False, methods=['get'])
    def daily_sales(self, request: Request) -> Response:
        """日次の売上データを取得"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        period_sales = SalesService.get_period_sales('daily', start_date, end_date)
        return Response(period_sales)

    @action(detail=False, methods=['get'])
    def weekly_sales(self, request: Request) -> Response:
        """週次の売上データを取得"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        period_sales = SalesService.get_period_sales('weekly', start_date, end_date)
        return Response(period_sales)

    @action(detail=False, methods=['get'])
    def monthly_sales(self, request: Request) -> Response:
        """月次の売上データを取得"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        period_sales = SalesService.get_period_sales('monthly', start_date, end_date)
        return Response(period_sales)


class SalesAnalysisViewSet(viewsets.ViewSet):
    """売上分析用のビュー"""

    @action(detail=False, methods=['get'])
    def sales_summary(self, request):
        """売上サマリーを取得"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        return Response(SalesService.get_sales_summary(start_date, end_date))

    @action(detail=False, methods=['get'])
    def category_sales(self, request):
        """カテゴリー別売上を取得"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        return Response(SalesService.get_top_categories(limit=None, start_date=start_date, end_date=end_date))

    @action(detail=False, methods=['get'])
    def sales_by_weather(self, request):
        """天気別売上を取得"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        return Response(SalesService.get_sales_by_factor('weather', 'weather__name', start_date, end_date))

    @action(detail=False, methods=['get'])
    def sales_by_gender(self, request):
        """性別別売上を取得"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        return Response(SalesService.get_sales_by_factor('gender', 'gender__name', start_date, end_date))

    @action(detail=False, methods=['get'])
    def weather_timeslot_analysis(self, request):
        """天気と時間帯のクロス分析を取得"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        return Response(SalesService.get_weather_timeslot_analysis(start_date, end_date))


class ProductAnalysisViewSet(viewsets.ViewSet):
    """商品分析用のビュー"""

    @action(detail=False, methods=['get'])
    def bestsellers(self, request):
        """ベストセラー商品を取得"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        limit = int(request.query_params.get('limit', 10))
        return Response(ProductService.get_bestsellers(limit, start_date, end_date))

    @action(detail=False, methods=['get'])
    def discount_analysis(self, request):
        """割引分析を取得"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        return Response(ProductService.get_discount_analysis(start_date, end_date))

    @action(detail=False, methods=['get'])
    def dine_in_popular_items(self, request):
        """店内飲食の時間帯ごとの人気メニューランキングを取得"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        return Response(ProductService.get_dine_in_popular_by_timeslot(start_date, end_date))

    @action(detail=False, methods=['get'])
    def dine_in_popular(self, request):
        """店内飲食の人気商品を取得"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        limit = int(request.query_params.get('limit', 10))
        return Response(ProductService.get_popular_items_by_type(order_type_id=1, limit=limit, start_date=start_date, end_date=end_date))

    @action(detail=False, methods=['get'])
    def takeout_popular(self, request):
        """テイクアウトの人気商品を取得"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        limit = int(request.query_params.get('limit', 10))
        return Response(ProductService.get_popular_items_by_type(order_type_id=2, limit=limit, start_date=start_date, end_date=end_date))

    @action(detail=False, methods=['get'])
    def combo_analysis(self, request):
        """よく一緒に注文される商品の組み合わせ分析を取得"""
        min_occurrence = int(request.query_params.get('min_occurrence', 2))
        limit = int(request.query_params.get('limit', 10))
        return Response(ProductService.get_combo_analysis(min_occurrence, limit))


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().prefetch_related('items').order_by('timestamp')
    serializer_class = OrderSerializer


class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
