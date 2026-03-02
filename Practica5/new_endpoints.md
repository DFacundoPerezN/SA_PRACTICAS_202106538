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
