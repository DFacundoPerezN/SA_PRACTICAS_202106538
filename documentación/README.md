# Sistema de Soporte Técnico (Mesa de Ayuda) Orientado a Eventos

---

## Actores del Sistema

Antes de definir los requerimientos, se identifican los actores que interactúan con el sistema:

| Actor | Tipo | Descripción |
|-------|------|-------------|
| **Cliente** | Externo | Usuario que reporta incidentes. Puede crear tickets, ver sus propios tickets, agregar comentarios públicos y recibir notificaciones sobre el avance. |
| **Técnico de Soporte** | Externo | Usuario que atiende y resuelve tickets. Puede ver los tickets asignados, cambiar estados, agregar comentarios internos y públicos. |
| **Administrador** | Externo | Tiene control total del sistema. Puede gestionar usuarios, reasignar tickets, configurar categorías y visualizar reportes y métricas. |
| **Sistema** | Interno | Representa el comportamiento automatizado: publicación y consumo de eventos en RabbitMQ, asignación automática de tickets, cierre automático por inactividad y generación de notificaciones. |

---

## Requerimientos Funcionales (RF)

### Módulo de Gestión de Usuarios

| ID | Requerimiento | Descripción |
|----|---------------|-------------|
| **RF-01** | Registro de usuarios | El sistema debe permitir el registro de nuevos usuarios (clientes y técnicos de soporte) con nombre, email, contraseña y rol. |
| **RF-02** | Autenticación de usuarios | El sistema debe autenticar usuarios mediante email y contraseña, generando un token de sesión (JWT). |
| **RF-03** | Listado de usuarios | El sistema debe permitir listar todos los usuarios registrados, con filtros opcionales por rol. |
| **RF-04** | Actualización de perfil | El sistema debe permitir a un usuario actualizar su propia información (nombre, email, contraseña). |
| **RF-05** | Eliminación de usuarios | El sistema debe permitir la eliminación (soft-delete) de usuarios por parte de administradores, conservando la integridad histórica de los tickets asociados. |

### Módulo de Gestión de Tickets

| ID | Requerimiento | Descripción |
|----|---------------|-------------|
| **RF-06** | Creación de ticket | El sistema debe permitir a un usuario autenticado crear un ticket de soporte con título, descripción, categoría y prioridad. El sistema debe registrar automáticamente la fecha/hora de creación y el usuario creador. |
| **RF-07** | Listado de tickets | El sistema debe permitir listar tickets con filtros por estado, prioridad, categoría, fechas y usuario asignado. |
| **RF-08** | Visualización de ticket | El sistema debe permitir ver el detalle completo de un ticket específico, incluyendo su historial de cambios. |
| **RF-09** | Actualización de ticket | El sistema debe permitir actualizar el estado, prioridad, categoría o descripción de un ticket (solo roles autorizados). |
| **RF-10** | Cambio de estado | El sistema debe gestionar la máquina de estados del ticket: `abierto` → `en_progreso` → `resuelto` → `cerrado`. También debe permitir `reabierto` desde resuelto/cerrado. |
| **RF-11** | Asignación de ticket | El sistema debe permitir asignar un ticket a un técnico de soporte específico. |
| **RF-12** | Comentarios en ticket | El sistema debe permitir añadir comentarios a un ticket. Los comentarios pueden ser **públicos** (visibles para el cliente y el técnico) o **internos** (visibles únicamente para técnicos y administradores). |
| **RF-13** | Búsqueda de tickets | El sistema debe permitir realizar búsquedas por texto libre sobre el título y la descripción de los tickets, combinable con los filtros existentes. |
| **RF-14** | Cierre automático por inactividad | El sistema debe cerrar automáticamente los tickets en estado `resuelto` que no hayan recibido actividad en un período configurable (por defecto, 7 días). |

### Módulo de Comunicación Asíncrona (Eventos)

| ID | Requerimiento | Descripción |
|----|---------------|-------------|
| **RF-15** | Publicación de evento al crear ticket | Al crear un ticket, el sistema debe publicar un evento `ticket.created` en el bus de mensajería. |
| **RF-16** | Publicación de evento al asignar ticket | Al asignar un ticket, el sistema debe publicar un evento `ticket.assigned` en el bus de mensajería. |
| **RF-17** | Publicación de evento al cambiar estado | Al cambiar el estado de un ticket, el sistema debe publicar un evento `ticket.status.updated`. |
| **RF-18** | Consumo de evento para asignación automática | El servicio de asignaciones debe consumir eventos `ticket.created` para intentar asignar automáticamente un técnico disponible. |
| **RF-19** | Consumo de evento para notificaciones | El sistema debe consumir eventos de tickets para generar notificaciones (email/sistema) a los involucrados. |

### Módulo de Reportes y Métricas

| ID | Requerimiento | Descripción |
|----|---------------|-------------|
| **RF-20** | Tiempo promedio de resolución | El sistema debe calcular el tiempo promedio entre creación y resolución de tickets por categoría/técnico. |
| **RF-21** | Tickets por estado | El sistema debe reportar la cantidad de tickets agrupados por estado actual. |
| **RF-22** | Carga de trabajo por técnico | El sistema debe mostrar cuántos tickets activos tiene asignado cada técnico. |

---

## Requerimientos No Funcionales (RNF)

### Arquitectura y Despliegue

| ID | Requerimiento | Descripción |
|----|---------------|-------------|
| **RNF-01** | Arquitectura de microservicios | El sistema debe estar compuesto por al menos 3 microservicios independientes: Usuarios, Tickets, Asignaciones. |
| **RNF-02** | Comunicación asíncrona | La comunicación entre microservicios para eventos de negocio debe ser asíncrona mediante un bus de mensajería (RabbitMQ). |
| **RNF-03** | Comunicación síncrona | Las operaciones CRUD inmediatas pueden realizarse vía REST síncrono. |
| **RNF-04** | Contenerización | Cada microservicio debe ejecutarse dentro de un contenedor Docker con imágenes optimizadas mediante multi-stage builds. |
| **RNF-05** | Orquestación local | Debe existir un archivo `docker-compose.yml` que levante todos los servicios con un solo comando. |
| **RNF-06** | Despliegue en la nube | El sistema debe ser desplegable en un clúster K3s/Kubernetes en la nube (futura práctica). |

### Rendimiento y Escalabilidad

| ID | Requerimiento | Descripción |
|----|---------------|-------------|
| **RNF-07** | Tiempo de respuesta | Las APIs REST deben responder en menos de 500ms para el 95% de las peticiones en condiciones normales. |
| **RNF-08** | Escalabilidad horizontal | Los microservicios deben poder escalarse horizontalmente (múltiples instancias) sin afectar la consistencia. |
| **RNF-09** | Tolerancia a fallos | El fallo de un microservicio no debe detener por completo al sistema; debe haber degradación controlada. |

### Seguridad

| ID | Requerimiento | Descripción |
|----|---------------|-------------|
| **RNF-10** | Autenticación | Todos los endpoints (excepto registro/login) deben requerir autenticación mediante token JWT. |
| **RNF-11** | Autorización | El sistema debe implementar control de acceso basado en roles (RBAC): cliente, técnico, administrador. |
| **RNF-12** | Protección de datos sensibles | Las contraseñas deben almacenarse hasheadas (bcrypt). |
| **RNF-13** | Variables de entorno | Credenciales de bases de datos, secretos y configuraciones sensibles deben inyectarse vía variables de entorno, no hardcodeadas. |
| **RNF-14** | Rate Limiting | El API Gateway debe implementar límite de tasa por IP para proteger los endpoints contra abuso y ataques de fuerza bruta. |

### Disponibilidad y Resiliencia

| ID | Requerimiento | Descripción |
|----|---------------|-------------|
| **RNF-15** | Health checks | Cada microservicio debe exponer un endpoint `/health` para verificar su estado. |
| **RNF-16** | Reintentos de conexión | Los servicios deben implementar lógica de reintentos al conectarse a RabbitMQ o bases de datos. |
| **RNF-17** | Persistencia de eventos | Los mensajes en RabbitMQ deben ser persistentes para no perderse ante reinicios. |

### Observabilidad

| ID | Requerimiento | Descripción |
|----|---------------|-------------|
| **RNF-18** | Logging estructurado | Cada microservicio debe generar logs en formato JSON (estructurado) que incluyan el nivel de severidad, timestamp, servicio de origen e ID de correlación, para facilitar la trazabilidad entre servicios.

---

## Diagrama de entidad-relación

<div align="center">
  <img src="img/diagrama-entidad-relacion.png" alt="" width="100%">
  <p><i>Figura 5: Diagrama de entida relación.</i></p>
</div>

---