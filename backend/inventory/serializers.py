from rest_framework import serializers

from .models import StockMovement


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            'id',
            'product',
            'product_name',
            'movement_type',
            'quantity',
            'movement_date',
            'note',
            'created_by',
            'created_by_username',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError('La cantidad debe ser mayor a cero.')
        return value
