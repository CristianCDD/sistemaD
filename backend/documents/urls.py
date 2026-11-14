from django.urls import path

from .views import FolderView, LibraryView, UploadView, DownloadView


urlpatterns = [
    path('', LibraryView.as_view(), name='document-library'),
    path('carpetas/', FolderView.as_view(), name='document-folders'),
    path('archivos/', UploadView.as_view(), name='document-upload'),
    path('archivos/<int:pk>/descargar/', DownloadView.as_view(), name='document-download'),
]
