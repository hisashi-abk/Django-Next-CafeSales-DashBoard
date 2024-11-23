from django.core.management.base import BaseCommand
from cafe_analytics.models import Category, Gender, OrderType, WeatherType, TimeSlot, MenuItem, Order, OrderItem
import json
from django.conf import settings
import os
from django.utils import timezone
from datetime import datetime
from django.db import transaction

class Command(BaseCommand):
    help = 'Import cafe data from JSON files'

    def handle_master_data(self, master_data):
        """マスターデータをインポートする"""
        # 各マスターデータのインポート処理
        for category in master_data['categories']:
            Category.objects.get_or_create(
                id=category['id'],
                defaults={'name': category['name']}
            )

        for gender in master_data['genders']:
            Gender.objects.get_or_create(
                id=gender['id'],
                defaults={'name': gender['name']}
            )

        for order_type in master_data['order_types']:
            OrderType.objects.get_or_create(
                id=order_type['id'],
                defaults={'name': order_type['name']}
            )

        for weather_type in master_data['weather_types']:
            WeatherType.objects.get_or_create(
                id=weather_type['id'],
                defaults={'name': weather_type['name']}
            )

        for time_slot in master_data['time_slots']:
            TimeSlot.objects.get_or_create(
                id=time_slot['id'],
                defaults={'name': time_slot['name']}
            )

        for menu_item in master_data['menu_items']:
            MenuItem.objects.get_or_create(
                id=menu_item['id'],
                defaults={
                    'name': menu_item['name'],
                    'price': menu_item['price'],
                    'category_id': menu_item['category_id']
                }
            )

    def handle_orders(self, orders_data):
        """注文データをインポートする"""
        created_count = 0
        for order in orders_data:
            timestamp = datetime.strptime(order['timestamp'], '%Y-%m-%d %H:%M:%S')
            order_obj, created = Order.objects.get_or_create(
                id=order['id'],
                defaults={
                    'timestamp': timestamp,
                    'gender_id': order['gender_id'],
                    'order_type_id': order['order_type_id'],
                    'weather_id': order['weather_id'],
                    'time_slot_id': order['time_slot_id'],
                    'total_price': order['total_price'],
                    'discount': order['discount']
                }
            )
            if created:
                created_count += 1
        return created_count

    def handle_order_items(self, order_items_data):
        """注文アイテムデータをインポートする"""
        created_count = 0
        for item in order_items_data:
            order_item, created = OrderItem.objects.get_or_create(
                id=item['id'],
                defaults={
                    'order_id': item['order_id'],
                    'menu_item_id': item['menu_item_id'],
                    'price': item['price']
                }
            )
            if created:
                created_count += 1
        return created_count

    @transaction.atomic
    def handle(self, *args, **kwargs):
        data_dir = os.path.join(settings.BASE_DIR, 'cafe_analytics', 'data')

        try:
            # マスターデータのインポート
            master_data_path = os.path.join(data_dir, 'master_data_2024-04.json')
            self.stdout.write(f"Reading master data from: {master_data_path}")

            with open(master_data_path, encoding='utf-8') as f:
                master_data = json.load(f)
                self.handle_master_data(master_data)
                self.stdout.write(self.style.SUCCESS('Successfully imported master data'))

            # 注文データのインポート
            orders_path = os.path.join(data_dir, 'orders_2024-04.json')
            self.stdout.write(f"Reading orders data from: {orders_path}")

            with open(orders_path, encoding='utf-8') as f:
                orders_data = json.load(f)
                orders_created = self.handle_orders(orders_data)
                self.stdout.write(self.style.SUCCESS(f'Successfully imported {orders_created} orders'))

            # 注文アイテムデータのインポート
            order_items_path = os.path.join(data_dir, 'order_items_2024-04.json')
            self.stdout.write(f"Reading order items data from: {order_items_path}")

            with open(order_items_path, encoding='utf-8') as f:
                order_items_data = json.load(f)
                items_created = self.handle_order_items(order_items_data)
                self.stdout.write(self.style.SUCCESS(f'Successfully imported {items_created} order items'))

        except FileNotFoundError as e:
            self.stdout.write(self.style.ERROR(f'File not found: {e.filename}'))
        except json.JSONDecodeError:
            self.stdout.write(self.style.ERROR('Invalid JSON format'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'An error occurred: {str(e)}'))
