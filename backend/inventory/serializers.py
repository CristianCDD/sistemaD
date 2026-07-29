from rest_framework import serializers

from .models import DailyListImage, StockMovement


class DailyListImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = DailyListImage
        fields = [
            'id',
            'movement_date',
            'image',
            'image_url',
            'created_by',
            'created_by_username',
            'created_at',
        ]
        read_only_fields = ['created_by', 'created_at']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if not obj.image:
            return ''
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url


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
