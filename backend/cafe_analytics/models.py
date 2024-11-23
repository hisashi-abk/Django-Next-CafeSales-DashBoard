from django.db import models
from django.core.validators import MinValueValidator
from django.utils.translation import gettext_lazy as _


class Category(models.Model):
    """メニューカテゴリーモデル"""
    name = models.CharField(_('カテゴリー名'), max_length=50)

    class Meta:
        db_table = 'categories'
        verbose_name = _('カテゴリー')
        verbose_name_plural = _('カテゴリー')

    def __str__(self):
        return self.name


class Gender(models.Model):
    """性別モデル"""
    name = models.CharField(_('性別'), max_length=10)

    class Meta:
        db_table = 'genders'
        verbose_name = _('性別')
        verbose_name_plural = _('性別')

    def __str__(self):
        return self.name


class OrderType(models.Model):
    """注文タイプモデル(店内飲食/テイクアウト)"""
    name = models.CharField(_('注文タイプ'), max_length=20)

    class Meta:
        db_table = 'order_types'
        verbose_name = _('注文タイプ')
        verbose_name_plural = _('注文タイプ')

    def __str__(self):
        return self.name


class WeatherType(models.Model):
    """天気タイプモデル"""
    name = models.CharField(_('天気'), max_length=20)

    class Meta:
        db_table = 'weather_types'
        verbose_name = _('天気')
        verbose_name_plural = _('天気')

    def __str__(self):
        return self.name


class TimeSlot(models.Model):
    """時間帯モデル"""
    name = models.CharField(_('時間帯'), max_length=20)

    class Meta:
        db_table = 'time_slots'
        verbose_name = _('時間帯')
        verbose_name_plural = _('時間帯')

    def __str__(self):
        return self.name


class MenuItem(models.Model):
    """メニューアイテムモデル"""
    name = models.CharField(_('商品名'), max_length=100)
    price = models.IntegerField(
        _('価格'),
        validators=[MinValueValidator(0)]
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='menu_items',
    )

    class Meta:
        db_table ='menu_items'
        verbose_name = _('メニューアイテム')
        verbose_name_plural = _('メニューアイテム')

    def __str__(self):
        return f"{self.name} (¥{self.price})"



class Order(models.Model):
    """注文モデル"""
    id = models.CharField(_('注文ID'), primary_key=True, max_length=50)
    timestamp = models.DateTimeField(_('注文日時'))
    gender = models.ForeignKey(
        Gender,
        verbose_name=_('性別'),
        on_delete=models.PROTECT,
    )
    order_type = models.ForeignKey(
        OrderType,
        verbose_name=_('注文タイプ'),
        on_delete=models.PROTECT,
    )
    weather = models.ForeignKey(
        WeatherType,
        verbose_name=_('天気'),
        on_delete=models.PROTECT,
    )
    time_slot = models.ForeignKey(
        TimeSlot,
        verbose_name=_('時間帯'),
        on_delete=models.PROTECT,
    )
    total_price = models.IntegerField(
        _('合計金額'),
        validators=[MinValueValidator(0)]
    )
    discount = models.IntegerField(
        _('割引額'),
        validators=[MinValueValidator(0)]
    )

    class Meta:
        db_table = 'orders'
        verbose_name = _('注文')
        verbose_name_plural = _('注文')
        ordering = ['-timestamp']

    def __str__(self):
        return f"Order {self.id} - {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"

    @property
    def final_price(self):
        """割引後の最終価格を計算"""
        return self.total_price - self.discount


class OrderItem(models.Model):
    """注文アイテムモデル"""
    id = models.CharField(_('注文アイテムID'), primary_key=True, max_length=50)
    order = models.ForeignKey(
        Order,
        verbose_name=_('注文'),
        on_delete=models.CASCADE,
        related_name='items',
    )
    menu_item = models.ForeignKey(
        MenuItem,
        verbose_name=_('メニューアイテム'),
        on_delete=models.PROTECT,
    )
    price = models.IntegerField(
        _('価格'),
        validators=[MinValueValidator(0)]
    )

    class Meta:
        db_table = 'order_items'
        verbose_name = _('注文項目')
        verbose_name_plural = _('注文項目')

    def __str__(self):
        return f"{self.menu_item.name} - Order {self.order.id}"
