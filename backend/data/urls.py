from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"orders", views.OrderViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("dashboard/", views.dashboard, name="dashboard"),
    path("trending/", views.trending_items, name="trending_items"),
    path("analysis/daily_summary", views.daily_summary, name="daily_summary"),
    path("analysis/timeslot", views.timeslot_analysis, name="analysis_timeslot"),
    path("analysis/category", views.category_analysis, name="category_analysis"),
    path("analysis/weather", views.weather_analysis, name="weather_analysis"),
    path("analysis/popular_items/", views.popular_items, name="popular_items"),
    path("analysis/sales_trend/", views.sales_trend, name="sales_trend"),
]
