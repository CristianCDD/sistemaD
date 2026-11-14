from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework.test import APITestCase

from .models import Document, Folder


class DocumentLibraryTests(APITestCase):
    def setUp(self):
        self.admin = get_user_model().objects.create_user(username='admin-docs', is_staff=True)
        self.member = get_user_model().objects.create_user(username='member-docs')
        self.root = Folder.objects.get(name='Impor.Damian')
        self.folder = Folder.objects.get(parent=self.root, name='Facturas')
        self.library_url = reverse('document-library')
        self.folders_url = reverse('document-folders')
        self.upload_url = reverse('document-upload')

    def upload(self, name='Factura.pdf', content=b'%PDF-1.7 test'):
        return self.client.post(self.upload_url, {
            'file': SimpleUploadedFile(name, content), 'folder': self.folder.pk,
        }, format='multipart')

    def test_root_and_breadcrumbs(self):
        self.client.force_authenticate(self.member)
        listing = self.client.get(self.library_url)
        self.assertEqual(listing.data['folders'], [{'id': self.root.pk, 'name': self.root.name}])
        nested = self.client.get(self.library_url, {'carpeta': self.root.pk})
        self.assertEqual({f['name'] for f in nested.data['folders']}, {'Dep\u00f3sitos', 'Facturas', 'Importaciones'})
        self.assertEqual(nested.data['path'], listing.data['folders'])
        self.assertFalse(nested.data['can_manage'])
        self.assertIn('no-store', nested.headers['Cache-Control'])

    def test_upload_search_and_download_are_private(self):
        self.client.force_authenticate(self.admin)
        upload = self.upload()
        self.assertEqual(upload.status_code, 201)
        download_url = reverse('document-download', args=[upload.data['id']])
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(self.library_url).status_code, 401)
        self.assertEqual(self.client.get(download_url).status_code, 401)
        self.client.force_authenticate(self.member)
        search = self.client.get(self.library_url, {'carpeta': self.folder.pk, 'q': 'factURA'})
        self.assertEqual([f['name'] for f in search.data['documents']], ['Factura.pdf'])
        self.assertNotIn('content', search.data['documents'][0])
        download = self.client.get(download_url)
        self.assertEqual(b''.join(download.streaming_content), b'%PDF-1.7 test')
        self.assertEqual(download['Content-Type'], 'application/octet-stream')
        self.assertEqual(download['Content-Disposition'], 'attachment; filename="Factura.pdf"')
        self.member.profile.is_active = False
        self.member.profile.save()
        self.assertEqual(self.client.get(download_url).status_code, 403)

    def test_member_cannot_upload_or_create_folders(self):
        self.client.force_authenticate(self.member)
        self.assertEqual(self.upload().status_code, 403)
        self.assertEqual(self.client.post(self.folders_url, {'name': '2026'}).status_code, 403)
        self.assertEqual(Document.objects.count(), 0)

    def test_validates_names_extensions_size_and_duplicates(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.post(self.folders_url, {'name': '../invalido'}).status_code, 400)
        self.assertEqual(self.client.post(self.folders_url, {'name': '2026', 'parent': self.folder.pk}).status_code, 201)
        self.assertEqual(self.client.post(self.folders_url, {'name': '2026', 'parent': self.folder.pk}).status_code, 409)
        self.assertEqual(self.upload('script.html').status_code, 400)
        with patch('documents.views.MAX_FILE_BYTES', 2):
            self.assertEqual(self.upload().status_code, 400)
        with patch('documents.views.MAX_LIBRARY_BYTES', 2):
            self.assertEqual(self.upload().status_code, 400)
        self.assertEqual(self.upload().status_code, 201)
        self.assertEqual(self.upload('FACTURA.PDF').status_code, 409)
        self.assertEqual(Document.objects.count(), 1)
