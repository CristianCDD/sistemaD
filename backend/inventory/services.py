from django.db.models import Case, F, IntegerField, Sum, When
from django.db.models.functions import Coalesce


def stock_expression():
    return Coalesce(
        Sum(
            Case(
                When(stock_movements__movement_type='entrada', then=F('stock_movements__quantity')),
                When(stock_movements__movement_type='salida', then=-F('stock_movements__quantity')),
                When(stock_movements__movement_type='ajuste', then=F('stock_movements__quantity')),
                default=0,
                output_field=IntegerField(),
            )
        ),
        0,
    )


def get_product_stock(product):
    aggregate = product.stock_movements.aggregate(
        stock=Coalesce(
            Sum(
                Case(
                    When(movement_type='entrada', then=F('quantity')),
                    When(movement_type='salida', then=-F('quantity')),
                    When(movement_type='ajuste', then=F('quantity')),
                    default=0,
                    output_field=IntegerField(),
                )
            ),
            0,
        )
    )
    return aggregate['stock'] or 0
