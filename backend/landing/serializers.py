from rest_framework import serializers

from catalog.serializers import PublicProductSerializer
from .models import LandingConfig, LandingImage


class LandingConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = LandingConfig
        fields = '__all__'


class LandingImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = LandingImage
        fields = ['id', 'title', 'image', 'image_url', 'image_type', 'order', 'is_active', 'created_at']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if not obj.image:
            return None
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url


class PublicLandingSerializer(serializers.Serializer):
    config = LandingConfigSerializer()
    images = LandingImageSerializer(many=True)
    products = PublicProductSerializer(many=True)
