from django.db.models import Count, Q, Sum
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Product
from catalog.serializers import ProductSerializer
from .models import StockMovement
from .serializers import StockMovementSerializer
from .services import stock_expression


class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.select_related('product', 'created_by').all()
    serializer_class = StockMovementSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        movement_date = self.request.query_params.get('fecha') or self.request.query_params.get('movement_date')
        date_from = self.request.query_params.get('desde') or self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('hasta') or self.request.query_params.get('date_to')
        product = self.request.query_params.get('producto') or self.request.query_params.get('product')
        movement_type = self.request.query_params.get('tipo') or self.request.query_params.get('movement_type')

        if movement_date:
            queryset = queryset.filter(movement_date=movement_date)
        if date_from:
            queryset = queryset.filter(movement_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(movement_date__lte=date_to)
        if product:
            queryset = queryset.filter(product_id=product)
        if movement_type:
            queryset = queryset.filter(movement_type=movement_type)

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class StockSummaryView(APIView):
    def get(self, request):
        product = request.query_params.get('producto') or request.query_params.get('product')
        date_from = request.query_params.get('desde') or request.query_params.get('date_from')
        date_to = request.query_params.get('hasta') or request.query_params.get('date_to')

        products = Product.objects.filter(
            is_active=True,
        ).annotate(stock=stock_expression())
        movements_queryset = StockMovement.objects.all()

        if product:
            products = products.filter(id=product)
            movements_queryset = movements_queryset.filter(product_id=product)
        if date_from:
            movements_queryset = movements_queryset.filter(movement_date__gte=date_from)
        if date_to:
            movements_queryset = movements_queryset.filter(movement_date__lte=date_to)

        total_products = products.count()
        exhausted = products.filter(stock__lte=0).count()
        low_stock = 0
        normal = max(total_products - exhausted, 0)

        movements = movements_queryset.aggregate(
            entries=Sum('quantity', filter=Q(movement_type=StockMovement.MovementType.IN)),
            exits=Sum('quantity', filter=Q(movement_type=StockMovement.MovementType.OUT)),
            total=Count('id'),
        )

        inventory_value = sum(
            (product.stock or 0) * (product.cost or 0)
            for product in products
        )

        serializer = ProductSerializer(
            products.order_by('name')[:50],
            many=True,
            context={'request': request},
        )

        return Response(
            {
                'total_products': total_products,
                'alerts': low_stock + exhausted,
                'low_stock': low_stock,
                'exhausted': exhausted,
                'normal': normal,
                'movements': {
                    'entries': movements['entries'] or 0,
                    'exits': movements['exits'] or 0,
                    'total': movements['total'] or 0,
                },
                'inventory_value': inventory_value,
                'products': serializer.data,
                'filters': {
                    'product': product,
                    'date_from': date_from,
                    'date_to': date_to,
                },
            },
            status=status.HTTP_200_OK,
        )

# Create your views here.
