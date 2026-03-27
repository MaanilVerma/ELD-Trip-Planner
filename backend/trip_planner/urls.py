from django.urls import path
from .views import TripPlanView, LocationSearchView

urlpatterns = [
    path('trip/plan', TripPlanView.as_view(), name='trip-plan'),
    path('locations/search', LocationSearchView.as_view(), name='location-search'),
]
