from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'categoria'
        verbose_name_plural = 'categorias'

    def __str__(self):
        return self.name


class Product(models.Model):
    class ProductType(models.TextChoices):
        PRODUCT = 'producto', 'Producto'
        SERVICE = 'servicio', 'Servicio'

    name = models.CharField(max_length=160)
    sku = models.CharField(max_length=80, blank=True, null=True)
    description = models.TextField(blank=True)
    product_type = models.CharField(
        max_length=20,
        choices=ProductType.choices,
        default=ProductType.PRODUCT,
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        related_name='products',
        blank=True,
        null=True,
    )
    image = models.ImageField(upload_to='productos/', blank=True, null=True)
    sale_price = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    cost = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    minimum_stock = models.PositiveIntegerField(default=0)
    manages_stock = models.BooleanField(default=True)
    show_on_landing = models.BooleanField(default=False)
    show_price_on_landing = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

# Create your models here.
