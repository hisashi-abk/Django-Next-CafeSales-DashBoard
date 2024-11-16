from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import (
    Count, Sum, Avg, F, Q,
    FloatField, ExpressionWrapper
)
from django.db.models.functions import (
    TruncHour, TruncDate, Cast, ExtractHour
)
from datetime import datetime, timedelta
from django.utils import timezone
from .models import Order, MenuItem, OrderItem
from .serializers import OrderSerializer, MenuItemSerializer


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-timestamp')
    serializer_class = OrderSerializer


@api_view(['GET'])
def dashboard(request):
    """ダッシュボード用の集計データを返すエンドポイント"""
    # 期間の設定
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)

    orders = Order.objects.filter(
        timestamp__range=(start_date, end_date)
    )

    # 売上概要
    sales_summary = {
        'total_sales': orders.aggregate(total=Sum('total_price'))['total'] or 0,
        'total_orders': orders.count(),
        'average_order_value': orders.aggregate(avg=Avg('total_price'))['avg'] or 0,
        'total_discount': orders.aggregate(total=Sum('discount'))['total'] or 0,
    }

    # 時間帯別売上
    hourly_sales = orders.annotate(
        hour=ExtractHour('timestamp')
    ).values('hour').annotate(
        sales=Sum('total_price'),
        orders=Count('id')
    ).order_by('hour')

    # カテゴリー別売上
    category_sales = OrderItem.objects.filter(
        order__in=orders
    ).values(
        category_name=F('menu_item__category__name'),
    ).annotate(
        sales=Sum('price'),
        orders=Count('id')
    )

    # 天気別売上
    weather_sales = orders.values(
        'weather__name'
    ).annotate(
        sales=Sum('total_price'),
        orders=Count('id')
    )

    # 時間帯別売上
    timeslot_sales = orders.values(
        'time_slot__name'
    ).annotate(
        sales=Sum('total_price'),
        orders=Count('id')
    )

    return Response({
        'summary': sales_summary,
        'hourly_sales': hourly_sales,
        'category_sales': category_sales,
        'weather_sales': weather_sales,
        'timeslot_sales': timeslot_sales,
    })

@api_view(['GET'])
def trending_items(request):
    """人気メニューの集計データを返すエンドポイント"""
    # 期間の設定
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)

    trending = OrderItem.objects.filter(
        order__timestamp__range=(start_date, end_date)
    ).values(
        'menu_item__name',
        'menu_item__category__name',
    ).annotate(
        total_orders=Count('id'),
        total_sales=Sum('price')
    ).order_by('-total_orders')[:10]

    return Response(trending)


@api_view(['GET'])
def daily_summary(request):
    """日別売上の集計データを返すエンドポイント"""
    # 期間の設定
    today = timezone.now().date()
    yesterday = today - timedelta(days=1)

    # 本日のデータ
    today_data = Order.objects.filter(timestamp__date=today)
    today_summary = {
        'total_sales': today_data.aggregate(total=Sum('total_price'))['total'] or 0,
        'customer_count': today_data.count(),
        'average_spend': today_data.aggregate(
            avg=Avg('total_price')
        )['avg'] or 0,
        'takeout_rate': (
            today_data.filter(order_type__name='takeout').count() /
            max(today_data.count(), 1) * 100
        ),
    }

    # 前日比の計算
    yesterday_data = Order.objects.filter(timestamp__date=yesterday)
    yesterday_sales = yesterday_data.aaggregate(
        total=Sum('total_price')
    )['total'] or 0

    today_summary['daily_comparison'] = {
        'sales_growth': (
            ((today_summary['total_sales'] - yesterday_sales) /
             max(yesterday_sales, 1)) * 100
        ),
        'yesterday_sales': yesterday_sales
    }

    return Response(today_summary)

@api_view(['GET'])
def timeslot_analysis(self):
    """時間帯別分析を返すエンドポイント"""
    today = timezone.now().date()

    timeslot_stats = Order.objects.filter(
        timestamp__date=today
    ).values(
        'time_slot__name',
    ).annotate(
        sales=Sum('total_price'),
        customer_count=Count('id'),
        average_spend=ExpressionWrapper(
            Cast(F('sales'), FloatField()) / Cast(F('customer_count')), FloatField()
        )
    ).order_by('time_slot__id')

    return Response(timeslot_stats)


@api_view(['GET'])
def category_analysis(self):
    """カテゴリー分析を返すエンドポイント"""
    today = timezone.now().date()

    category_stats = MenuItem.objects.filter(
        'category__name',
    ).annotate(
        total_items=Count('id'),
        sales=Sum(
            'orderitem__price',
            filter=Q(orderitem__order__timestamp__date=today)
        )
    ).order_by('-sales')

    return Response(category_stats)


@api_view(['GET'])
def weather_analysis(self):
    """天候影響分析を返すエンドポイント"""
    last_30_days = timezone.now() - timedelta(days=30)

    weather_stats = Order.objects.filter(
        timestamp__gte=last_30_days
    ).values(
        'weather__name',
    ).annotate(
        total_sales=Sum('total_price'),
        customer_count=Count('id'),
        average_spend=ExpressionWrapper(
            Cast(F('total_sales'), FloatField()) / Cast(F('customer_count'), FloatField()),
            output_field=FloatField()
        )
    ).order_by('-total_sales')

    return Response(weather_stats)


@api_view(['GET'])
def popular_items(self):
    """時間帯別人気メニュー分析を返すエンドポイント"""
    today = timezone.now().date()

    popular_by_timeslot = OrderItem.objects.filter(
        order__timestamp__date=today
    ).values(
        'order__time_slot__name',
        'menu_item__name',
        'menu_item__category__name',
    ).annotate(
        order_count=Count('id'),
        total_sales=Sum('price')
    ).order_by(
        'order__time_slot__name',
        '-order_count'
    )

    # 時間帯ごとにグループ化
    result = {}
    for item in popular_by_timeslot:
        time_slot = item['order__time_slot__name']
        if len(result[time_slot]) < 5: # 各時間帯top5
            result[time_slot].append({
                'item_name': item['menu_item__name'],
                'category': item['menu_item__category__name'],
                'order_count': item['order_count'],
                'total_sales': item['total_sales']
            })

    return Response(result)

@api_view(['GET'])
def sales_trend(request):
    """売上トレンドを返すエンドポイント"""
    days = int(request.query_params.get('days', 7))
    start_date = timezone.now().date() - timedelta(days=days)

    # 時間別データ
    hourly_trend = Order.objects.filter(
        timestamp__date=timezone.now().date()
    ).annotate(
        hour=TruncHour('timestamp')
    ).values('hour').annotate(
        sales=Sum('total_price'),
        order_count=Count('id')
    ).order_by('hour')

    # 日別データ
    daily_trend = Order.objects.filter(
        timestamp__gte=start_date
    ).annotate(
        day=TruncDate('timestamp')
    ).values('date').annotate(
        sales=Sum('total_price'),
        order_count=Count('id')
    ).order_by('date')

    return Response({
        'hourly': hourly_trend,
        'daily': daily_trend
    })
