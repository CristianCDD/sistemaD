from rest_framework import permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Product
from catalog.serializers import PublicProductSerializer
from .models import LandingConfig, LandingImage
from .serializers import LandingConfigSerializer, LandingImageSerializer


class LandingConfigViewSet(viewsets.ModelViewSet):
    queryset = LandingConfig.objects.all()
    serializer_class = LandingConfigSerializer


class LandingImageViewSet(viewsets.ModelViewSet):
    queryset = LandingImage.objects.all()
    serializer_class = LandingImageSerializer


class PublicLandingView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        config = LandingConfig.objects.filter(is_active=True).order_by('-id').first()
        images = LandingImage.objects.filter(is_active=True)
        products = Product.objects.filter(is_active=True, show_on_landing=True).select_related('category')

        return Response(
            {
                'config': LandingConfigSerializer(config).data if config else None,
                'images': LandingImageSerializer(images, many=True, context={'request': request}).data,
                'products': PublicProductSerializer(products, many=True, context={'request': request}).data,
            }
        )

# Create your views here.
