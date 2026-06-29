from django.contrib import admin

from .models import StockMovement


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ['product', 'movement_type', 'quantity', 'movement_date', 'created_by']
    list_filter = ['movement_type', 'movement_date']
    search_fields = ['product__name', 'product__sku', 'note']

# Register your models here.
