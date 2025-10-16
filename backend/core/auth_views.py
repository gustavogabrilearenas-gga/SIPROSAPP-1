"""
Vistas de autenticación para SIPROSA MES
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from backend.usuarios.serializers import UserSerializer


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Endpoint de login
    POST /api/auth/login/
    Body: { "username": "...", "password": "..." }
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'error': 'Por favor proporcione usuario y contraseña'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(username=username, password=password)
    
    if user is None:
        return Response(
            {'error': 'Credenciales inválidas'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.is_active:
        return Response(
            {'error': 'Usuario inactivo'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Actualizar last_login
    user.last_login = timezone.now()
    user.save(update_fields=['last_login'])
    
    # Generar tokens JWT
    refresh = RefreshToken.for_user(user)
    
    # Serializar usuario
    user_data = UserSerializer(user).data
    
    return Response({
        'user': user_data,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'message': 'Login exitoso'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Endpoint de logout
    POST /api/auth/logout/
    """
    try:
        # Obtener el refresh token del body
        refresh_token = request.data.get('refresh')
        
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        return Response({
            'message': 'Logout exitoso'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': 'Token inválido'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """
    Obtener información del usuario actual
    GET /api/auth/me/
    """
    user = request.user
    user_data = UserSerializer(user).data
    
    # Agregar perfil si existe
    profile = getattr(user, 'user_profile', None)
    if profile:
        user_data['profile'] = {
            'legajo': profile.legajo,
            'area': profile.area,
            'area_display': profile.get_area_display() if profile.area else None,
            'turno_habitual': profile.turno_habitual,
            'telefono': profile.telefono,
            'activo': profile.activo,
        }
    else:
        user_data['profile'] = None
    
    # Agregar grupos del usuario
    try:
        user_data['groups'] = list(user.groups.values_list('name', flat=True))
    except Exception:
        user_data['groups'] = []

    return Response(user_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refresh_token_view(request):
    """
    Refrescar access token
    POST /api/auth/refresh/
    Body: { "refresh": "..." }
    """
    refresh_token = request.data.get('refresh')
    
    if not refresh_token:
        return Response(
            {'error': 'Refresh token requerido'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        refresh = RefreshToken(refresh_token)
        return Response({
            'access': str(refresh.access_token),
        })
    except Exception as e:
        return Response(
            {'error': 'Token inválido o expirado'},
            status=status.HTTP_401_UNAUTHORIZED
        )


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Registro de nuevo usuario (OPCIONAL - solo para demo)
    POST /api/auth/register/
    Body: { "username": "...", "password": "...", "email": "...", "first_name": "...", "last_name": "..." }
    """
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email', '')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    
    if not username or not password:
        return Response(
            {'error': 'Usuario y contraseña son requeridos'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verificar si el usuario ya existe
    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'El usuario ya existe'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Crear usuario
    user = User.objects.create_user(
        username=username,
        password=password,
        email=email,
        first_name=first_name,
        last_name=last_name
    )
    
    # Actualizar last_login
    user.last_login = timezone.now()
    user.save(update_fields=['last_login'])
    
    # Generar tokens
    refresh = RefreshToken.for_user(user)
    user_data = UserSerializer(user).data
    
    return Response({
        'user': user_data,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'message': 'Usuario registrado exitosamente'
    }, status=status.HTTP_201_CREATED)
