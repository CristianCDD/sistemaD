from rest_framework import permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import CatalogCategory, CatalogEntry
from catalog.catalog_serializers import PublicCatalogEntrySerializer
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
        products = CatalogEntry.objects.filter(is_active=True, show_on_landing=True).prefetch_related('images')
        categories = CatalogCategory.objects.filter(is_active=True).prefetch_related('entries__images')
        category_data = []
        for category in categories:
            entries = [entry for entry in category.entries.all() if entry.is_active and entry.show_on_landing]
            image = next((entry.images.all()[0].image for entry in entries if entry.images.all()), None)
            category_data.append({
                'id': category.id,
                'name': category.name,
                'slug': category.slug,
                'product_count': len(entries),
                'image_url': request.build_absolute_uri(image.url) if image else None,
            })

        return Response(
            {
                'config': LandingConfigSerializer(config).data if config else None,
                'images': LandingImageSerializer(images, many=True, context={'request': request}).data,
                'products': PublicCatalogEntrySerializer(products, many=True, context={'request': request}).data,
                'categories': category_data,
            }
        )

# Create your views here.
