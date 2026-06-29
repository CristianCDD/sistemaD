from django.contrib import admin

from .models import LandingConfig, LandingImage


@admin.register(LandingConfig)
class LandingConfigAdmin(admin.ModelAdmin):
    list_display = ['business_name', 'whatsapp', 'email', 'is_active', 'updated_at']
    list_filter = ['is_active']


@admin.register(LandingImage)
class LandingImageAdmin(admin.ModelAdmin):
    list_display = ['title', 'image_type', 'order', 'is_active']
    list_filter = ['image_type', 'is_active']

# Register your models here.
