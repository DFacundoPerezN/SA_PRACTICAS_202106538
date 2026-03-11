# Nuevos endpoints

## Calificacion repartidor
POST /ratings

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

GET /ratings/driver/12/average

response
{
  "promedio": 5,
  "total_calificaciones": 1
}