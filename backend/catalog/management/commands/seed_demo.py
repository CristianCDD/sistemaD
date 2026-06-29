from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from catalog.models import Category, Product
from inventory.models import StockMovement
from landing.models import LandingConfig, LandingImage


class Command(BaseCommand):
    help = 'Carga datos demo para probar productos, servicios, landing y movimientos de stock.'

    def handle(self, *args, **options):
        admin = self.ensure_admin()
        categories = self.seed_categories()
        products = self.seed_products(categories)
        self.seed_landing()
        self.seed_movements(products, admin)

        stock_products = Product.objects.filter(manages_stock=True).count()
        landing_products = Product.objects.filter(show_on_landing=True).count()
        demo_movements = StockMovement.objects.filter(note__startswith='[demo]').count()

        self.stdout.write(self.style.SUCCESS('Datos demo cargados correctamente.'))
        self.stdout.write(f'Productos con stock: {stock_products}')
        self.stdout.write(f'Productos/servicios en landing: {landing_products}')
        self.stdout.write(f'Movimientos demo: {demo_movements}')

    def ensure_admin(self):
        user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@example.com',
                'is_staff': True,
                'is_superuser': True,
            },
        )
        user.is_staff = True
        user.is_superuser = True
        user.set_password('Admin12345!')
        user.save()
        return user

    def seed_categories(self):
        data = [
            ('materiales-impresion', 'Materiales de impresion', 'Lonas, canvas, viniles y materiales base.'),
            ('viniles', 'Viniles', 'Viniles decorativos, transparentes y especiales.'),
            ('accesorios', 'Accesorios', 'Herramientas y consumibles complementarios.'),
            ('servicios', 'Servicios', 'Servicios de instalacion, diseno e impresion.'),
            ('laminas', 'Laminas', 'Laminas de seguridad y acabados especiales.'),
        ]
        categories = {}
        for slug, name, description in data:
            category, _ = Category.objects.update_or_create(
                slug=slug,
                defaults={'name': name, 'description': description, 'is_active': True},
            )
            categories[slug] = category
        return categories

    def seed_products(self, categories):
        rows = [
            ('CAN-150', 'Canvas 1.50', 'producto', 'materiales-impresion', 'Canvas para impresion de alta calidad.', '120.00', '80.00', 10, True, True, True),
            ('PERF-150', 'Perforado 1.50', 'producto', 'materiales-impresion', 'Material microperforado para ventanas y publicidad.', '98.00', '61.00', 8, True, True, True),
            ('PAV-150', 'Pavonado 1.50', 'producto', 'viniles', 'Vinil pavonado para oficinas y mamparas.', '89.00', '52.00', 6, True, False, True),
            ('LAM-SEG', 'Laminas de seguridad', 'producto', 'laminas', 'Lamina de seguridad para vidrios.', '135.00', '92.00', 5, True, True, True),
            ('VIN-TRANS', 'Vinil transparente brillante 1.50', 'producto', 'viniles', 'Vinil transparente para trabajos publicitarios.', '95.00', '61.50', 5, True, False, True),
            ('BACK-150', 'Back Light brillo 1.50', 'producto', 'materiales-impresion', 'Material backlight para cajas luminosas.', '142.00', '99.00', 7, True, True, True),
            ('HOLO-150', 'Holografiado espejo impresion directa 1.50', 'producto', 'viniles', 'Material holografico efecto espejo.', '165.00', '118.00', 3, True, False, True),
            ('REF-120', 'Reflectivo blanco 1.20 codigo 200', 'producto', 'viniles', 'Vinil reflectivo blanco para senalizacion.', '210.00', '152.00', 4, True, True, True),
            ('LAM-FRIA', 'Laminado frio brillante 1.50', 'producto', 'laminas', 'Laminado frio brillante para proteccion.', '88.00', '56.00', 10, True, False, True),
            ('LAM-MATE', 'Laminado frio mate 1.50', 'producto', 'laminas', 'Laminado mate para acabados sobrios.', '91.00', '58.00', 10, True, False, True),
            ('TAPE-APP', 'Application tape 1.22', 'producto', 'accesorios', 'Transfer para aplicacion de vinil de corte.', '72.00', '44.00', 6, True, True, True),
            ('ESP-10MM', 'Espuma PVC 10mm', 'producto', 'materiales-impresion', 'Panel de espuma PVC para senaletica.', '48.00', '29.00', 12, True, True, True),
            ('ACR-3MM', 'Acrilico transparente 3mm', 'producto', 'materiales-impresion', 'Plancha acrilica transparente.', '75.00', '46.00', 8, True, True, True),
            ('OJAL-500', 'Ojales bolsa x500', 'producto', 'accesorios', 'Ojales metalicos para banners y lonas.', '38.00', '22.00', 15, True, True, True),
            ('CUT-45', 'Cuchilla plotter 45 grados', 'producto', 'accesorios', 'Cuchilla de repuesto para plotter de corte.', '28.00', '14.50', 10, True, True, True),
            ('SERV-INST', 'Instalacion de vinil', 'servicio', 'servicios', 'Servicio de instalacion para negocios y oficinas.', '150.00', '70.00', 0, False, True, True),
            ('SERV-DISENO', 'Diseno grafico personalizado', 'servicio', 'servicios', 'Diseno de piezas graficas bajo requerimiento.', None, '45.00', 0, False, True, False),
            ('SERV-IMP', 'Impresion gran formato', 'servicio', 'servicios', 'Servicio de impresion en gran formato.', None, '0.00', 0, False, True, False),
        ]

        products = {}
        for sku, name, product_type, category_slug, description, sale_price, cost, minimum_stock, manages_stock, show_landing, show_price in rows:
            product, _ = Product.objects.update_or_create(
                sku=sku,
                defaults={
                    'name': name,
                    'description': description,
                    'product_type': product_type,
                    'category': categories[category_slug],
                    'sale_price': Decimal(sale_price) if sale_price is not None else None,
                    'cost': Decimal(cost) if cost is not None else None,
                    'minimum_stock': minimum_stock,
                    'manages_stock': manages_stock,
                    'show_on_landing': show_landing,
                    'show_price_on_landing': show_price,
                    'is_active': True,
                },
            )
            products[sku] = product
        return products

    def seed_landing(self):
        LandingConfig.objects.update_or_create(
            id=1,
            defaults={
                'business_name': 'Distribuidor Damian',
                'headline': 'Productos y servicios para impresion',
                'subheadline': 'Catalogo publico conectado al sistema administrativo.',
                'whatsapp': '999999999',
                'email': 'ventas@example.com',
                'address': 'Lima, Peru',
                'facebook_url': '',
                'instagram_url': '',
                'tiktok_url': '',
                'is_active': True,
            },
        )
        LandingImage.objects.filter(title__startswith='Demo ').delete()

    def seed_movements(self, products, admin):
        StockMovement.objects.filter(note__startswith='[demo]').delete()

        plans = {
            'CAN-150': (date(2026, 1, 8), 32, [6, 4, 7, 3, 5, 2]),
            'PERF-150': (date(2026, 1, 10), 18, [3, 2, 4, 2, 1]),
            'PAV-150': (date(2026, 1, 12), 14, [2, 4, 3, 2]),
            'LAM-SEG': (date(2026, 1, 15), 10, [1, 2, 1, 1]),
            'VIN-TRANS': (date(2026, 1, 18), 16, [4, 2, 3, 2, 1]),
            'BACK-150': (date(2026, 1, 20), 11, [1, 2, 1]),
            'HOLO-150': (date(2026, 2, 3), 7, [1, 2, 1, 1]),
            'REF-120': (date(2026, 2, 6), 9, [2, 1, 2]),
            'LAM-FRIA': (date(2026, 2, 9), 24, [5, 3, 4, 2]),
            'LAM-MATE': (date(2026, 2, 11), 22, [3, 2, 2, 4]),
            'TAPE-APP': (date(2026, 2, 13), 12, [2, 3, 1]),
            'ESP-10MM': (date(2026, 2, 15), 30, [6, 5, 4, 3]),
            'ACR-3MM': (date(2026, 2, 18), 20, [4, 2, 5, 1]),
            'OJAL-500': (date(2026, 2, 20), 40, [8, 5, 7, 6]),
            'CUT-45': (date(2026, 2, 22), 18, [2, 4, 3, 2]),
        }

        for sku, (start_date, initial_quantity, exits) in plans.items():
            product = products[sku]
            StockMovement.objects.create(
                product=product,
                movement_type=StockMovement.MovementType.IN,
                quantity=initial_quantity,
                movement_date=start_date,
                note='[demo] carga inicial',
                created_by=admin,
            )

            current_date = start_date + timedelta(days=5)
            for index, quantity in enumerate(exits, start=1):
                StockMovement.objects.create(
                    product=product,
                    movement_type=StockMovement.MovementType.OUT,
                    quantity=quantity,
                    movement_date=current_date,
                    note=f'[demo] salida venta #{index}',
                    created_by=admin,
                )
                current_date += timedelta(days=11 + (index % 4))

            if sku in {'CAN-150', 'VIN-TRANS', 'LAM-FRIA', 'OJAL-500'}:
                StockMovement.objects.create(
                    product=product,
                    movement_type=StockMovement.MovementType.IN,
                    quantity=10,
                    movement_date=date(2026, 5, 20),
                    note='[demo] reposicion mayo',
                    created_by=admin,
                )

        StockMovement.objects.create(
            product=products['CAN-150'],
            movement_type=StockMovement.MovementType.OUT,
            quantity=2,
            movement_date=date(2026, 2, 25),
            note='[demo] consulta puntual 25/02/2026',
            created_by=admin,
        )
