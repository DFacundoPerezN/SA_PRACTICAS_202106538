# API Gateway

NestJS HTTP → gRPC gateway. Escucha en `http://localhost:4000/api`.

## Arranque rápido

```bash
npm install
cp .env .env.local   # ajusta URLs si es necesario
npm run start:dev
```

> El directorio `proto/` debe existir en la raíz del proyecto (mismo nivel que `src/`).

---

## Endpoints y payloads de prueba

### AUTH  (`/api/auth`)

| Método | Ruta | Protegido | Descripción |
|--------|------|-----------|-------------|
| POST | `/api/auth/register` | ❌ | Registra un usuario en auth-service |
| POST | `/api/auth/login`    | ❌ | Devuelve access_token y refresh_token |
| POST | `/api/auth/refresh`  | ❌ | Renueva el par de tokens |
| POST | `/api/auth/validate` | ❌ | Valida si un access_token es vigente |
| POST | `/api/auth/logout`   | ❌ | Invalida el refresh_token |

---

#### POST `/api/auth/register`
```json
{
  "email": "juan@example.com",
  "password": "Segura1234!"
}
```
**Respuesta esperada:**
```json
{
  "user_id": "uuid-generado",
  "message": "User registered successfully"
}
```

---

#### POST `/api/auth/login`
```json
{
  "email": "juan@example.com",
  "password": "Segura1234!"
}
```
**Respuesta esperada:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "user_id": "uuid-generado"
}
```

---

#### POST `/api/auth/refresh`
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI..."
}
```
**Respuesta esperada:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."
}
```

---

#### POST `/api/auth/validate`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI..."
}
```
**Respuesta esperada:**
```json
{
  "valid": true,
  "user_id": "uuid-generado"
}
```

---

#### POST `/api/auth/logout`
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI..."
}
```
**Respuesta esperada:**
```json
{
  "success": true
}
```

---

### USERS  (`/api/users`)

> Todos los endpoints de usuarios requieren el header:
> `Authorization: Bearer <access_token>`

| Método | Ruta | Roles permitidos | Descripción |
|--------|------|-----------------|-------------|
| POST   | `/api/users`              | admin              | Crea un usuario |
| GET    | `/api/users`              | admin, agente      | Lista usuarios (paginado) |
| GET    | `/api/users/:id`          | cualquier autenticado | Busca por ID |
| GET    | `/api/users/email/:email` | cualquier autenticado | Busca por email |
| PUT    | `/api/users/:id`          | cualquier autenticado | Actualiza usuario |
| DELETE | `/api/users/:id`          | admin              | Elimina usuario |

---

#### POST `/api/users`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "role": "cliente"
}
```
> `role` acepta: `"admin"` | `"cliente"` | `"agente"` (por defecto `"cliente"`)

**Respuesta esperada:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "role": "cliente",
  "is_active": true,
  "created_at": "2026-04-04T21:00:00.000Z"
}
```

---

#### GET `/api/users?page=1&limit=10&role=cliente`

Sin body. Query params opcionales:
- `page` (número, default 1)
- `limit` (número, default 20)
- `role` (string, opcional)

**Respuesta esperada:**
```json
{
  "users": [ { "id": "...", "name": "...", ... } ],
  "total": 42
}
```

---

#### GET `/api/users/550e8400-e29b-41d4-a716-446655440000`

Sin body.

**Respuesta esperada:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "role": "cliente",
  "is_active": true,
  "created_at": "2026-04-04T21:00:00.000Z"
}
```

---

#### GET `/api/users/email/juan@example.com`

Sin body.

---

#### PUT `/api/users/550e8400-e29b-41d4-a716-446655440000`
```json
{
  "name": "Juan Pérez Actualizado",
  "role": "agente"
}
```
> Todos los campos son opcionales.

---

#### DELETE `/api/users/550e8400-e29b-41d4-a716-446655440000`

Sin body.

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "User deleted"
}
```

---

## Manejo de errores

Cualquier error (HTTP, gRPC, runtime) devuelve:
```json
{
  "statusCode": 404,
  "message": "User not found",
  "path": "/api/users/id-inexistente",
  "timestamp": "2026-04-04T21:30:00.000Z"
}
```

Los códigos gRPC se traducen automáticamente a HTTP:
- `NOT_FOUND (5)` → `404`
- `ALREADY_EXISTS (6)` → `409`
- `UNAUTHENTICATED (16)` → `401`
- `UNAVAILABLE (14)` → `503`
- etc.
