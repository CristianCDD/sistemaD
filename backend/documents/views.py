import io
import unicodedata
from pathlib import PurePath
from zipfile import BadZipFile, ZIP_DEFLATED, ZIP_STORED, ZipFile

from django.db import IntegrityError, transaction
from django.db.models import Sum
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.utils.cache import add_never_cache_headers
from rest_framework import serializers, status
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Document, Folder


MAX_FILE_BYTES = 20 * 1024 * 1024
MAX_LIBRARY_BYTES = 200 * 1024 * 1024
MAX_FOLDER_DEPTH = 12
MAX_ZIP_BYTES = 40 * 1024 * 1024
MAX_ZIP_ENTRIES = 500
DOCUMENT_EXTENSIONS = (
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.ppt', '.pptx', '.txt', '.xml',
    '.odt', '.ods', '.jpeg', '.jpg', '.png', '.webp', '.zip', '.rar', '.7z', '.blend',
)


def can_manage(user):
    return user.is_staff or user.is_superuser


class LibraryAccess(BasePermission):
    def has_permission(self, request, view):
        profile = getattr(request.user, 'profile', None)
        return request.user.is_active and (profile is None or profile.is_active)


class ManageLibrary(BasePermission):
    message = 'Solo un administrador puede cambiar los documentos.'

    def has_permission(self, request, view):
        return can_manage(request.user)


def clean_name(value):
    name = unicodedata.normalize('NFC', value).strip()
    if not name or name in {'.', '..'} or any(c in '/\\' or unicodedata.category(c).startswith('C') for c in name):
        raise serializers.ValidationError('El nombre no es valido.')
    return name


def folder_path(folder):
    path = []
    while folder is not None:
        path.append({'id': folder.pk, 'name': folder.name})
        folder = folder.parent
    return path[::-1]


def library_bytes_with_lock():
    # Serialize quota checks on the permanent, seeded root folder.
    Folder.objects.select_for_update().order_by('pk').values_list('pk', flat=True).first()
    return Document.objects.aggregate(total=Sum('size', default=0))['total']


class PrivateView(APIView):
    permission_classes = [IsAuthenticated, LibraryAccess]

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        add_never_cache_headers(response)
        return response


class LibraryView(PrivateView):
    def get(self, request):
        folder_id = request.query_params.get('carpeta')
        if folder_id:
            field = serializers.IntegerField(min_value=1, max_value=2**63 - 1)
            folder = get_object_or_404(Folder, pk=field.run_validation(folder_id))
        else:
            folder = None
        folders = Folder.objects.filter(parent=folder)
        documents = Document.objects.filter(folder=folder)
        query = unicodedata.normalize('NFC', request.query_params.get('q', '').strip()[:120]).casefold()
        if query:
            folders = folders.filter(name_key__contains=query)
            documents = documents.filter(name_key__contains=query)
        return Response({
            'path': folder_path(folder),
            'folders': list(folders.values('id', 'name')),
            'documents': list(documents.values('id', 'name', 'size', 'created_at')),
            'can_manage': can_manage(request.user),
            'max_file_bytes': MAX_FILE_BYTES,
            'max_zip_bytes': MAX_ZIP_BYTES,
            'extensions': DOCUMENT_EXTENSIONS,
        })


class FolderInput(serializers.Serializer):
    name = serializers.CharField(max_length=120, validators=[clean_name])
    parent = serializers.PrimaryKeyRelatedField(queryset=Folder.objects.all(), allow_null=True, required=False)


class FolderView(PrivateView):
    permission_classes = [*PrivateView.permission_classes, ManageLibrary]

    def post(self, request):
        form = FolderInput(data=request.data)
        form.is_valid(raise_exception=True)
        parent = form.validated_data.get('parent')
        if len(folder_path(parent)) >= MAX_FOLDER_DEPTH:
            raise serializers.ValidationError({'detail': 'Se alcanzo el limite de niveles de carpetas.'})
        name = clean_name(form.validated_data['name'])
        try:
            with transaction.atomic():
                folder = Folder.objects.create(name=name, name_key=name.casefold(), parent=parent)
        except IntegrityError:
            return Response({'detail': 'Ya existe una carpeta con ese nombre.'}, status=status.HTTP_409_CONFLICT)
        return Response({'id': folder.pk, 'name': folder.name}, status=status.HTTP_201_CREATED)


class UploadInput(serializers.Serializer):
    file = serializers.FileField(max_length=255)
    folder = serializers.PrimaryKeyRelatedField(queryset=Folder.objects.all(), allow_null=True, required=False)

    def validate_file(self, value):
        if PurePath(clean_name(value.name)).suffix.lower() not in DOCUMENT_EXTENSIONS:
            raise serializers.ValidationError('Formato de archivo no admitido.')
        if value.size > MAX_FILE_BYTES:
            raise serializers.ValidationError('El archivo supera los 20 MB.')
        return value


class UploadView(PrivateView):
    permission_classes = [*PrivateView.permission_classes, ManageLibrary]
    parser_classes = [MultiPartParser]

    def post(self, request):
        form = UploadInput(data=request.data)
        form.is_valid(raise_exception=True)
        upload = form.validated_data['file']
        name = clean_name(upload.name)
        content = upload.read(MAX_FILE_BYTES + 1)
        try:
            with transaction.atomic():
                used_bytes = library_bytes_with_lock()
                if used_bytes + len(content) > MAX_LIBRARY_BYTES:
                    raise serializers.ValidationError({'detail': 'La biblioteca alcanzo los 200 MB de almacenamiento.'})
                document = Document.objects.create(
                    name=name, name_key=name.casefold(), content=content, size=len(content),
                    folder=form.validated_data.get('folder'), uploaded_by=request.user,
                )
        except IntegrityError:
            return Response({'detail': 'Ya existe un archivo con ese nombre en la carpeta.'}, status=status.HTTP_409_CONFLICT)
        return Response({'id': document.pk, 'name': document.name}, status=status.HTTP_201_CREATED)


class ZipImportInput(serializers.Serializer):
    file = serializers.FileField()
    folder = serializers.PrimaryKeyRelatedField(queryset=Folder.objects.all(), allow_null=True, required=False)

    def validate_file(self, value):
        if PurePath(value.name).suffix.lower() != '.zip' or value.size > MAX_ZIP_BYTES:
            raise serializers.ValidationError('Selecciona un archivo ZIP de hasta 40 MB.')
        return value


def zip_entries(archive, depth):
    entries = archive.infolist()
    if len(entries) > MAX_ZIP_ENTRIES or sum(entry.file_size for entry in entries) > MAX_ZIP_BYTES:
        raise serializers.ValidationError({'detail': 'El ZIP excede los 500 elementos o los 40 MB descomprimidos.'})
    for entry in entries:
        parts = tuple(clean_name(part) for part in entry.filename.removesuffix('/').split('/'))
        is_folder = entry.is_dir()
        folders = parts if is_folder else parts[:-1]
        if depth + len(folders) > MAX_FOLDER_DEPTH or any(len(name) > 120 or ':' in name for name in folders):
            raise serializers.ValidationError({'detail': 'El ZIP contiene una ruta de carpeta no admitida.'})
        if not is_folder and (
            len(parts[-1]) > 255 or ':' in parts[-1]
            or PurePath(parts[-1]).suffix.lower() not in DOCUMENT_EXTENSIONS
            or not 0 < entry.file_size <= MAX_FILE_BYTES
            or entry.flag_bits & 1 or entry.compress_type not in (ZIP_STORED, ZIP_DEFLATED)
            or (entry.external_attr >> 16) & 0o170000 == 0o120000
        ):
            raise serializers.ValidationError({'detail': f'Archivo no admitido en el ZIP: {parts[-1]}'})
        yield entry, folders, None if is_folder else parts[-1]


def import_zip(archive, parent, user):
    entries = list(zip_entries(archive, len(folder_path(parent))))
    result = {'imported': 0, 'existing': 0, 'conflicts': 0, 'folders_created': 0}
    folder_cache = {(): parent}
    used_bytes = library_bytes_with_lock()
    for entry, folders, name in entries:
        path = ()
        for part in folders:
            ancestor = folder_cache[path]
            # Reuse the accented folder from the initial library.
            if ancestor and ancestor.parent_id is None and ancestor.name_key == 'impor.damian' and part.casefold() == 'depositos':
                part = 'Dep\u00f3sitos'
            path = (*path, part.casefold())
            if path not in folder_cache:
                folder_cache[path], created = Folder.objects.get_or_create(
                    parent=ancestor, name_key=path[-1], defaults={'name': part},
                )
                result['folders_created'] += int(created)
        if name is None:
            continue
        with archive.open(entry) as stream:
            content = stream.read(MAX_FILE_BYTES + 1)
        if len(content) != entry.file_size or len(content) > MAX_FILE_BYTES:
            raise serializers.ValidationError({'detail': 'El ZIP contiene un archivo con un tama\u00f1o no v\u00e1lido.'})
        destination = folder_cache[path]
        current = Document.objects.filter(folder=destination, name_key=name.casefold()).values_list('content', flat=True).first()
        if current is not None:
            result['existing' if bytes(current) == content else 'conflicts'] += 1
            continue
        used_bytes += len(content)
        if used_bytes > MAX_LIBRARY_BYTES:
            raise serializers.ValidationError({'detail': 'La biblioteca alcanzo los 200 MB de almacenamiento.'})
        Document.objects.create(
            name=name, name_key=name.casefold(), folder=destination,
            uploaded_by=user, size=len(content), content=content,
        )
        result['imported'] += 1
    return result


class ZipImportView(PrivateView):
    permission_classes = [*PrivateView.permission_classes, ManageLibrary]
    parser_classes = [MultiPartParser]

    def post(self, request):
        form = ZipImportInput(data=request.data)
        form.is_valid(raise_exception=True)
        data = form.validated_data
        try:
            with ZipFile(data['file']) as archive, transaction.atomic():
                result = import_zip(archive, data.get('folder'), request.user)
        except (BadZipFile, OSError, RuntimeError, ValueError):
            raise serializers.ValidationError({'detail': 'No se pudo leer el ZIP. Comprueba que no este dañado ni protegido.'})
        return Response(result, status=status.HTTP_201_CREATED)


class DownloadView(PrivateView):
    def get(self, request, pk):
        document = get_object_or_404(Document.objects.only('name', 'content'), pk=pk)
        response = FileResponse(io.BytesIO(document.content), as_attachment=True, filename=document.name,
                                content_type='application/octet-stream')
        response['X-Content-Type-Options'] = 'nosniff'
        return response
