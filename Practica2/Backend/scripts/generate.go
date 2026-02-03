//go:build ignore
// +build ignore

package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
)

func main() {
	// Obtener ruta actual
	currentDir, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}

	// Ruta del archivo .proto
	protoFile := filepath.Join(currentDir, "internal", "proto", "auth", "auth.proto")

	// Ruta de salida
	outputDir := filepath.Join(currentDir, "internal", "proto", "gen")

	// Crear directorio si no existe
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		log.Fatal(err)
	}

	// Verificar si protoc está disponible
	if _, err := exec.LookPath("protoc"); err != nil {
		log.Println("protoc no encontrado. Instalando via go install...")

		// Instalar protoc-gen-go y protoc-gen-go-grpc
		cmds := []*exec.Cmd{
			exec.Command("go", "install", "google.golang.org/protobuf/cmd/protoc-gen-go@latest"),
			exec.Command("go", "install", "google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest"),
		}

		for _, cmd := range cmds {
			cmd.Stdout = os.Stdout
			cmd.Stderr = os.Stderr
			if err := cmd.Run(); err != nil {
				log.Printf("Error instalando: %v", err)
			}
		}

		log.Println("Instalando protoc via chocolatey...")
		// Intentar instalar protoc con chocolatey
		choco := exec.Command("choco", "install", "protoc", "-y")
		choco.Stdout = os.Stdout
		choco.Stderr = os.Stderr
		if err := choco.Run(); err != nil {
			log.Println("Chocolatey no disponible, intentando descargar manualmente...")
			downloadProtocManually()
		}
	}

	// Generar código
	fmt.Println("Generando código gRPC...")

	cmd := exec.Command("protoc",
		fmt.Sprintf("--proto_path=%s", filepath.Join(currentDir, "internal", "proto")),
		fmt.Sprintf("--go_out=%s", outputDir),
		"--go_opt=paths=source_relative",
		fmt.Sprintf("--go-grpc_out=%s", outputDir),
		"--go-grpc_opt=paths=source_relative",
		protoFile,
	)

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		log.Printf("Error ejecutando protoc: %v", err)
		log.Println("Intentando generar con buf...")
		generateWithBuf()
	} else {
		fmt.Println("✅ Código gRPC generado exitosamente!")
	}
}

func downloadProtocManually() {
	// URL para descargar protoc
	url := "https://github.com/protocolbuffers/protobuf/releases/download/v25.2/protoc-25.2-win64.zip"
	log.Printf("Por favor descarga protoc manualmente de: %s", url)
	log.Println("1. Descarga el archivo ZIP")
	log.Println("2. Extrae protoc.exe")
	log.Println("3. Colócalo en C:\\Windows\\System32 o añade al PATH")
}

func generateWithBuf() {
	// Alternativa usando buf
	log.Println("Intentando usar buf...")

	// Verificar si buf está instalado
	if _, err := exec.LookPath("buf"); err != nil {
		log.Println("Instalando buf...")
		cmd := exec.Command("go", "install", "github.com/bufbuild/buf/cmd/buf@latest")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			log.Fatal("No se pudo instalar buf:", err)
		}
	}

	cmd := exec.Command("buf", "generate")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		log.Fatal("Error con buf:", err)
	}
}
