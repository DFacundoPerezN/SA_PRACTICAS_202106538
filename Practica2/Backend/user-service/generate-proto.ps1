# Script para generar código gRPC desde archivos .proto en Windows

Write-Host "Generando código gRPC..." -ForegroundColor Blue

# Crear directorios si no existen
New-Item -ItemType Directory -Force -Path "proto\user" | Out-Null
New-Item -ItemType Directory -Force -Path "proto\auth" | Out-Null

# Generar código para user.proto
Write-Host "Generando user.proto..." -ForegroundColor Green
protoc --go_out=. --go_opt=paths=source_relative --go-grpc_out=. --go-grpc_opt=paths=source_relative proto/user.proto

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ user.proto generado exitosamente" -ForegroundColor Green
} else {
    Write-Host "✗ Error al generar user.proto" -ForegroundColor Red
    exit 1
}

# Generar código para auth.proto
Write-Host "Generando auth.proto..." -ForegroundColor Green
protoc --go_out=. --go_opt=paths=source_relative --go-grpc_out=. --go-grpc_opt=paths=source_relative proto/auth.proto

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ auth.proto generado exitosamente" -ForegroundColor Green
} else {
    Write-Host "✗ Error al generar auth.proto" -ForegroundColor Red
    exit 1
}

Write-Host "`n¡Código gRPC generado exitosamente!" -ForegroundColor Blue
Write-Host "Archivos generados:" -ForegroundColor Yellow
Write-Host "  - proto\auth\auth.pb.go" -ForegroundColor Cyan
Write-Host "  - proto\auth\auth_grpc.pb.go" -ForegroundColor Cyan
Write-Host "  - proto\user\user.pb.go" -ForegroundColor Cyan
Write-Host "  - proto\user\user_grpc.pb.go" -ForegroundColor Cyan