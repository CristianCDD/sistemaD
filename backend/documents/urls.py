from django.urls import path

from .views import DownloadView, FolderDetailView, FolderView, LibraryView, UploadView, ZipImportView


urlpatterns = [
    path('', LibraryView.as_view(), name='document-library'),
    path('carpetas/', FolderView.as_view(), name='document-folders'),
    path('carpetas/<int:pk>/', FolderDetailView.as_view(), name='document-folder-detail'),
    path('archivos/', UploadView.as_view(), name='document-upload'),
    path('importar-zip/', ZipImportView.as_view(), name='document-import-zip'),
    path('archivos/<int:pk>/descargar/', DownloadView.as_view(), name='document-download'),
]
