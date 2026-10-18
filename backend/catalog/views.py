from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Category, Product
from .models import CatalogEntry
from .catalog_serializers import CatalogEntrySerializer, PublicCatalogEntrySerializer
from .models import MaterialGuideEntry
from .catalog_serializers import MaterialGuideEntrySerializer, PublicMaterialGuideEntrySerializer
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    ProductSummarySerializer,
    PublicMaterialGuideSerializer,
    PublicProductSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category').prefetch_related('catalog_images', 'material_images').all()
    serializer_class = ProductSerializer
    filterset_fields = ['category', 'product_type', 'is_active', 'show_on_landing']
    search_fields = ['name', 'sku', 'description']

    @action(detail=False, methods=['get'], url_path='resumen')
    def summary(self, request):
        queryset = self.get_queryset().filter(is_active=True).order_by('name')
        serializer = ProductSummarySerializer(queryset, many=True)
        return Response(serializer.data)


class CatalogEntryViewSet(viewsets.ModelViewSet):
    queryset = CatalogEntry.objects.prefetch_related('images').all()
    serializer_class = CatalogEntrySerializer
    filterset_fields = ['origin', 'show_on_landing', 'is_active']
    search_fields = ['name', 'sku', 'description', 'category']


class PublicProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CatalogEntry.objects.filter(
        is_active=True,
        show_on_landing=True,
    ).prefetch_related('images')
    serializer_class = PublicCatalogEntrySerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['get'], url_path='resumen')
    def summary(self, request):
        queryset = self.get_queryset().order_by('name')
        serializer = ProductSummarySerializer(queryset, many=True)
        return Response(serializer.data)


class MaterialGuideEntryViewSet(viewsets.ModelViewSet):
    queryset = MaterialGuideEntry.objects.prefetch_related('images').all()
    serializer_class = MaterialGuideEntrySerializer
    search_fields = ['name', 'sku', 'description']


class PublicMaterialGuideViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MaterialGuideEntry.objects.filter(is_active=True).prefetch_related('images')
    serializer_class = PublicMaterialGuideEntrySerializer
    permission_classes = [permissions.AllowAny]

# Create your views here.
