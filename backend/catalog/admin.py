from django.contrib import admin

from .models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'is_active']
    list_filter = ['is_active']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'sku', 'product_type', 'category', 'sale_price', 'cost', 'minimum_stock', 'manages_stock', 'is_active']
    list_filter = ['product_type', 'category', 'manages_stock', 'show_on_landing', 'is_active']
    search_fields = ['name', 'sku', 'description']

# Register your models here.
