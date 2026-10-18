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
    landing_image = models.ImageField(upload_to='productos/landing/', blank=True, null=True)
    material_image = models.ImageField(upload_to='productos/materiales/', blank=True, null=True)
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


class CatalogEntry(models.Model):
    product = models.ForeignKey(Product, blank=True, null=True, on_delete=models.SET_NULL, related_name='catalog_entries')
    name = models.CharField(max_length=160)
    sku = models.CharField(max_length=80, blank=True)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=120, blank=True)
    origin = models.CharField(max_length=20, choices=[('importado', 'Importado'), ('local', 'Compra local'), ('sin_definir', 'Sin definir')], default='sin_definir')
    tags = models.CharField(max_length=240, blank=True)
    sale_price = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    show_price_on_landing = models.BooleanField(default=False)
    show_on_landing = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class CatalogEntryImage(models.Model):
    entry = models.ForeignKey(CatalogEntry, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='catalogo/')

    class Meta:
        ordering = ['id']


class MaterialGuideEntry(models.Model):
    product = models.ForeignKey(Product, blank=True, null=True, on_delete=models.SET_NULL, related_name='guide_entries')
    name = models.CharField(max_length=160)
    sku = models.CharField(max_length=80, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class MaterialGuideEntryImage(models.Model):
    entry = models.ForeignKey(MaterialGuideEntry, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='guia-materiales/')

    class Meta:
        ordering = ['id']


class ProductCatalogImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='catalog_images')
    image = models.ImageField(upload_to='productos/catalogo/')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f'Imagen de catalogo - {self.product.name}'


class ProductMaterialImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='material_images')
    image = models.ImageField(upload_to='productos/materiales/')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f'Imagen de materiales - {self.product.name}'

# Create your models here.
