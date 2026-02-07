.PHONY: help proto build run stop clean test

help:
	@echo "Available commands:"
	@echo "  make proto   - Generate gRPC code from .proto files"
	@echo "  make build   - Build all services"
	@echo "  make run     - Run all services"
	@echo "  make stop    - Stop all services"
	@echo "  make clean   - Clean build artifacts"
	@echo "  make test    - Run tests"

proto:
	@echo "Generating gRPC code..."
	@protoc --go_out=. --go_opt=paths=source_relative \
		--go-grpc_out=. --go-grpc_opt=paths=source_relative \
		proto/user.proto
	@protoc --go_out=. --go_opt=paths=source_relative \
		--go-grpc_out=. --go-grpc_opt=paths=source_relative \
		proto/auth.proto
	@echo "Done!"

build:
	@echo "Building Auth Service..."
	@cd auth-service && go build -o auth-service
	@echo "Building User Service..."
	@cd user-service && go build -o user-service
	@echo "Building API Gateway..."
	@cd api-gateway && go build -o api-gateway
	@echo "All services built!"

run:
	@./start.sh

stop:
	@./stop.sh

clean:
	@echo "Cleaning build artifacts..."
	@rm -f auth-service/auth-service
	@rm -f user-service/user-service
	@rm -f api-gateway/api-gateway
	@rm -f logs/*.log
	@echo "Clean complete!"

test:
	@echo "Running tests..."
	@cd auth-service && go test ./...
	@cd user-service && go test ./...
	@cd api-gateway && go test ./...
	@echo "Tests complete!"

install-deps:
	@echo "Installing dependencies..."
	@go get google.golang.org/grpc
	@go get google.golang.org/protobuf
	@go get github.com/gin-gonic/gin
	@go get github.com/joho/godotenv
	@go get github.com/golang-jwt/jwt/v5
	@echo "Dependencies installed!"
