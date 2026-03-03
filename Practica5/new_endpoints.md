POST   /api/orders/:id/image

request:
{
    "image_url": "url_de la imagen"
}

response:
{
  "message": "Imagen agregada correctamente"
}

GET /api/orders/:id/image

response:
{
  "order_id": 8,
  "link": "url"
}


GET    /api/orders/cancelled

response:
[
  {
    "id": 1,
    "estado": "CANCELADA",
    "cliente_nombre": "Diego Perez",
    "costo_total": 60,
    "motivo": "Me cai"
  },
  {
    "id": 3,
    "estado": "RECHAZADA",
    "cliente_nombre": "Diego Perez",
    "costo_total": 25,
    "motivo": "Orden rechazada por el restaurante"
  }
]