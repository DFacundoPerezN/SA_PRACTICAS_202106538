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
| POST | `/api/auth/register` | ❌ | Registra un usuario de tipo cliente en auth-service |
| POST | `/api/auth/admin/register` | ❌ | Solo el administrador puede registra a los 3 tipos de usuario en auth-service |
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
  "userId": "uuid-generado",
  "message": "User registered successfully"
}
```
---

#### POST `/api/auth/admin/register`

El rol puede ser:

1. Cliente
2. Técnico
3. Administrador

```json
{
  "email": "cliente2@gmail.com",
  "password": "201504070",
  "rol": 1 //1:cliente, 2:técnico, 3:administrador
}
```
**Respuesta esperada:**
```json
{
    "user_id": "ea1bc2e6-e1a3-485a-a837-d620c5e7f77f",
    "role": "cliente",
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
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
    "userId": "uuid-generado",
  "role": "administrador"
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
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
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
  "userId": "uuid-generado"
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
  "isActive": true,
  "createdAt": "2026-04-04T21:00:00.000Z"
}
```

---

#### GET `/api/users?page=1&limit=10&role=cliente`

Sin body. Query params opcionales:
- `page` (número, default 1)
- `limit` (número, default 20)
- `role` (string, opcional) // puede ser: "cliente", "administrador" o "tecnico"

**Respuesta esperada:**
```json
{
    "users": [
        {
            "id": "993c479f-1d7b-4610-aa0c-4caa372cbb54",
            "name": "hugo.1997rm",
            "email": "hugo.1997rm@gmail.com",
            "role": "cliente",
            "isActive": true,
            "createdAt": "2026-04-14T06:05:58.000Z"
        },
        {
            "id": "c1a9812e-bf41-428c-bffe-382635bd38fa",
            "name": "cliente5",
            "email": "cliente5@gmail.com",
            "role": "cliente",
            "isActive": true,
            "createdAt": "2026-04-17T07:03:33.000Z"
        },
        {
            "id": "ea1bc2e6-e1a3-485a-a837-d620c5e7f77f",
            "name": "cliente2",
            "email": "cliente2@gmail.com",
            "role": "cliente",
            "isActive": true,
            "createdAt": "2026-04-17T05:20:41.000Z"
        }
    ],
    "total": 3
}
```

---

#### GET `/api/users/550e8400-e29b-41d4-a716-446655440000`

Sin body.

**Respuesta esperada:**
```json
{
    "id": "ae5288e1-5e9d-44ef-b473-1b299da9de54",
    "name": "tecnico",
    "email": "tecnico@gmail.com",
    "role": "tecnico",
    "isActive": true,
    "createdAt": "2026-04-14T05:35:10.000Z"
}
```

---

#### GET `/api/users/email/juan@example.com`

Sin body.

**Respuesta esperada:**
```json
{
    "id": "ae5288e1-5e9d-44ef-b473-1b299da9de54",
    "name": "tecnico",
    "email": "tecnico@gmail.com",
    "role": "tecnico",
    "isActive": true,
    "createdAt": "2026-04-14T05:35:10.000Z"
}
```

---

#### PUT `/api/users/550e8400-e29b-41d4-a716-446655440000`
```json
{
  "name": "Juan Pérez Actualizado",
  "role": "Técnico"
}
```
> Todos los campos son opcionales.

**Respuesta:**

```json
{
    "id": "02a292ed-1af4-46bb-a8d3-6d5c59dc4b65",
    "name": "Juan Pérez Actualizado",
    "email": "tecnicoreprueba@gmail.com",
    "role": "tecnico",
    "isActive": true,
    "createdAt": "2026-04-17T07:04:14.000Z"
}
```

---

#### DELETE `/api/users/550e8400-e29b-41d4-a716-446655440000`

Sin body.

**Respuesta esperada:**
```json
{
    "success": true,
    "message": "User 02a292ed-1af4-46bb-a8d3-6d5c59dc4b65 deleted successfully"
}
```

---

### TICKETS  (`/api/tickets`)

> Todos los endpoints de tickets requieren el header:
> `Authorization: Bearer <access_token>`

| Método | Ruta | Roles permitidos | Descripción |
|--------|------|-----------------|-------------|
| POST   | `/api/tickets`                          | cliente, tecnico, admin | Crea un nuevo ticket (RF-06, RF-15) |
| GET    | `/api/tickets`                          | tecnico, admin          | Lista tickets con filtros (RF-07) |
| GET    | `/api/tickets/my`                       | cliente                 | Lista tickets propios del cliente autenticado |
| GET    | `/api/tickets/:id`                      | cualquier autenticado   | Detalle completo del ticket (RF-08) |
| PATCH  | `/api/tickets/:id`                      | tecnico, admin          | Actualiza campos del ticket (RF-09) |
| PATCH  | `/api/tickets/:id/status`               | tecnico, admin          | Cambia el estado del ticket (RF-10, RF-17) |
| POST   | `/api/tickets/:id/comments`             | cualquier autenticado   | Agrega un comentario al ticket (RF-12) |
| GET    | `/api/tickets/:id/comments`             | cualquier autenticado   | Lista comentarios de un ticket |
| GET    | `/api/tickets/search`                   | tecnico, admin          | Búsqueda fulltext (RF-13) |

---

#### POST `/api/tickets`

Crea un ticket. El sistema asigna automáticamente `created_by` desde el JWT. Publica el evento `ticket.created` en RabbitMQ.

```json
{
  "title": "No puedo acceder a mi correo corporativo",
  "description": "Desde esta mañana el acceso al correo falla con error 401. Ya intenté restablecer la contraseña sin éxito.",
  "category_id": 5,
  "priority_id": 2
}
```

> `category_id`: 1=Hardware, 2=Software, 3=Red/Conectividad, 4=Accesos y Permisos, 5=Correo Electrónico, 6=Otro  
> `priority_id`: 1=baja, 2=media, 3=alta, 4=critica

**Respuesta esperada:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "No puedo acceder a mi correo corporativo",
  "description": "Desde esta mañana el acceso al correo falla con error 401. Ya intenté restablecer la contraseña sin éxito.",
  "category": "Correo Electrónico",
  "priority": "media",
  "status": "abierto",
  "created_by": "550e8400-e29b-41d4-a716-446655440000",
  "assigned_to": null,
  "createdAt": "2026-04-05T10:00:00.000Z",
  "updatedAt": "2026-04-05T10:00:00.000Z"
}
```

---

#### GET `/api/tickets?status=abierto&priority_id=3&category_id=2&page=1&limit=20`

Sin body. Query params opcionales:
- `status` — abierto | en_progreso | resuelto | cerrado | reabierto
- `priority_id` — 1..4
- `category_id` — 1..6
- `assigned_to` — UUID del técnico
- `created_by` — UUID del creador
- `from` — fecha ISO inicio (ej. `2026-01-01`)
- `to` — fecha ISO fin
- `page` — default 1
- `limit` — default 20

**Respuesta esperada:**
```json
{
    "tickets": [
        {
            "id": "3bc0a3e9-57d0-437d-aedf-6464dfde912f",
            "title": "esta es una prueba",
            "description": "segundo ticket creado",
            "category": "Software",
            "priority": "media",
            "status": "abierto",
            "createdBy": "993c479f-1d7b-4610-aa0c-4caa372cbb54",
            "assignedTo": "ae5288e1-5e9d-44ef-b473-1b299da9de54",
            "resolvedAt": "",
            "closedAt": "",
            "createdAt": "2026-04-14T09:14:32.000Z",
            "updatedAt": "2026-04-14T09:14:33.000Z"
        },
        {
            "id": "c5a305ce-b31d-44a6-98a3-f14176eefe45",
            "title": "No puedo encender la computadora",
            "description": "La computadora no enciende al presionar el botón",
            "category": "Hardware",
            "priority": "critica",
            "status": "abierto",
            "createdBy": "993c479f-1d7b-4610-aa0c-4caa372cbb54",
            "assignedTo": "ae5288e1-5e9d-44ef-b473-1b299da9de54",
            "resolvedAt": "",
            "closedAt": "",
            "createdAt": "2026-04-14T06:06:47.000Z",
            "updatedAt": "2026-04-14T08:33:25.000Z"
        }
    ],
    "total": 2,
    "page": 1,
    "limit": 20
}
```

---

#### GET `/api/tickets/my?status=abierto&page=1&limit=10`

Lista los tickets del cliente autenticado. Extrae `created_by` del JWT automáticamente.

Sin body. Query params opcionales: `status`, `page`, `limit`.

---

#### GET `/api/tickets/a1b2c3d4-e5f6-7890-abcd-ef1234567890`

Sin body. Devuelve el ticket con su historial de cambios.

**Respuesta esperada:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "No puedo acceder a mi correo corporativo",
  "description": "Desde esta mañana...",
  "category": "Correo Electrónico",
  "priority": "media",
  "status": "en_progreso",
  "createdBy": "uuid-cliente",
  "assignedTo": "uuid-tecnico",
  "resolvedAt": null,
  "closedAt": null,
  "createdAt": "2026-04-05T10:00:00.000Z",
  "updatedAt": "2026-04-05T11:30:00.000Z",
  "history": [
    {
      "id": "uuid-history",
      "fieldChanged": "status",
      "oldValue": "abierto",
      "newValue": "en_progreso",
      "changedBy": "uuid-tecnico",
      "changedAt": "2026-04-05T11:30:00.000Z"
    }
  ]
}
```

---

#### PATCH `/api/tickets/a1b2c3d4-e5f6-7890-abcd-ef1234567890`

Actualiza campos editables del ticket (descripción, categoría, prioridad). Todos los campos son opcionales.

```json
{
  "description": "Descripción actualizada con más detalle del problema.",
  "priority_id": 3,
  "category_id": 4
}
```

**Respuesta esperada:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "No puedo acceder a mi correo corporativo",
  "priority": "alta",
  "category": "Accesos y Permisos",
  "status": "abierto",
  "updatedAt": "2026-04-05T12:00:00.000Z"
}
```

---

#### PATCH `/api/tickets/a1b2c3d4-e5f6-7890-abcd-ef1234567890/status`

Cambia el estado siguiendo la máquina de estados:
`abierto → en_progreso → resuelto → cerrado`
También permite `reabierto` desde `resuelto` o `cerrado`.

Publica el evento `ticket.status.updated` en RabbitMQ.

```json
{
  "status": "en_progreso"
}
```

> `status` acepta: `en_progreso` | `resuelto` | `cerrado` | `reabierto`

**Respuesta esperada:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "en_progreso",
  "updatedAt": "2026-04-05T12:30:00.000Z"
}
```

---

#### POST `/api/tickets/a1b2c3d4-e5f6-7890-abcd-ef1234567890/comments`

Agrega un comentario. Los comentarios `is_internal: true` solo son visibles para técnicos y administradores.

```json
{
  "content": "Revisé el servidor de correo y el problema parece ser un token OAuth expirado. Estoy regenerándolo.",
  "is_internal": true
}
```

**Respuesta esperada:**
```json
{
    "comments": [
        {
            "id": "389d9688-2a17-4acc-9654-3e5f13e9a73c",
            "ticketId": "c5a305ce-b31d-44a6-98a3-f14176eefe45",
            "authorId": "993c479f-1d7b-4610-aa0c-4caa372cbb54",
            "content": "este es un comentario",
            "isInternal": false,
            "createdAt": "2026-04-14T09:00:31.000Z"
        },
        {
            "id": "248be37d-1111-4e13-83ac-4a528b92f3b6",
            "ticketId": "c5a305ce-b31d-44a6-98a3-f14176eefe45",
            "authorId": "ae5288e1-5e9d-44ef-b473-1b299da9de54",
            "content": "este es otro comentario",
            "isInternal": false,
            "createdAt": "2026-04-14T19:41:40.000Z"
        }
    ],
    "total": 2
}
```

---

#### GET `/api/tickets/a1b2c3d4-e5f6-7890-abcd-ef1234567890/comments`

Sin body. Los clientes solo ven comentarios con `is_internal: false`.

**Respuesta esperada:**
```json
{
    "comments": [
        {
            "id": "389d9688-2a17-4acc-9654-3e5f13e9a73c",
            "ticketId": "c5a305ce-b31d-44a6-98a3-f14176eefe45",
            "authorId": "993c479f-1d7b-4610-aa0c-4caa372cbb54",
            "content": "este es un comentario",
            "isInternal": false,
            "createdAt": "2026-04-14T09:00:31.000Z"
        }
    ],
    "total": 1
}
```

---

#### GET `/api/tickets/search?q=correo+OAuth&status=abierto&page=1&limit=10`

Búsqueda fulltext sobre `title` y `description`. Combinable con los filtros del listado.

Sin body. Query params:
- `q` — texto libre (requerido)
- `status`, `priority_id`, `category_id`, `page`, `limit` — opcionales

**Respuesta esperada:**
```json
{
  "tickets": [
    {
      "id": "a1b2c3d4-...",
      "title": "No puedo acceder a mi correo corporativo",
      "status": "abierto",
      "priority": "media",
      "createdAt": "2026-04-05T10:00:00.000Z"
    }
  ],
  "total": 3
}
```

---

### ASSIGNMENTS  (`/api/assignments`)

> Todos los endpoints de assignments requieren el header:
> `Authorization: Bearer <access_token>`

| Método | Ruta | Roles permitidos | Descripción |
|--------|------|-----------------|-------------|
| POST   | `/api/assignments`                         | admin, tecnico  | Asignación manual de ticket a técnico (RF-11, RF-16) |
| GET    | `/api/assignments`                         | admin           | Lista todas las asignaciones con filtros |
| GET    | `/api/assignments/ticket/:ticket_id`       | admin, tecnico  | Asignación activa de un ticket específico |
| GET    | `/api/assignments/technician/:technician_id` | admin         | Asignaciones de un técnico específico |
| GET    | `/api/assignments/workload`                | admin           | Carga de trabajo de todos los técnicos (RF-22) |
| PATCH  | `/api/assignments/:id`                     | admin           | Reasigna o cierra una asignación |

---

#### POST `/api/assignments`

Asignación manual desde el gateway vía gRPC. Registra la asignación en `assignments_db`, actualiza `technician_workload` y publica el evento `ticket.assigned` en RabbitMQ. También actualiza el campo `assigned_to` del ticket en `tickets_db` (llamada gRPC interna al tickets-service).

```json
{
  "ticket_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "technician_id": "tecnico-uuid-1234",
  "notes": "Asignado por urgencia de categoría. El técnico tiene experiencia en accesos y permisos."
}
```

> `assigned_by` se extrae automáticamente del JWT del administrador que hace la petición.

**Respuesta esperada:**
```json
{
    "id": "db77da92-fd4c-4c23-a5c2-22ce14ae36aa",
    "ticketId": "c5a305ce-b31d-44a6-98a3-f14176eefe46",
    "technicianId": "ae5288e1-5e9d-44ef-b473-1b299da9de55",
    "assignedBy": "ae5288e1-5e9d-44ef-b473-1b299da9de54",
    "status": "asignado",
    "notes": "Asignado por urgencia de categoría. El técnico tiene experiencia en accesos y permisos.",
    "assignedAt": "2026-04-14T08:52:26.000Z",
    "closedAt": ""
}
```

---

#### GET `/api/assignments?status=asignado&technician_id=uuid&page=1&limit=20`

Sin body. Query params opcionales:
- `status` — pendiente | asignado | reasignado | cerrado
- `technician_id` — UUID del técnico
- `ticket_id` — UUID del ticket
- `from` / `to` — rango de fechas ISO
- `page`, `limit` — paginación

**Respuesta esperada:**
```json
{
    "assignments": [
        {
            "id": "db77da92-fd4c-4c23-a5c2-22ce14ae36aa",
            "ticketId": "c5a305ce-b31d-44a6-98a3-f14176eefe46",
            "technicianId": "ae5288e1-5e9d-44ef-b473-1b299da9de55",
            "assignedBy": "ae5288e1-5e9d-44ef-b473-1b299da9de54",
            "status": "asignado",
            "notes": "Asignado por urgencia de categoría. El técnico tiene experiencia en accesos y permisos.",
            "assignedAt": "2026-04-14T08:52:26.000Z",
            "closedAt": ""
        }
    ],
    "total": 1
}
```

---

#### GET `/api/assignments/ticket/a1b2c3d4-e5f6-7890-abcd-ef1234567890`

Sin body. Devuelve la asignación activa (`status = asignado` o `reasignado`) del ticket indicado.

**Respuesta esperada:**
```json
{
    "id": "4f12fd1d-cf1a-4f6f-a475-4a8cbf98e72c",
    "ticketId": "c5a305ce-b31d-44a6-98a3-f14176eefe45",
    "technicianId": "ae5288e1-5e9d-44ef-b473-1b299da9de54",
    "assignedBy": "ae5288e1-5e9d-44ef-b473-1b299da9de54",
    "status": "asignado",
    "notes": "Asignado por urgencia de categoría. El técnico tiene experiencia en accesos y permisos.",
    "assignedAt": "2026-04-14T08:33:25.000Z",
    "closedAt": ""
}
```

---

#### GET `/api/assignments/technician/tecnico-uuid-1234?status=asignado`

Sin body. Lista las asignaciones de un técnico con filtro opcional por estado.

**Respuesta esperada:**
```json
{
  "assignments": [
    {
      "id": "assignment-uuid",
      "ticketId": "a1b2c3d4-...",
      "status": "asignado",
      "assignedAt": "2026-04-05T10:05:00.000Z"
    }
  ],
  "total": 5
}
```

---

#### GET `/api/assignments/workload`

Sin body. Devuelve la carga de trabajo activa de todos los técnicos ordenada de menor a mayor (para asignación automática y supervisión, RF-22).

**Respuesta esperada:**
```json
{
  "workload": [
    {
      "technicianId": "tecnico-uuid-5678",
      "active_tickets": 2,
      "last_updated": "2026-04-05T12:00:00.000Z"
    },
    {
      "technician_id": "tecnico-uuid-1234",
      "active_tickets": 5,
      "last_updated": "2026-04-05T12:00:00.000Z"
    }
  ]
}
```

---

#### PATCH `/api/assignments/assignment-uuid`

Reasigna a otro técnico o cierra la asignación.

```json
{
  "technicianId": "tecnico-uuid-5678",
  "status": "reasignado",
  "notes": "Reasignado porque el técnico original está de vacaciones."
}
```

> Para cerrar: enviar `"status": "cerrado"` sin `technician_id`.

**Respuesta esperada:**
```json
{
  "id": "assignment-uuid",
  "ticketId": "a1b2c3d4-...",
  "technicianId": "tecnico-uuid-5678",
  "status": "reasignado",
  "notes": "Reasignado porque el técnico original está de vacaciones.",
  "assignedAt": "2026-04-05T14:00:00.000Z"
}
```

---

## Manejo de errores

Cualquier error (HTTP, gRPC, runtime) devuelve:
```json
{
  "statusCode": 404,
  "message": "Ticket not found",
  "path": "/api/tickets/id-inexistente",
  "timestamp": "2026-04-05T21:30:00.000Z"
}
```

Los códigos gRPC se traducen automáticamente a HTTP:
- `NOT_FOUND (5)` → `404`
- `ALREADY_EXISTS (6)` → `409`
- `UNAUTHENTICATED (16)` → `401`
- `PERMISSION_DENIED (7)` → `403`
- `INVALID_ARGUMENT (3)` → `400`
- `UNAVAILABLE (14)` → `503`

---

## Eventos RabbitMQ

| Evento | Publicado por | Consumido por | Descripción |
|--------|--------------|---------------|-------------|
| `ticket.created` | tickets-service | assignments-service | Dispara intento de asignación automática |
| `ticket.assigned` | assignments-service | notifications-service (futuro) | Notifica al cliente y técnico |
| `ticket.status.updated` | tickets-service | notifications-service (futuro) | Notifica cambio de estado |