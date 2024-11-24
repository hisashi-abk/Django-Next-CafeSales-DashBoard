from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

# メインのダッシュボード
router.register(r'dashboard', views.DashboardViewSet, basename='dashboard')

# 売上分析関連
router.register(r'sales', views.SalesAnalysisViewSet, basename='sales')

# 商品分析関連
router.register(r'products', views.ProductAnalysisViewSet, basename='products')

# 既存のViewSet
router.register(r'orders', views.OrderViewSet)
router.register(r'menu-items', views.MenuItemViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
