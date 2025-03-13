from typing import Dict, List, Optional, Union, Any
from datetime import date, datetime, timedelta
from decimal import Decimal

from django.db.models import Sum, Count, Avg, F, ExpressionWrapper, DecimalField, QuerySet
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from django.utils.dateparse import parse_date

from cafe_analytics.models import Order, OrderItem
from . import BaseService

class SalesService(BaseService):
    """
    売上分析に関連するビジネスロジックを提供
    """

    @staticmethod
    def get_sales_summary(start_date: Optional[Union[str, date]] = None, end_date: Optional[Union[str, date]] = None) -> Dict[str, Any]:
        """
        基本的な売上サマリーを取得

        Args:
            start_date (str or date, optional): 開始日. Defaults to None.
            end_date (str or date, optional): 終了日. Defaults to None.

        Returns:
            Dict[str, Any]: 売上サマリー
        """
        queryset = Order.objects.all()

        if start_date:
            start_date_obj = BaseService.parse_date_param(start_date)
            if start_date_obj:
                queryset = queryset.filter(timestamp__date__gte=start_date_obj)

        if end_date:
            end_date_obj = BaseService.parse_date_param(end_date)
            if end_date_obj:
                queryset = queryset.filter(timestamp__date__lte=end_date_obj)

        return queryset.aggregate(
            total_amount=Sum('total_price'),
            total_orders=Count('id'),
            avg_order_value=Avg('total_price'),
            total_discount=Sum('discount'),
            net_sales=Sum(F('total_price') - F('discount'))
        )

    @staticmethod
    def get_period_sales(
        period: str,
        start_date: Optional[Union[str, date]] = None,
        end_date: Optional[Union[str, date]] = None
        ) -> List[Dict[str, Any]]:
            """期間別の売上データを取得"""
            trunc_func = {
                'daily': TruncDate,
                'weekly': TruncWeek,
                'monthly': TruncMonth
            }.get(period, TruncDate)

            queryset = Order.objects.all()

            if start_date:
                start_date_obj = BaseService.parse_date_param(start_date)
                if start_date_obj:
                    queryset = queryset.filter(timestamp__date__gte=start_date_obj)

            if end_date:
                end_date_obj = BaseService.parse_date_param(end_date)
                if end_date_obj:
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

    @staticmethod
    def get_sales_by_factor(
        factor_field: str,
        factor_name_field: str,
        start_date: Optional[Union[str, date]] = None,
        end_date: Optional[Union[str, date]] = None
    ) -> List[Dict[str, Any]]:
        """指定された要素(天気や性別等)別の売上データを取得"""
        queryset = Order.objects.all()

        if start_date:
            start_date_obj = BaseService.parse_date_param(start_date)
            if start_date_obj:
                queryset = queryset.filter(timestamp__date__gte=start_date_obj)

        if end_date:
            end_date_obj = BaseService.parse_date_param(end_date)
            if end_date_obj:
                queryset = queryset.filter(timestamp__date__lte=end_date_obj)

        return list(queryset.values(
            factor_name_field
        ).annotate(
            total_sales=Sum('total_price'),
            total_orders=Count('id'),
            avg_order_value=Avg('total_price'),
        ).order_by('-total_sales'))

    @staticmethod
    def get_top_categories(
        limit: Optional[int] = 5,
        start_date: Optional[Union[str, date]] = None,
        end_date: Optional[Union[str, date]] = None
    ) -> List[Dict[str, Any]]:
        """トップカテゴリーを取得"""
        queryset = OrderItem.objects.all()

        if start_date:
            start_date_obj = BaseService.parse_date_param(start_date)
            if start_date_obj:
                queryset = queryset.filter(order__timestamp__date__gte=start_date_obj)

        if end_date:
            end_date_obj = BaseService.parse_date_param(end_date)
            if end_date_obj:
                queryset = queryset.filter(order__timestamp__date__lte=end_date_obj)

        result = queryset.values(
            'menu_item__category__name'
        ).annotate(
            total_sales=Sum('price'),
            items_sold=Count('id')
        ).order_by('-total_sales')

        # limitがNoneの場合は全てのカテゴリーを返す
        if limit is not None:
            result = result[:limit]

        return list(result)

    @staticmethod
    def calculate_takeout_rate(orders: QuerySet) -> float:
        """テイクアウト率を計算"""
        total_orders = orders.count()
        takeout_orders = orders.filter(order_type__name='テイクアウト').count()
        return (takeout_orders / total_orders * 100) if total_orders > 0 else 0

    @staticmethod
    def get_hourly_sales(orders: QuerySet) -> List[Dict[str, Any]]:
        """時間帯別の売上データを取得"""
        from django.db.models.functions import ExtractHour

        return list(orders.annotate(
            hour=ExtractHour('timestamp')
        ).values('hour').annotate(
            total_sales=Sum('total_price'),
            order_count=Count('id')
        ).order_by('hour'))

    @staticmethod
    def get_weather_timeslot_analysis(
        start_date: Optional[Union[str, date]] = None,
        end_date: Optional[Union[str, date]] = None
    ) -> List[Dict[str, Any]]:
        """天気と時間帯のクロス分析を取得"""
        queryset = Order.objects.all()

        if start_date:
            start_date_obj = BaseService.parse_date_param(start_date)
            if start_date_obj:
                queryset = queryset.filter(timestamp__date__gte=start_date_obj)

        if end_date:
            end_date_obj = BaseService.parse_date_param(end_date)
            if end_date_obj:
                queryset = queryset.filter(timestamp__date__lte=end_date_obj)

        return list(queryset.values(
            'weather__name',
            'time_slot__name'
        ).annotate(
            total_sales=Sum('total_price'),
            order_count=Count('id'),
            avg_order_value=Avg('total_price'),
        ).order_by('weather__name', 'time_slot__name'))
