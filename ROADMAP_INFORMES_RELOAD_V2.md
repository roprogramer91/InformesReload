# InformeReload v2 — Hoja de ruta oficial

> Fuente persistente de contexto, alcance, decisiones, pruebas y avance del nuevo Gestor integrado de InformeReload.

# Instrucciones para asistentes de desarrollo

1. Leer este archivo completo antes de modificar código.
2. Tratar `InformeReload` como el proyecto principal.
3. Tratar `gestor_cardio` sólo como referencia de comportamiento y respaldo operativo de Vital Norte.
4. No modificar, refactorizar, mover ni fusionar `gestor_cardio` salvo instrucción explícita.
5. Identificar la fase actual y no implementar fases posteriores sin autorización.
6. Trabajar y validar primero en la rama y el entorno `dev`.
7. No promover a `main`, Railway producción ni al frontend público sin autorización y validación independiente.
8. Mantener todos los flujos actuales de InformeReload durante la evolución.
9. Marcar `[x]` únicamente cuando exista implementación y evidencia de prueba.
10. Actualizar estado, pruebas, problemas y decisiones al finalizar cada tarea.
11. No borrar el historial del roadmap.
12. No incluir credenciales, tokens ni datos reales de pacientes en documentación, Git o pruebas públicas.
13. Antes de una refactorización relevante, presentar motivo, alcance, compatibilidad y validación esperada.

# Estado actual

**Fase actual:** FASE 1 — Preparar InformeReload para el módulo Gestor

**Estado:** PostgreSQL local validado en `feature/postgresql-unificado`; Fase 1 continúa en progreso.

**Última actualización:** 2026-09-01

**Próximo objetivo:** Consolidar la migración PostgreSQL local antes de preparar, mediante una autorización separada, Railway Dev.

**Entorno autorizado:** Local sobre `feature/postgresql-unificado`, creada desde `dev`. Railway y producción permanecen intactos.

# Decisión principal y alcance

El producto que evoluciona es **InformeReload**. El resultado buscado es **InformeReload v2**, con un nuevo módulo Gestor multi-institución integrado.

`gestor_cardio` no será convertido en la base del nuevo sistema. Debe conservarse funcional y sin modificaciones como:

- Referencia de comportamiento.
- Respaldo operativo de Vital Norte.
- Fuente de requisitos y lógica ya probada que pueda reimplementarse correctamente.

Queda fuera de alcance:

- Convertir primero `gestor_cardio` en multi-institución.
- Copiar su `app.py` dentro de InformeReload.
- Mover InformeReload dentro de `gestor_cardio`.
- Fusionar físicamente las carpetas de ambos proyectos.
- Automatizar ABPM en las primeras fases.

# Visión del producto

## Flujo actual

```text
AWP
 ↓
ABPM externo/manual
 ↓
PDF -P
 ↓
InformeReload
 ↓
Informe médico
 ↓
gestor_cardio
 ↓
Organización / combinación
 ↓
Correo / Drive
```

## Flujo objetivo

```text
AWP
 ↓
ABPM externo/manual
 ↓
PDF -P
 ↓
InformeReload v2
 ├── Generación de informes
 ├── Herramientas actuales
 └── Gestor integrado
      ↓
   Procesamiento interno
      ↓
   Validaciones automáticas
      ↓
   Revisión humana
      ↓
   Aprobación
      ↓
   Drive / Email / Archivo
```

## Estados objetivo

```text
GENERADO
   ↓
PROCESADO
   ↓
PENDIENTE_REVISION
   ↓
APROBADO
   ↓
ENVIADO / SUBIDO / ARCHIVADO
```

La posibilidad de salida externa depende de `revision_modo` y de las validaciones. Un error crítico bloquea siempre la salida, independientemente del modo configurado.

## Política configurable de revisión

Cada institución deberá definir una regla `revision_modo` con uno de estos valores:

- **`siempre`:** todo estudio debe pasar por `PENDIENTE_REVISION` y alcanzar `APROBADO` antes de cualquier salida externa.
- **`opcional`:** al procesar, el sistema debe preguntar si se desea revisar o continuar directamente. Si se elige revisar, se aplica el circuito de aprobación; si se elige envío directo, igualmente deben superarse todas las validaciones críticas.
- **`nunca`:** permite omitir la revisión humana y continuar directamente sólo cuando no exista ningún error crítico.

`revision_modo` controla si la revisión humana se exige, se ofrece o se omite. No desactiva las validaciones de seguridad.

## Bloqueo universal por errores críticos

Ninguna modalidad de revisión puede autorizar una salida externa cuando exista un error crítico. El sistema debe bloquear Drive, email, archivado externo y cualquier otro destino hasta corregirlo.

Ejemplos iniciales de errores críticos:

- DNI ausente cuando la institución lo exige.
- Archivos que no corresponden al mismo paciente.
- Documento requerido faltante.
- Inconsistencias fuertes de identidad, fecha o asociación documental.
- Archivo ilegible, inválido o generación incompleta que impida verificar el resultado.

La clasificación exacta de errores y advertencias deberá ser configurable y quedar registrada para auditoría.

## Objetivo funcional: combinado automático

InformeReload v2 debe generar automáticamente el PDF combinado a partir del PDF `-P` y el informe médico asociado, incluyendo carátula cuando la configuración institucional lo requiera.

El objetivo es eliminar el paso manual actual de descargar los documentos y volver a cargar ambos en la herramienta de unión. La herramienta manual existente debe conservarse durante la transición como respaldo hasta validar el nuevo flujo automático.

# Relación entre proyectos

```text
gestor_cardio actual
        │
        ├── observar comportamiento operativo
        ├── extraer requisitos y casos límite
        └── comparar resultados de Vital Norte
                         │
                         ▼
                  InformeReload v2
                         │
                         └── Gestor configurable integrado
```

La migración es conceptual y funcional, no una copia de código ni una fusión de proyectos.

# FASE 0 — Análisis realizado

## Arquitectura actual de InformeReload

InformeReload es una aplicación web dividida en un frontend estático y una API Node.js/Express.

### Frontend

- `index.html`: contiene la estructura completa de la interfaz y las tarjetas institucionales repetidas en varios flujos.
- `styles.css`: concentra todos los estilos visuales.
- `scripts/main.js`: concentra navegación, selección de institución, carga de archivos, llamadas a la API, descarga de resultados, corrección de fechas, herramientas PDF e historial local.
- Selecciona la API según el contexto de ejecución: local, Railway `dev` mediante `?dev`, o producción.
- El historial de procesamiento vive en `localStorage` bajo `informatron_historial`; no es compartido entre navegadores, equipos o dominios.

### Backend

- `back/index.js`: inicializa Express, CORS, logging, límites de cuerpo y registra las rutas bajo `/api`.
- `back/routes/`: capa HTTP separada por operación.
- `back/functions/`: extracción, parsing, cálculos médicos, documentos y conversión.
- `back/config/config.js`: configuración estática actual de instituciones y umbrales globales de validación.
- `back/templates/`: plantillas DOCX de informes, informes insuficientes y carátulas.
- `back/output/`: salida de scripts y pruebas; actualmente contiene documentos versionados y no versionados.
- `back/test-pdfs/` y scripts `test-*`, `analizar-*`, `diagnosticar-*`: utilidades manuales de diagnóstico, no una suite automatizada unificada.

### API actual

| Endpoint | Responsabilidad |
|---|---|
| `POST /api/upload-pdf` | Extraer un PDF MAPA y construir el paciente. |
| `GET /api/criterios-validacion` | Exponer umbrales globales de duración y mediciones. |
| `POST /api/actualizar-mediciones` | Actualizar y validar mediciones. |
| `POST /api/generar-informe` | Generar DOCX y convertirlo a PDF cuando el entorno lo permite. |
| `POST /api/inspeccionar-awp` | Mostrar nombre y fechas detectadas de un AWP. |
| `POST /api/procesar-awp` | Procesar AWP y generar informe. |
| `POST /api/unir-pdfs` | Unir informe médico, `-P` y carátula opcional. |
| `POST /api/agregar-caratula` | Anteponer una carátula institucional. |

### Modelo de datos actual

- No hay base de datos ni persistencia del lado servidor.
- El objeto paciente viaja entre frontend y backend en cada solicitud.
- Los archivos entran en memoria mediante Multer y las respuestas se descargan directamente.
- Las instituciones están hardcodeadas en un objeto JavaScript.
- Las tarjetas de instituciones también están duplicadas en el HTML.
- La condición de carátula aparece en configuración backend y en una lista separada del frontend.
- Los criterios mínimos de estudio son globales, no reglas por institución.

### Generación y procesamiento

- Admite PDF como entrada tradicional y AWP como entrada automatizada.
- El parser AWP lee secciones `PATIENTDATA` y `ABPMDATA` desde texto Latin-1.
- La fecha del informe proviene primero de la primera medición válida detectada; la fecha administrativa funciona como respaldo.
- Existe una ruta separada para corregir manualmente la fecha sin interrumpir el procesamiento automático.
- `crearInforme.js` elige la plantilla institucional y reemplaza variables mediante Docxtemplater/PizZip.
- `pdf-lib` realiza la unión de PDFs sin PDFtk.
- LibreOffice headless convierte DOCX a PDF en Linux/Railway; en Windows local el sistema devuelve DOCX.

### Despliegue actual

- Backend Node 20 en Railway mediante Dockerfile o Nixpacks, con LibreOffice instalado.
- Frontend estático separado; sus cambios no se publican automáticamente con el backend.
- `dev` y `main` representan integración/pruebas y producción respectivamente.
- CORS está abierto a cualquier origen.
- No existe autenticación ni autorización en la API actual.

## Arquitectura actual de gestor_cardio

`gestor_cardio` es una aplicación local Flask para el flujo operativo de Vital Norte.

### Componentes

- `app.py`: servidor, rutas, configuración, OAuth, Gmail, Drive, acceso a carpetas, combinación y estados, todo en un único archivo.
- `templates/index.html`: interfaz, estilos y JavaScript en una sola plantilla Flask.
- `arrancar.bat`: verifica/instala dependencias, abre el navegador y ejecuta Flask en el puerto 5050.
- `credentials.json` y `token.json`: credenciales OAuth locales; no se inspeccionó su contenido.
- `instalacion.zip`: paquete instalable con copias de `app.py`, `arrancar.bat`, `configurar.py` e `index.html`.

### Responsabilidades operativas

- Lee una carpeta de descargas local.
- Indexa archivos `-P` en una estructura local organizada por mes y fecha.
- Mueve el informe médico al lado de su `-P` correspondiente.
- Copia informes médicos a `Solo Informe`.
- Combina `-P` e informe médico mediante PDFtk.
- Envía por Gmail los archivos de una fecha.
- Sube combinados a una carpeta mensual de Google Drive.
- Evita subir archivos cuyo nombre ya existe en el destino consultado.
- Registra envíos en `enviados.json` por mes.
- Abre carpetas mediante Windows Explorer.

### Acoplamientos actuales

- Rutas Windows y estructura `mes/fecha` asumidas globalmente.
- Nombres `Solo Informe` y `Combinados` incorporados a la lógica.
- Destinatario de facturación, asunto y texto de correo orientados a Vital Norte.
- Una única carpeta raíz de Drive y organización mensual fija.
- Estado de envío indexado por fecha, no por paciente o documento.
- Correspondencia de archivos basada principalmente en el nombre.
- Dependencias directas de Windows Explorer y PDFtk.
- OAuth, API, operaciones de archivos y reglas de negocio mezclados en `app.py`.
- Clave de sesión y valores operativos predeterminados presentes en el código.
- No hay repositorio Git ni `.gitignore` dentro de esa carpeta.

# Mapa de responsabilidades

| Responsabilidad | InformeReload actual | gestor_cardio actual | Destino en v2 |
|---|---|---|---|
| Leer PDF MAPA | Sí | No | Núcleo de generación existente. |
| Leer AWP | Sí | No | Núcleo de generación existente, extensible a campos configurables. |
| Cálculos médicos | Sí | No | Servicio de generación existente. |
| Generar informe institucional | Sí | No | Servicio de documentos existente. |
| Corregir fecha AWP | Sí | No | Herramienta actual preservada. |
| Crear carátula | Sí | No | Servicio de documentos configurable. |
| Unir PDFs | Sí, en memoria | Sí, con PDFtk local | Reutilizar `pdf-lib`; configurar orden y carátula. |
| Detectar/mover archivos locales | No | Sí | Adaptador de almacenamiento local del Gestor. |
| Crear Solo Informe | No | Sí | Capacidad configurable del procesamiento. |
| Organizar por mes/fecha | No | Sí | Estrategia de destino configurable. |
| Enviar Gmail | No | Sí | Adaptador de email posterior al control de revisión y validaciones. |
| Subir a Drive | No | Sí | Adaptador de Drive posterior al control de revisión y validaciones. |
| Registrar enviados | Sólo historial local del navegador | Sí, por fecha | Persistencia central por paciente/documento/acción. |
| Revisión/aprobación | No | No | Nuevo dominio obligatorio del Gestor. |
| Administrar instituciones | Configuración estática | No | Nuevo módulo de instituciones. |

# Funcionalidades de gestor_cardio que deben migrarse conceptualmente

- Descubrimiento de pares de archivos por paciente.
- Separación entre informe médico, `-P`, Solo Informe y combinado.
- Organización configurable de destinos locales.
- Envío de uno o varios informes por email.
- Creación/búsqueda de carpetas en Google Drive.
- Detección de duplicados antes de subir o enviar.
- Registro durable del resultado de cada acción.
- Reintento de errores sin repetir acciones satisfactorias.
- Apertura o acceso al destino local cuando el despliegue lo permita.
- Resumen operativo del lote.

Estas responsabilidades deben reimplementarse detrás de servicios y configuración institucional; no copiarse desde `app.py`.

# Código y conceptos que no deben reutilizarse directamente

- El archivo monolítico `app.py` como estructura del nuevo módulo.
- Rutas absolutas de Windows como constantes globales.
- Condicionales o funciones con nombres específicos por institución.
- Destinatarios, asuntos, IDs de Drive o nombres de carpetas incrustados en código.
- `enviados.json` indexado sólo por fecha.
- La suposición de que coincidencia de nombre de archivo equivale siempre a identidad del paciente.
- El envío o subida inmediata sin revisión y aprobación.
- PDFtk como dependencia obligatoria, porque InformeReload ya combina con `pdf-lib`.
- `explorer.exe` como parte del dominio; debe quedar, si se conserva, en un adaptador local opcional.
- Instalación automática de dependencias durante cada arranque como estrategia de despliegue.
- Claves de sesión o secretos incorporados al código.
- Duplicación de HTML/JavaScript institucional en cada herramienta.

# Arquitectura mínima propuesta para InformeReload v2

Se propone una evolución incremental dentro del stack actual Node.js/Express + frontend estático. No se introduce todavía un framework frontend ni microservicios.

## Capas

```text
Frontend existente
├── Generación de informes
├── Herramientas actuales
└── Gestor
    ├── Instituciones
    ├── Pendientes
    ├── Revisión
    └── Procesamiento
            │
            ▼
API Express
├── Rutas HTTP
├── Casos de uso del Gestor
├── Dominio
│   ├── Institución
│   ├── Estudio/Paciente
│   ├── Documento
│   ├── Lote
│   └── Estado/Aprobación
├── Servicios reutilizables
│   ├── Documentos/PDF
│   ├── Validaciones
│   ├── Organización
│   └── Orquestación
└── Adaptadores
    ├── Persistencia
    ├── Archivos locales
    ├── Google Drive
    └── Email
```

## Modelo mínimo de institución

```text
Institución
├── id estable
├── nombre y estado
├── tipos de estudio
├── plantillas y carátula
├── capacidades
│   ├── combinarPdf
│   ├── guardarSoloInforme
│   ├── enviarEmail
│   ├── subirDrive
│   ├── archivarAwp
│   ├── organizarPorMes
│   └── organizarPorFecha
├── reglas
│   ├── dniRequerido
│   ├── nombreRequerido
│   ├── fechaRequerida
│   ├── validarCoincidenciaFechas
│   ├── revisionModo: siempre | opcional | nunca
│   └── erroresCriticosBloqueanSalida: true  # regla invariable del sistema
└── destinos
    ├── local
    ├── drive
    └── email
```

## Entidades operativas mínimas

- **Estudio:** institución, paciente, fecha, origen, datos extraídos y advertencias.
- **Documento:** tipo, nombre, ubicación o referencia, hash opcional y relación con el estudio.
- **Lote:** conjunto de estudios procesados juntos.
- **Transición de estado:** estado anterior, nuevo estado, fecha y responsable cuando corresponda.
- **Acción externa:** tipo, destino, estado, intentos, error y evidencia de finalización.

## Persistencia

La interfaz no debe depender de `localStorage` como fuente oficial. Para la Fase 1 se adoptó Prisma con PostgreSQL en todos los entornos, encapsulado detrás de un contrato Repository. Desarrollo local utiliza PostgreSQL mediante Docker Compose; Railway Dev y la producción futura utilizarán instancias PostgreSQL independientes. El proyecto mantiene un único `schema.prisma` y un único historial de migraciones PostgreSQL. Ninguna ruta, servicio ni función de negocio debe conocer el entorno o contener SQL específico del motor.

# Árbol de carpetas propuesto

Los nombres son una propuesta para la Fase 1 y deben validarse antes de crearlos.

```text
InformeReload/
├── index.html
├── styles.css
├── scripts/
│   ├── main.js
│   └── gestor/                  # UI del nuevo módulo, sin reescribir lo actual
│       ├── gestor-api.js
│       ├── instituciones.js
│       └── gestor-view.js
├── back/
│   ├── index.js
│   ├── config/
│   │   └── config.js            # compatibilidad temporal
│   ├── routes/
│   │   └── gestor/              # rutas nuevas agrupadas
│   │       ├── institucionesRoutes.js
│   │       ├── estudiosRoutes.js
│   │       └── revisionRoutes.js
│   ├── domain/
│   │   └── gestor/
│   │       ├── institucion.js
│   │       ├── estudio.js
│   │       ├── estados.js
│   │       └── validacion-config.js
│   ├── services/
│   │   └── gestor/
│   │       ├── institutionService.js
│   │       ├── processingService.js
│   │       └── reviewService.js
│   ├── repositories/
│   │   └── institutionRepository.js
│   ├── adapters/
│   │   ├── storage/
│   │   ├── drive/
│   │   └── email/
│   ├── functions/               # funciones actuales preservadas
│   ├── templates/               # plantillas actuales preservadas
│   └── tests/
│       ├── baseline/
│       ├── unit/
│       └── integration/
└── ROADMAP_INFORMES_RELOAD_V2.md
```

No es necesario crear todas estas carpetas al comienzo. La Fase 1 debe añadir sólo el esqueleto requerido por el primer corte vertical y evitar arquitectura vacía.

# Flujo de datos propuesto

```text
1. Usuario selecciona institución
2. Configuración institucional determina capacidades y reglas
3. Usuario carga AWP/PDF y documentos relacionados
4. Parser normaliza un Estudio
5. Validaciones clasifican errores críticos y advertencias
6. Si existe un error crítico, el flujo queda bloqueado para toda salida externa
7. Servicios generan informe y combinado automático (`-P` + informe médico + carátula configurable)
8. Gestor registra documentos y estado PROCESADO
9. `revision_modo = siempre` → pasa a PENDIENTE_REVISION
10. `revision_modo = opcional` → pregunta revisar o continuar directo
11. `revision_modo = nunca` → omite revisión sólo si no hay errores críticos
12. Cuando corresponde, usuario revisa y aprueba o rechaza
13. Sólo una transición válida habilita Drive/email/archivo
14. Cada acción externa registra resultado e impide duplicados
```

# Riesgos técnicos

- **Regresión de generación:** el nuevo módulo puede alterar los flujos actuales de PDF, AWP, plantillas o fechas si se acopla demasiado pronto.
- **Configuración duplicada:** instituciones aparecen hoy en backend, HTML y JavaScript; una migración parcial produciría comportamientos inconsistentes.
- **Ausencia de persistencia central:** `localStorage` no alcanza para revisión, auditoría, reintentos ni multidispositivo.
- **Identidad débil:** basarse sólo en nombres de archivo puede mezclar pacientes o impedir distinguir reintentos legítimos.
- **Asociación automática incorrecta:** automatizar el combinado exige verificar que el `-P` y el informe médico pertenezcan al mismo paciente; una duda fuerte debe ser error crítico.
- **Datos sensibles:** pacientes, PDFs, AWP, tokens y credenciales requieren límites claros de almacenamiento, logs y pruebas.
- **API sin autenticación:** no puede exponerse un Gestor con acciones externas y datos clínicos sin autorización.
- **CORS abierto:** deberá restringirse cuando exista una superficie privada real.
- **Carga en memoria:** Multer y cuerpos de 50 MB pueden afectar memoria con lotes o PDFs grandes.
- **Conversión dependiente del entorno:** Windows devuelve DOCX y Railway/Linux PDF; las pruebas deben reconocer ambos resultados.
- **LibreOffice por proceso:** conversión sin cola puede provocar conflictos, consumo alto o archivos temporales en procesamiento concurrente.
- **Frontend monolítico:** `main.js` y `index.html` crecerán demasiado si el Gestor se agrega sin módulos.
- **Pruebas dispersas:** existen scripts manuales, pero `npm test` no ejecuta pruebas reales.
- **Archivos clínicos en Git:** hay PDFs de prueba y DOCX de salida versionados; deben evaluarse y reemplazarse por datos sintéticos sin borrar nada en esta fase.
- **README desactualizado:** describe sólo una parte del producto y omite funciones recientes.
- **Código duplicado:** `crearInforme.js` contiene una definición duplicada de `generarYGuardarInforme`.
- **Codificación:** existen mensajes con caracteres mojibake en rutas AWP que conviene corregir bajo prueba.
- **Frontend/backend separados:** un cambio backend en Railway no actualiza automáticamente el frontend publicado.

# Dependencias locales y límites multidispositivo

| Dependencia | Situación actual | Impacto futuro |
|---|---|---|
| ABPM | Programa externo/manual | Debe seguir como frontera explícita del sistema. |
| Carpetas Windows | Usadas por `gestor_cardio` | Un servidor remoto no puede acceder directamente a discos de cada notebook. |
| Windows Explorer | Apertura local desde Flask | Sólo puede existir como capacidad de un agente/aplicación local. |
| PDFtk | Usado por `gestor_cardio` | No debería migrarse; InformeReload ya usa `pdf-lib`. |
| LibreOffice | Linux/Railway para PDF | Requiere controlar disponibilidad, concurrencia y temporales. |
| Google OAuth | Token local en Gestor | Debe diseñarse por usuario/entorno y almacenarse de forma segura. |
| Drive/Gmail | Acciones externas | Requieren aprobación, idempotencia, auditoría y reintentos. |
| `localStorage` | Historial sólo del navegador | No sirve como historial compartido ni oficial. |
| Frontend estático | Host separado del backend | Exige coordinar versiones y despliegues. |

# Plan exacto de implementación de la Fase 1

Este plan aún no está autorizado para ejecución.

## Paso 1 — Congelar una línea base

- [ ] Documentar los flujos actuales: PDF manual, AWP automático, corrección de fecha, unión y carátula.
- [ ] Definir archivos sintéticos o anonimizados seguros para cada prueba.
- [ ] Registrar resultados esperados: estado HTTP, tipo de archivo, nombre, plantilla y campos clave.
- [ ] Ejecutar verificaciones locales sin publicar documentos reales.

## Paso 2 — Asegurar el repositorio antes de ampliar alcance

- [ ] Revisar `.gitignore` para outputs, temporales, credenciales, tokens y configuración local.
- [ ] Auditar archivos clínicos ya versionados sin borrarlos automáticamente.
- [ ] Definir variables de entorno y ejemplos sin secretos para futuros conectores.
- [ ] No tocar credenciales de `gestor_cardio`.

## Paso 3 — Definir contratos mínimos

- [ ] Definir el esquema de Institución con capacidades, reglas y destinos.
- [ ] Definir estados del Estudio y transiciones permitidas.
- [ ] Definir `revision_modo` (`siempre`, `opcional`, `nunca`) y sus transiciones.
- [ ] Definir catálogo inicial de errores críticos y el bloqueo universal de salidas.
- [ ] Definir interfaces de repositorio y adaptadores externos.
- [ ] Definir validación y mensajes de configuración incompleta.
- [ ] Registrar la decisión de persistencia inicial antes de implementarla.

## Paso 4 — Crear un corte vertical aislado

- [ ] Crear el módulo backend del Gestor sin mover las funciones actuales.
- [ ] Exponer inicialmente sólo lectura/listado de instituciones.
- [ ] Adaptar la configuración estática actual mediante una capa compatible.
- [ ] Crear una entrada visual del Gestor sin reemplazar las herramientas existentes.
- [ ] No habilitar todavía Drive, email, archivo ni procesamiento destructivo.

## Paso 5 — Validar compatibilidad

- [ ] Ejecutar la línea base completa.
- [ ] Confirmar que los endpoints existentes mantienen contratos y resultados.
- [ ] Confirmar que las cuatro instituciones actuales siguen generando sus plantillas correctas.
- [ ] Confirmar los flujos local, `?dev` y Railway `dev` según corresponda.
- [ ] Documentar resultados y problemas antes de ampliar el módulo.

## Criterio de salida de Fase 1

- [ ] Arquitectura mínima creada sin migrar aún el flujo de Vital Norte.
- [ ] Configuración institucional actual accesible mediante un contrato único.
- [ ] Entrada del Gestor integrada sin romper la UI existente.
- [ ] Ninguna acción externa nueva habilitada.
- [ ] Aplicación y endpoints actuales validados en `dev`.
- [ ] Pruebas, decisiones y pendientes actualizados.

# Hoja de ruta principal

## FASE 0 — Analizar InformeReload + Gestor Cardio

**Objetivo:** Comprender ambos proyectos y definir cómo incorporar el nuevo Gestor dentro de InformeReload.

- [x] Inspeccionar la estructura y el código actual de InformeReload.
- [x] Inspeccionar la estructura y el comportamiento de `gestor_cardio` sin leer credenciales.
- [x] Documentar ambas arquitecturas.
- [x] Crear el mapa de responsabilidades.
- [x] Identificar funciones que deben migrarse conceptualmente.
- [x] Identificar acoplamientos que no deben copiarse.
- [x] Proponer arquitectura mínima, árbol y flujo de datos.
- [x] Identificar riesgos y dependencias locales.
- [x] Preparar el plan exacto de Fase 1.
- [x] Crear el roadmap oficial de InformeReload v2.
- [x] Obtener revisión y autorización del usuario para iniciar la Fase 1.

### Criterio para dar esta fase por terminada

- [x] No se modificó código funcional ni configuración.
- [x] El análisis cubre ambos proyectos y sus límites.
- [x] El diseño preserva `gestor_cardio` como respaldo.
- [x] La propuesta mantiene compatibilidad con InformeReload.
- [x] El usuario aprueba el diseño y autoriza la Fase 1.

## FASE 1 — Preparar InformeReload para el módulo Gestor

**Objetivo:** Crear la arquitectura interna necesaria sin romper funcionalidades existentes.

- [x] Crear y validar una línea base sintética de regresión para instituciones, informes y carátulas.
- [x] Completar protección de la base SQLite local, `.env` y archivos auxiliares.
- [x] Definir contrato Repository y separar repositorio, servicio y rutas.
- [x] Crear el esqueleto mínimo persistente de instituciones.
- [x] Centralizar en el backend la lectura de instituciones manteniendo los nombres actuales como identificadores funcionales de compatibilidad.
- [ ] Agregar entrada visual aislada para el Gestor.
- [x] Mantener intactos los flujos actuales cubiertos por las pruebas sintéticas.
- [x] Documentar pruebas locales de esta rama.

### Criterio para dar esta fase por terminada

- [ ] La aplicación arranca y los flujos existentes funcionan igual.
- [ ] El esqueleto no habilita acciones externas prematuras.
- [ ] Configuración y contratos están documentados y probados.
- [ ] No existen regresiones conocidas importantes.
- [ ] Checklist y pruebas completos.

## FASE 2 — Crear sistema de instituciones

**Objetivo:** Listar, crear, editar, activar, desactivar y configurar instituciones.

> Alcance adelantado y autorizado dentro de `feature/instituciones-v1`: sólo endpoints backend mínimos de listado, creación y edición. La administración visual y el resto de la Fase 2 permanecen pendientes.

- [x] Crear endpoint backend de listado desde una fuente única.
- [x] Crear institución con ID estable.
- [x] Mantener `name` como campo editable y único, separado de la identidad estable.
- [x] Editar institución mediante endpoint backend identificado por `id`.
- [ ] Activar/desactivar.
- [ ] Validar duplicados y configuración incompleta.
- [x] Validar duplicados y los campos mínimos autorizados.
- [x] Persistir cambios localmente con Prisma y SQLite.
- [x] Mantener compatibilidad backend con las cuatro instituciones actuales.

### Criterio para dar esta fase por terminada

- [ ] La administración funciona sin editar código ni duplicar tarjetas.
- [ ] Persistencia, validaciones y compatibilidad fueron probadas.
- [ ] Checklist y documentación completos.

## FASE 3 — Crear funciones y reglas configurables

**Objetivo:** Configurar capacidades y validaciones por institución.

- [ ] Implementar capacidades configurables.
- [ ] Implementar reglas configurables.
- [x] Implementar `dniMode` por institución con resolución `AWP`, `MANUAL` u `OPTIONAL`.
- [ ] Implementar `revision_modo` con valores `siempre`, `opcional` y `nunca`.
- [ ] Implementar bloqueo de salida por errores críticos en todos los modos.
- [ ] Evitar condicionales por nombre de institución.
- [ ] Mostrar UI según capacidades.
- [ ] Validar reglas antes de cada transición.
- [ ] Probar configuraciones representativas.

### Criterio para dar esta fase por terminada

- [ ] Capacidades y reglas controlan el comportamiento sin duplicar flujos.
- [ ] Los tres modos de revisión tienen transiciones definidas y probadas.
- [ ] Los errores críticos bloquean las salidas en los tres modos.
- [ ] Configuraciones inválidas fallan de forma segura.
- [ ] Flujos anteriores continúan funcionando.

## FASE 4 — Reimplementar flujo Vital Norte

**Objetivo:** Reproducir dentro del nuevo Gestor lo que actualmente hace `gestor_cardio`.

- [ ] Documentar una comparación funcional completa.
- [ ] Detectar y asociar archivos.
- [ ] Crear Solo Informe.
- [ ] Asociar automáticamente el PDF `-P` con el informe médico correcto.
- [ ] Generar automáticamente el PDF combinado, con carátula cuando corresponda.
- [ ] Mantener temporalmente la herramienta manual de unión como respaldo.
- [ ] Organizar por mes y fecha.
- [ ] Preparar internamente archivos, destinos y acciones de correo, Drive y archivado sin ejecutarlas.
- [ ] Mantener deshabilitadas todas las salidas externas automáticas hasta que la Fase 6 esté implementada y conectada al flujo.
- [ ] Registrar estados por paciente y documento.
- [ ] Comparar resultados con `gestor_cardio` usando copias seguras.
- [ ] Mantener `gestor_cardio` intacto y operativo.

### Criterio para dar esta fase por terminada

- [ ] InformeReload v2 reproduce el flujo acordado con resultados equivalentes.
- [ ] El combinado se genera automáticamente sin volver a cargar manualmente ambos PDFs.
- [ ] Ningún correo, subida a Drive o archivado externo automático queda habilitado en esta fase.
- [ ] No se copiaron acoplamientos de Vital Norte al núcleo.
- [ ] El respaldo anterior sigue disponible y sin modificaciones.

## FASE 5 — Incorporar Clínica Delta

**Objetivo:** Agregar Delta utilizando únicamente el nuevo sistema configurable.

- [ ] Configurar `01 - PENDIENTES`.
- [ ] Configurar `02 - INFORMES LISTOS/COMBINADOS`.
- [ ] Configurar `02 - INFORMES LISTOS/SOLO INFORME MEDICO`.
- [ ] Configurar `03 - AWP PROCESADOS`.
- [ ] Mantener email y organización mensual/diaria desactivables.
- [ ] Generar internamente Solo Informe y combinado automático según la configuración de Delta.
- [ ] Preparar la organización y los destinos externos sin ejecutar envíos, subidas o archivado externo.
- [ ] Mantener deshabilitadas las salidas externas automáticas hasta que la Fase 6 esté implementada y conectada al flujo.
- [ ] Definir tratamiento de AWP excepcionales.
- [ ] Probar un paciente y un lote pequeño.
- [ ] Confirmar que Vital Norte no fue afectado.

### Criterio para dar esta fase por terminada

- [ ] Delta funciona mediante configuración, sin lógica duplicada.
- [ ] Los archivos internos quedan preparados para revisión sin salir a terceros.
- [ ] Ninguna salida externa automática queda habilitada en esta fase.
- [ ] Casos normales y excepcionales tienen trazabilidad.
- [ ] Regresiones de instituciones anteriores descartadas.

## FASE 6 — Bandeja de revisión y aprobación

**Objetivo:** Incorporar la bandeja de revisión y conectar al flujo la política `revision_modo`, garantizando que los errores críticos bloqueen siempre cualquier salida externa.

- [ ] Crear `PENDIENTE_REVISION` y transiciones válidas.
- [ ] Implementar `revision_modo = siempre` con aprobación obligatoria.
- [ ] Implementar `revision_modo = opcional` con decisión explícita al procesar.
- [ ] Implementar `revision_modo = nunca` con continuación directa sólo sin errores críticos.
- [ ] Crear un catálogo inicial de errores críticos y advertencias.
- [ ] Bloquear toda salida externa ante un error crítico, sin excepciones por modo.
- [ ] Mostrar paciente, institución, fecha y DNI disponible.
- [ ] Mostrar documentos y vista previa.
- [ ] Mostrar advertencias e inconsistencias.
- [ ] Aprobar, rechazar y devolver para corrección.
- [ ] Aprobar individualmente y por lote.
- [ ] Bloquear acciones externas de no aprobados.
- [ ] Habilitar las salidas externas preparadas en Fases 4 y 5 únicamente a través de este control conectado.
- [ ] Registrar responsable y momento cuando corresponda.
- [ ] Probar errores deliberados.

### Criterio para dar esta fase por terminada

- [ ] En modo `siempre`, ningún documento no aprobado puede salir a terceros.
- [ ] En modo `opcional`, la decisión de revisar o continuar queda registrada.
- [ ] En modo `nunca`, sólo pueden continuar estudios sin errores críticos.
- [ ] Ningún estudio con errores críticos puede salir a terceros en ningún modo.
- [ ] Todas las transiciones quedan registradas.
- [ ] Casos felices y errores deliberados fueron probados.

## FASE 7 — DNI y campos configurables

**Objetivo:** Leer y validar campos como `ID PACIENTE`/DNI según institución.

- [ ] Investigar la representación real de `ID PACIENTE` en AWP.
- [ ] Mapearlo a DNI sólo con evidencia.
- [ ] Incorporar campos configurables y extensibles.
- [ ] Vital Norte: DNI obligatorio.
- [ ] Clínica Delta: DNI opcional actualmente.
- [ ] DarMed: DNI opcional actualmente.
- [ ] Mostrar advertencias y bloqueos según reglas.
- [ ] Probar archivos con y sin el campo.

### Criterio para dar esta fase por terminada

- [ ] Extracción y validación están probadas con muestras seguras.
- [ ] Las reglas controlan advertencia, aprobación y envío.
- [ ] El diseño admite nuevos campos sin duplicar lógica.

## FASE 8 — Automatización Drive / Email / AWP

**Objetivo:** Automatizar acciones externas después de atravesar el control establecido por `revision_modo` y superar siempre las validaciones críticas.

- [ ] Procesar estudios autorizados por una transición válida de `revision_modo`.
- [ ] Rechazar cualquier estudio con errores críticos, incluso en modo `nunca`.
- [ ] Subir Solo Informe y combinado según configuración.
- [ ] Enviar email según configuración.
- [ ] Archivar AWP según configuración.
- [ ] Mover pendientes sólo después del éxito acordado.
- [ ] Implementar idempotencia y evitar duplicados.
- [ ] Registrar errores por acción y permitir reintentos.
- [ ] Mostrar resumen del lote.

### Criterio para dar esta fase por terminada

- [ ] Acciones externas son seguras, auditables e idempotentes.
- [ ] Fallos parciales no repiten acciones exitosas.
- [ ] Se probaron reintentos y duplicados.

## FASE 9 — DarMed y Consultorios Médicos

**Objetivo:** Agregar las demás instituciones sin duplicar lógica.

- [ ] Documentar el flujo real de DarMed.
- [ ] Configurar y probar DarMed.
- [ ] Documentar el flujo real de Consultorios Médicos.
- [ ] Configurar y probar Consultorios Médicos.
- [ ] Confirmar que no se necesitó lógica específica por nombre.
- [ ] Registrar nuevas capacidades necesarias.

### Criterio para dar esta fase por terminada

- [ ] Ambas instituciones funcionan por configuración.
- [ ] Las instituciones anteriores conservan su comportamiento.
- [ ] Pruebas y documentación completas.

## FASE 10 — Multidispositivo / despliegue

**Objetivo:** Evaluar y posteriormente implementar acceso seguro desde varias computadoras.

- [ ] Inventariar procesos locales y remotos.
- [ ] Definir cómo interactuar con ABPM y carpetas locales.
- [ ] Elegir persistencia compartida.
- [ ] Diseñar autenticación, permisos y auditoría.
- [ ] Diseñar almacenamiento seguro de documentos.
- [ ] Diseñar OAuth seguro por entorno/usuario.
- [ ] Evaluar servicio o agente local si fuera necesario.
- [ ] Diseñar backups, actualización y recuperación.
- [ ] Probar la arquitectura antes de migrar producción.

### Criterio para dar esta fase por terminada

- [ ] La arquitectura multidispositivo está decidida y probada.
- [ ] Seguridad, respaldo y recuperación están documentados.
- [ ] La migración preserva los flujos operativos validados.

# Decisiones de arquitectura

## 2026-08-29 — InformeReload es el producto principal

**Decisión:** Evolucionar InformeReload hacia InformeReload v2 con un Gestor integrado.

**Motivo:** InformeReload ya posee el núcleo de generación, parsing AWP, plantillas y herramientas PDF que deben rodear al nuevo Gestor.

**Consecuencias:** Las nuevas capacidades se diseñarán dentro de este repositorio y se validarán primero en `dev`.

## 2026-08-29 — gestor_cardio permanece intacto

**Decisión:** Usar `gestor_cardio` sólo como referencia y respaldo operativo.

**Motivo:** Su flujo de Vital Norte está probado, pero su implementación está acoplada a Windows, rutas y reglas específicas.

**Consecuencias:** No se refactoriza ni se copia `app.py`; se compararán comportamientos durante la Fase 4.

## 2026-08-29 — Evolución incremental dentro del stack actual

**Decisión:** Mantener inicialmente Node.js/Express y el frontend existente.

**Motivo:** Separar el riesgo funcional del riesgo de una migración tecnológica completa.

**Consecuencias:** El Gestor se añadirá como módulos aislados y cortes verticales pequeños.

## 2026-08-29 — Instituciones, capacidades y reglas configurables

**Decisión:** Las diferencias institucionales se representarán mediante configuración persistente.

**Motivo:** Evitar funciones y condicionales específicos por nombre.

**Consecuencias:** Backend y frontend deberán consumir una fuente institucional única.

## 2026-08-29 — Revisión flexible con bloqueo crítico universal

**Decisión:** Cada institución define `revision_modo` como `siempre`, `opcional` o `nunca`. Los errores críticos bloquean Drive, email, archivado externo y cualquier otra salida en todos los modos.

**Motivo:** Adaptar el nivel de intervención humana al flujo de cada institución sin debilitar las validaciones de seguridad.

**Consecuencias:** Estados, decisión de revisión, validaciones y auditoría forman parte del dominio central. El modo `nunca` no equivale a ignorar errores.

## 2026-08-29 — ABPM continúa externo y manual

**Decisión:** No automatizar ABPM durante las primeras fases.

**Motivo:** No es necesario para construir el núcleo del Gestor y tiene dependencias locales propias.

**Consecuencias:** Los AWP y PDF `-P` siguen siendo entradas del sistema.

## 2026-08-29 — PDFtk no se migra al nuevo núcleo

**Decisión:** Reutilizar conceptualmente la combinación del Gestor, pero conservar `pdf-lib` en InformeReload.

**Motivo:** `pdf-lib` ya resuelve la unión sin dependencia binaria local.

**Consecuencias:** PDFtk queda sólo como dependencia del respaldo actual.

## 2026-08-29 — SQLite local detrás de Repository

**Decisión:** Utilizar Prisma con SQLite durante la Fase 1 local y encapsular todo acceso detrás del patrón Repository.

**Motivo:** Permite incorporar persistencia mínima ahora sin acoplar rutas o servicios a la base que será reemplazada más adelante.

**Consecuencias:** Sólo el adaptador Prisma y el esquema conocen SQLite. La futura migración a PostgreSQL deberá implementar el mismo contrato. Cada institución posee un `id` estable; `name` es editable y único. El modelo registra además `createdAt` y `updatedAt`.

## 2026-08-30 — PostgreSQL unificado en todos los entornos

**Decisión:** Reemplazar SQLite local por PostgreSQL mediante Docker Compose y utilizar PostgreSQL también en Railway Dev y producción futura.

**Motivo:** El módulo se encuentra en una etapa temprana y unificar el motor permite mantener un solo schema Prisma, un solo historial de migraciones y reproducir localmente el comportamiento del despliegue.

**Consecuencias:** La decisión anterior de SQLite queda reemplazada. Las migraciones SQLite dejan de ser el historial activo; desarrollo y pruebas usan bases PostgreSQL locales separadas. El contrato Repository y la lógica funcional permanecen sin conocimiento del motor. Railway no se configura hasta completar la validación local.

## 2026-08-29 — Separar procesamiento interno de salidas externas

**Decisión:** Las Fases 4 y 5 pueden implementar asociación, organización, Solo Informe, combinado y preparación de destinos, pero no ejecutar automáticamente Drive, email ni archivado externo.

**Motivo:** La protección definida por `revision_modo` sólo es efectiva cuando la bandeja y sus transiciones están realmente conectadas al procesamiento.

**Consecuencias:** Las salidas externas se habilitan después de implementar la Fase 6 y se automatizan en la Fase 8.

## 2026-08-29 — Generación automática del PDF combinado

**Decisión:** El Gestor debe asociar el PDF `-P` con el informe médico y producir automáticamente el combinado, agregando carátula cuando corresponda.

**Motivo:** Eliminar la recarga manual de ambos documentos en la herramienta de unión y reducir errores operativos.

**Consecuencias:** La asociación debe validarse; una inconsistencia fuerte entre archivos se considera error crítico. La herramienta manual se conserva temporalmente como respaldo.

# Problemas y pendientes detectados

- [ ] El roadmap anterior `ROADMAP_GESTOR_CARDIO.md` refleja un objetivo reemplazado.
  - Impacto: Puede confundir a futuros asistentes.
  - Posible solución: Conservarlo sin borrar por ahora y declarar este archivo como única hoja de ruta oficial; archivar o eliminar sólo con autorización.
  - Fase relacionada: Fase 0.

- [ ] La configuración institucional está duplicada entre backend, HTML y JavaScript.
  - Impacto: Una institución puede aparecer en un flujo y faltar en otro.
  - Posible solución: Fuente única de configuración y renderizado dinámico.
  - Fase relacionada: Fases 1 y 2.

- [ ] No existe persistencia central para estudios, revisiones, aprobaciones y acciones.
  - Impacto: No hay trazabilidad ni soporte real multidispositivo.
  - Posible solución: Definir contratos y elegir persistencia mínima antes del primer flujo durable.
  - Fase relacionada: Fases 1 y 6.

- [ ] La API actual no tiene autenticación y usa CORS abierto.
  - Impacto: Riesgo alto si se exponen datos o acciones externas.
  - Posible solución: Diseñar seguridad antes de habilitar el Gestor fuera del entorno controlado.
  - Fase relacionada: Fases 6, 8 y 10.

- [ ] Existen PDFs de prueba y salidas DOCX dentro del repositorio.
  - Impacto: Pueden contener datos clínicos y aumentar el riesgo de exposición.
  - Posible solución: Auditar, reemplazar por fixtures sintéticos y corregir `.gitignore`, sin borrar automáticamente.
  - Fase relacionada: Fase 1.

- [ ] `npm test` no ejecuta una suite real.
  - Impacto: Las regresiones dependen de pruebas manuales dispersas.
  - Posible solución: Crear una suite pequeña para contratos críticos antes de refactorizar.
  - Fase relacionada: Fase 1.

- [ ] `crearInforme.js` contiene una función y exportación duplicadas.
  - Impacto: Confusión de mantenimiento y riesgo al modificar el archivo.
  - Posible solución: Corregir sólo dentro de una tarea acotada con pruebas de regresión.
  - Fase relacionada: Fase 1.

- [ ] Hay mensajes AWP con codificación dañada.
  - Impacto: Respuestas y errores pueden mostrarse incorrectamente.
  - Posible solución: Normalizar UTF-8 con pruebas de contrato.
  - Fase relacionada: Fase 1.

- [ ] La estrategia de identidad e idempotencia por paciente/documento no está definida.
  - Impacto: Riesgo de duplicados, asociaciones erróneas o reenvíos.
  - Posible solución: Definir clave estable y huella de archivo antes de automatizar.
  - Fase relacionada: Fases 1, 4 y 8.

- [ ] No se verificó todavía dónde está `ID PACIENTE` dentro del AWP.
  - Impacto: No puede implementarse DNI de manera confiable.
  - Posible solución: Investigar con muestras seguras en Fase 7.
  - Fase relacionada: Fase 7.

- [ ] El frontend todavía mantiene tarjetas institucionales hardcodeadas.
  - Impacto: La base es la fuente oficial del backend, pero las instituciones nuevas aún no aparecen automáticamente en la interfaz.
  - Posible solución: Incorporar lectura y renderizado dinámico del frontend en una tarea posterior explícitamente autorizada.
  - Fase relacionada: Fases 1 y 2.

# Pruebas realizadas

## Fase 0 — 2026-08-29

- [x] Prueba: Confirmar rama de trabajo de InformeReload.
  - Resultado: `dev`, alineada inicialmente con `origin/dev` al comenzar el análisis.
  - Observaciones: No se hizo commit, push ni despliegue.

- [x] Prueba: Inventario de archivos y módulos de InformeReload.
  - Resultado: Frontend, backend, rutas, funciones, configuración, plantillas, scripts y despliegue identificados.
  - Observaciones: Se excluyó el contenido de outputs clínicos del análisis.

- [x] Prueba: Inventario de `gestor_cardio`.
  - Resultado: Componentes, endpoints, flujo local, Drive, Gmail y dependencias identificados.
  - Observaciones: No se leyó el contenido de `credentials.json` ni `token.json`.

- [x] Prueba: Verificación de alcance.
  - Resultado: Sólo se agregó este documento Markdown.
  - Observaciones: No se modificó código funcional, configuración, credenciales ni archivos de ambos proyectos.

- [ ] Prueba: Línea base funcional de InformeReload.
  - Resultado: Parcial; la línea base sintética de instituciones, informes y carátulas pasó. Los flujos manuales completos siguen pendientes.
  - Observaciones: No se utilizaron PDFs ni AWP reales.

## Fase 1 — 2026-08-29

- [x] Prueba: Migración y seed local de instituciones.
  - Resultado: La migración creó `Institution` y el seed idempotente cargó las cuatro instituciones actuales.
  - Observaciones: SQLite permanece local e ignorado por Git.

- [x] Prueba: Endpoints mínimos de instituciones.
  - Resultado: `GET`, `POST` y `PUT` pasaron con una base SQLite temporal aislada.
  - Observaciones: Se probaron listado, creación, edición por ID estable, cambio de nombre y rechazo de nombres duplicados.

- [x] Prueba: Compatibilidad de generación por institución.
  - Resultado: Las cuatro plantillas generaron buffers DOCX válidos con un paciente completamente sintético.
  - Observaciones: No se activó ninguna validación de DNI.

- [x] Prueba: Compatibilidad de carátulas.
  - Resultado: Consultorios Médicos, DarMed e Instituto Delta conservan carátula; Vital Norte permanece sin carátula.
  - Observaciones: El nombre físico de cada carátula sigue en el mapa de compatibilidad existente porque el modelo mínimo no incluye `coverTemplate`.

- [x] Prueba: Sintaxis JavaScript de todos los archivos tocados.
  - Resultado: Sin errores.
  - Observaciones: Validación ejecutada con `node --check`.

- [x] Prueba: Modos de captura de DNI por institución.
  - Resultado: Suite automatizada 7/7 aprobada y validación manual satisfactoria de DNI automático desde AWP y DNI ingresado manualmente.
  - Observaciones: Consultorios Médicos usa `OPTIONAL`, Vital Norte `AWP`, DarMed e Instituto Delta `MANUAL`; no quedaron trazas temporales con datos de pacientes.

## Fase 1 — 2026-08-30

- [x] Prueba: Validación estática del schema PostgreSQL unificado.
  - Resultado: `prisma validate` aprobó y `prisma migrate diff` produjo una definición equivalente del modelo `Institution`.
  - Observaciones: El historial activo contiene una única migración inicial PostgreSQL.

- [x] Prueba: Migración, seed y suite de integración sobre PostgreSQL local.
  - Resultado: Migración inicial aplicada, seed correcto y suite automatizada 7/7 aprobada sobre `informes_reload_test`.
  - Observaciones: Docker Desktop 29.7.2 y Compose 5.4.0; las cuatro instituciones persistieron después de reiniciar el contenedor. Por un PostgreSQL preexistente en Windows se utilizó el puerto `55432` únicamente en el `.env` local ignorado; el código y la configuración compartida conservan el puerto predeterminado y Railway dependerá de `DATABASE_URL`.

# Definition of Done general

Una fase sólo termina cuando:

- [ ] La implementación acordada está completa.
- [ ] La aplicación arranca en desarrollo.
- [ ] Los flujos anteriores siguen funcionando.
- [ ] Las pruebas manuales y automáticas pertinentes fueron ejecutadas.
- [ ] Los resultados están registrados.
- [ ] Los errores importantes fueron corregidos o aceptados mediante decisión explícita.
- [ ] El checklist, las decisiones y los pendientes están actualizados.
- [ ] No se usaron datos reales de pacientes en endpoints públicos.
- [ ] Cualquier promoción fuera de `dev` fue autorizada y verificada por separado.

# Historial de actualizaciones

## 2026-09-01

- [x] Se instaló y verificó Docker Desktop con el engine activo.
- [x] Se aplicó la migración PostgreSQL inicial y se ejecutó el seed de las cuatro instituciones.
- [x] La suite de integración PostgreSQL fue aprobada 7/7.
- [x] Se comprobó persistencia de migraciones e instituciones después de reiniciar el contenedor.
- [x] El puerto alternativo `55432` quedó limitado a configuración local ignorada y no afecta Railway.

## 2026-08-30

- [x] Se aprobó PostgreSQL como motor único para local, Railway Dev y producción futura.
- [x] Se creó `feature/postgresql-unificado` desde `dev` actualizado.
- [x] Se preparó Docker Compose con bases separadas de desarrollo y pruebas y volumen persistente local.
- [x] Se reemplazó el historial SQLite activo por una migración inicial PostgreSQL.
- [x] Se retiró del repository la creación de tablas específica de SQLite.
- [x] La validación local completa se realizó posteriormente el 2026-09-01.

## 2026-08-29

- [x] Se corrigió el objetivo principal: InformeReload v2 es el producto a evolucionar.
- [x] Se dejó `gestor_cardio` fuera del alcance de modificación.
- [x] Se completó el análisis técnico de Fase 0.
- [x] Se propuso la arquitectura mínima y el plan exacto de Fase 1.
- [x] Se creó la nueva hoja de ruta oficial.
- [x] Se incorporó `revision_modo` con valores `siempre`, `opcional` y `nunca`.
- [x] Se estableció el bloqueo universal de salidas ante errores críticos.
- [x] Se separó el procesamiento interno de Fases 4 y 5 de las salidas externas posteriores a Fase 6.
- [x] Se agregó la generación automática del combinado como objetivo funcional explícito.
- [x] Se autorizó el inicio acotado de la Fase 1.
- [x] Se creó `feature/instituciones-v1` desde `dev` sin modificar producción.
- [x] Se incorporó Prisma con SQLite detrás del patrón Repository.
- [x] Se creó el modelo mínimo `Institution` y luego se incorporó `id` estable como clave primaria.
- [x] Se dejó `name` como campo editable y único, y se agregaron `createdAt` y `updatedAt`.
- [x] Se agregaron seed y endpoints backend de listado, creación y edición.
- [x] Se migró la lectura backend desde el objeto institucional hardcodeado hacia la base local.
- [x] Se mantuvo el frontend sin cambios y no se activaron reglas de DNI.
- [x] Se incorporó `dniMode`: Vital Norte `AWP`, DarMed e Instituto Delta `MANUAL`, Consultorios Médicos `OPTIONAL`.
- [x] Se agregó el diálogo manual condicionado por `dniMode` y se mantuvo la decisión validada también en backend.
- [x] Se validaron manualmente los flujos de DNI automático y manual antes de preparar la integración a `dev`.
