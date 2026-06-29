from django.conf import settings
from django.db import models

from catalog.models import Product


class StockMovement(models.Model):
    class MovementType(models.TextChoices):
        IN = 'entrada', 'Entrada'
        OUT = 'salida', 'Salida'
        ADJUSTMENT = 'ajuste', 'Ajuste'

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='stock_movements',
    )
    movement_type = models.CharField(max_length=20, choices=MovementType.choices)
    quantity = models.PositiveIntegerField()
    movement_date = models.DateField()
    note = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='stock_movements',
        blank=True,
        null=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-movement_date', '-id']

    def __str__(self):
        return f'{self.get_movement_type_display()} {self.quantity} - {self.product.name}'

# Create your models here.
