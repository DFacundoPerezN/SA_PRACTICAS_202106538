# Flujo de Autenticación JWT - Delivereats

## Descripción General

El sistema Delivereats implementa autenticación basada en JSON Web Tokens para gestionar sesiones de usuario de forma stateless. El flujo utiliza tokens firmados digitalmente para validar la identidad de los usuarios en cada petición.

---

## Arquitectura de Autenticación

![Diagrama de Arquitectura JWT](./imgs/image-1.png)
 

---

## 1. Registro de Usuario

### Endpoint
```
POST /api/users
```

### Request Body
```json
{
  "email": "juan.perez@example.com",
  "password": "SecurePass123!",
  "name": "Juan Pérez",
  "role": "CLIENTE"
}
```

### Response (201 Created)
```json
{
  "id": 13,
  "email": "juan.perez@example.com"
}
```

### Error Response (400 Bad Request)
```json
{
  "error": "invalid body"
}
```

O si el usuario ya existe:
```json
{
  "error": "email already exists"
}
```

### Roles Disponibles
- `CLIENTE`
- `RESTAURANTE`
- `REPARTIDOR`
- `ADMINISTRADOR`

---

## 2. Inicio de Sesión

### Endpoint
```
POST /api/auth/login
```

### Request Body
```json
{
  "email": "juan.perez@example.com",
  "password": "SecurePass123!"
}
```

### Response (200 OK)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMywiZW1haWwiOiJqdWFuLnBlcmV6QGV4YW1wbGUuY29tIiwicm9sZSI6IkNMSUVOVEUiLCJpc3MiOiJkZWxpdmVyeS1zeXN0ZW0iLCJleHAiOjE3NzAwMjQ4NzksImlhdCI6MTc3MDAxMDQ3OX0.DeohvkN0kHuYnco5rUw2DK",
  "email": "juan.perez@example.com",
  "role": "CLIENTE",
  "name": "Juan Pérez",
  "id": 13
}
```

### Error Response (401 Unauthorized)
```json
{
  "error": "invalid credentials"
}
```

O si el cuerpo es inválido (400 Bad Request):
```json
{
  "error": "invalid body"
}
```

---

## 3. Estructura del JWT

El token JWT contiene la siguiente información:

### Payload (Claims)
```json
{
  "user_id": 13,
  "email": "juan.perez@example.com",
  "role": "CLIENTE",
  "iss": "delivery-system",
  "iat": 1770010479,
  "exp": 1770024879
}
```

**Claims utilizados:**
- `user_id`: ID del usuario en la base de datos
- `email`: Correo electrónico del usuario
- `role`: Rol del usuario (CLIENTE, RESTAURANTE, REPARTIDOR, ADMINISTRADOR)
- `iss`: Emisor del token ("delivery-system")
- `iat`: Timestamp de emisión (issued at)
- `exp`: Timestamp de expiración (expiration time)

---

## 4. Uso del Token en Peticiones Protegidas

Todas las rutas protegidas requieren el header `Authorization` con el token JWT.

### Ejemplo: Crear una Orden

#### Endpoint
```
POST /api/orders
```

#### Headers
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

#### Request Body
```json
{
  "restaurant_id": 5,
  "items": [
    {
      "product_id": 10,
      "quantity": 2
    }
  ]
}
```

### Ejemplo: Obtener Perfil del Usuario

#### Endpoint
```
GET /api/profile
```

#### Headers
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response (200 OK)
```json
{
  "user_id": 13,
  "email": "juan.perez@example.com"
}
```

---

## 5. Middleware de Validación JWT

El middleware de autenticación valida el token en cada petición protegida.
 

### Errores de Autenticación

#### Token Faltante
```json
{
  "error": "missing token"
}
```
**Status Code:** 401 Unauthorized

#### Formato de Token Inválido
```json
{
  "error": "invalid token format"
}
```
**Status Code:** 401 Unauthorized

#### Token Inválido o Expirado
```json
{
  "error": "invalid token"
}
```
**Status Code:** 401 Unauthorized

---

## 6. Rutas Públicas vs Protegidas

### Rutas Públicas (sin autenticación)
```
POST   /api/auth/login
POST   /api/users
GET    /api/restaurants
GET    /api/restaurants/:id/products
GET    /api/orders/available
POST   /api/products
GET    /health
```

### Rutas Protegidas (requieren JWT)
```
GET    /api/profile
POST   /api/restaurants
POST   /api/orders
PATCH  /api/orders/:id/status
POST   /api/orders/:id/cancel
GET    /api/orders/me
GET    /api/orders/restaurant/:id
PUT    /api/orders/:id/assign
GET    /api/orders/driver/me
```
 
