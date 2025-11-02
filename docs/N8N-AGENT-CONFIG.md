# 🤖 CONFIGURACIÓN DEL AGENTE N8N
## Para Asistente Contable Inteligente

**Última actualización:** 2024-10-23  
**Propósito:** Configurar un agente inteligente en n8n que pueda interactuar con la base de datos PostgreSQL del Asistente Contable

---

## 📋 ÍNDICE

1. [Descripción General](#descripción-general)
2. [Opciones de Conexión](#opciones-de-conexión)
3. [Configuración del Agente](#configuración-del-agente)
4. [Capacidades del Agente](#capacidades-del-agente)
5. [Prompts del Agente](#prompts-del-agente)
6. [Queries Disponibles](#queries-disponibles)
7. [Ejemplos de Uso](#ejemplos-de-uso)
8. [Workflow de n8n](#workflow-de-n8n)

---

## 🎯 DESCRIPCIÓN GENERAL

Este documento describe cómo configurar un agente inteligente en n8n que pueda:
- **Agregar** transacciones a la base de datos
- **Modificar** transacciones existentes
- **Eliminar** transacciones
- **Consultar** datos financieros (sumatoria de gastos, ingresos, por fechas, etc.)
- **Entender** la estructura de las tablas y sus relaciones

### El Agente Necesita Entender:

1. **Tablas del Sistema:**
   - `contable_users` - Usuarios
   - `contable_transactions` - Transacciones
   - `contable_kpi_summary` - KPIs calculados
   - `contable_categories` - Categorías
   - `contable_accounts` - Cuentas bancarias

2. **Relaciones:**
   - Cada transacción está asociada a un usuario (`user_id`)
   - Las transacciones pueden tener categorías y cuentas
   - Los KPIs se calculan automáticamente por período

3. **Formatos:**
   - Fechas: `YYYY-MM-DD` (ej: `2024-10-23`)
   - Períodos: `YYYY-MM` (ej: `2024-10`)
   - Tipos: `ingreso`, `gasto`, `inversion`, `ahorro`, `transferencia`

---

## 🔌 OPCIONES DE CONEXIÓN

### Opción 1: PostgreSQL Directo (Recomendado para el Agente)

**Ventajas:**
- El agente puede ejecutar queries SQL directamente
- Más flexible para consultas complejas
- Acceso directo a todas las funciones de la base de datos

**Configuración en n8n:**
```
Type: PostgreSQL
Host: db.knaplqhumkuiazqdnznd.supabase.co
Database: postgres
User: postgres
Password: [SUPABASE_DB_PASSWORD]
Port: 5432
SSL: Required
```

**Nota:** Para operaciones que requieren bypassar RLS (como crear transacciones desde Telegram), necesitas usar la conexión con permisos elevados o usar las APIs REST.

### Opción 2: API REST HTTP

**Ventajas:**
- Más seguro (respeta RLS automáticamente)
- Validación de datos integrada
- Logs de auditoría automáticos

**Configuración en n8n:**
```
Type: HTTP Request
Base URL: https://knaplqhumkuiazqdnznd.supabase.co/rest/v1
Headers:
  - apikey: [SUPABASE_ANON_KEY o SERVICE_ROLE_KEY]
  - Authorization: Bearer [TOKEN]
```

**Endpoints disponibles:**
- `GET /rest/v1/contable_transactions?user_id=eq.{uuid}`
- `POST /rest/v1/contable_transactions`
- `PATCH /rest/v1/contable_transactions?id=eq.{uuid}`
- `DELETE /rest/v1/contable_transactions?id=eq.{uuid}`

### Opción 3: Webhook HTTP (Para crear transacciones desde Telegram)

**Ventajas:**
- Bypassa RLS automáticamente
- Crea usuarios automáticamente si no existen
- Registra acciones en audit_logs

**Configuración en n8n:**
```
Type: HTTP Request
Method: POST
URL: https://tu-dominio.com/api/webhook/n8n
Headers:
  - Authorization: Bearer [WEBHOOK_SECRET_TOKEN]
  - Content-Type: application/json
```

---

## 🤖 CONFIGURACIÓN DEL AGENTE

### Información del Sistema para el Agente

El agente debe tener acceso a la siguiente información sobre el sistema:

#### Tablas del Sistema

1. **contable_users**
   - ID: `uuid` (PK)
   - Campos: `nombre`, `email`, `telefono` (UNIQUE)
   - Función: Almacena información de usuarios

2. **contable_transactions**
   - ID: `uuid` (PK)
   - Campos principales: `user_id`, `tipo`, `monto`, `descripcion`, `fecha`
   - Tipos válidos: `ingreso`, `gasto`, `inversion`, `ahorro`, `transferencia`
   - Función: Almacena todas las transacciones financieras

3. **contable_kpi_summary**
   - ID: `uuid` (PK)
   - Campos: `user_id`, `periodo`, `ingreso_total`, `gasto_total`, `balance`, etc.
   - Función: Almacena KPIs calculados automáticamente por período

4. **contable_categories**
   - ID: `uuid` (PK)
   - Campos: `nombre`, `tipo`, `grupo`
   - Función: Categorías disponibles para clasificar transacciones

5. **contable_accounts**
   - ID: `uuid` (PK)
   - Campos: `user_id`, `nombre`, `tipo`, `saldo_actual`
   - Función: Cuentas bancarias asociadas a usuarios

#### Relaciones Clave

- `contable_transactions.user_id` → `contable_users.id`
- `contable_transactions.category_id` → `contable_categories.id` (opcional)
- `contable_transactions.account_id` → `contable_accounts.id` (opcional)
- `contable_kpi_summary.user_id` → `contable_users.id`

#### Funcionalidades Automáticas

- **Triggers:** Los KPIs se recalculan automáticamente al insertar/modificar/eliminar transacciones
- **RLS:** Todas las tablas tienen Row Level Security habilitado (excepto `contable_categories`)

---

## 🧠 CAPACIDADES DEL AGENTE

El agente debe poder realizar las siguientes operaciones:

### 1. Buscar Usuario

**Descripción:** Buscar un usuario por teléfono o email.

**Query:**
```sql
SELECT * FROM contable_users 
WHERE telefono = ? OR email = ?;
```

**Ejemplo:**
```sql
SELECT * FROM contable_users 
WHERE telefono = '+34612345678';
```

### 2. Crear Transacción

**Descripción:** Agregar una nueva transacción a la base de datos.

**Query:**
```sql
INSERT INTO contable_transactions (
  user_id,
  tipo,
  monto,
  descripcion,
  fecha,
  metodo_pago,
  origen
)
VALUES (
  ?,  -- user_id (uuid)
  ?,  -- tipo: 'ingreso', 'gasto', 'inversion', 'ahorro', 'transferencia'
  ?,  -- monto (numeric, debe ser > 0)
  ?,  -- descripcion (text, opcional)
  ?,  -- fecha (date, formato: YYYY-MM-DD)
  ?,  -- metodo_pago (varchar, opcional)
  ?   -- origen: 'manual', 'n8n', 'telegram', etc.
)
RETURNING *;
```

**Nota:** El trigger `trg_contable_transactions_kpi` recalculará automáticamente los KPIs.

### 3. Modificar Transacción

**Descripción:** Actualizar una transacción existente.

**Query:**
```sql
UPDATE contable_transactions
SET 
  tipo = ?,
  monto = ?,
  descripcion = ?,
  fecha = ?
WHERE id = ? AND user_id = ?
RETURNING *;
```

**Nota:** Si cambia la fecha, el trigger recalculará KPIs de ambos períodos.

### 4. Eliminar Transacción

**Descripción:** Eliminar una transacción.

**Query:**
```sql
DELETE FROM contable_transactions
WHERE id = ? AND user_id = ?;
```

**Nota:** El trigger recalculará automáticamente los KPIs del período afectado.

### 5. Consultar Transacciones

**Descripción:** Obtener transacciones de un usuario con filtros.

**Query:**
```sql
SELECT * FROM contable_transactions
WHERE user_id = ?
  AND fecha >= ?  -- fecha_desde (opcional)
  AND fecha <= ?  -- fecha_hasta (opcional)
  AND tipo = ?    -- tipo (opcional)
ORDER BY fecha DESC;
```

### 6. Sumar Gastos

**Descripción:** Calcular el total de gastos de un usuario en un período.

**Query:**
```sql
SELECT 
  SUM(monto) as total_gastos,
  COUNT(*) as num_transacciones
FROM contable_transactions
WHERE user_id = ?
  AND tipo = 'gasto'
  AND fecha >= ?
  AND fecha <= ?;
```

**Ejemplo:**
```sql
SELECT 
  SUM(monto) as total_gastos,
  COUNT(*) as num_transacciones
FROM contable_transactions
WHERE user_id = 'user-uuid-here'
  AND tipo = 'gasto'
  AND fecha >= '2024-10-01'
  AND fecha <= '2024-10-31';
```

### 7. Sumar Ingresos

**Descripción:** Calcular el total de ingresos de un usuario en un período.

**Query:**
```sql
SELECT 
  SUM(monto) as total_ingresos,
  COUNT(*) as num_transacciones
FROM contable_transactions
WHERE user_id = ?
  AND tipo = 'ingreso'
  AND fecha >= ?
  AND fecha <= ?;
```

### 8. Consultar Balance

**Descripción:** Obtener el balance y KPIs de un usuario para un período.

**Query:**
```sql
SELECT 
  ingreso_total,
  gasto_total,
  balance,
  porcentaje_ahorro,
  margen_neto
FROM contable_kpi_summary
WHERE user_id = ?
  AND periodo = ?;
```

**Ejemplo:**
```sql
SELECT 
  ingreso_total,
  gasto_total,
  balance,
  porcentaje_ahorro,
  margen_neto
FROM contable_kpi_summary
WHERE user_id = 'user-uuid-here'
  AND periodo = '2024-10';
```

### 9. Consultar Top Gastos

**Descripción:** Obtener los gastos más altos de un usuario.

**Query:**
```sql
SELECT 
  descripcion,
  monto,
  fecha
FROM contable_transactions
WHERE user_id = ?
  AND tipo = 'gasto'
ORDER BY monto DESC
LIMIT ?;
```

### 10. Consultar Transacciones por Período

**Descripción:** Obtener todas las transacciones de un usuario en un período específico.

**Query:**
```sql
SELECT * FROM contable_transactions
WHERE user_id = ?
  AND fecha >= (periodo || '-01')::date
  AND fecha <= ((periodo || '-01')::date + INTERVAL '1 month' - INTERVAL '1 day')::date
ORDER BY fecha DESC;
```

**Ejemplo:**
```sql
SELECT * FROM contable_transactions
WHERE user_id = 'user-uuid-here'
  AND fecha >= '2024-10-01'::date
  AND fecha <= '2024-10-31'::date
ORDER BY fecha DESC;
```

### 11. Consultar Períodos Disponibles

**Descripción:** Obtener todos los períodos en los que un usuario tiene transacciones.

**Query:**
```sql
SELECT DISTINCT 
  TO_CHAR(fecha, 'YYYY-MM') as periodo
FROM contable_transactions
WHERE user_id = ?
ORDER BY periodo DESC;
```

### 12. Consultar Resumen por Categoría

**Descripción:** Obtener un resumen de transacciones agrupadas por categoría.

**Query:**
```sql
SELECT 
  c.nombre as categoria,
  SUM(t.monto) as total,
  COUNT(*) as cantidad
FROM contable_transactions t
JOIN contable_categories c ON t.category_id = c.id
WHERE t.user_id = ?
  AND t.fecha >= ?
  AND t.fecha <= ?
GROUP BY c.nombre
ORDER BY total DESC;
```

---

## 📝 PROMPTS DEL AGENTE

### Prompt del Sistema

```
Eres un asistente contable inteligente especializado en gestión de finanzas personales. Tu objetivo es ayudar a los usuarios a gestionar sus transacciones financieras a través de una base de datos PostgreSQL.

CONOCIMIENTO DEL SISTEMA:

TABLAS:
1. contable_users - Usuarios del sistema (id, nombre, email, telefono)
2. contable_transactions - Transacciones financieras (id, user_id, tipo, monto, descripcion, fecha)
3. contable_kpi_summary - KPIs calculados por período (user_id, periodo, ingreso_total, gasto_total, balance)
4. contable_categories - Categorías disponibles (id, nombre, tipo, grupo)
5. contable_accounts - Cuentas bancarias (id, user_id, nombre, tipo)

RELACIONES:
- contable_transactions.user_id → contable_users.id
- contable_transactions.category_id → contable_categories.id (opcional)
- contable_transactions.account_id → contable_accounts.id (opcional)

TIPOS DE TRANSACCIÓN:
- ingreso: Ingresos de dinero
- gasto: Gastos de dinero
- inversion: Inversiones
- ahorro: Ahorros
- transferencia: Transferencias entre cuentas

FORMATOS:
- Fechas: YYYY-MM-DD (ej: 2024-10-23)
- Períodos: YYYY-MM (ej: 2024-10)

OPERACIONES DISPONIBLES:
1. Buscar usuario por teléfono o email
2. Crear transacción (INSERT)
3. Modificar transacción (UPDATE)
4. Eliminar transacción (DELETE)
5. Consultar transacciones (SELECT)
6. Sumar gastos o ingresos
7. Consultar balance y KPIs
8. Consultar top gastos
9. Consultar transacciones por período
10. Consultar períodos disponibles

IMPORTANTE:
- Todas las tablas tienen RLS habilitado (excepto contable_categories)
- Los KPIs se recalculan automáticamente mediante triggers
- Siempre verifica que el user_id coincida antes de modificar/eliminar
- Valida que el tipo de transacción sea válido
- Valida que el monto sea mayor a 0

INSTRUCCIONES:
- Cuando el usuario pida agregar una transacción, usa INSERT
- Cuando el usuario pida modificar, usa UPDATE
- Cuando el usuario pida eliminar, usa DELETE
- Cuando el usuario pida consultar sumas o totales, usa SUM() con GROUP BY si es necesario
- Siempre devuelve resultados claros y formateados
- Si no tienes el user_id, búscalo primero por teléfono o email
- Usa las queries SQL proporcionadas en la documentación
```

### Ejemplos de Prompts para el Usuario

**Agregar Transacción:**
```
"Agrega un gasto de 50 euros de supermercado el día de hoy para el usuario con teléfono +34612345678"
```

**Consultar Gastos:**
```
"¿Cuánto gastó el usuario con teléfono +34612345678 en octubre de 2024?"
```

**Consultar Balance:**
```
"¿Cuál es el balance del usuario con teléfono +34612345678 en el período 2024-10?"
```

**Modificar Transacción:**
```
"Modifica la transacción X para que el monto sea 75 euros"
```

**Eliminar Transacción:**
```
"Elimina la transacción X del usuario Y"
```

---

## 🔍 QUERIES DISPONIBLES

### Queries Esenciales para el Agente

#### 1. Buscar Usuario por Teléfono

```sql
SELECT * FROM contable_users 
WHERE telefono = ?;
```

#### 2. Buscar Usuario por Email

```sql
SELECT * FROM contable_users 
WHERE email = ?;
```

#### 3. Crear Transacción

```sql
INSERT INTO contable_transactions (
  user_id,
  tipo,
  monto,
  descripcion,
  fecha,
  metodo_pago,
  origen
)
VALUES (?, ?, ?, ?, ?, ?, 'n8n')
RETURNING *;
```

#### 4. Modificar Transacción

```sql
UPDATE contable_transactions
SET 
  tipo = COALESCE(?, tipo),
  monto = COALESCE(?, monto),
  descripcion = COALESCE(?, descripcion),
  fecha = COALESCE(?, fecha)
WHERE id = ? AND user_id = ?
RETURNING *;
```

#### 5. Eliminar Transacción

```sql
DELETE FROM contable_transactions
WHERE id = ? AND user_id = ?;
```

#### 6. Sumar Gastos por Período

```sql
SELECT 
  SUM(monto) as total_gastos,
  COUNT(*) as num_transacciones
FROM contable_transactions
WHERE user_id = ?
  AND tipo = 'gasto'
  AND fecha >= ?
  AND fecha <= ?;
```

#### 7. Sumar Ingresos por Período

```sql
SELECT 
  SUM(monto) as total_ingresos,
  COUNT(*) as num_transacciones
FROM contable_transactions
WHERE user_id = ?
  AND tipo = 'ingreso'
  AND fecha >= ?
  AND fecha <= ?;
```

#### 8. Consultar Balance (KPI)

```sql
SELECT 
  periodo,
  ingreso_total,
  gasto_total,
  balance,
  porcentaje_ahorro,
  margen_neto
FROM contable_kpi_summary
WHERE user_id = ?
  AND periodo = ?;
```

#### 9. Consultar Todas las Transacciones de un Período

```sql
SELECT 
  id,
  tipo,
  monto,
  descripcion,
  fecha
FROM contable_transactions
WHERE user_id = ?
  AND fecha >= ?
  AND fecha <= ?
ORDER BY fecha DESC;
```

#### 10. Consultar Top 5 Gastos

```sql
SELECT 
  id,
  descripcion,
  monto,
  fecha
FROM contable_transactions
WHERE user_id = ?
  AND tipo = 'gasto'
ORDER BY monto DESC
LIMIT 5;
```

#### 11. Consultar Períodos Disponibles

```sql
SELECT DISTINCT 
  TO_CHAR(fecha, 'YYYY-MM') as periodo
FROM contable_transactions
WHERE user_id = ?
ORDER BY periodo DESC;
```

#### 12. Consultar Resumen Diario

```sql
SELECT 
  fecha,
  SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as ingresos,
  SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as gastos,
  COUNT(*) as num_transacciones
FROM contable_transactions
WHERE user_id = ?
  AND fecha >= ?
  AND fecha <= ?
GROUP BY fecha
ORDER BY fecha DESC;
```

---

## 💬 EJEMPLOS DE USO

### Ejemplo 1: Agregar Gasto desde Telegram

**Usuario dice:** "Gasté 50 euros en supermercado hoy"

**Flujo del Agente:**
1. Buscar usuario por teléfono del chat de Telegram
2. Si no existe, crear usuario
3. Insertar transacción:
   ```sql
   INSERT INTO contable_transactions (
     user_id,
     tipo,
     monto,
     descripcion,
     fecha,
     metodo_pago,
     origen
   )
   VALUES (
     'user-uuid',
     'gasto',
     50.00,
     'supermercado',
     CURRENT_DATE,
     'telegram',
     'n8n'
   )
   RETURNING *;
   ```
4. Confirmar al usuario: "Gasto de 50 euros agregado exitosamente"

### Ejemplo 2: Consultar Gastos del Mes

**Usuario dice:** "¿Cuánto gasté este mes?"

**Flujo del Agente:**
1. Obtener teléfono del usuario
2. Buscar usuario
3. Calcular primer y último día del mes actual
4. Ejecutar query:
   ```sql
   SELECT 
     SUM(monto) as total_gastos,
     COUNT(*) as num_transacciones
   FROM contable_transactions
   WHERE user_id = 'user-uuid'
     AND tipo = 'gasto'
     AND fecha >= '2024-10-01'
     AND fecha <= '2024-10-31';
   ```
5. Responder: "Has gastado X euros en Y transacciones este mes"

### Ejemplo 3: Consultar Balance

**Usuario dice:** "¿Cuál es mi balance de octubre?"

**Flujo del Agente:**
1. Obtener teléfono del usuario
2. Buscar usuario
3. Ejecutar query:
   ```sql
   SELECT 
     ingreso_total,
     gasto_total,
     balance,
     porcentaje_ahorro
   FROM contable_kpi_summary
   WHERE user_id = 'user-uuid'
     AND periodo = '2024-10';
   ```
4. Responder: "En octubre tuviste X euros de ingresos, Y euros de gastos, con un balance de Z euros"

### Ejemplo 4: Modificar Transacción

**Usuario dice:** "Cambia el monto de la transacción X a 75 euros"

**Flujo del Agente:**
1. Obtener ID de transacción y teléfono del usuario
2. Buscar usuario
3. Verificar que la transacción pertenece al usuario
4. Actualizar transacción:
   ```sql
   UPDATE contable_transactions
   SET monto = 75.00
   WHERE id = 'transaction-uuid'
     AND user_id = 'user-uuid'
   RETURNING *;
   ```
5. Confirmar: "Transacción actualizada exitosamente"

### Ejemplo 5: Eliminar Transacción

**Usuario dice:** "Elimina la transacción X"

**Flujo del Agente:**
1. Obtener ID de transacción y teléfono del usuario
2. Buscar usuario
3. Verificar que la transacción pertenece al usuario
4. Eliminar:
   ```sql
   DELETE FROM contable_transactions
   WHERE id = 'transaction-uuid'
     AND user_id = 'user-uuid';
   ```
5. Confirmar: "Transacción eliminada exitosamente"

---

## 🔄 WORKFLOW DE N8N

### Estructura Recomendada

```
[Trigger: Telegram] 
  → [Extract Phone Number]
    → [Check if User Exists]
      → [Create User if Not Exists]
        → [Parse Transaction Data]
          → [Execute SQL: INSERT Transaction]
            → [Send Confirmation to Telegram]
```

### Nodos Requeridos

#### 1. Trigger: Telegram

**Configuración:**
- Event: `Message`
- Bot Token: [Tu bot token de Telegram]

#### 2. Node: Extract Phone Number

**Función:** Extraer teléfono del mensaje o del chat.

#### 3. Node: PostgreSQL - Check User

**Query:**
```sql
SELECT * FROM contable_users 
WHERE telefono = $1;
```

**Parámetros:** `{{ $json.phone }}`

#### 4. Node: PostgreSQL - Create User (si no existe)

**Query:**
```sql
INSERT INTO contable_users (nombre, telefono)
VALUES ($1, $2)
ON CONFLICT (telefono) DO NOTHING
RETURNING *;
```

**Parámetros:** 
- `{{ $json.name || 'Usuario' }}`
- `{{ $json.phone }}`

#### 5. Node: AI Code - Parse Transaction

**Función:** Usar IA para extraer información de la transacción del mensaje del usuario.

**Input:** Mensaje del usuario  
**Output:** `{ tipo, monto, descripcion, fecha }`

#### 6. Node: PostgreSQL - Insert Transaction

**Query:**
```sql
INSERT INTO contable_transactions (
  user_id,
  tipo,
  monto,
  descripcion,
  fecha,
  metodo_pago,
  origen
)
VALUES ($1, $2, $3, $4, $5, 'telegram', 'n8n')
RETURNING *;
```

**Parámetros:**
- `{{ $json.user_id }}`
- `{{ $json.tipo }}`
- `{{ $json.monto }}`
- `{{ $json.descripcion }}`
- `{{ $json.fecha || CURRENT_DATE }}`

#### 7. Node: Telegram - Send Message

**Mensaje:**
```
"✅ Transacción agregada exitosamente:
Tipo: {{ $json.tipo }}
Monto: {{ $json.monto }} euros
Descripción: {{ $json.descripcion }}"
```

---

## 🔐 SEGURIDAD Y RLS

### Importante para el Agente

**RLS (Row Level Security):**
- Todas las tablas tienen RLS habilitado
- El agente debe usar Service Role Key para bypassar RLS **SOLO cuando sea necesario**
- Para operaciones normales, usa las APIs REST que respetan RLS automáticamente

**Recomendaciones:**
1. **Para consultas:** Usa Service Role Key o conexión con permisos elevados
2. **Para crear transacciones desde Telegram:** Usa el webhook `/api/webhook/n8n` que maneja RLS automáticamente
3. **Para operaciones normales:** Usa las APIs REST con token de usuario

**Conexión con Service Role:**
```
Host: db.knaplqhumkuiazqdnznd.supabase.co
User: postgres
Password: [SUPABASE_SERVICE_ROLE_KEY o DB_PASSWORD]
Database: postgres
SSL: Required
```

---

## 📋 CHECKLIST DE CONFIGURACIÓN

- [ ] Configurar conexión PostgreSQL en n8n
- [ ] Configurar bot de Telegram
- [ ] Configurar webhook para crear transacciones
- [ ] Configurar agente con prompts del sistema
- [ ] Probar agregar transacción
- [ ] Probar modificar transacción
- [ ] Probar eliminar transacción
- [ ] Probar consultar gastos/ingresos
- [ ] Probar consultar balance
- [ ] Probar consultar períodos disponibles

---

## 🎯 PRÓXIMOS PASOS

1. Configurar el agente en n8n con los prompts proporcionados
2. Conectar el agente a la base de datos PostgreSQL
3. Probar cada operación individualmente
4. Integrar con Telegram
5. Implementar el workflow completo

---

**Referencias:**
- Ver `DATABASE-SCHEMA.md` para información completa de la base de datos
- Ver `ROADMAP.md` para el estado del proyecto

