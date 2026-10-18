from django.contrib import admin

from .models import Category, Product, ProductCatalogImage, ProductMaterialImage
from .models import CatalogEntry, CatalogEntryImage
from .models import MaterialGuideEntry, MaterialGuideEntryImage


class MaterialGuideEntryImageInline(admin.TabularInline):
    model = MaterialGuideEntryImage
    extra = 0


@admin.register(MaterialGuideEntry)
class MaterialGuideEntryAdmin(admin.ModelAdmin):
    list_display = ['name', 'sku', 'is_active']
    search_fields = ['name', 'sku']
    inlines = [MaterialGuideEntryImageInline]


class CatalogEntryImageInline(admin.TabularInline):
    model = CatalogEntryImage
    extra = 0


@admin.register(CatalogEntry)
class CatalogEntryAdmin(admin.ModelAdmin):
    list_display = ['name', 'origin', 'show_on_landing', 'is_active']
    search_fields = ['name', 'sku', 'category']
    list_filter = ['origin', 'show_on_landing', 'is_active']
    inlines = [CatalogEntryImageInline]


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
    fields = [
        'name',
        'sku',
        'description',
        'product_type',
        'category',
        'image',
        'landing_image',
        'material_image',
        'sale_price',
        'cost',
        'minimum_stock',
        'manages_stock',
        'show_on_landing',
        'show_price_on_landing',
        'is_active',
    ]


@admin.register(ProductCatalogImage)
class ProductCatalogImageAdmin(admin.ModelAdmin):
    list_display = ['product', 'created_at']
    search_fields = ['product__name', 'product__sku']


@admin.register(ProductMaterialImage)
class ProductMaterialImageAdmin(admin.ModelAdmin):
    list_display = ['product', 'created_at']
    search_fields = ['product__name', 'product__sku']

# Register your models here.
