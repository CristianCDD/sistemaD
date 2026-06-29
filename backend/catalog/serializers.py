from rest_framework import serializers

from inventory.services import get_product_stock

from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    stock = serializers.SerializerMethodField()
    stock_status = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'sku',
            'description',
            'product_type',
            'category',
            'image',
            'image_url',
            'sale_price',
            'cost',
            'minimum_stock',
            'manages_stock',
            'show_on_landing',
            'show_price_on_landing',
            'is_active',
            'stock',
            'stock_status',
            'created_at',
            'updated_at',
        ]

    def get_stock(self, obj):
        return get_product_stock(obj)

    def get_stock_status(self, obj):
        stock = get_product_stock(obj)
        if stock <= 0:
            return 'agotado'
        return 'normal'

    def get_image_url(self, obj):
        request = self.context.get('request')
        if not obj.image:
            return None
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url


class PublicProductSerializer(ProductSerializer):
    display_price = serializers.SerializerMethodField()

    class Meta(ProductSerializer.Meta):
        fields = [
            'id',
            'name',
            'sku',
            'description',
            'product_type',
            'category',
            'image_url',
            'sale_price',
            'show_price_on_landing',
            'display_price',
        ]

    def get_display_price(self, obj):
        if obj.show_price_on_landing and obj.sale_price is not None:
            return obj.sale_price
        return None


class PublicMaterialGuideSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'sku', 'image_url']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if not obj.image:
            return None
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url


class ProductSummarySerializer(serializers.ModelSerializer):
    codigo = serializers.CharField(source='sku')
    nombre = serializers.CharField(source='name')
    precio = serializers.DecimalField(source='sale_price', max_digits=12, decimal_places=2)

    class Meta:
        model = Product
        fields = ['id', 'codigo', 'nombre', 'precio']
