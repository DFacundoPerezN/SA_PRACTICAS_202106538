# 📝 Guía de Migración: Monolito → Microservicios

Esta guía te ayudará a migrar tu backend monolítico actual a la arquitectura de microservicios con gRPC.

## 🎯 Pasos de Migración

### Paso 1: Preparar el entorno

```bash
# 1. Instalar Protocol Buffers Compiler
# Windows (PowerShell como administrador)
choco install protoc

# Verificar instalación
protoc --version

# 2. Instalar Go plugins para protoc
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# 3. Asegúrate de que estén en el PATH
go env GOPATH  # Anota este path
# Agrega $GOPATH/bin a tu PATH si no está
```

### Paso 2: Organizar tu proyecto actual

```bash
# Estructura antes de migrar
Backend/
├── cmd/
│   └── main.go          # Tu main.go actual
├── internal/
│   ├── config/
│   ├── domain/
│   ├── handler/
│   ├── pkg/
│   ├── repository/
│   └── service/
└── .env

# Crear nueva estructura
mkdir -p microservices
cd microservices
```

### Paso 3: Copiar archivos proto

```bash
# Copia los archivos proto que te proporcioné
mkdir proto
# Copia user.proto y auth.proto a proto/
```

### Paso 4: Generar código gRPC

```bash
# Opción A: Usar el script
chmod +x generate-proto.sh
./generate-proto.sh

# Opción B: Manual
protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    proto/user.proto

protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    proto/auth.proto
```

Deberías ver:
```
proto/
├── auth.proto
├── auth/
│   ├── auth.pb.go
│   └── auth_grpc.pb.go
├── user.proto
└── user/
    ├── user.pb.go
    └── user_grpc.pb.go
```

### Paso 5: Copiar código existente

```bash
# Copia tu carpeta internal como está
cp -r ../Backend/internal ./shared/internal
```

### Paso 6: Crear servicios gRPC

```bash
# Crear directorios
mkdir -p auth-service user-service api-gateway

# Copiar los archivos main.go que te proporcioné a cada carpeta
```

### Paso 7: Actualizar imports

En `auth-service/main.go`, `user-service/main.go` y `api-gateway/main.go`:

```go
import (
    "Backend/internal/config"           // ← Cambia "Backend" por el nombre de tu módulo
    "Backend/internal/domain"
    "Backend/internal/pkg/database"
    "Backend/internal/pkg/jwt"
    "Backend/internal/repository/sqlserver"
    "Backend/internal/service"
    pb "Backend/proto/auth"  // ← Cambia "Backend" por el nombre de tu módulo
)
```

**¿Cómo saber el nombre de tu módulo?**

Revisa el archivo `go.mod` en la raíz de tu proyecto Backend:

```go
module github.com/tu-usuario/Backend  // ← Este es el nombre
```

Reemplaza todos los imports de `Backend/` por ese nombre.

### Paso 8: Instalar dependencias

```bash
# En cada servicio (auth-service, user-service, api-gateway)
cd auth-service
go mod init Backend/auth-service
go mod tidy

cd ../user-service
go mod init Backend/user-service
go mod tidy

cd ../api-gateway
go mod init Backend/api-gateway
go mod tidy
```

### Paso 9: Configurar .env

Copia tu `.env` actual a cada servicio:

```bash
cp ../Backend/.env auth-service/
cp ../Backend/.env user-service/
cp ../Backend/.env api-gateway/
```

### Paso 10: Probar compilación

```bash
# Auth Service
cd auth-service
go build
# Deberías ver: auth-service o auth-service.exe

# User Service
cd ../user-service
go build

# API Gateway
cd ../api-gateway
go build
```

### Paso 11: Primera ejecución

```bash
# Terminal 1
cd auth-service
go run main.go

# Terminal 2
cd user-service
go run main.go

# Terminal 3
cd api-gateway
go run main.go
```

Deberías ver:
```
Auth Service starting on :50051
User Service starting on :50052
API Gateway starting on :8080
```

### Paso 12: Probar los endpoints

```bash
# Health check
curl http://localhost:8080/health

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Registro
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email":"nuevo@example.com",
    "password":"password123",
    "role":"CLIENTE",
    "nombre_completo":"Juan Pérez"
  }'
```

## 🔧 Solución de Problemas Comunes

### Error: "protoc: command not found"

```bash
# Windows
choco install protoc

# MacOS
brew install protobuf

# Linux
sudo apt install protobuf-compiler
```

### Error: "cannot find package"

```bash
# Instalar dependencias faltantes
go get google.golang.org/grpc
go get google.golang.org/protobuf
go get github.com/gin-gonic/gin
go get github.com/joho/godotenv
```

### Error: "Failed to connect to database"

Verifica en `.env`:
```env
DB_HOST=localhost
DB_PORT=1434  # o 1433
DB_USER=sa
DB_PASSWORD=tu_password
DB_NAME=Delivereats_SA
DB_WINDOWS_AUTH=false  # o true si usas autenticación de Windows
```

### Error: "Failed to connect to Auth Service"

- Asegúrate de que Auth Service esté corriendo primero
- Verifica que esté en el puerto 50051
- Revisa los logs: `tail -f logs/auth-service.log`

### Error: imports incorrectos

Si ves errores como:
```
package Backend/internal/config is not in GOROOT
```

Significa que necesitas ajustar los imports. Revisa tu `go.mod`:

```go
// Si tu go.mod dice:
module github.com/miusuario/delivery-backend

// Entonces tus imports deben ser:
import "github.com/miusuario/delivery-backend/internal/config"
```

## 📊 Comparación: Antes vs Después

### Antes (Monolito)

```
Backend/
└── cmd/
    └── main.go (1 archivo, ~400 líneas)
        ├── Gin Router
        ├── Auth Logic
        ├── User Logic
        ├── Database
        └── Middleware
```

**Problemas:**
- ❌ Todo en un proceso (si falla algo, falla todo)
- ❌ No se puede escalar independientemente
- ❌ Acoplamiento alto
- ❌ Difícil de mantener a largo plazo

### Después (Microservicios)

```
microservices/
├── auth-service/     (Puerto 50051)
│   └── Solo autenticación
├── user-service/     (Puerto 50052)
│   └── Solo gestión de usuarios
└── api-gateway/      (Puerto 8080)
    └── Solo enrutamiento HTTP
```

**Ventajas:**
- ✅ Separación de responsabilidades
- ✅ Escalabilidad independiente
- ✅ Fácil de mantener
- ✅ Despliegue independiente
- ✅ Tecnología independiente (cada servicio puede usar diferentes DBs, lenguajes, etc.)
- ✅ Performance mejorada (gRPC es ~7x más rápido que REST)

## 🚀 Próximos Pasos

Una vez que funcione:

1. **Agregar logging estructurado**
   ```bash
   go get go.uber.org/zap
   ```

2. **Agregar métricas (Prometheus)**
   ```bash
   go get github.com/prometheus/client_golang
   ```

3. **Agregar tracing (Jaeger)**
   ```bash
   go get go.opentelemetry.io/otel
   ```

4. **Dockerizar cada servicio**
   ```dockerfile
   FROM golang:1.21-alpine
   # ...
   ```

5. **Kubernetes deployment**
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   # ...
   ```

## 📞 ¿Necesitas ayuda?

Si encuentras algún error durante la migración, compárteme:

1. El error exacto (copy-paste completo)
2. El comando que ejecutaste
3. Tu go.mod (si es relevante)
4. Logs de los servicios (si aplica)

¡Buena suerte con la migración! 🚀
