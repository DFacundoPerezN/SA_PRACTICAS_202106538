//go:build ignore

package main

import (
	"fmt"
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	fmt.Println("Verificando archivos protobuf...")

	protoDir := "internal/proto/gen"

	files, err := os.ReadDir(protoDir)
	if err != nil {
		fmt.Printf("Error leyendo directorio: %v\n", err)
		return
	}

	for _, file := range files {
		if strings.HasSuffix(file.Name(), ".go") {
			fmt.Printf("\n🔍 Analizando: %s\n", file.Name())

			path := filepath.Join(protoDir, file.Name())
			content, err := os.ReadFile(path)
			if err != nil {
				fmt.Printf("Error leyendo: %v\n", err)
				continue
			}

			// Verificar paquete
			if strings.Contains(string(content), "package gen") {
				fmt.Printf("✅ Paquete correcto: 'gen'\n")
			} else {
				fmt.Printf("❌ Paquete incorrecto\n")
			}

			// Contar estructuras vs gRPC
			hasGrpc := strings.Contains(string(content), "AuthServiceClient") ||
				strings.Contains(string(content), "RegisterAuthServiceServer")
			hasStructs := strings.Contains(string(content), "type LoginRequest struct") ||
				strings.Contains(string(content), "type User struct")

			if hasGrpc && hasStructs {
				fmt.Printf("⚠️  ADVERTENCIA: Archivo mezcla estructuras y gRPC\n")
			} else if hasGrpc {
				fmt.Printf("✅ Solo código gRPC\n")
			} else if hasStructs {
				fmt.Printf("✅ Solo estructuras de datos\n")
			}

			// Verificar sintaxis Go
			fset := token.NewFileSet()
			_, err = parser.ParseFile(fset, path, nil, parser.AllErrors)
			if err != nil {
				fmt.Printf("❌ Error de sintaxis Go: %v\n", err)
			} else {
				fmt.Printf("✅ Sintaxis Go válida\n")
			}
		}
	}

	fmt.Println("\n✅ Verificación completada")
}
