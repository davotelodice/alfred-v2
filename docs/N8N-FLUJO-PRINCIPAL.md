# 🔄 FLUJO PRINCIPAL - Coordinador de n8n
## Asistente Contable Inteligente

**Propósito:** Este es el flujo coordinador que recibe mensajes de Telegram y los enruta a los subflujos correspondientes según el tipo de mensaje (texto, audio o PDF).

---

## 📋 Descripción General

El flujo principal actúa como el punto de entrada del sistema. Recibe todos los mensajes de Telegram y los procesa según su tipo:

- **Mensajes de texto:** Se analizan con un Agente IA para determinar si el usuario quiere CREAR una transacción o CONSULTAR transacciones existentes
- **Mensajes de audio:** Se transcriben a texto y luego se procesan como mensajes de texto
- **Documentos PDF:** Se extrae el texto y se procesa como extracto bancario para crear asientos contables

---

## 🔧 Configuración de Nodos

### 1. Telegram Trigger

**Tipo:** `n8n-nodes-base.telegramTrigger`

**Configuración:**
- **Credential:** `Alfred Aux Bot` (credencial de Telegram Bot API)
- **Updates:** `message`
- **Webhook ID:** Se genera automáticamente

**Función:** Recibe todos los mensajes entrantes del bot de Telegram.

---

### 2. Switch

**Tipo:** `n8n-nodes-base.switch`

**Configuración:** Tres salidas según el tipo de mensaje:

**Salida 1 - Texto:**
- Condición: `{{ $json.message.text }}` existe

**Salida 2 - Audio:**
- Condición: `{{ $json.message.voice.mime_type }}` existe

**Salida 3 - PDF:**
- Condición: `{{ $json.message.document.mime_type }}` existe

**Función:** Separa los mensajes según su tipo para procesarlos de manera diferente.

---

### 3. Edit Fields (Para mensajes de texto)

**Tipo:** `n8n-nodes-base.set`

**Configuración:**
- **Asignación:**
  - `text`: `={{ $json.message.text }}`

**Función:** Extrae el texto del mensaje para enviarlo al Agente IA.

---

### 4. Telegram (Para audio)

**Tipo:** `n8n-nodes-base.telegram`

**Configuración:**
- **Resource:** `file`
- **File ID:** `={{ $('Telegram Trigger').item.json.message.voice.file_id }}`
- **Credential:** `Alfred Aux Bot`

**Función:** Descarga el archivo de audio de Telegram.

---

### 5. OpenAI (Transcripción de audio)

**Tipo:** `@n8n/n8n-nodes-langchain.openAi`

**Configuración:**
- **Resource:** `audio`
- **Operation:** `transcribe`
- **Credential:** `OpenAi account`

**Función:** Transcribe el audio a texto para procesarlo como mensaje de texto.

---

### 6. Get a file2 (Para PDF)

**Tipo:** `n8n-nodes-base.telegram`

**Configuración:**
- **Resource:** `file`
- **File ID:** `={{ $json.message.document.file_id }}`
- **Credential:** `Alfred Aux Bot`

**Función:** Descarga el archivo PDF de Telegram.

---

### 7. Extract from File (Para PDF)

**Tipo:** `n8n-nodes-base.extractFromFile`

**Configuración:**
- **Operation:** `pdf`

**Función:** Extrae el texto del PDF.

---

### 8. Code in JavaScript2 (Divisor de extractos)

**Tipo:** `n8n-nodes-base.code`

**Código:**
```javascript
// 🧩 Divisor Inteligente V4 - 5 transacciones por bloque sin cortar líneas
// Crea bloques de texto manejables para IA, manteniendo transacciones completas.

const text = $input.first().json.text || '';
const MAX_TX_PER_BLOCK = 5;       // ✅ Máximo 5 transacciones por bloque
const MAX_CHARS_PER_BLOCK = 7000; // Límite de tamaño (seguridad extra)

// Detecta inicios de transacciones: "dd/mm dd/mm" con patrón español
const lines = text.split(/\s(?=\d{2}\/\d{2}\s\d{2}\/\d{2}\s)/g);

let currentBlock = '';
let txCount = 0;
let charCount = 0;
const blocks = [];

for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed === '') continue;

  // Detectar transacción válida (tiene fechas e importe)
  const isTransaction =
    /\d{2}\/\d{2}\s\d{2}\/\d{2}/.test(trimmed) && /-?\d{1,3}[.,]\d{2}/.test(trimmed);

  if (isTransaction) txCount++;

  currentBlock += trimmed + ' ';
  charCount += trimmed.length + 1;

  // Si alcanzamos los límites → cerramos bloque
  if (txCount >= MAX_TX_PER_BLOCK || charCount >= MAX_CHARS_PER_BLOCK) {
    blocks.push(currentBlock.trim());
    currentBlock = '';
    txCount = 0;
    charCount = 0;
  }
}

// Si queda texto pendiente al final → último bloque
if (currentBlock.trim() !== '') {
  blocks.push(currentBlock.trim());
}

// Generamos un item por bloque
return blocks.map((block, index) => ({
  json: {
    part: index + 1,
    total_parts: blocks.length,
    text_fragment: block
  }
}));
```

**Función:** Divide extractos bancarios grandes en bloques de máximo 5 transacciones para procesarlos eficientemente.

---

### 9. Code in JavaScript1 (Limpieza de texto PDF)

**Tipo:** `n8n-nodes-base.code`

**Código:**
```javascript
// Limpieza de texto PDF extraído
// Elimina saltos de línea innecesarios, espacios duplicados, caracteres no imprimibles
// y deja el texto listo para usar por un agente o LLM.

return $input.all().map(item => {
  const raw = $input.first().json.text_fragment || '';

  // Normalización básica del texto
  const cleanText = raw
    .replace(/\r?\n+/g, ' ')      // Reemplaza saltos de línea por espacio
    .replace(/\s{2,}/g, ' ')      // Reduce espacios múltiples
    .replace(/[^\x20-\x7EÀ-ÿ€ñÑ.,:;()\-/]/g, '') // Elimina caracteres no imprimibles
    .trim();                      // Quita espacios al inicio y fin

  return {
    json: {
      text_clean: cleanText
    }
  };
});
```

**Función:** Limpia el texto extraído del PDF eliminando caracteres especiales y normalizando espacios.

---

### 10. Loop Over Items1 (Procesar bloques de extracto)

**Tipo:** `n8n-nodes-base.splitInBatches`

**Configuración:** Procesa cada bloque del extracto de forma secuencial.

**Función:** Itera sobre cada bloque de transacciones del extracto para procesarlas una por una.

---

### 11. Set (Preparar datos para procesamiento de extracto)

**Tipo:** `n8n-nodes-base.set`

**Configuración:**
- **Asignaciones:**
  - `información del estado de cuenta`: `={{ $json.text_clean }}`
  - `chat_id`: `={{ $('Telegram Trigger').item.json.message.chat.id }}`

**Función:** Prepara los datos del extracto y el chat_id para el Agente IA que procesa extractos.

---

### 12. AI Agent (Para mensajes de texto)

**Tipo:** `@n8n/n8n-nodes-langchain.agent`

**Configuración:**
- **Model:** `gpt-5` (o `gpt-4o`)
- **System Message:** Copia el prompt completo de `docs/N8N-AGENT-PROMPT.md`
- **Text:** `={{ $json.text }}`
- **Tools disponibles:**
  - `CREAR TRANSACCIÓN` (subflujo)
  - `Call 'CONSULTAS'` (subflujo)
  - `Date & Time` (para obtener fechas)
  - `Calculator` (para cálculos simples)

**Memory:** `Postgres Chat Memory`
- **Table:** `asistente_contable`
- **Session Key:** `={{ $('Switch').item.json.message.chat.id }}`
- **Credential:** `Postgres online`

**Función:** Analiza el mensaje del usuario y determina si quiere CREAR o CONSULTAR transacciones, luego llama al subflujo correspondiente.

---

### 13. AI Agent1 (Para procesar extractos PDF)

**Tipo:** `@n8n/n8n-nodes-langchain.agent`

**Configuración:**
- **Model:** `gpt-4o` (recomendado para procesamiento de extractos)
- **System Message:** Copia el prompt completo de `docs/N8N-AGENT-PROMPT-ASIENTOS.md`
- **Text:** `informacion del estado de cuneta:{{ $json['información del estado de cuenta'] }}\nchat id: {{ $json.chat_id }}`
- **Tools disponibles:**
  - `Call 'CREAR ASIENTO CONTABLE'` (subflujo)

**Language Models:**
- `OpenAI Chat Model1` (gpt-5)
- `OpenAI Chat Model2` (gpt-4o)

**Función:** Procesa extractos bancarios, extrae transacciones y crea asientos contables automáticamente.

---

### 14. Code in JavaScript (Formatear respuesta)

**Tipo:** `n8n-nodes-base.code`

**Código:**
```javascript
const inputData = $input.all();

const results = inputData.map(item => {
  let textoRaw = item.json.output;
  let textoPlano = "";

  try {
    // Si el texto es un string JSON válido, lo parseamos
    const parsed = JSON.parse(textoRaw);

    // Construimos string plano SIN \n
    textoPlano = 
      `Descripción: ${parsed.descripcion} - ` +
      `Monto: ${parsed.monto} - ` +
      `Tipo: ${parsed.tipo} - ` +
      `Fecha: ${parsed.fecha}`;
  } catch (err) {
    // Si no es parseable, limpiamos caracteres escapados y eliminamos saltos
    textoPlano = textoRaw
      .replace(/\\n/g, ' ')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, '\\')
      .replace(/\s+/g, ' ') // remover múltiples espacios o saltos
      .trim();
  }

  return {
    json: {
      output: textoPlano
    }
  };
});

return results;
```

**Función:** Limpia y formatea la respuesta del Agente IA antes de enviarla a Telegram.

---

### 15. Telegram1 (Enviar respuesta)

**Tipo:** `n8n-nodes-base.telegram`

**Configuración:**
- **Resource:** `sendMessage`
- **Chat ID:** `={{ $('Telegram Trigger').item.json.message.chat.id }}`
- **Text:** `={{ $json.output }}`
- **Credential:** `Alfred Aux Bot`

**Función:** Envía la respuesta final al usuario en Telegram.

---

### 16. Edit Fields1 (Respuesta de extractos)

**Tipo:** `n8n-nodes-base.set`

**Configuración:**
- **Asignación:**
  - `output`: `Asientos registrados exitosamente`

**Función:** Prepara el mensaje de confirmación después de procesar un extracto bancario.

---

## 🔗 Conexiones entre Nodos

```
Telegram Trigger → Switch
  ├─ (texto) → Edit Fields → AI Agent → Code in JavaScript → Telegram1
  ├─ (audio) → Telegram → OpenAI → AI Agent → Code in JavaScript → Telegram1
  └─ (PDF) → Get a file2 → Extract from File → Code in JavaScript2 → Code in JavaScript1 → Loop Over Items1
                └─ Set → AI Agent1 → Loop Over Items1 → Edit Fields1 → Telegram1
```

---

## 🛠️ Tools del Agente IA

### CREAR TRANSACCIÓN

**Tipo:** `@n8n/n8n-nodes-langchain.toolWorkflow`

**Workflow:** Subflujo "CREAR TRANSACCIÓN"

**Inputs mapeados:**
- `chat_id`: `={{ $fromAI('chat_id', '', 'string') }}`
- `telefono`: `={{ $fromAI('telefono', '', 'string') }}`
- `tipo`: `={{ $fromAI('tipo', '', 'string') }}`
- `monto`: `={{ $fromAI('monto', '', 'number') }}`
- `descripcion`: `={{ $fromAI('descripcion', '', 'string') }}`
- `fecha`: `={{ $fromAI('fecha', '', 'string') }}`
- `metodo_pago`: `={{ $fromAI('metodo_pago', '', 'string') }}`

**Función:** Crea una nueva transacción financiera.

---

### Call 'CONSULTAS'

**Tipo:** `@n8n/n8n-nodes-langchain.toolWorkflow`

**Workflow:** Subflujo "CONSULTAS"

**Inputs:** Se pasan automáticamente desde el Agente IA

**Función:** Consulta transacciones existentes según filtros.

---

### Call 'CREAR ASIENTO CONTABLE'

**Tipo:** `@n8n/n8n-nodes-langchain.toolWorkflow`

**Workflow:** Subflujo "CREAR ASIENTO CONTABLE"

**Inputs mapeados:**
- `chat_id`: `={{ $fromAI('chat_id', '', 'string') }}`
- `fecha`: `={{ $fromAI('fecha', '', 'string') }}`
- `descripcion`: `={{ $fromAI('descripcion', '', 'string') }}`
- `tipo_movimiento`: `={{ $fromAI('tipo_movimiento', '', 'string') }}`
- `categoria_contable`: `={{ $fromAI('categoria_contable', '', 'string') }}`
- `monto`: `={{ $fromAI('monto', '', 'number') }}`
- `moneda`: `={{ $fromAI('moneda', '', 'string') }}`
- `cuenta_origen`: `={{ $fromAI('cuenta_origen', '', 'string') }}`
- `cuenta_destino`: `={{ $fromAI('cuenta_destino', '', 'string') }}`
- `saldo_posterior`: `={{ $fromAI('saldo_posterior', '', 'number') }}`
- `referencia`: `={{ $fromAI('referencia', '', 'string') }}`
- `fuente_datos`: `={{ $fromAI('fuente_datos', '', 'string') }}`
- `telefono`: `={{ $fromAI('telefono', '', 'string') }}`

**Función:** Crea un asiento contable desde un extracto bancario.

---

## 📝 Prompts del Sistema

**⚠️ IMPORTANTE:** Los prompts son archivos separados que debes copiar y pegar directamente en n8n. No están duplicados en este documento para evitar confusión.

### Para Mensajes de Texto (AI Agent)

1. Abre el archivo `docs/N8N-AGENT-PROMPT.md`
2. Copia TODO el contenido de la sección "📋 PROMPT DEL SISTEMA (COMPLETO)"
3. Pega el prompt completo en el campo **System Message** del nodo **AI Agent** (nodo 12)

**Archivo:** `docs/N8N-AGENT-PROMPT.md`

### Para Extractos Bancarios (AI Agent1)

1. Abre el archivo `docs/N8N-AGENT-PROMPT-ASIENTOS.md`
2. Copia TODO el contenido del prompt (es muy largo, asegúrate de copiarlo completo)
3. Pega el prompt completo en el campo **System Message** del nodo **AI Agent1** (nodo 13)

**Archivo:** `docs/N8N-AGENT-PROMPT-ASIENTOS.md`

**¿Por qué archivos separados?** Los prompts son muy largos (600+ y 800+ líneas) y contienen toda la lógica del Agente IA. Se mantienen en archivos separados para facilitar su copia y pegado en n8n.

---

## ✅ Verificación

### Probar con Mensaje de Texto

Envía a Telegram:
```
Gasté 50 euros en supermercado
```

**Resultado esperado:** El bot responde confirmando que la transacción fue creada.

### Probar con Audio

Envía un mensaje de voz a Telegram.

**Resultado esperado:** El bot transcribe el audio y procesa el mensaje como texto.

### Probar con PDF

Envía un PDF de extracto bancario a Telegram.

**Resultado esperado:** El bot procesa el extracto y crea asientos contables automáticamente.

---

## 🔧 Troubleshooting

### Error: "Usuario no registrado"

**Causa:** El `chat_id` no está vinculado a ningún usuario.

**Solución:** El usuario debe registrarse en el dashboard web y vincular su `telegram_chat_id` en el perfil.

### Error: "No se recibió respuesta de OpenAI"

**Causa:** Problema con la API de OpenAI o créditos insuficientes.

**Solución:** Verifica tu cuenta de OpenAI y los créditos disponibles.

---

## 📚 Documentación Relacionada

- **[N8N-SUBFLUJO-CREAR-TRANSACCION.md](N8N-SUBFLUJO-CREAR-TRANSACCION.md)**: Documentación del subflujo de crear transacción
- **[N8N-SUBFLUJO-CONSULTAS.md](N8N-SUBFLUJO-CONSULTAS.md)**: Documentación del subflujo de consultas
- **[N8N-SUBFLUJO-CREAR-ASIENTO.md](N8N-SUBFLUJO-CREAR-ASIENTO.md)**: Documentación del subflujo de crear asiento contable
- **[N8N-AGENT-PROMPT.md](N8N-AGENT-PROMPT.md)**: Prompt del sistema para mensajes de texto
- **[N8N-AGENT-PROMPT-ASIENTOS.md](N8N-AGENT-PROMPT-ASIENTOS.md)**: Prompt del sistema para extractos bancarios

