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

## Diagrama general de Casos de Uso de alto nivel

<div align="center">
  <img src="img/casos_de_uso_alto_nivel.png" alt="" width="50%">
  <p><i>Figura 1: Diagrama general de casos de Uso de alto nivel.</i></p>
</div>

## Casos de Uso Expandidos

### Flujo Crítico 1: Creación de Ticket

---

## Caso de Uso: Creación de Ticket

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Creación de Ticket |
| **ID** | UC-07 |
| **Actor(es)** | Cliente (principal), Sistema (secundario) |
| **Descripción** | Permite a un usuario autenticado reportar un incidente o solicitud de soporte mediante la creación de un nuevo ticket en el sistema. |
| **Tipo** | Primario / Esencial |

---

### Precondiciones

| ID | Precondición |
|----|--------------|
| PC-01 | El usuario debe haber iniciado sesión en el sistema (estar autenticado). |
| PC-02 | El usuario debe tener el rol de **Cliente** o **Administrador** (los técnicos también pueden crear tickets en nombre de clientes). |
| PC-03 | El token JWT de autenticación debe ser válido y no haber expirado. |
| PC-04 | El usuario debe tener una conexión activa al sistema. |

---

### Flujo Normal (Básico)

| Paso | Acción del Actor | Respuesta del Sistema |
|------|------------------|----------------------|
| 1 | El cliente accede a la sección "Nuevo Ticket" en la interfaz. | El sistema presenta un formulario con los campos requeridos: título, descripción, categoría y prioridad. |
| 2 | El cliente completa el formulario con la información del incidente. | El sistema valida en tiempo real que los campos obligatorios no estén vacíos. |
| 3 | El cliente hace clic en el botón "Crear Ticket". | El sistema recibe la solicitud POST al endpoint `/tickets`. |
| 4 | - | El sistema valida que el cliente exista y esté activo en la base de datos. |
| 5 | - | El sistema genera un ID único para el ticket. |
| 6 | - | El sistema asigna automáticamente la fecha y hora de creación (timestamp). |
| 7 | - | El sistema establece el estado inicial del ticket como `abierto`. |
| 8 | - | El sistema almacena el ticket en la base de datos MySQL (`tickets_db`). |
| 9 | - | El sistema publica un evento `ticket.created` en el bus RabbitMQ para notificar a otros microservicios. |
| 10 | - | El sistema retorna una respuesta exitosa (HTTP 201 Created) con los datos del ticket creado. |
| 11 | El sistema muestra al cliente un mensaje de confirmación con el número de ticket generado. | - |

---

### Flujos Alternativos

#### Flujo Alternativo 1: Campos obligatorios incompletos

| Paso | Acción del Actor | Respuesta del Sistema |
|------|------------------|----------------------|
| 2a | El cliente intenta enviar el formulario sin completar todos los campos obligatorios. | El sistema detecta la falta de datos y rechaza la solicitud. |
| 3a | - | El sistema retorna un error HTTP 400 Bad Request indicando qué campos son obligatorios. |
| 4a | El sistema muestra mensajes de error específicos junto a cada campo incompleto. | - |

#### Flujo Alternativo 2: Usuario no autenticado

| Paso | Acción del Actor | Respuesta del Sistema |
|------|------------------|----------------------|
| 1a | Un usuario no autenticado intenta acceder al formulario de creación de ticket. | El sistema detecta la ausencia o invalidez del token JWT. |
| 2a | - | El sistema retorna un error HTTP 401 Unauthorized. |
| 3a | El sistema redirige al usuario a la página de inicio de sesión. | - |

#### Flujo Alternativo 3: Usuario con rol no autorizado

| Paso | Acción del Actor | Respuesta del Sistema |
|------|------------------|----------------------|
| 1b | Un usuario con rol no autorizado (ej. solo lectura) intenta crear un ticket. | El sistema verifica los permisos del rol mediante RBAC. |
| 2b | - | El sistema retorna un error HTTP 403 Forbidden. |
| 3b | El sistema muestra un mensaje "No tienes permisos para realizar esta acción". | - |

#### Flujo Alternativo 4: Error en la base de datos

| Paso | Acción del Actor | Respuesta del Sistema |
|------|------------------|----------------------|
| 7a | - | La base de datos no responde o ocurre un error de conexión. |
| 8a | - | El sistema intenta reconectar (máximo 3 reintentos). |
| 9a | - | Si persiste el error, el sistema retorna un error HTTP 503 Service Unavailable. |
| 10a | El sistema muestra un mensaje "Error temporal, intente más tarde". | - |

#### Flujo Alternativo 5: Error en la publicación del evento

| Paso | Acción del Actor | Respuesta del Sistema |
|------|------------------|----------------------|
| 9a | - | El ticket se creó correctamente, pero RabbitMQ no está disponible. |
| 10a | - | El sistema registra el evento en una cola de fallos o log de errores. |
| 11a | - | El sistema programa un reintento para publicar el evento más tarde (retry con backoff exponencial). |
| 12a | El ticket se crea exitosamente, pero las notificaciones automáticas podrían retrasarse. | El sistema continúa funcionando normalmente para el cliente. |

#### Flujo Alternativo 6: Título o descripción demasiado largos

| Paso | Acción del Actor | Respuesta del Sistema |
|------|------------------|----------------------|
| 2c | El cliente ingresa un título superior a 200 caracteres o una descripción superior a 5000 caracteres. | El sistema valida las longitudes máximas permitidas. |
| 3c | - | El sistema retorna un error HTTP 400 Bad Request indicando la longitud máxima permitida. |
| 4c | El sistema muestra mensajes de error específicos. | - |

---

### Postcondiciones

| ID | Postcondición | Estado |
|----|---------------|--------|
| PC-01 | Se ha creado un nuevo ticket en la base de datos con estado `abierto`. | ✅ Siempre (si el flujo se completa) |
| PC-02 | Se ha generado un ID único para el ticket. | ✅ Siempre |
| PC-03 | Se ha registrado la fecha y hora de creación. | ✅ Siempre |
| PC-04 | Se ha asociado el ticket al usuario creador mediante su ID. | ✅ Siempre |
| PC-05 | Se ha publicado un evento `ticket.created` en RabbitMQ (o se ha intentado). | ✅ Siempre (con reintentos si falla) |
| PC-06 | El ticket es visible inmediatamente en los listados del cliente y del administrador. | ✅ Siempre |
| PC-07 | El ticket es elegible para asignación automática por el servicio de asignaciones. | ✅ Siempre |
| PC-08 | Se ha registrado un log de la acción de creación. | ✅ Siempre |

---

### Reglas de Negocio Asociadas

| ID | Regla de Negocio |
|----|------------------|
| RN-01 | Un ticket recién creado siempre comienza en estado `abierto`. |
| RN-02 | El sistema no permite que un ticket sea creado sin un usuario asociado. |
| RN-03 | La prioridad por defecto de un nuevo ticket es `media` si el cliente no la especifica. |
| RN-04 | La categoría por defecto es `general` si el cliente no la especifica. |
| RN-05 | El cliente puede ver únicamente sus propios tickets (no los de otros clientes). |

---

### Requerimientos Funcionales Cubiertos

| RF | Descripción |
|----|-------------|
| RF-06 | Creación de ticket |
| RF-15 | Publicación de evento al crear ticket |

---

## Caso de Uso: Asignación de Ticket

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Asignación de Ticket |
| **ID** | UC-12 |
| **Actor(es)** | Administrador, Técnico de Soporte (principal), Sistema (secundario) |
| **Descripción** | Permite asignar un ticket existente a un técnico de soporte específico para que sea atendido. La asignación puede ser manual (por un administrador o técnico con permisos) o automática (disparada por el sistema al crear un ticket). |
| **Tipo** | Primario / Esencial |

---

### Precondiciones

| ID | Precondición |
|----|--------------|
| PC-01 | El ticket debe existir en el sistema (estar registrado en la base de datos). |
| PC-02 | El ticket debe estar en estado `abierto` o `en_progreso` (no puede estar `resuelto` o `cerrado`). |
| PC-03 | El usuario que realiza la asignación debe tener el rol de **Administrador** o **Técnico de Soporte**. |
| PC-04 | El técnico a asignar debe existir en el sistema y tener el rol de **Técnico de Soporte**. |
| PC-05 | El técnico a asignar debe estar activo (no eliminado/deshabilitado). |

---

### Flujo Normal (Básico) - Asignación Manual

| Paso | Acción del Actor | Respuesta del Sistema |
|------|------------------|----------------------|
| 1 | El administrador accede al detalle de un ticket en estado `abierto` o `en_progreso`. | El sistema muestra la información completa del ticket. |
| 2 | El administrador selecciona la opción "Asignar Ticket". | El sistema presenta una lista desplegable con todos los técnicos de soporte activos. |
| 3 | El administrador selecciona un técnico de la lista. | El sistema valida que el técnico seleccionado sea válido y esté activo. |
| 4 | El administrador confirma la asignación haciendo clic en "Asignar". | El sistema recibe la solicitud PUT/PATCH al endpoint `/tickets/{id}/assign`. |
| 5 | - | El sistema verifica que el ticket no esté ya asignado al mismo técnico (evita duplicados). |
| 6 | - | El sistema actualiza el campo `tecnico_asignado_id` del ticket con el ID del técnico seleccionado. |
| 7 | - | El sistema registra la fecha y hora de asignación. |
| 8 | - | El sistema cambia automáticamente el estado del ticket de `abierto` a `en_progreso` (si estaba en abierto). |
| 9 | - | El sistema almacena un registro histórico de la asignación en la tabla de asignaciones. |
| 10 | - | El sistema publica un evento `ticket.assigned` en el bus RabbitMQ. |
| 11 | - | El sistema retorna una respuesta exitosa (HTTP 200 OK) con los datos actualizados del ticket. |
| 12 | El sistema muestra un mensaje de confirmación "Ticket asignado exitosamente a [Técnico]". | - |

---

### Flujo Normal (Alternativo) - Asignación Automática

| Paso | Acción del Actor | Respuesta del Sistema |
|------|------------------|----------------------|
| 1 | - | El servicio de asignaciones consume el evento `ticket.created` desde RabbitMQ. |
| 2 | - | El sistema extrae el ID del ticket y la categoría/prioridad del evento. |
| 3 | - | El sistema consulta la lista de técnicos disponibles (menos tickets activos asignados). |
| 4 | - | El sistema aplica el algoritmo de asignación (round-robin o por carga mínima). |
| 5 | - | El sistema selecciona al técnico más adecuado. |
| 6 | - | El sistema realiza la asignación automática (mismos pasos 5-11 del flujo manual). |
| 7 | - | El sistema publica un evento `ticket.assigned` (ya cubierto en paso 10 del flujo manual). |
| 8 | - | El sistema genera una notificación para el técnico asignado. |

---

### Flujos Alternativos

#### Flujo Alternativo 1: Ticket no encontrado

| Paso | Acción del Actor | Respuesta del Sistema |
|------|------------------|----------------------|
| 1a | El administrador intenta asignar un ticket con ID inexistente. | El sistema busca el ticket en la base de datos. |
| 2a | - | El sistema no encuentra el ticket. |
| 3a | - | El sistema retorna un error HTTP 404 Not Found con mensaje "Ticket no encontrado". |

#### Flujo Alternativo 2: Ticket en estado no asignable

| Paso | Acción del Actor | Respuesta del Sistema |
|------|------------------|----------------------|
| 1b | El administrador intenta asignar un ticket en estado `resuelto` o `cerrado`. | El sistema verifica el estado actual del ticket. |
| 2b | - | El sistema retorna un error HTTP 409 Conflict con mensaje "No se puede asignar un ticket en estado [estado_actual]". |
| 3b | El sistema sugiere que primero se reabra el ticket si es necesario. | - |

#### Flujo Alternativo 3: Técnico no encontrado o inactivo

| Paso | Acción del Actor | Respuesta del Sistema |
|------|------------------|----------------------|
| 3a | El administrador selecciona un técnico que no existe o está inactivo. | El sistema valida la existencia y estado del técnico. |
| 4a | - | El sistema retorna un error HTTP 404 Not Found o 400 Bad Request. |
| 5a | El sistema muestra mensaje "El técnico seleccionado no está disponible". | - |

#### Flujo Alternativo 4: Ticket ya asignado al mismo técnico

| Paso | Acción del Actor | Respuesta del Sistema |
|------|------------------|----------------------|
| 4b | El administrador intenta asignar un ticket al técnico que ya lo tiene asignado. | El sistema detecta que `tecnico_asignado_id` ya coincide con el ID seleccionado. |
| 5b | - | El sistema retorna un error HTTP 409 Conflict con mensaje "El ticket ya está asignado a este técnico". |

#### Flujo Alternativo 5: Usuario no autorizado

| Paso | Acción del Actor | Respuesta del Sistema |
|------|------------------|----------------------|
| 1c | Un cliente intenta asignar un ticket (sin permisos). | El sistema verifica el rol mediante RBAC. |
| 2c | - | El sistema retorna un error HTTP 403 Forbidden. |
| 3c | El sistema muestra mensaje "No tienes permisos para asignar tickets". | - |

#### Flujo Alternativo 6: Asignación automática sin técnicos disponibles

| Paso | Acción del Actor | Respuesta del Sistema |
|------|------------------|----------------------|
| 4d | - | El sistema consulta técnicos disponibles y no encuentra ninguno. |
| 5d | - | El sistema no realiza la asignación automática. |
| 6d | - | El sistema registra un log de advertencia "No hay técnicos disponibles para asignación automática". |
| 7d | - | El ticket permanece en estado `abierto` sin asignar. |
| 8d | - | El sistema publica un evento `ticket.unassigned` (opcional) para alertar a administradores. |

#### Flujo Alternativo 7: Error en la publicación del evento

| Paso | Acción del Actor | Respuesta del Sistema |
|------|------------------|----------------------|
| 10a | - | La asignación se realizó correctamente, pero RabbitMQ no está disponible. |
| 11a | - | El sistema registra el evento en una cola de fallos o log de errores. |
| 12a | - | El sistema programa un reintento para publicar el evento más tarde. |
| 13a | La asignación es exitosa, pero las notificaciones podrían retrasarse. | - |

---

### Postcondiciones

| ID | Postcondición | Estado |
|----|---------------|--------|
| PC-01 | El ticket tiene un técnico asignado (campo `tecnico_asignado_id` actualizado). | ✅ Siempre (si el flujo se completa) |
| PC-02 | El estado del ticket cambia a `en_progreso` si estaba en `abierto`. | ✅ Siempre (si aplica) |
| PC-03 | Se ha registrado la fecha y hora de asignación. | ✅ Siempre |
| PC-04 | Se ha creado un registro histórico en la tabla de asignaciones. | ✅ Siempre |
| PC-05 | Se ha publicado un evento `ticket.assigned` en RabbitMQ (o se ha intentado). | ✅ Siempre |
| PC-06 | El técnico asignado puede ver el ticket en su lista "Mis Tickets". | ✅ Siempre |
| PC-07 | Se ha generado una notificación al técnico asignado. | ✅ Siempre (si el sistema de notificaciones está operativo) |
| PC-08 | Se ha registrado un log de la acción de asignación. | ✅ Siempre |

---

### Reglas de Negocio Asociadas

| ID | Regla de Negocio |
|----|------------------|
| RN-06 | Un ticket solo puede estar asignado a un técnico a la vez. |
| RN-07 | Un técnico puede tener múltiples tickets asignados simultáneamente. |
| RN-08 | Al asignar un ticket en estado `abierto`, el sistema debe cambiarlo automáticamente a `en_progreso`. |
| RN-09 | Un ticket en estado `resuelto` o `cerrado` no puede ser asignado. |
| RN-10 | La reasignación de un ticket solo puede ser realizada por un Administrador. |
| RN-11 | La asignación automática debe priorizar al técnico con menor carga de trabajo activa. |
| RN-12 | Si un ticket es reasignado, debe conservarse el historial de asignaciones previas. |

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

## Diagrama de actividades

<div align="center">
  <img src="img/diagrama-de-actividades.png" alt="" width="80%">
  <p><i>Figura 3: Diagrama de actividades.</i></p>
</div>

---

## Diagrama de secuencias

<div align="center">
  <img src="img/diagrama-de-secuencia.png" alt="" width="80%">
  <p><i>Figura 4: Diagrama de secuencias.</i></p>
</div>

---

## Diagrama de entidad-relación

<div align="center">
  <img src="img/diagrama-entidad-relacion.png" alt="" width="100%">
  <p><i>Figura 5: Diagrama de entida relación.</i></p>
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

# Reporte de Principios SOLID Aplicados

## 1. S — Single Responsibility Principle (SRP) {#srp}

> **"Cada clase debe tener una única razón para cambiar."**

Este es el principio más ampliamente aplicado en el proyecto. Se manifiesta en la separación en capas (domain / application / infrastructure) y en el patrón de **un use-case por operación de negocio**.

---

### `auth-service`

| Archivo | Responsabilidad única |
|---|---|
| `auth/domain/user-auth.entity.ts` | Representa el estado persistido de credenciales. Sin lógica de negocio. |
| `auth/domain/refresh-token.entity.ts` | Representa únicamente un refresh-token almacenado. |
| `auth/application/use-cases/register.use-case.ts` | Solo registra un usuario nuevo (validar email duplicado → hashear password → crear). |
| `auth/application/use-cases/login.use-case.ts` | Solo autentica credenciales y genera tokens. |
| `auth/application/use-cases/logout.use-case.ts` | Solo revoca un refresh-token. |
| `auth/application/use-cases/refresh-token.use-case.ts` | Solo rota el par de tokens dado un refresh-token válido. |
| `auth/application/use-cases/validate-token.use-case.ts` | Solo verifica la firma y vigencia de un access-token. |
| `auth/application/use-cases/admin-register.use-case.ts` | Solo crea usuarios con rol explícito (flujo de administrador). |
| `auth/infrastructure/services/bcrypt.service.ts` | Solo hashea/compara passwords con bcrypt. |
| `auth/infrastructure/services/jwt.service.ts` | Solo firma/verifica JWTs de acceso y refresco. |
| `auth/infrastructure/services/token-hash.service.ts` | Solo aplica SHA-256 determinístico a tokens (necesario para lookup en BD). |
| `auth/infrastructure/repositories/auth.repository.ts` | Solo accede a las tablas `users_auth` y `refresh_tokens`. |
| `auth/auth.controller.ts` | Solo traduce mensajes gRPC a llamadas del servicio de aplicación y viceversa. |
| `auth/application/auth.service.ts` | Solo actúa como orquestador/fachada de los use-cases; delega toda la lógica. |

**¿Por qué?** Separar cada operación de autenticación en su propio use-case garantiza que un cambio en la política de login (p. ej. agregar 2FA) no afecte el código de registro, logout, etc. Cada archivo tiene **una sola razón para cambiar**.

---

### `users-service`

| Archivo | Responsabilidad única |
|---|---|
| `users/domain/user.entity.ts` | Estado de un usuario (columnas de BD, relaciones). Sin lógica de negocio. |
| `users/domain/role.entity.ts` | Catalogo de roles. Sin lógica de negocio. |
| `users/application/use-cases/create-user.use-case.ts` | Solo crea un usuario (valida email duplicado, resuelve rol, persiste). |
| `users/application/use-cases/find-user.use-case.ts` | Solo consulta usuarios (por ID, por email, listado paginado). |
| `users/application/use-cases/update-user.use-case.ts` | Solo actualiza campos de un usuario existente. |
| `users/application/use-cases/delete-user.use-case.ts` | Solo realiza soft-delete de un usuario. |
| `users/infrastructure/repositories/user.repository.ts` | Solo accede a la BD para usuarios y roles. |
| `users/users.mapper.ts` | Solo convierte `UserEntity` → DTO de respuesta gRPC. |
| `users/users.controller.ts` | Solo recibe métodos gRPC y delega al servicio. |

---

### `tickets-service`

| Archivo | Responsabilidad única |
|---|---|
| `tickets/domain/ticket.entity.ts` | Estado persistido de un ticket. |
| `tickets/domain/comment.entity.ts` | Representa un comentario en un ticket. |
| `tickets/domain/ticket-history.entity.ts` | Representa una entrada de historial de cambios. |
| `tickets/domain/category.entity.ts` | Catálogo de categorías. |
| `tickets/domain/priority.entity.ts` | Catálogo de prioridades. |
| `tickets/domain/ticket-status.entity.ts` | Catálogo de estados posibles. |
| `tickets/application/use-cases/create-ticket.use-case.ts` | Solo crea un ticket y publica el evento `ticket.created`. |
| `tickets/application/use-cases/find-ticket.use-case.ts` | Solo consulta tickets (por ID, listados, búsqueda full-text). |
| `tickets/application/use-cases/update-ticket.use-case.ts` | Solo edita descripción/prioridad/categoría y escribe historial. |
| `tickets/application/use-cases/change-status.use-case.ts` | Solo valida y aplica transiciones de estado (máquina de estados). |
| `tickets/application/use-cases/assign-ticket.use-case.ts` | Solo asigna un ticket a un técnico y escribe historial. |
| `tickets/application/use-cases/add-comment.use-case.ts` | Solo agrega un comentario a un ticket. |
| `tickets/application/use-cases/auto-close-tickets.use-case.ts` | Solo cierra tickets resueltos con más de N días de inactividad. |
| `tickets/infrastructure/messaging/rabbitmq-publisher.service.ts` | Solo publica eventos en RabbitMQ. |
| `tickets/infrastructure/scheduler/auto-close.scheduler.ts` | Solo dispara el cron de auto-cierre (sin lógica de negocio propia). |
| `tickets/tickets.mapper.ts` | Solo convierte entidades de dominio → DTOs de respuesta gRPC. |

**Nota destacada — `AutoCloseScheduler` vs `AutoCloseTicketsUseCase`**: el scheduler sabe *cuándo* ejecutar la tarea; el use-case sabe *cómo*. Son dos razones de cambio distintas, por eso están en archivos separados. Si el horario cambia, solo toca el scheduler. Si la lógica de cierre cambia, solo toca el use-case.

---

### `assignments-service`

| Archivo | Responsabilidad única |
|---|---|
| `assignments/domain/assignment.entity.ts` | Estado de una asignación. |
| `assignments/domain/assignment-status.entity.ts` | Catálogo de estados de asignación. |
| `assignments/domain/technician-workload.entity.ts` | Contador de carga de trabajo por técnico. |
| `assignments/application/use-cases/manual-assign.use-case.ts` | Solo realiza asignación manual con validación de conflictos. |
| `assignments/application/use-cases/auto-assign.use-case.ts` | Solo selecciona el técnico con menor carga y crea la asignación automáticamente. |
| `assignments/application/use-cases/update-assignment.use-case.ts` | Solo reasigna o cierra una asignación existente. |
| `assignments/application/use-cases/find-assignment.use-case.ts` | Solo consulta asignaciones (por ID, por ticket, por técnico, listado). |
| `assignments/infrastructure/repositories/assignment.repository.ts` | Solo accede a las tablas de asignaciones y carga de trabajo. |
| `assignments/infrastructure/messaging/rabbitmq-publisher.service.ts` | Solo publica eventos de asignación en RabbitMQ. |
| `assignments/infrastructure/messaging/rabbitmq-consumer.controller.ts` | Solo consume el evento `ticket.created` y dispara el auto-assign. |
| `assignments/infrastructure/messaging/tickets-grpc-client.service.ts` | Solo realiza la llamada gRPC `AssignTicket` al tickets-service. |
| `assignments/assignments.mapper.ts` | Solo convierte entidades → DTOs de respuesta gRPC. |

---

### `api-gateway`

| Archivo | Responsabilidad única |
|---|---|
| `common/filters/all-exceptions.filter.ts` | Solo captura excepciones y las convierte a respuestas HTTP consistentes. |
| `common/interceptors/logging.interceptor.ts` | Solo registra método, URL y tiempo de respuesta de cada petición. |
| `common/guards/jwt-auth.guard.ts` | Solo valida el token JWT y verifica roles. |
| `common/decorators/roles.decorator.ts` | Solo adjunta metadatos de roles a rutas. |
| `grpc/grpc.options.ts` | Solo define opciones de conexión gRPC por servicio. |
| `grpc/grpc-clients.module.ts` | Solo registra y exporta los clientes gRPC. |
| `auth/auth.controller.ts` | Solo traduce peticiones HTTP de autenticación a llamadas gRPC. |
| `tickets/tickets.controller.ts` | Solo traduce peticiones HTTP de tickets a llamadas gRPC. |
| `users/users.controller.ts` | Solo traduce peticiones HTTP de usuarios a llamadas gRPC. |
| `assignments/assignments.controller.ts` | Solo traduce peticiones HTTP de asignaciones a llamadas gRPC. |

---

## 2. O — Open/Closed Principle (OCP) {#ocp}

> **"Las entidades deben estar abiertas a extensión, cerradas a modificación."**

### `tickets-service/src/tickets/application/use-cases/change-status.use-case.ts`

```typescript
const VALID_TRANSITIONS: Record<string, string[]> = {
  abierto:     ['en_progreso'],
  en_progreso: ['resuelto'],
  resuelto:    ['cerrado', 'reabierto'],
  cerrado:     ['reabierto'],
  reabierto:   ['en_progreso'],
};
```

La máquina de estados de tickets está declarada como un mapa de datos. Para agregar un nuevo estado o una nueva transición **no se modifica la lógica del use-case**, solo se extiende el mapa. El algoritmo de validación permanece intacto.

### Interfaces de repositorio e interfaces de publisher

Las interfaces `ITicketRepository`, `IAssignmentRepository`, `IAuthRepository`, `IUserRepository`, `IEventPublisher` e `IAssignmentEventPublisher` están **cerradas para modificación** desde el punto de vista de los use-cases. Si se necesita un nuevo proveedor de base de datos o de mensajería, se crea una nueva clase que implemente la interfaz sin tocar nada de la capa de aplicación.

---

## 3. L — Liskov Substitution Principle (LSP) {#lsp}

> **"Los subtipos deben poder sustituir a sus tipos base sin alterar el comportamiento correcto del programa."**

### `tickets-service` — `RabbitMqPublisherService implements IEventPublisher`

```typescript
// tickets/infrastructure/messaging/rabbitmq-publisher.service.ts
@Injectable()
export class RabbitMqPublisherService implements IEventPublisher { ... }
```

El use-case `CreateTicketUseCase` recibe un `IEventPublisher`. Puede recibir `RabbitMqPublisherService` en producción o un mock `{ publishTicketCreated: jest.fn() }` en tests; en ambos casos el contrato se cumple completamente (misma firma, mismo tipo de retorno `Promise<void>`).

### `auth-service` — `BcryptService implements IHashService` / `JwtTokenService implements ITokenService`

Ambas implementaciones satisfacen completamente el contrato de su interfaz. Un test puede sustituir `JwtTokenService` por cualquier implementación que firme y verifique tokens del mismo modo, sin cambiar los use-cases que la consumen.

### `assignments-service` — `TicketsGrpcClientService implements ITicketsGrpcClient`

El use-case solo llama a `assignTicket(data): Promise<void>`. La implementación concreta usa gRPC; en tests se puede sustituir por un stub que retorne `Promise.resolve()`. La sustitución no altera el comportamiento de los use-cases.

---

## 4. I — Interface Segregation Principle (ISP) {#isp}

> **"Los clientes no deben depender de interfaces que no usan."**

### `auth-service/src/auth/application/interfaces/token-service.interface.ts`

En lugar de una única interfaz `IAuthServices` monolítica, el proyecto define tres interfaces pequeñas y específicas:

```typescript
export interface ITokenService {    // Firma y verifica JWTs
  signAccessToken(payload: TokenPayload): string;
  verifyAccessToken(token: string): TokenPayload | null;
  signRefreshToken(payload: TokenPayload): string;
  verifyRefreshToken(token: string): TokenPayload | null;
}

export interface IHashService {     // Hashea y compara passwords
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}

export interface ITokenHashService { // Hash determinístico de tokens
  hash(token: string): string;
}
```

- `ValidateTokenUseCase` solo inyecta `ITokenService` — no sabe nada de hashing de passwords.
- `RegisterUseCase` solo inyecta `IHashService` — no sabe nada de tokens JWT.
- `LogoutUseCase` inyecta `ITokenService` y `ITokenHashService` — solo lo que necesita para revocar.

Cada use-case depende únicamente de los métodos que realmente usa.

### `assignments-service/src/assignments/application/interfaces/`

Se definen tres interfaces separadas:

- `IAssignmentRepository` — operaciones de persistencia.
- `IAssignmentEventPublisher` — solo `publishAssignmentCreated`.
- `ITicketsGrpcClient` — solo `assignTicket`.

`FindAssignmentUseCase` solo inyecta `IAssignmentRepository` (no necesita publicar eventos ni llamar a gRPC). `UpdateAssignmentUseCase` inyecta `IAssignmentRepository` y `ITicketsGrpcClient` (no necesita publicar eventos). Esta granularidad evita que un use-case dependa de métodos que nunca llamará.

---

## 5. D — Dependency Inversion Principle (DIP) {#dip}

> **"Los módulos de alto nivel no deben depender de módulos de bajo nivel. Ambos deben depender de abstracciones."**

Este es el principio más enfatizado estructuralmente en el proyecto. Se aplica de forma **sistemática y consistente** en todos los servicios mediante el patrón de inyección de dependencias de NestJS con tokens de símbolo (`Symbol`).

---

### Patrón general aplicado

#### 1. Se define una interfaz (abstracción) en la capa de aplicación

```typescript
// application/interfaces/assignment-repository.interface.ts
export interface IAssignmentRepository { ... }
export const ASSIGNMENT_REPOSITORY = Symbol('IAssignmentRepository');
```

#### 2. Los use-cases dependen de la abstracción, nunca de la implementación concreta

```typescript
// application/use-cases/auto-assign.use-case.ts
@Injectable()
export class AutoAssignUseCase {
  constructor(
    @Inject(ASSIGNMENT_REPOSITORY)      private readonly assignRepo:    IAssignmentRepository,
    @Inject(ASSIGNMENT_EVENT_PUBLISHER) private readonly publisher:     IAssignmentEventPublisher,
    @Inject(TICKETS_GRPC_CLIENT_TOKEN)  private readonly ticketsClient: ITicketsGrpcClient,
  ) {}
```

Los tipos de las dependencias son **interfaces**, no clases concretas.

#### 3. El módulo conecta la abstracción con la implementación concreta

```typescript
// assignments.module.ts
providers: [
  AssignmentRepository,
  { provide: ASSIGNMENT_REPOSITORY, useExisting: AssignmentRepository },

  RabbitMqPublisherService,
  { provide: ASSIGNMENT_EVENT_PUBLISHER, useExisting: RabbitMqPublisherService },

  TicketsGrpcClientService,
  { provide: TICKETS_GRPC_CLIENT_TOKEN, useExisting: TicketsGrpcClientService },
]
```

El módulo es el único lugar donde se "conoce" la implementación concreta. El resto del código de aplicación no lo sabe.

---

### Mapa completo de aplicaciones DIP por servicio

#### `auth-service`

| Abstracción (interfaz + símbolo) | Implementación concreta | Archivo del vínculo |
|---|---|---|
| `IAuthRepository` / `AUTH_REPOSITORY` | `AuthRepository` | `auth.module.ts` |
| `ITokenService` / `TOKEN_SERVICE` | `JwtTokenService` | `auth.module.ts` |
| `IHashService` / `HASH_SERVICE` | `BcryptService` | `auth.module.ts` |
| `ITokenHashService` / `TOKEN_HASH_SERVICE` | `TokenHashService` | `auth.module.ts` |

Use-cases dependientes:

- `LoginUseCase` → inyecta `IAuthRepository`, `IHashService`, `ITokenService`, `ITokenHashService`
- `RefreshTokenUseCase` → inyecta `IAuthRepository`, `ITokenService`, `ITokenHashService`
- `ValidateTokenUseCase` → inyecta solo `ITokenService`
- `RegisterUseCase` → inyecta `IAuthRepository`, `IHashService`

**¿Por qué importa?** Si mañana se reemplaza bcrypt por Argon2, solo se crea `Argon2Service implements IHashService` y se actualiza el binding en `auth.module.ts`. Los use-cases (`RegisterUseCase`, `LoginUseCase`) **no se tocan**.

---

#### `users-service`

| Abstracción | Implementación concreta | Archivo del vínculo |
|---|---|---|
| `IUserRepository` / `USER_REPOSITORY` | `UserRepository` | `users.module.ts` |

Todos los use-cases (`CreateUserUseCase`, `FindUserUseCase`, `UpdateUserUseCase`, `DeleteUserUseCase`) inyectan `IUserRepository`. Ninguno importa ni referencia `UserRepository` directamente.

---

#### `tickets-service`

| Abstracción | Implementación concreta | Archivo del vínculo |
|---|---|---|
| `ITicketRepository` / `TICKET_REPOSITORY` | `TicketRepository` | `tickets.module.ts` |
| `IEventPublisher` / `EVENT_PUBLISHER` | `RabbitMqPublisherService` | `tickets.module.ts` |

```typescript
// tickets.module.ts
{ provide: TICKET_REPOSITORY, useExisting: TicketRepository },
{ provide: EVENT_PUBLISHER,   useExisting: RabbitMqPublisherService },
```

Los use-cases `CreateTicketUseCase`, `ChangeStatusUseCase` y `AssignTicketUseCase` publican eventos llamando a `IEventPublisher` — nunca a `ClientProxy` de RabbitMQ directamente. Si se migra a Kafka, solo se implementa `KafkaPublisherService implements IEventPublisher` y se cambia el binding.

El comentario en el código de la interfaz lo declara explícitamente:

```typescript
// event-publisher.interface.ts
// Abstracción sobre RabbitMQ (o cualquier broker futuro).
// Los use-cases dependen solo de esta interfaz — nunca de RabbitMQ directamente (DIP).
```

---

#### `assignments-service`

Es el servicio donde el DIP se aplica con mayor profundidad, dado que tiene **tres dependencias de infraestructura** diferentes:

| Abstracción | Implementación concreta | Uso |
|---|---|---|
| `IAssignmentRepository` / `ASSIGNMENT_REPOSITORY` | `AssignmentRepository` (TypeORM/MySQL) | Todos los use-cases |
| `IAssignmentEventPublisher` / `ASSIGNMENT_EVENT_PUBLISHER` | `RabbitMqPublisherService` | `ManualAssignUseCase`, `AutoAssignUseCase` |
| `ITicketsGrpcClient` / `TICKETS_GRPC_CLIENT_TOKEN` | `TicketsGrpcClientService` | `ManualAssignUseCase`, `AutoAssignUseCase`, `UpdateAssignmentUseCase` |

El comentario en `tickets-grpc-client.interface.ts` lo expresa claramente:

```typescript
// Abstracción que permite a assignments-service actualizar el campo assigned_to
// en un ticket sin depender de un cliente gRPC concreto (DIP).
// La implementación inyecta el cliente gRPC real; los tests inyectan un mock.
```

**Caso de prueba de testabilidad:** `AutoAssignUseCase` puede probarse en aislamiento completo inyectando:
- Un `IAssignmentRepository` en memoria (sin BD real).
- Un `IAssignmentEventPublisher` mock (sin RabbitMQ real).
- Un `ITicketsGrpcClient` stub (sin servidor gRPC real).

Esto es la consecuencia directa y práctica del DIP aplicado correctamente.

---

### Diagrama de dependencias (DIP aplicado)

```
Use-Cases (aplicación)
    │
    ├── @Inject(TICKET_REPOSITORY)         →  ITicketRepository  ←── TicketRepository (TypeORM)
    ├── @Inject(EVENT_PUBLISHER)           →  IEventPublisher    ←── RabbitMqPublisherService
    ├── @Inject(AUTH_REPOSITORY)           →  IAuthRepository    ←── AuthRepository (TypeORM)
    ├── @Inject(TOKEN_SERVICE)             →  ITokenService      ←── JwtTokenService
    ├── @Inject(HASH_SERVICE)              →  IHashService       ←── BcryptService
    ├── @Inject(TOKEN_HASH_SERVICE)        →  ITokenHashService  ←── TokenHashService
    ├── @Inject(USER_REPOSITORY)           →  IUserRepository    ←── UserRepository (TypeORM)
    ├── @Inject(ASSIGNMENT_REPOSITORY)     →  IAssignmentRepository ←── AssignmentRepository
    ├── @Inject(ASSIGNMENT_EVENT_PUBLISHER)→  IAssignmentEventPublisher ←── RabbitMqPublisherService
    └── @Inject(TICKETS_GRPC_CLIENT_TOKEN) →  ITicketsGrpcClient ←── TicketsGrpcClientService

Módulos (*.module.ts)  ←── único lugar donde se conocen las implementaciones concretas
```

---
