# 📚 ÍNDICE DE DOCUMENTACIÓN
## Asistente Contable Inteligente

Aquí encontrarás toda la documentación relevante para entender, configurar y extender el Asistente Contable Inteligente.

---

## 📋 DOCUMENTOS PRINCIPALES

### Configuración Inicial

-   **[GUÍA DE CONFIGURACIÓN DE LA BASE DE DATOS SUPABASE (DATABASE-SETUP.md)](DATABASE-SETUP.md)**
    -   Instrucciones paso a paso para crear y configurar tu base de datos PostgreSQL en Supabase. Incluye el script SQL completo para tablas, funciones, triggers, RLS y vistas.

-   **[GUÍA DE CONFIGURACIÓN DE N8N (N8N-SETUP.md)](N8N-SETUP.md)**
    -   Guía completa para configurar n8n, incluyendo cómo generar el token de API, configurar credenciales y entender la arquitectura del sistema.

---

## 🔄 DOCUMENTACIÓN DE FLUJOS DE N8N

### Flujo Principal

-   **[FLUJO PRINCIPAL - Coordinador (N8N-FLUJO-PRINCIPAL.md)](N8N-FLUJO-PRINCIPAL.md)**
    -   Documentación completa del flujo coordinador que recibe mensajes de Telegram y los enruta a los subflujos correspondientes.

### Subflujos

-   **[SUBFLUJO: CREAR TRANSACCIÓN (N8N-SUBFLUJO-CREAR-TRANSACCION.md)](N8N-SUBFLUJO-CREAR-TRANSACCION.md)**
    -   Documentación del subflujo que crea transacciones financieras desde mensajes de texto.

-   **[SUBFLUJO: CONSULTAS (N8N-SUBFLUJO-CONSULTAS.md)](N8N-SUBFLUJO-CONSULTAS.md)**
    -   Documentación del subflujo que consulta transacciones existentes según filtros.

-   **[SUBFLUJO: CREAR ASIENTO CONTABLE (N8N-SUBFLUJO-CREAR-ASIENTO.md)](N8N-SUBFLUJO-CREAR-ASIENTO.md)**
    -   Documentación del subflujo que crea asientos contables desde extractos bancarios PDF.

---

## 🤖 PROMPTS DEL SISTEMA PARA AGENTES IA

**⚠️ IMPORTANTE:** Estos prompts son archivos separados que debes copiar y pegar directamente en n8n. Son necesarios para que los Agentes IA funcionen correctamente.

-   **[PROMPT DEL SISTEMA PARA EL AGENTE N8N (N8N-AGENT-PROMPT.md)](N8N-AGENT-PROMPT.md)**
    -   El prompt principal para el Agente IA que procesa mensajes de Telegram para crear o consultar transacciones.
    -   **Uso:** Copia el contenido completo y pégalo en el campo "System Message" del nodo AI Agent del flujo principal.

-   **[PROMPT DEL SISTEMA PARA AGENTE N8N - PROCESADOR DE EXTRACTOS BANCARIOS (N8N-AGENT-PROMPT-ASIENTOS.md)](N8N-AGENT-PROMPT-ASIENTOS.md)**
    -   Prompt específico para el Agente IA encargado de procesar extractos bancarios y crear asientos contables universales automáticamente.
    -   **Uso:** Copia el contenido completo y pégalo en el campo "System Message" del nodo AI Agent1 que procesa PDFs.

---

## 📊 ESQUEMA DE LA BASE DE DATOS

-   **[DOCUMENTACIÓN COMPLETA DE LA BASE DE DATOS (DATABASE-SCHEMA.md)](DATABASE-SCHEMA.md)**
    -   Descripción detallada de todas las tablas, columnas, índices, relaciones, políticas RLS, funciones y triggers de la base de datos.

---

## 🔒 AUDITORÍA DE SEGURIDAD

-   **[INFORME DE AUDITORÍA DE SEGURIDAD (SECURITY-AUDIT.md)](../SECURITY-AUDIT.md)**
    -   Resumen de la auditoría de seguridad realizada, incluyendo la eliminación de credenciales hardcodeadas y la verificación de variables de entorno.

---

## 📜 REGISTRO DE CAMBIOS

-   **[REGISTRO DE CAMBIOS Y AUDITORÍA (CHANGELOG-AUDIT.md)](../CHANGELOG-AUDIT.md)**
    -   Un registro detallado de todos los cambios realizados durante el proceso de limpieza y preparación del proyecto para su publicación.

---

## 🚀 Inicio Rápido

1. **Configura la base de datos:** Sigue [DATABASE-SETUP.md](DATABASE-SETUP.md)
2. **Configura n8n:** Sigue [N8N-SETUP.md](N8N-SETUP.md)
3. **Configura los flujos:** Sigue la documentación de cada flujo:
   - [N8N-FLUJO-PRINCIPAL.md](N8N-FLUJO-PRINCIPAL.md)
   - [N8N-SUBFLUJO-CREAR-TRANSACCION.md](N8N-SUBFLUJO-CREAR-TRANSACCION.md)
   - [N8N-SUBFLUJO-CONSULTAS.md](N8N-SUBFLUJO-CONSULTAS.md)
   - [N8N-SUBFLUJO-CREAR-ASIENTO.md](N8N-SUBFLUJO-CREAR-ASIENTO.md)

---

**¿Necesitas ayuda?** Revisa la documentación específica del flujo que estás configurando o consulta los logs de n8n y tu aplicación para diagnosticar problemas.
