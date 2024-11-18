from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.contrib.auth.tokens import default_token_generator
from .serializers import *
from .utils import send_verification_email
from rest_framework_simplejwt.tokens import RefreshToken
from .models import *
import yfinance as yf
from django.db.models import Q
from decimal import Decimal
from django.db import transaction as db_transaction
import math

# Registration View
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        send_verification_email(user, request)
        return Response({"message": "User registered successfully. Please check your email to verify your account."}, status=status.HTTP_201_CREATED)

# Login View
class LoginView(APIView):
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        user = authenticate(username=username, password=password)
        if user is not None:
            if user.profile.is_email_verified:
                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'username': str(user.username),
                    'cash': float(user.profile.cash)
                }, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Email is not verified.'}, status=status.HTTP_401_UNAUTHORIZED)
        else:
            return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

# Email Verification View
class VerifyEmail(APIView):
    def get(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            # Ensure the user has a profile
            profile, created = Profile.objects.get_or_create(user=user)
            profile.is_email_verified = True
            profile.save()

            # Return tokens to frontend
            return Response({
                'message': 'Email verified successfully.'
            }, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid verification link.'}, status=status.HTTP_400_BAD_REQUEST)

class StockSummary(APIView):
    def get(self, request, ticker):
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            if not (info['shortName'] or info['longName']):
                return Response(
                    {"valid": False, "message": "Invalid ticker symbol."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            def sanitize(value):
                if isinstance(value, float) and math.isnan(value):
                    return None
                return value
            
            stock_data = {
                "valid": True,
                "companyName": sanitize(info.get("shortName")) or sanitize(info.get("longName")),
                "ticker": ticker.upper(),
                "currentPrice": sanitize(info.get("currentPrice")) or sanitize(info.get("ask")) or sanitize(info.get("regularMarketPreviousClose")),
                "marketCap": sanitize(info.get("marketCap")) or "--",
                "volume": sanitize(info.get("volume")),
                "sector": sanitize(info.get("sector")) or "--",
                "industry": sanitize(info.get("industry")) or "--",
                "exchange": sanitize(info.get("exchange")),
            }
            
            time_periods = {
                "5d": "5d",
                "1mo": "1mo",
                "3mo": "3mo",
                "1y": "1y",
                "5y": "5y",
                "10y": "10y",
                "ytd": "ytd",
                "max": "max"
            }
            
            period = request.GET.get('period', '1mo')
            if period not in time_periods:
                return Response(
                    {"valid": False, "message": "Invalid time period specified."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            hist = stock.history(period=time_periods[period])
            if hist.empty:
                return Response(
                    {"valid": False, "message": "No historical data available for this ticker."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            historical_data = {
                "dates": hist.index.strftime('%Y-%m-%d').tolist(),
                "open": [sanitize(x) for x in hist['Open'].tolist()],
                "high": [sanitize(x) for x in hist['High'].tolist()],
                "low": [sanitize(x) for x in hist['Low'].tolist()],
                "close": [sanitize(x) for x in hist['Close'].tolist()],
                "volume": [sanitize(x) for x in hist['Volume'].tolist()],
            }

            # Get current holdings of the stock if any
            user = request.user
            stockObj = Stock.objects.get(ticker=ticker.upper())

            try:
                holding = Holding.objects.get(user=user.pk, ticker=stockObj.pk)
                holdings = holding.shares_owned
            except Holding.DoesNotExist:
                holdings = 0
            
            response_data = {
                "stockDetails": stock_data,
                "historicalData": historical_data,
                "currentHoldings": holdings
            }
            
            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"Error fetching stock data for ticker {ticker}: {e}")
            return Response(
                {"valid": False, "message": "An error occurred while fetching stock data."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class TickerSuggestionsAPIView(APIView):
    def get(self, request, format=None):
        query = request.GET.get('query', '').strip().upper()
        if not query:
            return Response(
                {"error": "Query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        stocks = Stock.objects.filter(
            Q(ticker__icontains=query) | Q(company_name__icontains=query)
        ).order_by('ticker')[:10]
        
        serializer = StockSerializer(stocks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

# Buy Stock View
class BuyStockView(APIView):
    def post(self, request, ticker):
        user = request.user
        quantity = Decimal(request.data.get('quantity'))

        stock = generics.get_object_or_404(Stock, ticker=ticker.upper())
        try:
            stock.update_current_price()
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        total_cost = quantity * stock.current_price

        with db_transaction.atomic():
            if user.profile.cash < total_cost:
                return Response({'error': 'Insufficient balance.'}, status=status.HTTP_400_BAD_REQUEST)

            user.profile.cash -= total_cost
            user.profile.save()

            holding, created = Holding.objects.get_or_create(
                user=user,
                ticker=stock,
                company_name = stock.company_name,
                defaults={'shares_owned': Decimal('0.0000'),
                          'average_price': Decimal(stock.current_price)
                          }
            )
            
            if not created:
                new_average = ((holding.shares_owned * holding.average_price) + total_cost) / (holding.shares_owned + quantity)
                holding.average_price = new_average
            
            holding.shares_owned += quantity
            holding.save()

            Transaction.objects.create(
                user=user,
                stock=stock,
                transaction_type='BUY',
                quantity=quantity,
                price_per_share=stock.current_price,
                total_amount=total_cost
            )

        return Response({'message': 'Stock purchased successfully.', 'cash_remaining': user.profile.cash}, status=status.HTTP_200_OK)

# Sell Stock View
class SellStockView(APIView):
    def post(self, request, ticker):
        user = request.user
        quantity = Decimal(request.data.get('quantity'))

        stock = generics.get_object_or_404(Stock, ticker=ticker.upper())

        try:
            stock.update_current_price()
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        total_revenue = quantity * stock.current_price

        with db_transaction.atomic():
            holding = generics.get_object_or_404(Holding, user=user, ticker=stock)
            if holding.shares_owned < quantity:
                return Response({'error': 'Insufficient shares to sell.'}, status=status.HTTP_400_BAD_REQUEST)

            user.profile.cash += total_revenue
            user.profile.save()

            holding.shares_owned -= quantity
            if holding.shares_owned == 0:
                holding.delete()
            else:
                holding.save()

            Transaction.objects.create(
                user=user,
                stock=stock,
                transaction_type='SELL',
                quantity=quantity,
                price_per_share=stock.current_price,
                total_amount=total_revenue
            )

        return Response({'message': 'Stock sold successfully.', 'cash_total': user.profile.cash}, status=status.HTTP_200_OK)

class DashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        portfolio_history_qs = PortfolioHistory.objects.filter(user=user).order_by('date')
        portfolio_history_serializer = PortfolioHistorySerializer(portfolio_history_qs, many=True)

        current_holdings_qs = Holding.objects.filter(user=user)
        current_holdings_serializer = HoldingSerializer(current_holdings_qs, many=True)

        dashboard_data = {
            'portfolio_history': portfolio_history_serializer.data,
            'current_holdings': current_holdings_serializer.data,
        }

        serializer = DashboardSerializer(dashboard_data)
        return Response(serializer.data, status=status.HTTP_200_OK)