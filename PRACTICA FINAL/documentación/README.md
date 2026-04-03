# Sistema de Soporte Técnico (Mesa de Ayuda) Orientado a Eventos

---

## Diagrama de arquitectura de alto nivel

<div align="center">
  <img src="img/diagrama-de-arquitectura.jpg" alt="" width="50%">
  <p><i>Figura 2: Diagrama de arquitectura de alto nivel.</i></p>
</div>

---

## Diagrama de despliegue

<div align="center">
  <img src="img/diagrama-de-despliegue.png" alt="" width="80%">
  <p><i>Figura 2: Diagrama de despliegue.</i></p>
</div>

---

## Justificación Técnica del Stack Tecnológico

La selección del stack tecnológico para el Sistema de Soporte Técnico se ha realizado considerando los requerimientos funcionales y no funcionales del proyecto, teniendo en cuenta la mantenibilidad del código y la portabilidad del sistema en entornos de nube.

### 1. Resumen del Stack

| Capa | Tecnología Seleccionada | Propósito |
|------|------------------------|-----------|
| **Lenguaje** | TypeScript | Tipado estático, mejor mantenibilidad y reducción de errores en tiempo de ejecución |
| **Framework Backend** | NestJS | Arquitectura modular, inyección de dependencias nativa y soporte para microservicios |
| **API Gateway** | NestJS + HTTP/REST | Punto único de entrada, autenticación centralizada y rate limiting |
| **Comunicación Interna** | gRPC | Alto rendimiento, contratos tipados y comunicación eficiente entre microservicios |
| **Bus de Mensajería** | RabbitMQ | Mensajería asíncrona confiable con soporte AMQP y fácil integración con NestJS |
| **Base de Datos** | MySQL 8.0 | Consistencia ACID, soporte FULLTEXT para búsquedas y madurez probada |
| **Contenerización** | Docker (multi-stage builds) | Imágenes optimizadas, reproducibilidad y aislamiento |
| **Orquestación Local** | Docker Compose | Levantamiento de todos los servicios con un solo comando |
| **Orquestación en Nube** | K3s | Kubernetes ligero, bajo consumo de recursos y portabilidad |
| **Proveedor Cloud** | Google Cloud Platform | Créditos educativos, integración con GCR y Compute Engine |
| **CI/CD** | GitHub Actions | Automatización de builds, tests y despliegues integrada con el repositorio |

---

## 2. TypeScript y NestJS — Argumentos SOLID explícitos

### TypeScript

| Ventaja | Justificación |
|---------|----------------|
| **Tipado estático** | Reduce errores en tiempo de ejecución, facilita el refactor y mejora la documentación del código. |
| **Interfaces y tipos** | Permite definir contratos claros entre microservicios (DTOs, eventos tipados). |
| **Compatibilidad con JavaScript** | Aprovecha todo el ecosistema de Node.js con seguridad adicional. |

### NestJS — Aplicación de Principios SOLID

| Principio SOLID | Implementación en NestJS | Evidencia en el código |
|----------------|--------------------------|------------------------|
| **S — Responsabilidad Única** | Cada módulo, controlador y servicio tiene una única razón de cambio. | `TicketsService` solo gestiona tickets; `AssignmentsService` solo gestiona asignaciones. |
| **O — Abierto/Cerrado** | Las clases están abiertas para extensión pero cerradas para modificación mediante herencia y composición. | Uso de `extends` y decoradores personalizados sin modificar clases base. |
| **L — Sustitución de Liskov** | Las clases derivadas pueden sustituir a sus clases base sin alterar el comportamiento. | Los repositorios abstractos permiten cambiar implementación (MySQL → PostgreSQL) sin afectar servicios. |
| **I — Segregación de Interfaces** | Interfaces específicas para cada cliente, evitando dependencias innecesarias. | Se definen interfaces pequeñas como `ITicketRepository`, `IUserRepository`. |
| **D — Inversión de Dependencias** | Inyección de dependencias mediante `@Injectable()` y módulos. | Los servicios dependen de abstracciones (repositorios) no de implementaciones concretas. |


---

## 3. HTTP REST (API Gateway) vs gRPC (Microservicios)

### Estrategia de Comunicación Dual

| Capa | Protocolo | Justificación |
|------|-----------|----------------|
| **Cliente → API Gateway** | HTTP/REST | Los clientes externos (web/mobile) requieren compatibilidad universal, facilidad de consumo y soporte nativo en navegadores. |
| **API Gateway → Microservicios** | gRPC | Mayor rendimiento, contratos tipados (Protocol Buffers) y comunicación eficiente en la red interna. |

### Comparativa Técnica

| Criterio | HTTP/REST | gRPC |
|----------|-----------|------|
| **Formato de datos** | JSON (texto, verboso) | Protocol Buffers (binario, compacto) |
| **Rendimiento** | Moderado | Alto (hasta 10x más rápido) |
| **Tipado** | Débil (no nativo) | Fuerte (contratos .proto) |
| **Navegadores** | ✅ Excelente | ⚠️ Limitado (requiere grpc-web) |
| **Streaming** | ❌ Unidireccional | ✅ Bidireccional nativo |
| **Generación de código** | Manual (Swagger/OpenAPI) | Automática desde .proto |

### Decisión final

| Uso | Protocolo | Razón |
|-----|-----------|-------|
| API Gateway expuesta al cliente | **HTTP/REST** | Simplicidad, compatibilidad, facilidad de depuración |
| Comunicación interna entre microservicios | **gRPC** | Rendimiento, tipado fuerte, latencia reducida |

---

## 4. RabbitMQ vs Kafka — Comparativa Técnica Directa

Para este proyecto se ha seleccionado **RabbitMQ** como bus de mensajería asíncrona.

### Tabla Comparativa

| Criterio | RabbitMQ ✅ | Apache Kafka |
|----------|-------------|--------------|
| **Modelo de mensajería** | Smart Broker / Dumb Consumer | Dumb Broker / Smart Consumer |
| **Patrón** | Colas, exchanges, routing keys | Logs particionados (topics) |
| **Persistencia** | Mensajes persistentes opcionales | Retención configurable por tiempo/tamaño |
| **Throughput** | ~50k msg/seg (suficiente) | ~1M msg/seg (sobreingeniería) |
| **Latencia** | Muy baja (microsegundos) | Baja, pero mayor que RabbitMQ |
| **Orden de mensajes** | Garantizado por cola | Garantizado por partición |
| **Complejidad operativa** | Baja | Alta |
| **Integración con NestJS** | Nativa (`@nestjs/microservices`) | Requiere librería externa |
| **Dead Letter Queue** | ✅ Nativa | ❌ Requiere configuración manual |
| **Casos de uso ideales** | RPC, tareas distribuidas, notificaciones | Streaming de eventos, big data, auditoría |

### Justificación de la elección de RabbitMQ

| Razón | Explicación |
|-------|-------------|
| **Volumen esperado** | El sistema de tickets no requiere procesamiento de millones de eventos por segundo. |
| **Simplicidad** | RabbitMQ es más fácil de configurar y operar en un entorno académico. |
| **Patrón de mensajería** | Se necesita routing flexible (exchanges) y colas específicas por tipo de evento. |
| **Integración nativa** | NestJS ofrece soporte oficial con `@nestjs/microservices` para RabbitMQ. |
| **Dead Letter Queue** | Permite manejar eventos fallidos (ej. asignación sin técnicos disponibles). |
| **Consumo de recursos** | Menor huella de memoria y CPU en contenedores Docker. |

---

## 5. MySQL 8.0

### Elección de MySQL 8.0

| Criterio | Justificación |
|----------|----------------|
| **Madurez y estabilidad** | Motor probado en entornos productivos durante décadas. |
| **Consistencia ACID** | Garantiza integridad transaccional para operaciones críticas (creación de tickets, asignaciones). |
| **Rendimiento en lecturas/escrituras** | Excelente para cargas de trabajo mixtas (OLTP). |
| **Facilidad de operación** | Amplia documentación y comunidad. |
| **Soporte en Docker** | Imagen oficial optimizada y fácil de configurar. |


### Modelo de datos por microservicio (Database per Service)

| Microservicio | Base de Datos | Tablas principales |
|---------------|---------------|---------------------|
| users-svc | `users_db` | usuarios, roles |
| tickets-svc | `tickets_db` | tickets, comentarios, historial_estados |
| assignments-svc | `assignments_db` | asignaciones, carga_trabajo |
| notifications-svc | `notifications_db` | notificaciones_enviadas |

### Independencia de datos

Cada microservicio tiene su propia base de datos, evitando acoplamiento directo a nivel de almacenamiento. La comunicación entre servicios se realiza únicamente vía API (gRPC) o eventos (RabbitMQ).

---

## 6. Docker y Docker Compose

### Docker — Contenerización

| Beneficio | Justificación |
|-----------|----------------|
| **Portabilidad** | La misma imagen funciona en desarrollo, testing y producción. |
| **Aislamiento** | Cada microservicio se ejecuta en su propio contenedor sin interferencias. |
| **Reproducibilidad** | El entorno está definido como código (Dockerfile). |
| **Consistencia** | Elimina el "funciona en mi máquina". |


### Ventajas de Docker Compose

| Beneficio | Descripción |
|-----------|-------------|
| **Un solo comando** | `docker-compose up` levanta todo el ecosistema. |
| **Redes automáticas** | Los servicios se descubren por nombre de servicio. |
| **Volúmenes persistentes** | Los datos sobreviven a reinicios de contenedores. |
| **Healthchecks** | Verificación automática del estado de cada servicio. |
| **Dependencias** | Control de orden de inicio (`depends_on`). |

---

## 7. K3s vs GKE nativo — Consumo de recursos y portabilidad

### Elección: K3s para despliegue en la nube

| Criterio | K3s ✅ | GKE nativo (Full K8s) |
|----------|--------|------------------------|
| **Memoria RAM requerida** | ~512 MB por nodo | ~2-4 GB por nodo |
| **Almacenamiento** | ~200 MB | ~1 GB+ |
| **Binarios** | Ejecutable único | Múltiples componentes separados |
| **Certificados** | Automáticos | Configuración manual |
| **Base de datos interna** | SQLite (embebido) | etcd (alto consumo) |
| **Instalación** | Un comando (`curl... \| bash`) | Múltiples pasos |
| **Compatibilidad** | 100% K8s (pasa tests CNCF) | 100% K8s |
| **Actualizaciones** | Simplificadas | Complejas |

### Justificación de K3s

| Razón | Explicación |
|-------|-------------|
| **Bajo consumo de recursos** | Ideal para instancias pequeñas en la nube (nodos de 2 vCPU, 4GB RAM). |
| **Portabilidad** | Los mismos manifiestos (Deployment, Service, Ingress) funcionan en cualquier Kubernetes. |
| **Facilidad de instalación** | Se puede desplegar en Compute Engine en minutos. |
| **K3s + K3d para desarrollo local** | Permite simular el entorno de producción en la máquina local. |
| **Certificación CNCF** | Garantiza compatibilidad con estándares de Kubernetes. |


## 8. Google Cloud Platform — Créditos, GCR y Compute Engine

### Selección de GCP como proveedor cloud

| Criterio | Justificación |
|----------|----------------|
| **Créditos educativos** | Google for Education ofrece $200-$500 en créditos para estudiantes. |
| **Google Container Registry (GCR)** | Almacenamiento de imágenes Docker integrado con el ecosistema GCP. |
| **Compute Engine (GCE)** | Instancias VM flexibles para desplegar K3s (e2-small, e2-medium). |
| **Integración con GitHub Actions** | Autenticación mediante Workload Identity Federation. |
| **Red global** | Baja latencia y alta disponibilidad. |


### Justificación de Compute Engine sobre otros servicios

| Servicio GCP | Uso en este proyecto |
|--------------|----------------------|
| **Compute Engine** | Alojamiento del clúster K3s (máximo control y costo optimizado). |
| **GKE (Google Kubernetes Engine)** | Descartado por costo (cargo por clúster ~$70/mes + nodos). |
| **Cloud Run** | No aplica (requiere microservicios sin estado, no aplica para MySQL). |
| **Cloud SQL** | Costo elevado para proyecto académico (~$15-30/mes). |

---

## 9. GitHub Actions — CI/CD y coherencia general del stack

### Selección de GitHub Actions

| Criterio | Justificación |
|----------|----------------|
| **Integración nativa** | El repositorio ya está alojado en GitHub. |
| **Gratuito para repositorios privados** | 2000 minutos/mes gratis. |
| **Marketplace de acciones** | Acciones predefinidas para Docker, GCR, K3s, etc. |
| **Matriz de pruebas** | Soporta pruebas paralelas en múltiples versiones de Node.js. |
| **Secretos integrados** | Almacenamiento seguro de credenciales (GCP keys, RabbitMQ, MySQL). |

---