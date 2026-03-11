# Nuevos endpoints

## Calificacion repartidor
POST /api/drivers/ratings

request
{
  "driver_id": 12,
  "stars": 5,
  "comment": "Excelente servicio"
}

response
{
  "rating_id": 1,
  "message": "Calificación registrada"
}

GET /api/ratings/driver/12/average

response
{
  "promedio": 5,
  "total_calificaciones": 1
}

## Calificacion restaurante

POST /api/restaurants/ratings

request
{
  "stars": 5,
  "comment": "Prueba Rest",
  "restaurant_id": 13
}

response
{
  "rating_id": 2,
  "message": "Calificación registrada"
}

GET /api/ratings/restaurant/:id/average

response
{
  "promedio": 5,
  "total_calificaciones": 1
}

## Recomencacion producto

POST   /api/products/recommendations

request
{
  "product_id": 1,
  "recommended": true
}

response
{
  "id": 1,
  "message": "Recomendación registrada"
}

GET    /api/products/:id/recommendation

response
{
  "porcentaje": 100,
  "total_recomendaciones": 1
}

## Obtener últimos restaurantes

GET /restaurants/new?n=7

response
[
  {
    "id": 24,
    "nombre": "Prueba Restaurante",
    "direccion": "17 calle zona 12"
  },
  {
    "id": 17,
    "nombre": "Calificacion Res",
    "direccion": "Enrique segoviano"
  },
  {
    "id": 13,
    "nombre": "Restaurante ",
    "direccion": "Zona 12",
    "calificacion": 5
  }
]
## Obtener restaurantes mejor calificados 

GET /restaurants/top?n=6
[
  {
    "id": 24,
    "nombre": "Prueba Restaurante",
    "direccion": "17 calle zona 12"
  },
  {
    "id": 17,
    "nombre": "Calificacion Res",
    "direccion": "Enrique segoviano"
  },
  {
    "id": 13,
    "nombre": "Restaurante ",
    "direccion": "Zona 12",
    "calificacion": 5
  }
]