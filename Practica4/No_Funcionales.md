# Requerimientos No-Funcionales - Fase 2 Delivereats

## Arquitectura
### RNF-01: El sistema debe usar arquitectura de microservicios desacoplados.
### RNF-02: La comunicación externa será vía REST con especificación OpenAPI.
### RNF-03: La comunicación interna entre servicios será mediante gRPC.
### RNF-04: El sistema debe implementar patrones de resiliencia.

## Seguridad y Autenticación
### RNF-05: El sistema debe usar JWT para autenticación con expiración configurada.
### RNF-06: Todas las contraseñas deben estar hasheadas con algoritmos seguros (bcrypt).
### RNF-07: La comunicación entre servicios debe estar cifrada con TLS/SSL.
### RNF-08: Implementar validación y sanitización de inputs en todos los endpoints.

## Datos
### RNF-09: Cada microservicio tendrá su propia base de datos.
### RNF-10: La base de datos debe ser relacional.
### RNF-11: Implementar migraciones automáticas de base de datos.
### RNF-12: Cada servicio debe mantener su propio esquema de BD sin dependencias externas.

## Contenedorización
### RNF-13: El sistema debe poder ejecutarse en contenedores Docker.
### RNF-14: Cada microservicio debe tener su propio Dockerfile optimizado.
### RNF-15: Implementar multi-stage builds para reducir tamaño de imágenes.

## Orquestación y Escalabilidad
### RNF-16: El sistema debe ser escalable horizontalmente mediante Kubernetes.
### RNF-17: Configurar HPA con métricas de CPU y memoria.
### RNF-18: Implementar health checks en todos los servicios.
### RNF-19: Cada pod debe tener límites de recursos configurados.

## Mensajería Asíncrona
### RNF-20: Implementar mensajería asíncrona mediante RabbitMQ o Kafka.
### RNF-21: Los eventos de cambio de estado de órdenes serán publicados a través del broker de mensajes.
### RNF-22: El sistema debe garantizar entrega de mensajes con reintentos configurables.
### RNF-23: Implementar dead letter queues para manejo de errores.

## CI/CD
### RNF-24: Implementar pipeline de CI con pruebas automáticas en cada commit.
### RNF-25: Implementar pipeline de CD con deployments automáticos a Kubernetes.
### RNF-26: Validar cobertura de código mínimo del 70%.
### RNF-27: Ejecutar análisis de seguridad estática en el pipeline.

## Observabilidad
### RNF-28: Implementar logging centralizado en todos los servicios.
### RNF-29: Implementar trazabilidad distribuida con OpenTelemetry.
### RNF-30: Implementar monitoreo con métricas de Prometheus y visualización en Grafana.
### RNF-31: Configurar alertas para anomalías en desempeño y disponibilidad.

## Desempeño
### RNF-32: El tiempo de respuesta de los endpoints debe ser menor a 500ms en promedio.
### RNF-33: El sistema debe soportar al menos 1000 usuarios concurrentes.
### RNF-34: Implementar caché distribuido para datos frecuentes.
### RNF-35: Optimizar queries de base de datos con índices apropiados.

## Disponibilidad
### RNF-36: El sistema debe tener disponibilidad del 99% (SLA).
### RNF-37: Implementar replicación de datos en base de datos.
### RNF-38: Configurar backups automáticos diarios.
### RNF-39: Implementar estrategia de disaster recovery con RTO < 1 hora.

## Documentación
### RNF-40: Mantener documentación de APIs actualizada con OpenAPI/Swagger.
### RNF-41: Documentar arquitectura, decisiones técnicas y patrones utilizados.
### RNF-42: Documentación de infraestructura de Kubernetes.
### RNF-43: Guías de deployments, troubleshooting y runbooks operacionales.
