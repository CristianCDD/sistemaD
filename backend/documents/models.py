from django.conf import settings
from django.db import models
from django.db.models.functions import Coalesce


class Folder(models.Model):
    name = models.CharField(max_length=120)
    name_key = models.CharField(max_length=360, editable=False)
    parent = models.ForeignKey('self', null=True, on_delete=models.PROTECT, related_name='folders')

    class Meta:
        ordering = ['name_key', 'pk']
        constraints = [
            models.UniqueConstraint(Coalesce('parent_id', 0), 'name_key', name='documents_unique_folder_name'),
        ]


class Document(models.Model):
    name = models.CharField(max_length=255)
    name_key = models.CharField(max_length=765, editable=False)
    folder = models.ForeignKey(Folder, null=True, on_delete=models.PROTECT, related_name='documents')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    size = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    content = models.BinaryField(editable=False)

    class Meta:
        ordering = ['name_key', 'pk']
        constraints = [
            models.UniqueConstraint(Coalesce('folder_id', 0), 'name_key', name='documents_unique_file_name'),
        ]
