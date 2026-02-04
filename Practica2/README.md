# Practica 2

## Backend

### Framework Golang Gin

Gin is another popular Go framework known for its simplicity and performance. It uses the HttpRouter package for fast routing and supports various routing methods and parameters. Gin is often chosen for developing RESTful APIs and services due to its productivity and performance.

- **High** performance: Built for speed and efficiency, Gin handles high-traffic applications well.

- **Simplicity**: Provides a minimal and intuitive API, making it easy to build web applications.

- **Modular design**: Allows building applications using only the required packages, keeping the framework lightweight.

- **Middleware support**: Rich middleware system for adding functionality like logging, authentication, and request management.

- **JSON binding**: Built-in support for JSON binding, making it simple to use JSON data in requests and responses.

Gin's API is simple and powerful, with flexible routing and helpful utilities. Gin also provides fast and efficient request routing using the HttpRouter package. Gin is versatile and well-suited for creating RESTful APIs and microservices.

### Dependencias
```bash
# Instalar protoc (Protocol Buffers compiler)
# Descarga desde: https://github.com/protocolbuffers/protobuf/releases

# Instalar plugins de Go para protoc
go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.28
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.2

# Añadir al PATH (en Windows)
# Añade %GOPATH%\bin a tu PATH de sistema

```
### JWT 

JSON Web Tokens (JWT) son una forma compacta y segura de transmitir información entre dos partes en formato JSON. En Golang, la librería más utilizada para trabajar con JWT es golang-jwt/jwt, que permite crear, firmar, validar y analizar tokens de manera eficiente.

Para usar la librería, primero instálala con el siguiente comando:

´´´bash
go get -u github.com/golang-jwt/jwt/v5

´´´
Luego, es impórtala en el código con :

´´´golang
import "github.com/golang-jwt/jwt/v5"

´´´

Para generar un token, se definen los claims (datos que se desean incluir en el payload) y se utiliza el método jwt.NewWithClaims para construir el token. Finalmente, se firma con una clave secreta.

Para validar un token recibido, es utilizado el método jwt.Parse y proporciona una función de verificación que valide el algoritmo y la clave secreta.

### Frontend

### React + Vite

Vite es una herramienta moderna de desarrollo frontend que permite crear proyectos de manera rápida y eficiente. Es compatible con React y aprovecha los módulos ES6 para ofrecer un entorno de desarrollo ágil y dinámico.

**Beneficios de Usar Vite con React**

- Rendimiento Rápido: Gracias a su servidor de desarrollo optimizado y Hot Module Replacement (HMR) extremadamente rápido.

- Configuración Sencilla: No necesitas configurar manualmente herramientas como Webpack.

- Compatibilidad con Múltiples Frameworks: Además de React, soporta Vue, Svelte, Lit, entre otros.