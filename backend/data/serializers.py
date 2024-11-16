from rest_framework import serializers
from .models import (
    Category, MenuItem, OrderItem, Order,
    Gender, OrderType, WeatherType, TimeSlot,
)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = MenuItem
        fields = ['id', 'name', 'price', 'category', 'category_name']


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)
    category_name = serializers.CharField(source='menu_item.category.name', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'menu_item_name', 'category_name', 'price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    gender_name = serializers.CharField(source='gender.name', read_only=True)
    order_type_name = serializers.CharField(source='order_type.name', read_only=True)
    weather_name = serializers.CharField(source='weather.name', read_only=True)
    time_slot_name = serializers.CharField(source='time_slot.name', read_only=True)
    final_price = serializers.IntegerField(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'timestamp', 'gender', 'gender_name',
            'order_type', 'order_type_name',
            'weather', 'weather_name',
            'time_slot', 'time_slot_name',
            'total_price', 'discount', 'final_price',
            'items',
        ]
