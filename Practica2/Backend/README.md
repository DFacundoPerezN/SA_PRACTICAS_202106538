# 🚀 DeliveryApp - Arquitectura de Microservicios con gRPC

Sistema de deliveries implementado con microservicios usando gRPC para comunicación entre servicios y API Gateway HTTP/REST para clientes.

## 📐 Arquitectura

```
┌──────────────────────────────────────────┐
│       API Gateway (Puerto 8080)          │
│         HTTP/REST + CORS                 │
│  - Gin Router                            │
│  - Convierte HTTP → gRPC                 │
│  - Autenticación JWT                     │
└──────────┬───────────────────────────────┘
           │ gRPC
    ┌──────┴──────┐
    │             │
┌───▼──────┐  ┌──▼──────────┐
│Auth Svc  │  │ User Svc    │
│:50051    │  │ :50052      │
│gRPC      │  │ gRPC        │
│          │  │             │
│- Login   │  │- CRUD Users │
│- Validate│  │- Get by ID  │
│  Token   │  │- Get by Mail│
└───┬──────┘  └──┬──────────┘
    │            │
    └─────┬──────┘
          │
    ┌─────▼──────┐
    │ SQL Server │
    └────────────┘
```

## 🏗️ Estructura del Proyecto

```
microservices-grpc/
├── proto/                    # Definiciones Protocol Buffers
│   ├── auth.proto           # Auth service definitions
│   └── user.proto           # User service definitions
├── api-gateway/             # API Gateway HTTP/REST
│   └── main.go
├── auth-service/            # Auth Microservice (gRPC)
│   └── main.go
├── user-service/            # User Microservice (gRPC)
│   └── main.go
└── shared/                  # Código compartido
    ├── internal/            # Tu código existente
    │   ├── config/
    │   ├── domain/
    │   ├── handler/
    │   ├── pkg/
    │   ├── repository/
    │   └── service/
    └── proto/               # Código generado de proto
        ├── auth/
        └── user/
```

## 📋 Requisitos Previos

1. **Go 1.21+**
2. **Protocol Buffers Compiler (protoc)**
   ```bash
   # Windows (con chocolatey)
   choco install protoc
   
   # MacOS
   brew install protobuf
   
   # Linux
   sudo apt install protobuf-compiler
   ```

3. **Go plugins para protoc**
   ```bash
   go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
   go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
   ```

4. **SQL Server** corriendo
5. **Dependencias Go**
   ```bash
   go get google.golang.org/grpc
   go get google.golang.org/protobuf
   go get github.com/gin-gonic/gin
   go get github.com/joho/godotenv
   go get github.com/golang-jwt/jwt/v5
   ```

## 🛠️ Instalación y Configuración

### 1. Copiar el código existente

Copia tu carpeta `internal/` actual a `shared/internal/`:

```bash
cp -r Backend/internal microservices-grpc/shared/internal
```

### 2. Generar código gRPC desde archivos .proto

```bash
cd microservices-grpc
chmod +x generate-proto.sh
./generate-proto.sh
```

O manualmente:

```bash
# Generar user.proto
protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    proto/user.proto

# Generar auth.proto
protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    proto/auth.proto
```

Esto generará:
- `proto/user/user.pb.go`
- `proto/user/user_grpc.pb.go`
- `proto/auth/auth.pb.go`
- `proto/auth/auth_grpc.pb.go`

### 3. Configurar variables de entorno

Crea un archivo `.env` en cada servicio:

```env
# Database
DB_HOST=localhost
DB_PORT=1434
DB_USER=sa
DB_PASSWORD=tu_password
DB_NAME=Delivereats_SA
DB_WINDOWS_AUTH=false

# JWT
JWT_SECRET=tu_secret_super_seguro
JWT_EXPIRATION_HOURS=24

# Server
SERVER_PORT=8080
```

### 4. Actualizar imports en los servicios

Asegúrate de que los imports en `auth-service/main.go` y `user-service/main.go` apunten correctamente:

```go
import (
    "Backend/internal/config"
    "Backend/internal/domain"
    "Backend/internal/pkg/database"
    "Backend/internal/pkg/jwt"
    "Backend/internal/repository/sqlserver"
    "Backend/internal/service"
    pb "Backend/proto/auth"  // o proto/user
)
```

## 🚀 Ejecución

### Opción 1: Ejecutar cada servicio manualmente

**Terminal 1 - Auth Service:**
```bash
cd auth-service
go run main.go
# Output: Auth Service starting on :50051
```

**Terminal 2 - User Service:**
```bash
cd user-service
go run main.go
# Output: User Service starting on :50052
```

**Terminal 3 - API Gateway:**
```bash
cd api-gateway
go run main.go
# Output: API Gateway starting on :8080
```

### Opción 2: Script de inicio (crear `start.sh`)

```bash
#!/bin/bash

echo "Starting Auth Service..."
cd auth-service && go run main.go &
AUTH_PID=$!

echo "Starting User Service..."
cd ../user-service && go run main.go &
USER_PID=$!

sleep 2

echo "Starting API Gateway..."
cd ../api-gateway && go run main.go &
GATEWAY_PID=$!

echo "All services started!"
echo "Auth Service PID: $AUTH_PID"
echo "User Service PID: $USER_PID"
echo "API Gateway PID: $GATEWAY_PID"

# Cleanup on exit
trap "kill $AUTH_PID $USER_PID $GATEWAY_PID" EXIT
wait
```

```bash
chmod +x start.sh
./start.sh
```

## 🔌 Endpoints API (igual que antes)

### Public Endpoints

**Login:**
```http
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "password123"
}
```

**Registro:**
```http
POST http://localhost:8080/api/users
Content-Type: application/json

{
  "email": "nuevo@example.com",
  "password": "password123",
  "role": "CLIENTE",
  "nombre_completo": "Juan Pérez",
  "telefono": "12345678"
}
```

### Protected Endpoints (requieren token)

**Get User Info:**
```http
GET http://localhost:8080/api/auth/me
Authorization: Bearer {token}
```

**Get All Users (ADMIN only):**
```http
GET http://localhost:8080/api/users?page=1&pageSize=10
Authorization: Bearer {token}
```

**Get User by ID:**
```http
GET http://localhost:8080/api/users/1
Authorization: Bearer {token}
```

**Update User:**
```http
PUT http://localhost:8080/api/users/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "nombre_completo": "Juan Carlos Pérez",
  "telefono": "87654321"
}
```

**Delete User (ADMIN only):**
```http
DELETE http://localhost:8080/api/users/1
Authorization: Bearer {token}
```

## 🔍 Testing

### Health Check
```bash
curl http://localhost:8080/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-04T...",
  "services": {
    "auth": "connected",
    "user": "connected"
  }
}
```

### Test Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## ⚙️ Ventajas de esta Arquitectura

### 1. **Separación de Responsabilidades**
- Auth Service: Solo autenticación y validación de tokens
- User Service: Solo gestión de usuarios
- API Gateway: Solo enrutamiento y conversión HTTP ↔ gRPC

### 2. **Escalabilidad Independiente**
Cada servicio puede escalarse por separado:
```bash
# Escalar User Service (3 instancias)
./user-service -port 50052 &
./user-service -port 50053 &
./user-service -port 50054 &
```

### 3. **Performance**
- gRPC es ~7x más rápido que REST
- Comunicación binaria (Protocol Buffers)
- HTTP/2 multiplexing

### 4. **Type Safety**
Los archivos `.proto` definen contratos estrictos entre servicios

### 5. **Fácil de Testear**
Cada microservicio se puede testear independientemente

## 🔧 Próximos Pasos

### 1. Service Discovery (Consul/Eureka)
Para que los servicios se encuentren automáticamente en producción

### 2. Load Balancing
Distribuir carga entre múltiples instancias

### 3. Circuit Breaker (Hystrix)
Manejo de fallos en cascada

### 4. API Gateway avanzado (Kong/Traefik)
Rate limiting, caching, logging

### 5. Monitoring (Prometheus + Grafana)
Métricas y dashboards

### 6. Distributed Tracing (Jaeger/Zipkin)
Trazabilidad de requests entre servicios

### 7. Message Queue (RabbitMQ/Kafka)
Para comunicación asíncrona

## 🐛 Troubleshooting

### Error: "Failed to connect to Auth Service"
- Verifica que Auth Service esté corriendo en el puerto 50051
- Revisa los logs del Auth Service

### Error: "Failed to connect to database"
- Verifica que SQL Server esté corriendo
- Revisa las credenciales en `.env`
- Verifica la conexión de red

### Error: "protoc: command not found"
- Instala Protocol Buffers compiler
- Asegúrate de que esté en el PATH

### Error: "invalid token"
- El token JWT puede haber expirado
- Verifica que el JWT_SECRET sea el mismo en todos los servicios

## 📚 Recursos

- [gRPC Documentation](https://grpc.io/docs/)
- [Protocol Buffers](https://protobuf.dev/)
- [Microservices Patterns](https://microservices.io/patterns/)
- [12 Factor App](https://12factor.net/)

## 📄 Licencia

Proyecto privado - Todos los derechos reservados
