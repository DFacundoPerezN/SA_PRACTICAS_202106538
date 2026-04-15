import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getTechnicianTicketById,
  getTechnicianComments,
  addTechnicianComment,
  updateTicketStatus,
  getTicketAssignment,
} from "../../services/technicianService";
import { getUser } from "../../utils/authStorage";
import type {
  Ticket,
  Comment,
  TicketStatus,
  TicketPriority,
} from "../../types/ticket.types";
import type { TicketAssignmentResponse } from "../../types/technician.types";

// ─── Catálogos ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; badge: string; dot: string }
> = {
  abierto: {
    label: "Abierto",
    badge: "bg-blue-100 text-blue-700 border border-blue-200",
    dot: "bg-blue-500",
  },
  en_progreso: {
    label: "En progreso",
    badge: "bg-amber-100 text-amber-700 border border-amber-200",
    dot: "bg-amber-500",
  },
  resuelto: {
    label: "Resuelto",
    badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
  },
  cerrado: {
    label: "Cerrado",
    badge: "bg-slate-100 text-slate-500 border border-slate-200",
    dot: "bg-slate-400",
  },
  reabierto: {
    label: "Reabierto",
    badge: "bg-purple-100 text-purple-700 border border-purple-200",
    dot: "bg-purple-500",
  },
};

const PRIORITY_CONFIG: Record<
  TicketPriority,
  { label: string; badge: string; dot: string }
> = {
  baja: {
    label: "Baja",
    badge: "bg-slate-100 text-slate-500",
    dot: "bg-slate-400",
  },
  media: {
    label: "Media",
    badge: "bg-blue-100 text-blue-600",
    dot: "bg-blue-500",
  },
  alta: {
    label: "Alta",
    badge: "bg-orange-100 text-orange-600",
    dot: "bg-orange-500",
  },
  critica: {
    label: "Crítica",
    badge: "bg-red-100 text-red-600 font-semibold",
    dot: "bg-red-500",
  },
};

// Transiciones de estado permitidas
const NEXT_STATUSES: Partial<
  Record<TicketStatus, Array<{ value: string; label: string; color: string }>>
> = {
  abierto: [
    {
      value: "en_progreso",
      label: "Iniciar progreso",
      color: "bg-amber-500 hover:bg-amber-600",
    },
  ],
  en_progreso: [
    {
      value: "resuelto",
      label: "Marcar como resuelto",
      color: "bg-emerald-600 hover:bg-emerald-700",
    },
  ],
  resuelto: [
    {
      value: "cerrado",
      label: "Cerrar ticket",
      color: "bg-slate-600 hover:bg-slate-700",
    },
    {
      value: "reabierto",
      label: "Reabrir ticket",
      color: "bg-purple-600 hover:bg-purple-700",
    },
  ],
  cerrado: [
    {
      value: "reabierto",
      label: "Reabrir ticket",
      color: "bg-purple-600 hover:bg-purple-700",
    },
  ],
  reabierto: [
    {
      value: "en_progreso",
      label: "Iniciar progreso",
      color: "bg-amber-500 hover:bg-amber-600",
    },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ─── Sub-componentes ──────────────────────────────────────────────────────────

const DetailRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 border-b border-slate-100 last:border-0">
    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide sm:w-36 flex-shrink-0 pt-0.5">
      {label}
    </span>
    <span className="text-sm text-slate-700">{children}</span>
  </div>
);

const CommentBubble = ({
  comment,
  isOwn,
}: {
  comment: Comment;
  isOwn: boolean;
}) => {
  // Función para procesar el contenido y mantener el formato
  const renderContent = (content: string) => {
    // Dividir el contenido por saltos de línea
    const lines = content.split("\n");

    return lines.map((line, index) => {
      // Detectar si la línea es un título (comienza con **)
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <div key={index} className="font-bold mb-2 mt-1">
            {line.replace(/\*\*/g, "")}
          </div>
        );
      }
      // Detectar si la línea es un paso numerado (ej: "1. ", "2. ")
      else if (/^\d+\./.test(line)) {
        return (
          <div key={index} className="ml-2 mb-1">
            {line}
          </div>
        );
      }
      // Detectar si la línea es un ítem de lista (comienza con -)
      else if (line.startsWith("-")) {
        return (
          <div key={index} className="ml-4 mb-1 flex items-start gap-2">
            <span className="text-current">•</span>
            <span className="flex-1">{line.substring(1).trim()}</span>
          </div>
        );
      }
      // Línea vacía
      else if (line.trim() === "") {
        return <div key={index} className="h-2" />;
      }
      // Texto normal
      else {
        // Procesar texto con **negritas** inline
        const parts = line.split(/(\*\*.*?\*\*)/g);
        const processedParts = parts.map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
          }
          return part;
        });

        return (
          <div key={index} className="mb-1">
            {processedParts}
          </div>
        );
      }
    });
  };

  return (
    <div
      className={`flex flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}
    >
      {comment.isInternal && (
        <span className="text-xs text-amber-600 flex items-center gap-1 px-1">
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          Nota interna
        </span>
      )}

      <div
        className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm
          ${
            isOwn
              ? comment.isInternal
                ? "bg-amber-500 text-white rounded-tr-sm"
                : "bg-blue-600 text-white rounded-tr-sm"
              : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm"
          }`}
      >
        <div className="space-y-0.5 leading-relaxed">
          {renderContent(comment.content)}
        </div>
      </div>

      <span className="text-xs text-slate-400 px-1">
        {formatDateTime(comment.createdAt)}
      </span>
    </div>
  );
};

// Respuestas automáticas

// Agrega este nuevo componente después de CommentBubble y antes de DetailSkeleton

// ─── Respuestas Predefinidas ────────────────────────────────────────────────────────────────

const PREDEFINED_RESPONSES: Record<
  string,
  Array<{ title: string; content: string }>
> = {
  Hardware: [
    {
      title: "🖥️ La computadora no enciende",
      content: `**Pasos a seguir:**

1. Verifica que el cable de poder esté bien conectado tanto al equipo como al tomacorriente.
2. Prueba enchufando otro dispositivo (como una lámpara) al mismo tomacorriente para descartar fallo eléctrico.
3. Si es una laptop, asegúrate de que el cargador esté conectado y que el LED de carga se encienda.
4. Mantén presionado el botón de encendido por 15 segundos, suelta, espera 5 segundos y vuelve a intentar.

Si después de esto sigue sin encender, **solicitamos que nos prestes el equipo para revisión física** (posible falla en fuente de poder, placa madre o botón de encendido).`,
    },
    {
      title: "⚠️ El equipo se apaga repentinamente",
      content: `**Pasos a seguir:**

Posibles causas:
- Sobrecalentamiento: Verifica que los ventiladores giren y que las rejillas no estén obstruidas por polvo.
- Fuente de poder insuficiente: ¿Agregaste nuevo hardware recientemente (disco, RAM, tarjeta gráfica)?
- Configuración de energía: Ve a *Panel de control > Opciones de energía* y selecciona "Alto rendimiento" o restaura valores predeterminados.

**Pasos inmediatos**:
1. Descarga e instala HWMonitor para revisar temperaturas (CPU > 90°C es peligroso).
2. Si se apaga solo al jugar o editar video, probablemente sea sobrecalentamiento o fuente débil.

Abre un nuevo ticket si el problema persiste después de limpiar el polvo interno.`,
    },
    {
      title: "💾 El disco duro no es reconocido",
      content: `**Pasos a seguir:**

⚠️ **No apagues el equipo abruptamente si crees que el disco tiene datos importantes.**

Pasos:
1. Reinicia y entra a la BIOS (F2, F10, DEL al encender). Si el disco no aparece allí → problema físico.
2. Si aparece en BIOS pero no en Windows:
   - Abre *Administración de discos* (Win + R → \`diskmgmt.msc\`)
   - Busca el disco sin letra → Asigna una letra.
3. Si el disco es externo: prueba otro cable USB y otro puerto.

Si el disco no es detectado en BIOS ni en otra computadora, **es probable que haya fallado físicamente**. Recomendamos reemplazo inmediato y recuperación de datos con servicio especializado.`,
    },
    {
      title: "⌨️ Teclado/mouse no responden",
      content: `**Pasos a seguir:**

1. Para equipos de escritorio:
   - Desconecta y vuelve a conectar el USB.
   - Prueba en otro puerto USB (preferiblemente 2.0 si es 3.0).
2. Para laptops:
   - Limpia el área del teclado con aire comprimido.
   - Desactiva el "Filtro de teclas" en Configuración > Accesibilidad.
3. Actualiza o reinstala el controlador desde Administrador de dispositivos.
4. Prueba el teclado/mouse en otra computadora para descartar falla del periférico.

Si solo falla en una aplicación específica, puede ser conflicto de software. Avísanos si eso ocurre.`,
    },
    {
      title: "🖥️ Pantalla muestra líneas o no da imagen",
      content: `**Pasos a seguir:**

1. Verifica que el cable de video (HDMI, VGA, DisplayPort) esté firmemente conectado en ambos extremos.
2. Prueba con otro cable o monitor (si es posible).
3. Actualiza los controladores de la tarjeta gráfica desde el sitio oficial (NVIDIA, AMD, Intel).
4. Si es una laptop: conecta un monitor externo.
   - Si el externo funciona bien → problema de la pantalla LCD o flexor.
   - Si también da líneas → problema de tarjeta gráfica.

**Solución temporal**: Si ves líneas pero aún operas, baja la resolución y la tasa de refresco hasta recibir revisión.`,
    },
  ],
  Software: [
    {
      title: "💥 Aplicación se cierra inesperadamente",
      content: `**Pasos a seguir:**

1. Reinicia la computadora (suena básico, pero resuelve el 60% de estos casos).
2. Desinstala y vuelve a instalar la aplicación.
3. Busca actualizaciones: muchas apps fallan por versiones desactualizadas.
4. Ejecuta la aplicación como administrador (clic derecho > Ejecutar como administrador).
5. Revisa el Visor de eventos de Windows (Win + R → \`eventvwr.msc\`) en *Registros de Windows > Aplicación* para ver el código de error.

Si el error persiste, indícanos el **nombre exacto de la app** y el **código de error** si aparece.`,
    },
    {
      title: "🐌 Sistema lento después de actualización",
      content: `**Pasos a seguir:**

Pasos recomendados (no requieren soporte urgente):

1. Espera unas horas: a veces Windows sigue instalando actualizaciones en segundo plano.
2. Desinstala la última actualización:
   - Ve a *Configuración > Actualización y seguridad > Ver historial de actualizaciones > Desinstalar actualizaciones*
3. Libera espacio en disco:
   - Ejecuta "Liberador de espacio en disco" (busca en inicio)
4. Desactiva efectos visuales:
   - *Configuración > Personalización > Colores > Transparencias* (desactivar)

Si después de 48 horas sigue lento, haremos una restauración del sistema a un punto anterior.`,
    },
    {
      title: "📦 No se puede instalar un programa",
      content: `**Pasos a seguir:**

Prueba estas soluciones en orden:

1. Ejecuta el instalador como administrador.
2. Cambia el modo de compatibilidad:
   - Clic derecho en el instalador > Propiedades > Compatibilidad
   - Ejecutar en modo compatibilidad para Windows 7/8.
3. Desactiva temporalmente el antivirus (a veces bloquea instaladores legítimos).
4. Si el error menciona "Microsoft Visual C++" o ".NET Framework", instala esas dependencias desde Microsoft.

Si el programa es muy antiguo (anterior a 2010), considera usar una máquina virtual o buscar una alternativa moderna.`,
    },
    {
      title: "⚠️ Error al iniciar el sistema",
      content: `**Pasos a seguir:**

**Paso 1**: Anota el mensaje de error completo o toma una foto.

**Paso 2**: Prueba estos arreglos generales:
- Inicia en **Modo seguro** (presiona F8 antes de que cargue Windows) – si no hay error en modo seguro, es un programa o driver problemático.
- Ejecuta \`SFC /SCANNOW\` en Símbolo del sistema como administrador.
- Abre *MSCONFIG* y desmarca servicios no de Microsoft en "Inicio".

**Paso 3**: Si el error es como \`0xc00000e9\` o \`MACHINE_CHECK_EXCEPTION\`, puede ser falla de hardware (disco o RAM). Te ayudamos a correr diagnósticos.

Envía la foto del error en tu respuesta.`,
    },
    {
      title: "🛡️ Antivirus detecta amenazas constantemente",
      content: `**Pasos a seguir:**

⚠️ **No ingreses contraseñas bancarias ni personales hasta resolver esto.**

Acción inmediata:
1. Ejecuta un análisis completo con Windows Defender (o tu antivirus) fuera de línea.
2. Instala y corre **Malwarebytes Free** (análisis completo).
3. Revisa extensiones del navegador: desinstala cualquier extensión que no reconozcas.
4. Si el antivirus detecta el mismo archivo repetidas veces, anota su ruta y súbela a https://www.virustotal.com.

Si después de limpiar sigue apareciendo, **recomendamos formateo completo del sistema operativo** (respalda solo documentos personales, NO programas).`,
    },
  ],
  "Red / Conectividad": [
    {
      title: "🌐 No hay conexión a internet",
      content: `**Pasos a seguir:**

1. Prueba otro dispositivo en el mismo cable (si funciona → problema de tu PC).
2. En tu PC:
   - Abre *Símbolo del sistema* y escribe: \`ipconfig /release\` → luego \`ipconfig /renew\`
   - Luego: \`ipconfig /flushdns\`
3. Desactiva y reactiva la tarjeta de red desde *Panel de control > Centro de redes > Cambiar configuración adaptador*.
4. Si el icono de red muestra una "x" roja, prueba otro cable o puerto del switch/router.

Si nada funciona, reinicia el router/módem desconectándolo 30 segundos. Si el problema persiste, puede ser falla de la tarjeta de red.`,
    },
    {
      title: "📡 WiFi conectada pero sin internet",
      content: `**Pasos a seguir:**

Estás conectado a la WiFi pero sin internet (posible puerta de enlace caída).

Soluciones:
1. Olvida la red WiFi y vuelve a conectarte.
2. Cambia la dirección DNS a la de Google:
   - Centro de redes > Cambiar configuración adaptador > Propiedades de WiFi > IPv4
   - DNS: \`8.8.8.8\` y \`8.8.4.4\`
3. Abre CMD como admin y ejecuta:
   \`\`\`
   netsh winsock reset
   netsh int ip reset
   ipconfig /flushdns
   \`\`\`
   Luego reinicia.
4. Si el problema es solo en tu equipo pero otros dispositivos sí navegan, actualiza el driver de la tarjeta WiFi.

Si todos los dispositivos tienen el mismo problema → reinicia el router.`,
    },
    {
      title: "🐌 Conexión muy lenta",
      content: `**Pasos a seguir:**

Antes de reportar, haz esto:

1. Mide tu velocidad en https://speedtest.net y compárala con lo contratado.
2. Si la velocidad es baja solo en tu PC:
   - Cierra aplicaciones que usan red en segundo plano (OneDrive, Steam, actualizaciones).
   - Escanea con Malwarebytes (puede haber un miner o botnet).
3. Si es lenta en todos los dispositivos:
   - Reinicia el router.
   - Conéctate por cable Ethernet para descartar interferencia WiFi.
4. Cambia el canal WiFi desde la configuración del router (evita canales saturados).

Si la lentitud persiste por más de un día, contacta a tu ISP (proveedor de internet) para revisar la señal.`,
    },
    {
      title: "📁 No se accede a recursos compartidos",
      content: `**Pasos a seguir:**

Esto suele ser por permisos o configuración de red.

Pasos:
1. Verifica que estés en el perfil de red **Privada** (no Pública).
   - Configuración > Red e Internet > Ethernet/WiFi > Perfil de red > Privado.
2. Habilita "Detección de redes y uso compartido de archivos" en *Centro de redes > Configuración avanzada de uso compartido*.
3. Intenta acceder por IP en lugar de nombre de equipo: \`\\\\192.168.x.x\`
4. En el equipo que comparte la carpeta: asegura que "Invitado" o el usuario tenga permisos.

Si el error es de acceso denegado, puede que el servidor tenga bloqueado tu usuario. Solicita a tu administrador de red que revise los permisos.`,
    },
    {
      title: "🔄 Conexión intermitente",
      content: `**Pasos a seguir:**

Causa más común: **conflicto de IP** o **driver inestable**.

Pruebas rápidas:
1. Asigna una IP fija (estática) en lugar de DHCP.
   - Propiedades de IPv4 > Usar siguiente dirección IP (ej: 192.168.1.150)
2. Actualiza el driver de red desde el fabricante (no desde Windows Update).
3. Si es WiFi:
   - Cambia la banda de 2.4 GHz a 5 GHz (menos interferencia)
   - En propiedades del adaptador WiFi > Configuración avanzada > Desactiva "Ahorro de energía"
4. Si es cableado: prueba otro cable.

Si se desconecta cada cierto tiempo exacto (ej: cada 30 min), puede ser configuración de energía del adaptador: desactiva "Permitir que el equipo apague este dispositivo" en Administrador de dispositivos.`,
    },
  ],
  "Accesos y Permisos": [
    {
      title: "🔐 No puede iniciar sesión",
      content: `**Pasos a seguir:**

No intentes más de 3 veces para evitar bloqueo.

Soluciones:
1. Verifica que el teclado esté en el idioma correcto (ej: @ vs ").
2. Usa la opción "¿Olvidaste tu contraseña?" si está disponible.
3. Si es dominio corporativo:
   - Conéctate a otra red (ej: hotspot móvil) para que valide contra el controlador de dominio.
   - Prueba con el usuario \`.\\nombre_usuario\` para cuenta local.
4. Si es cuenta local de Windows:
   - Inicia en Modo seguro y crea un nuevo usuario desde \`net user nuevo_usuario contraseña /add\`

Si todo falla, necesitamos que un administrador de sistemas restablezca tu contraseña manualmente.`,
    },
    {
      title: "🚫 Acceso denegado a carpetas",
      content: `**Pasos a seguir:**

No es una falla, es configuración de permisos.

Para resolverlo tú mismo:
1. Clic derecho en la carpeta > Propiedades > Seguridad
2. Haz clic en "Editar" y agrega tu usuario con control total.
3. Si los botones están grises, la carpeta pertenece a otro usuario o sistema. Debes pedir al propietario que te comparta el acceso.

Si es una carpeta de red (servidor):
- El administrador debe agregar tu usuario al grupo de permisos.
- A veces basta cerrar sesión y volver a abrirla.

**No muevas ni borres archivos desde ubicaciones del sistema (C:\\Windows) aunque tengas acceso.**`,
    },
    {
      title: "🔒 Cuenta bloqueada",
      content: `**Pasos a seguir:**

Tu cuenta se bloqueó por política de seguridad (generalmente 5 intentos fallidos).

¿Qué hacer?
1. Espera 15-30 minutos. Algunas políticas desbloquean automáticamente.
2. Si no se desbloquea: contacta al administrador del sistema para que la desbloquee manualmente.
3. **Para evitar que vuelva a pasar**:
   - Revisa si tienes guardada una contraseña vieja en aplicaciones (Outlook, Teams, red WiFi corporativa).
   - Cambia tu contraseña a una que no tengas en otros servicios.

**Importante**: Si se bloquea incluso con la contraseña correcta, puede haber un ataque de fuerza bruta sobre tu cuenta. Avisa al equipo de seguridad.`,
    },
    {
      title: "📥 No hay permisos para instalar apps",
      content: `**Pasos a seguir:**

Esto es normal si tu usuario no es administrador. No es un error, es una política de seguridad.

Opciones:
1. Si la aplicación es necesaria para tu trabajo: solicita a TI que la instale remotamente.
2. Pide que te otorguen permisos temporales de instalación (muchas empresas usan herramientas como ManageEngine o PolicyPak).
3. Busca una versión portable de la app (no necesita instalación).

**No intentes usar trucos como "runas" o software para bypassear permisos** – eso puede activar alertas de seguridad y suspender tu cuenta.`,
    },
    {
      title: "👑 Solicita permisos de admin constantemente",
      content: `**Pasos a seguir:**

Esto es molesto pero no crítico. Soluciones:

1. Baja el nivel del Control de cuentas de usuario (UAC):
   - Escribe "UAC" en inicio → Baja la barra a "Nunca notificar"
   - ⚠️ No recomendado si usas el equipo para cosas personales o navegas sitios no confiables.
2. Ejecuta la aplicación problemática una vez como administrador y marca "Ejecutar siempre como administrador" en sus propiedades.
3. Si son muchas apps diferentes, tu perfil de usuario puede estar corrupto. Crea un nuevo usuario local.

Para entornos corporativos: consulta con TI si pueden agregar las apps frecuentes a una lista de confianza.`,
    },
  ],
  "Correo Electrónico": [
    {
      title: "📤 No se pueden enviar correos",
      content: `**Pasos a seguir:**

Primero verifica:
1. Que tengas conexión a internet.
2. Que el servidor de correo saliente (SMTP) sea correcto:
   - Outlook/Hotmail: \`smtp-mail.outlook.com\`, puerto 587
   - Gmail: \`smtp.gmail.com\`, puerto 465 o 587
   - Corporativo: consulta con TI.
3. Si usas autenticación en dos pasos: genera una "contraseña de aplicación".

Errores típicos:
- \`0x800CCC0F\` → El servidor no responde. Cambia puerto a 587 con TLS.
- \`Correo rechazado por spam\` → Tu IP o dominio está en lista negra temporal.

Si envías y no llegan (pero no da error): revisa la bandeja de "enviados" – si está allí, el problema es del receptor o filtro antispam.`,
    },
    {
      title: "📥 Los correos no llegan",
      content: `**Pasos a seguir:**

No entres en pánico, los correos rara vez se pierden.

Busca en:
1. **Correo no deseado (spam)** – revisa bien.
2. **Otras pestañas** (si usas Gmail: Social, Promociones)
3. **Filtros o reglas** que hayas creado sin querer.
4. **Carpeta de correo no deseado del servidor** (accede vía webmail).

Si es un correo esperado de un remitente específico:
- Agrégalo a la lista de contactos.
- Pídele que reenvíe el mensaje.

**Caso especial**: Si no te llega ningún correo de nadie, puede que tu cuenta esté llena (liberar espacio) o que el proveedor tenga caída (revisar estado del servicio).`,
    },
    {
      title: "🔄 Cliente de correo no sincroniza",
      content: `**Pasos a seguir:**

Pasos progresivos:

1. **Modo desconectado/Conectado**: En Outlook, ve a *Enviar/Recibir > Preferencias > Trabajar sin conexión* y desmárcalo.
2. **Elimina y vuelve a agregar la cuenta** (no perderás correos locales si usas IMAP).
3. **Cambia el servidor entrante**:
   - Si da error de autenticación, regenera contraseña de app.
   - Si se queda en "Sin conexión", revisa el firewall.
4. **Reduce el tamaño de la caché**:
   - Outlook: Configuración avanzada > Enviar/Recibir > Sincronizar solo los últimos 12 meses.

Para Thunderbird, Apple Mail, etc.: el problema suele ser el mismo. Indícanos tu cliente y versión.`,
    },
    {
      title: "📎 Adjuntos no se pueden abrir",
      content: `**Pasos a seguir:**

Causas y soluciones:

1. **Archivo dañado** durante envío → pide al remitente que lo reenvíe o comprima en ZIP.
2. **Extensión bloqueada** (ej: .exe, .js, .vbs):
   - Guarda el adjunto en tu PC y cambia la extensión a .txt temporalmente (no ejecutes nada sospechoso).
3. **No hay programa asociado**:
   - .pdf → instala Adobe Reader o usa navegador.
   - .docx → Word Online gratuito.
4. **El adjunto supera el tamaño permitido** (muchos servidores limitan a 25MB). Pide un enlace de descarga (OneDrive, Google Drive).

⚠️ **Nunca abras adjuntos .exe, .scr, .js de remitentes desconocidos aunque el antivirus lo permita.**`,
    },
    {
      title: "📧 Correos sospechosos/spam",
      content: `**Pasos a seguir:**

No es un fallo técnico, es higiene digital.

Acciones inmediatas:
1. Marca como **Spam/Correo no deseado** cada vez que llegue uno.
2. **No des clic en "Desuscribir"** en correos sospechosos – eso confirma que tu cuenta está activa.
3. Bloquea remitentes en tu cliente de correo.
4. Cambia tu dirección de correo si el spam es masivo (más de 50 al día).

Si tu correo corporativo recibe mucho spam: solicita a TI que active un filtro antispam más agresivo (ej: Proofpoint, Barracuda).

Nunca respondas ni reenvíes esos correos a compañeros.`,
    },
  ],
  Otro: [
    {
      title: "❓ Comportamientos inesperados",
      content: `**Pasos a seguir:**

"Comportamiento inesperado" puede ser desde ventanas que se mueven solas hasta apagados mágicos.

Guía genérica:
1. Reinicia el equipo (resuelve fallos de memoria temporal).
2. Abre **Visor de eventos** → *Administrativos* y busca errores rojos en la última hora.
3. Ejecuta \`chkdsk /f /r\` en CMD como administrador (revisa disco duro).
4. Prueba a iniciar en Modo seguro – si allí no falla, el problema es un driver o programa de inicio.

**Pide ayuda con más detalles**: ¿Cuándo ocurre? ¿Cada cuánto? ¿Qué estabas haciendo justo antes?`,
    },
    {
      title: "📚 Necesita capacitación",
      content: `**Pasos a seguir:**

Este sistema es para reportes de fallos técnicos, no para capacitación.

Sin embargo, te dejamos recursos útiles:
- **YouTube**: Busca "[nombre herramienta] tutorial básico"
- **LinkedIn Learning / Coursera** (si tu empresa tiene suscripción)
- **Documentación oficial** de la herramienta (suele tener guías paso a paso)

Si la herramienta es interna de la empresa, solicita a tu jefe directo que organice una sesión de capacitación con el equipo de TI o superusuarios.`,
    },
    {
      title: "🆕 Configurar nuevo dispositivo",
      content: `**Pasos a seguir:**

Indícanos:
- Tipo de dispositivo (impresora, monitor, mouse, teléfono, tablet)
- Sistema operativo (Windows, macOS, Linux, iOS, Android)

Mientras tanto:
1. **Impresoras**: La mayoría son plug-and-play por USB o WiFi. Descarga el driver desde la web oficial.
2. **Monitores**: Conecta, selecciona entrada correcta (HDMI 1/2, DisplayPort), luego ajusta resolución en Windows.
3. **Periféricos USB**: Si no funcionan, prueba otro puerto o reinicia.

Si el dispositivo es corporativo (ej: lector de huella, VPN hardware), necesitamos que nos des el modelo exacto para darte una guía personalizada.`,
    },
    {
      title: "🔒 Buenas prácticas de seguridad",
      content: `**Pasos a seguir:**

Buenas prácticas básicas (aplican siempre):

1. **Contraseñas**: mínimo 12 caracteres, mayúsculas, números, símbolos. No reutilices.
2. **Autenticación en dos pasos (2FA)** – actívala en correo, redes sociales y banca.
3. **Actualizaciones**: No pospongas las actualizaciones de sistema y navegador.
4. **Correos**: No descargues adjuntos sospechosos ni hagas clic en enlaces acortados.
5. **Redes WiFi**: No uses redes públicas sin VPN.

Para asesoría más profunda (normativas como ISO 27001, GDPR, PCI DSS), solicita una reunión con el área de seguridad informática.

Este canal es solo para incidentes técnicos, no para consultas estratégicas.`,
    },
    {
      title: "❓ Problema no clasificado",
      content: `**Pasos a seguir:**

Entendido. Como no está en nuestra base de problemas conocidos:

1. Descríbenos con el mayor detalle posible:
   - ¿Qué estabas haciendo justo antes del problema?
   - ¿Recibes algún mensaje de error? (texto exacto o captura)
   - ¿El problema ocurre siempre o a veces?
   - ¿Desde cuándo sucede?

2. Si es posible, graba un video corto con tu teléfono mostrando el comportamiento.

Con esa información, lo escalaremos al área técnica correspondiente. Mientras tanto, intenta reiniciar el equipo y la aplicación involucrada.`,
    },
  ],
};

// Componente del panel de respuestas predefinidas
// Componente del panel de respuestas predefinidas - CORREGIDO
const PredefinedResponsesPanel = ({
  category,
  onSelectResponse,
}: {
  category: string;
  onSelectResponse: (content: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const responses = PREDEFINED_RESPONSES[category] || PREDEFINED_RESPONSES.Otro;

  if (!responses || responses.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        title="Respuestas predefinidas"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
        Respuestas rápidas
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Overlay para cerrar al hacer click fuera */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel desplegable - ajustado hacia la izquierda */}
          <div className="absolute bottom-full mb-2 right-0 z-20 w-80 bg-white rounded-lg shadow-xl border border-slate-200 overflow-visible">
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
              <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Respuestas predefinidas - {category}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Haz clic en una respuesta para insertarla
              </p>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {responses.map((response, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelectResponse(response.content);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors group"
                >
                  <div className="text-sm font-medium text-slate-700 group-hover:text-blue-600">
                    {response.title}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                    {response.content.substring(0, 100)}...
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Esqueleto de carga

const DetailSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex gap-3 items-center">
      <div className="w-8 h-8 bg-slate-200 rounded-lg" />
      <div className="flex-1 space-y-2">
        <div className="h-6 bg-slate-200 rounded w-2/3" />
        <div className="h-4 bg-slate-100 rounded w-1/4" />
      </div>
    </div>
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-4 bg-slate-100 rounded w-28" />
          <div className="h-4 bg-slate-200 rounded w-40" />
        </div>
      ))}
    </div>
    <div className="bg-white rounded-xl border border-slate-200 p-6 h-48" />
  </div>
);

// ─── Componente principal ─────────────────────────────────────────────────────

const TechnicianTicketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = getUser();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [assignment, setAssignment] = useState<TicketAssignmentResponse | null>(
    null,
  );

  const [loadingTicket, setLoadingTicket] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [ticketError, setTicketError] = useState<string | null>(null);

  // Cambio de estado
  const [changingStatus, setChangingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);

  // Comentario nuevo
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Carga del ticket
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoadingTicket(true);
      try {
        const [ticketData, assignmentData] = await Promise.all([
          getTechnicianTicketById(id),
          getTicketAssignment(id),
        ]);

        console.log(
          "Datos del ticket:",
          ticketData.ticket.category,
          ticketData.ticket.priority,
          ticketData.ticket.status,
        );

        let ticketConvert: Ticket = {
          id: ticketData.ticket.id,
          title: ticketData.ticket.title,
          description: ticketData.ticket.description,
          category: ticketData.ticket.category,
          priority: ticketData.ticket.priority as TicketPriority,
          status: ticketData.ticket.status as TicketStatus,
          created_by: ticketData.ticket.createdBy,
          assigned_to: ticketData.ticket.assignedTo,
          createdAt: ticketData.ticket.createdAt,
          updatedAt: ticketData.ticket.updatedAt,
          ticket: ticketData.ticket,
        };
        setTicket(ticketConvert);
        setAssignment(assignmentData);
      } catch (err: any) {
        console.error(`Error al cargar el ticket: ${err.message}`);
        setTicketError(err.message || "No se pudo cargar el ticket");
      } finally {
        setLoadingTicket(false);
      }
    };
    load();
  }, [id]);

  // Carga de comentarios
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoadingComments(true);
      try {
        const data = await getTechnicianComments(id);
        setComments(data.comments);
      } catch {
        // No bloqueante
      } finally {
        setLoadingComments(false);
      }
    };
    load();
  }, [id]);

  // Scroll al último comentario
  useEffect(() => {
    if (!loadingComments)
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [loadingComments, comments.length]);

  const handleStatusChange = async (newStatus: string) => {
    if (!id || !ticket) return;
    setChangingStatus(true);
    setStatusError(null);
    setStatusSuccess(null);
    try {
      const updated = await updateTicketStatus(id, {
        status: newStatus as
          | "en_progreso"
          | "resuelto"
          | "cerrado"
          | "reabierto",
      });
      setTicket((prev) =>
        prev
          ? { ...prev, status: updated.status, updated_at: updated.updatedAt }
          : prev,
      );
      setStatusSuccess(
        `Estado actualizado a "${STATUS_CONFIG[updated.status].label}"`,
      );
      setTimeout(() => setStatusSuccess(null), 3000);
    } catch (err: any) {
      setStatusError(err.message || "Error al cambiar el estado");
    } finally {
      setChangingStatus(false);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newComment.trim()) return;
    setSendingComment(true);
    setCommentError(null);
    try {
      const created = await addTechnicianComment(id, {
        content: newComment.trim(),
        is_internal: isInternal,
      });
      setComments((prev) => [...prev, created]);
      setNewComment("");
    } catch (err: any) {
      setCommentError(err.message || "Error al enviar el comentario");
    } finally {
      setSendingComment(false);
    }
  };

  // ── Render ──

  if (loadingTicket) return <DetailSkeleton />;

  if (ticketError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
          <svg
            className="w-7 h-7 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-slate-700 font-medium">{ticketError}</p>
        <button
          onClick={() => navigate("/tecnico/tickets")}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Volver a tickets
        </button>
      </div>
    );
  }

  if (!ticket) return null;

  const statusCfg = STATUS_CONFIG[ticket.status];
  const priorityCfg = PRIORITY_CONFIG[ticket.priority];
  const nextStatuses = NEXT_STATUSES[ticket.status] ?? [];
  const isTicketActive = !["cerrado"].includes(ticket.status);

  const getShortId = (id: string) => {
    return id?.slice(0, 8).toUpperCase() || id;
  };

  const getShortCreadedBy = (created_by: string) => {
    return created_by?.slice(0, 8).toUpperCase() || created_by;
  };

  const getShortAssignedTo = (assigned_to: string | null) => {
    return assigned_to ? assigned_to.slice(0, 8).toUpperCase() : "Sin asignar";
  };

  const getShortTechnicianId = (technicianId: string) => {
    return technicianId?.slice(0, 8).toUpperCase() || technicianId;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* ── Encabezado ── */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate("/tecnico/tickets")}
          className="mt-1 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
          aria-label="Volver"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 ${statusCfg.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              #{getShortId(ticket.id)}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 leading-snug">
            {ticket.title}
          </h1>
        </div>
      </div>

      {/* ── Acciones de estado ── */}
      {nextStatuses.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Cambiar estado del ticket
          </p>
          <div className="flex flex-wrap gap-2">
            {nextStatuses.map((ns) => (
              <button
                key={ns.value}
                onClick={() => handleStatusChange(ns.value)}
                disabled={changingStatus}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg
                            transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm ${ns.color}`}
              >
                {changingStatus ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                {ns.label}
              </button>
            ))}
          </div>

          {statusError && (
            <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {statusError}
            </p>
          )}
          {statusSuccess && (
            <p className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {statusSuccess}
            </p>
          )}
        </div>
      )}

      {/* ── Información del ticket ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-600">
            Detalles del ticket
          </h2>
          <span className="text-xs text-slate-400">
            {formatDate(ticket.createdAt)}
          </span>
        </div>
        <div className="px-5 divide-y divide-slate-100">
          <DetailRow label="Descripción">
            <span className="whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </span>
          </DetailRow>
          <DetailRow label="Categoría">{ticket.category}</DetailRow>
          <DetailRow label="Prioridad">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs ${priorityCfg.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${priorityCfg.dot}`} />
              {priorityCfg.label}
            </span>
          </DetailRow>
          <DetailRow label="Creado por">
            <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">
              {getShortCreadedBy(ticket.created_by)}...
            </span>
          </DetailRow>
          <DetailRow label="Asignado a">
            {assignment ? (
              <div className="space-y-1">
                <span className="font-mono text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                  {getShortTechnicianId(assignment.technicianId)}…
                </span>
                <p className="text-xs text-slate-400">
                  Asignado el {formatDate(assignment.assignedAt)}
                </p>
              </div>
            ) : ticket.assigned_to ? (
              <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">
                {getShortAssignedTo(ticket.assigned_to)}...
              </span>
            ) : (
              <span className="text-slate-400 italic">Sin asignar</span>
            )}
          </DetailRow>
          <DetailRow label="Última actualización">
            {formatDateTime(ticket.updatedAt)}
          </DetailRow>
        </div>
      </div>

      {/* ── Comentarios ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-600">Comentarios</h2>
          <span className="text-xs text-slate-400">
            {comments.length} mensaje{comments.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Lista */}
        <div className="px-5 py-4 space-y-4 min-h-[140px] max-h-[420px] overflow-y-auto">
          {loadingComments ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <svg
                className="w-8 h-8 text-slate-300 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-sm text-slate-400">Aún no hay comentarios.</p>
            </div>
          ) : (
            comments.map((c) => (
              <CommentBubble
                key={c.id}
                comment={c}
                isOwn={c.authorId === user?.sub}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input de comentario */}
        {isTicketActive ? (
          <div className="border-t border-slate-100 px-5 py-4 space-y-3">
            {/* Toggle nota interna y respuestas predefinidas */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsInternal((prev) => !prev)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 ease-in-out
                      focus:outline-none ${isInternal ? "bg-amber-500" : "bg-slate-200"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out mt-0.5
                        ${isInternal ? "translate-x-4" : "translate-x-0.5"}`}
                  />
                </button>
                <span
                  className={`text-xs font-medium ${isInternal ? "text-amber-600" : "text-slate-500"}`}
                >
                  {isInternal
                    ? "Nota interna (solo técnicos)"
                    : "Comentario público"}
                </span>
              </div>

              {/* Botón de respuestas predefinidas - solo visible si hay categoría */}
              {ticket?.category && (
                <PredefinedResponsesPanel
                  category={ticket.category}
                  onSelectResponse={(content) => {
                    // Insertar la respuesta en el textarea
                    setNewComment((prev) => {
                      // Si ya hay texto, agregar un salto de línea antes
                      if (prev && prev.trim()) {
                        return prev + "\n\n---\n\n" + content;
                      }
                      return content;
                    });
                  }}
                />
              )}
            </div>

            <form onSubmit={handleSendComment} className="flex flex-col gap-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendComment(e as any);
                  }
                }}
                rows={3}
                placeholder={
                  isInternal
                    ? "Escribe una nota interna… (solo visible para técnicos)"
                    : "Escribe un comentario… (visible para el cliente)"
                }
                disabled={sendingComment}
                className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none resize-none transition-colors disabled:bg-slate-50 whitespace-pre-wrap
                    ${
                      isInternal
                        ? "border-amber-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 bg-amber-50/50"
                        : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    }`}
                style={{ whiteSpace: "pre-wrap" }} // Asegura que los saltos de línea se mantengan
              />

              {commentError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {commentError}
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newComment.trim() || sendingComment}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg
                      transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm
                      ${
                        isInternal
                          ? "bg-amber-500 hover:bg-amber-600 shadow-amber-200"
                          : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                      }`}
                >
                  {sendingComment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Enviando…
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      {isInternal ? "Agregar nota" : "Enviar"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="border-t border-slate-100 px-5 py-3 bg-slate-50">
            <p className="text-xs text-slate-400 text-center">
              Este ticket está cerrado y no admite nuevos comentarios.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicianTicketDetail;
