"""
Authentication Views for Gym Tracker

Provides:
- RegisterView: Create new user accounts
- MeView: Get current user info
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken


class RegisterView(APIView):
    """
    POST /api/auth/register/
    
    Create a new user account and return JWT tokens.
    
    Request body:
    {
        "username": "string",
        "password": "string",
        "email": "string" (optional)
    }
    
    Response:
    {
        "user": {
            "id": int,
            "username": "string"
        },
        "tokens": {
            "access": "string",
            "refresh": "string"
        }
    }
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')
        email = request.data.get('email', '').strip()
        
        # Validate required fields
        if not username:
            return Response(
                {'error': 'Username is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not password:
            return Response(
                {'error': 'Password is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(password) < 6:
            return Response(
                {'error': 'Password must be at least 6 characters'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if username already exists
        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if email already exists (if provided)
        if email and User.objects.filter(email=email).exists():
            return Response(
                {'error': 'Email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create user
        user = User.objects.create_user(
            username=username,
            password=password,
            email=email or ''
        )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
            },
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_201_CREATED)


class MeView(APIView):
    """
    GET /api/auth/me/
    
    Returns info about the currently authenticated user.
    
    Response:
    {
        "id": int,
        "username": "string"
    }
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({
            'id': request.user.id,
            'username': request.user.username,
        })

