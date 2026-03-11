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