from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Category, Product
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
    queryset = Product.objects.select_related('category').all()
    serializer_class = ProductSerializer
    filterset_fields = ['category', 'product_type', 'is_active', 'show_on_landing']
    search_fields = ['name', 'sku', 'description']

    @action(detail=False, methods=['get'], url_path='resumen')
    def summary(self, request):
        queryset = self.get_queryset().filter(is_active=True).order_by('name')
        serializer = ProductSummarySerializer(queryset, many=True)
        return Response(serializer.data)


class PublicProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.select_related('category').filter(
        is_active=True,
        show_on_landing=True,
    )
    serializer_class = PublicProductSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['get'], url_path='resumen')
    def summary(self, request):
        queryset = self.get_queryset().order_by('name')
        serializer = ProductSummarySerializer(queryset, many=True)
        return Response(serializer.data)


class PublicMaterialGuideViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.filter(is_active=True).order_by('name')
    serializer_class = PublicMaterialGuideSerializer
    permission_classes = [permissions.AllowAny]

# Create your views here.
