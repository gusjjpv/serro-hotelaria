from django.urls import path
from .views import HotelRegisterView, HotelManageView

urlpatterns = [
    path('hotel/register/', HotelRegisterView.as_view(), name='hotel-register'),
    path('hotel/', HotelManageView.as_view(), name='hotel-manage'),
]
