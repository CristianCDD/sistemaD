from django.db import models


class LandingConfig(models.Model):
    business_name = models.CharField(max_length=160, default='Mi negocio')
    headline = models.CharField(max_length=220, blank=True)
    subheadline = models.TextField(blank=True)
    whatsapp = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    address = models.CharField(max_length=240, blank=True)
    facebook_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    tiktok_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.business_name


class LandingImage(models.Model):
    class ImageType(models.TextChoices):
        HERO = 'hero', 'Principal'
        GALLERY = 'galeria', 'Galeria'
        BANNER = 'banner', 'Banner'

    title = models.CharField(max_length=160, blank=True)
    image = models.ImageField(upload_to='landing/')
    image_type = models.CharField(max_length=20, choices=ImageType.choices, default=ImageType.GALLERY)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', '-id']

    def __str__(self):
        return self.title or self.get_image_type_display()

# Create your models here.
