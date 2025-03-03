from typing import Dict, List, Optional, Union, Any
from datetime import date, datetime, timedelta

from django.db.models import QuerySet, Max
from django.utils import timezone
from django.utils.dateparse import parse_date

from cafe_analytics.models import Order
from cafe_analytics.serializers import OrderSerializer
from . import BaseService

class OrderService(BaseService):
    """注文に関連するビジネスロジックを提供"""

    @staticmethod
    def get_latest_order_date() -> Optional[date]:
        """最新の注文日を取得"""
        return Order.objects.aggregate(
            latest_date=Max('timestamp__date')
        )['latest_date']

    @staticmethod
    def get_target_date(date_str: Optional[str] = None) -> Optional[date]:
        """
        リクエストから対象日を取得する
        指定がない場合は最新の注文日を返す
        """
        if date_str:
            try:
                return parse_date(date_str)
            except ValueError:
                return None
        else:
            latest_date = OrderService.get_latest_order_date()
            return latest_date if latest_date else timezone.now().date()

    @staticmethod
    def get_date_range(target_date: date, period: str) -> tuple[date, date]:
        """期間の開始日と終了日を計算"""
        if period == 'week':
            start_date = target_date - timedelta(days=target_date.weekday())
            end_date = start_date + timedelta(days=6)
        elif period == 'month':
            start_date = target_date.replace(day=1)
            # 次月の1日から1日引いて当月末日を取得
            next_month = (target_date.replace(day=28) + timedelta(days=4)).replace(day=1)
            end_date = next_month - timedelta(days=1)
        else:  # daily
            start_date = end_date = target_date
        return start_date, end_date

    @staticmethod
    def get_orders_in_period(start_date: date, end_date: date) -> QuerySet:
        """指定された期間の注文クエリセットを取得"""
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

    @staticmethod
    def get_orders_summary(orders: QuerySet) -> List[Dict[str, Any]]:
        """注文一覧の詳細データを取得"""
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

    @staticmethod
    def get_customer_demographics(orders: QuerySet) -> Dict[str, Any]:
        """顧客の人口統計学的分析"""
        from django.db.models import Count

        return {
            'gender_distribution': list(orders.values('gender__name').annotate(
                count=Count('id')
            )),
        }

    @staticmethod
    def get_weather_distribution(orders: QuerySet) -> List[Dict[str, Any]]:
        """指定された注文の天気分布を取得"""
        from django.db.models import Count

        return list(orders
            .values('weather__name')
            .annotate(count=Count('id'))
            .order_by('-count'))
