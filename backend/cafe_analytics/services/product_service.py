from typing import Dict, List, Optional, Union, Any
from datetime import date, datetime, timedelta

from django.db.models import Count, Sum, Avg, F
from django.db.models.functions import ExtractHour
from django.utils.dateparse import parse_date

from cafe_analytics.models import OrderItem
from . import BaseService

class ProductService(BaseService):
    """商品分析に関連するビジネスロジックを提供"""

    @staticmethod
    def get_bestsellers(
        limit: int = 10,
        start_date: Optional[Union[str, date]] = None,
        end_date: Optional[Union[str, date]] = None
    ) -> List[Dict[str, Any]]:
        """ベストセラー商品を取得"""
        queryset = OrderItem.objects.all()

        if start_date:
            start_date_obj = BaseService.parse_date_param(start_date)
            if start_date_obj:
                queryset = queryset.filter(order__timestamp__date__gte=start_date_obj)

        if end_date:
            end_date_obj = BaseService.parse_date_param(end_date)
            if end_date_obj:
                queryset = queryset.filter(order__timestamp__date__lte=end_date_obj)

        bestsellers = queryset.values(
            'menu_item__category__name',
            'menu_item__name',
            'menu_item__price'
        ).annotate(
            total_quantity=Count('id'),
            total_sales=Sum('price')
        ).order_by('-total_quantity')[:limit]

        return list(bestsellers)

    @staticmethod
    def get_popular_items_by_type(
        order_type_id: int,
        limit: int = 10,
        start_date: Optional[Union[str, date]] = None,
        end_date: Optional[Union[str, date]] = None
    ) -> List[Dict[str, Any]]:
        """指定された注文タイプの人気商品を取得"""
        queryset = OrderItem.objects.filter(
            order__order_type_id=order_type_id
        )

        if start_date:
            start_date_obj = BaseService.parse_date_param(start_date)
            if start_date_obj:
                queryset = queryset.filter(order__timestamp__date__gte=start_date_obj)

        if end_date:
            end_date_obj = BaseService.parse_date_param(end_date)
            if end_date_obj:
                queryset = queryset.filter(order__timestamp__date__lte=end_date_obj)

        return list(queryset.values(
            'menu_item__name',
            'menu_item__category__name',
            'menu_item__price'
        ).annotate(
            total_orders=Count('id'),
            total_sales=Sum('price')
        ).order_by('-total_orders')[:limit])

    @staticmethod
    def get_dine_in_popular_by_timeslot(
        start_date: Optional[Union[str, date]] = None,
        end_date: Optional[Union[str, date]] = None
    ) -> Dict[str, List[Dict[str, Any]]]:
        """店内飲食の時間帯ごとの人気メニューランキングを取得"""
        queryset = OrderItem.objects.filter(
            order__order_type_id=1  # 店内飲食のorder_type_id
        )

        if start_date:
            start_date_obj = BaseService.parse_date_param(start_date)
            if start_date_obj:
                queryset = queryset.filter(order__timestamp__date__gte=start_date_obj)

        if end_date:
            end_date_obj = BaseService.parse_date_param(end_date)
            if end_date_obj:
                queryset = queryset.filter(order__timestamp__date__lte=end_date_obj)

        popular_items = queryset.values(
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
        result = {}
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

        return result

    @staticmethod
    def get_discount_analysis(
        start_date: Optional[Union[str, date]] = None,
        end_date: Optional[Union[str, date]] = None
    ) -> List[Dict[str, Any]]:
        """割引分析を取得"""
        from cafe_analytics.models import Order

        queryset = Order.objects.exclude(discount=0)

        if start_date:
            start_date_obj = BaseService.parse_date_param(start_date)
            if start_date_obj:
                queryset = queryset.filter(timestamp__date__gte=start_date_obj)

        if end_date:
            end_date_obj = BaseService.parse_date_param(end_date)
            if end_date_obj:
                queryset = queryset.filter(timestamp__date__lte=end_date_obj)

        discount_data = queryset.values(
            'time_slot__name'
        ).annotate(
            total_orders=Count('id'),
            total_discount=Sum('discount'),
            avg_discount=Avg('discount'),
            total_sales_before_discount=Sum('total_price'),
            total_sales_after_discount=Sum(F('total_price') - F('discount'))
        ).order_by('time_slot__name')

        return list(discount_data)

    @staticmethod
    def get_combo_analysis(min_occurrence: int = 2, limit: int = 10) -> List[Dict[str, Any]]:
        """よく一緒に注文される商品の組み合わせ分析を取得"""
        from django.db.models import Count
        from cafe_analytics.models import OrderItem

        # 同じ注文のない商品の組み合わせを分岐
        combos = OrderItem.objects.values(
            'order_id'
        ).annotate(
            order_count=Count('id')
        ).filter(
            order_count__gte=2  # 二つ以上のアイテムがある注文に限定
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

                        if pair_count >= min_occurrence:
                            combo_results.append({
                                'items': pair,
                                'occurrence_count': pair_count
                            })

        return sorted(combo_results, key=lambda x: x['occurrence_count'], reverse=True)[:limit]
