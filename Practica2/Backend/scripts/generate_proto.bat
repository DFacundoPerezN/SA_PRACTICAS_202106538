@echo off
echo Generando gRPC...

REM Crear directorio si no existe
if not exist "internal\proto\gen" mkdir "internal\proto\gen"

REM Generar código
protoc --proto_path=internal/proto --go_out=internal/proto/gen --go_opt=paths=source_relative ^
       --go-grpc_out=internal/proto/gen --go-grpc_opt=paths=source_relative ^
       internal/proto/auth/auth.proto

echo codigo generado exitosamente!