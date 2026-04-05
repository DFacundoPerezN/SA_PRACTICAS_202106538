# Sistema de Soporte Técnico (Mesa de Ayuda) Orientado a Eventos

---

## Diagrama general de Casos de Uso de alto nivel

<div align="center">
  <img src="img/casos_de_uso_alto_nivel.png" alt="" width="50%">
  <p><i>Figura 1: Diagrama general de casos de Uso de alto nivel.</i></p>
</div>

---

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

