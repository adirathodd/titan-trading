from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import RegisterView, LoginView, VerifyEmail, StockSummary, TickerSuggestionsAPIView

urlpatterns = [
    # User Registration
    path('register/', RegisterView.as_view(), name='register'),

    # User Login
    path('login/', LoginView.as_view(), name='login'),

    # Email Verification
    path('verify/<uidb64>/<token>/', VerifyEmail.as_view(), name='verify-email'),

    # JWT Token Obtain Pair (Access and Refresh)
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),

    # JWT Token Refresh
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Search Stock Ticker
    path('search/<ticker>/', StockSummary.as_view(), name='search'),

    #Ticker suggestions
    path('tickers/', TickerSuggestionsAPIView.as_view(), name='tickers'),
]