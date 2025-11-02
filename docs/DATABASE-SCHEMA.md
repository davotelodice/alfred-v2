# 📊 DOCUMENTACIÓN COMPLETA DE LA BASE DE DATOS
## Asistente Contable Inteligente

**Última actualización:** 2024-10-23  
**Base de Datos:** PostgreSQL (Supabase)  
**Prefijo de tablas:** `contable_`

---

## 📋 ÍNDICE

1. [Descripción General](#descripción-general)
2. [Arquitectura de la Base de Datos](#arquitectura-de-la-base-de-datos)
3. [Tablas del Sistema](#tablas-del-sistema)
4. [Políticas RLS (Row Level Security)](#políticas-rls-row-level-security)
5. [Funciones y Triggers](#funciones-y-triggers)
6. [Relaciones entre Tablas](#relaciones-entre-tablas)
7. [Queries Útiles](#queries-útiles)
8. [APIs Disponibles](#apis-disponibles)
9. [Conexión desde n8n](#conexión-desde-n8n)

---

## 🎯 DESCRIPCIÓN GENERAL

El sistema de **Asistente Contable Inteligente** utiliza PostgreSQL en Supabase para almacenar y gestionar datos financieros de usuarios. Todas las tablas utilizan el prefijo `contable_` para identificar claramente las entidades del sistema.

### Características principales:
- **Seguridad:** Row Level Security (RLS) habilitado en todas las tablas de usuario
- **Automatización:** Triggers para recálculo automático de KPIs
- **Auditoría:** Tabla de logs de auditoría para rastrear acciones
- **Multi-usuario:** Cada usuario solo puede acceder a sus propios datos

---

## 🏗️ ARQUITECTURA DE LA BASE DE DATOS

### Diagrama de Relaciones

```
contable_users (Usuario principal)
    │
    ├── contable_transactions (Transacciones financieras)
    │       ├── contable_categories (Categorías)
    │       └── contable_accounts (Cuentas bancarias)
    │
    ├── contable_accounts (Cuentas bancarias)
    │
    ├── contable_kpi_summary (KPIs calculados)
    │
    ├── contable_advice (Recomendaciones IA)
    │
    └── contable_audit_logs (Logs de auditoría)
```

### Tabla Maestra
- **`contable_users`** es la tabla central que conecta todas las demás tablas a través de `user_id`

---

## 📊 TABLAS DEL SISTEMA

### 1. `contable_users` - Usuarios del Sistema

**Función:** Almacena información de los usuarios del sistema contable.

**Columnas:**

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | ID único del usuario (PK) |
| `nombre` | varchar | NO | - | Nombre completo del usuario |
| `email` | varchar | SÍ | - | Email del usuario (UNIQUE) |
| `telefono` | varchar | SÍ | - | Teléfono del usuario (UNIQUE) |
| `tipo_usuario` | varchar | SÍ | `'personal'` | Tipo de usuario (personal, empresa, etc.) |
| `moneda_preferida` | varchar | SÍ | `'EUR'` | Moneda preferida (EUR, USD, etc.) |
| `fecha_creacion` | timestamptz | SÍ | `now()` | Fecha de creación del registro |

**Índices:**
- `contable_users_pkey` (PRIMARY KEY): `id`
- `contable_users_email_key` (UNIQUE): `email`
- `contable_users_telefono_key` (UNIQUE): `telefono`

**RLS:** ✅ Habilitado

**Política RLS:** Los usuarios solo pueden ver/modificar sus propios datos.

---

### 2. `contable_transactions` - Transacciones Financieras

**Función:** Almacena todas las transacciones financieras (ingresos, gastos, ahorros, inversiones, transferencias).

**Columnas:**

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | ID único de la transacción (PK) |
| `user_id` | uuid | NO | - | ID del usuario (FK → `contable_users.id`) |
| `account_id` | uuid | SÍ | - | ID de la cuenta bancaria (FK → `contable_accounts.id`) |
| `category_id` | uuid | SÍ | - | ID de la categoría (FK → `contable_categories.id`) |
| `tipo` | varchar | NO | - | Tipo: `ingreso`, `gasto`, `inversion`, `ahorro`, `transferencia` |
| `monto` | numeric | NO | - | Monto de la transacción |
| `descripcion` | text | SÍ | - | Descripción de la transacción |
| `fecha` | date | NO | - | Fecha de la transacción |
| `metodo_pago` | varchar | SÍ | - | Método de pago (efectivo, tarjeta, transferencia, etc.) |
| `origen` | varchar | SÍ | `'manual'` | Origen: `manual`, `n8n`, `telegram`, etc. |
| `creado_por` | uuid | SÍ | - | ID del usuario que creó la transacción |
| `created_at` | timestamptz | SÍ | `now()` | Fecha de creación del registro |

**Índices:**
- `contable_transactions_pkey` (PRIMARY KEY): `id`

**RLS:** ✅ Habilitado

**Políticas RLS:**
- `contable_transactions_is_owner_select`: SELECT solo para el propietario
- `contable_transactions_is_owner_mod`: INSERT/UPDATE/DELETE solo para el propietario

**Triggers:**
- `trg_contable_transactions_kpi`: Se ejecuta después de INSERT/UPDATE/DELETE para recalcular KPIs automáticamente

**Función del trigger:** Llama a `contable_recompute_kpi_for_period()` para recalcular los KPIs del período afectado.

---

### 3. `contable_accounts` - Cuentas Bancarias

**Función:** Almacena información de las cuentas bancarias asociadas a cada usuario.

**Columnas:**

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | ID único de la cuenta (PK) |
| `user_id` | uuid | NO | - | ID del usuario (FK → `contable_users.id`) |
| `nombre` | varchar | NO | - | Nombre de la cuenta |
| `tipo` | varchar | SÍ | - | Tipo de cuenta (corriente, ahorro, etc.) |
| `saldo_actual` | numeric | SÍ | `0` | Saldo actual de la cuenta |
| `entidad` | varchar | SÍ | - | Entidad bancaria |
| `numero_cuenta` | varchar | SÍ | - | Número de cuenta |
| `fecha_creacion` | timestamptz | SÍ | `now()` | Fecha de creación |

**Índices:**
- `contable_accounts_pkey` (PRIMARY KEY): `id`

**RLS:** ✅ Habilitado

**Política RLS:** `contable_accounts_owner` - Los usuarios solo pueden acceder a sus propias cuentas.

---

### 4. `contable_categories` - Categorías de Transacciones

**Función:** Almacena las categorías disponibles para clasificar transacciones.

**Columnas:**

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | ID único de la categoría (PK) |
| `nombre` | varchar | NO | - | Nombre de la categoría |
| `tipo` | varchar | NO | - | Tipo: `ingreso`, `gasto`, `inversion`, `ahorro` |
| `grupo` | varchar | SÍ | - | Grupo al que pertenece (comida, transporte, etc.) |
| `descripcion` | text | SÍ | - | Descripción de la categoría |

**Índices:**
- `contable_categories_pkey` (PRIMARY KEY): `id`

**RLS:** ❌ Deshabilitado (tabla compartida para todos los usuarios)

**Nota:** Esta tabla es compartida y accesible para todos los usuarios. No tiene RLS porque las categorías son comunes a todos.

---

### 5. `contable_kpi_summary` - Resumen de KPIs

**Función:** Almacena los KPIs (Indicadores Clave de Rendimiento) calculados por período para cada usuario.

**Columnas:**

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | ID único del registro (PK) |
| `user_id` | uuid | NO | - | ID del usuario (FK → `contable_users.id`) |
| `periodo` | varchar | NO | - | Período en formato `YYYY-MM` |
| `ingreso_total` | numeric | SÍ | `0` | Total de ingresos del período |
| `gasto_total` | numeric | SÍ | `0` | Total de gastos del período |
| `ahorro_total` | numeric | SÍ | `0` | Total de ahorros del período |
| `inversion_total` | numeric | SÍ | `0` | Total de inversiones del período |
| `balance` | numeric | SÍ | `(ingreso_total - gasto_total)` | Balance del período (generado) |
| `porcentaje_ahorro` | numeric | SÍ | - | Porcentaje de ahorro (%) |
| `liquidez` | numeric | SÍ | - | Liquidez disponible |
| `endeudamiento` | numeric | SÍ | - | Nivel de endeudamiento (%) |
| `margen_neto` | numeric | SÍ | - | Margen neto (%) |
| `fecha_calculo` | timestamptz | SÍ | `now()` | Fecha del último cálculo |

**Índices:**
- `contable_kpi_summary_pkey` (PRIMARY KEY): `id`
- `contable_kpi_summary_user_id_periodo_key` (UNIQUE): `user_id`, `periodo` (un KPI por período por usuario)

**RLS:** ✅ Habilitado

**Política RLS:** `contable_kpi_owner` - Los usuarios solo pueden ver sus propios KPIs.

**Nota:** Los KPIs se recalculan automáticamente mediante el trigger `trg_contable_transactions_kpi` cuando se insertan, modifican o eliminan transacciones.

---

### 6. `contable_advice` - Recomendaciones IA

**Función:** Almacena recomendaciones financieras generadas por IA (GPT) para cada usuario.

**Columnas:**

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | ID único de la recomendación (PK) |
| `user_id` | uuid | NO | - | ID del usuario (FK → `contable_users.id`) |
| `tipo_alerta` | varchar | SÍ | - | Tipo de alerta (gasto_excesivo, oportunidad_ahorro, etc.) |
| `mensaje` | text | NO | - | Mensaje de la recomendación |
| `prioridad` | varchar | SÍ | `'normal'` | Prioridad: `baja`, `normal`, `alta`, `critica` |
| `generado_por` | varchar | SÍ | `'IA'` | Origen: `IA`, `sistema`, `manual` |
| `fecha` | timestamptz | SÍ | `now()` | Fecha de generación |
| `leido` | boolean | SÍ | `false` | Si el usuario ha leído la recomendación |

**Índices:**
- `contable_advice_pkey` (PRIMARY KEY): `id`

**RLS:** ✅ Habilitado

**Política RLS:** `contable_advice_owner` - Los usuarios solo pueden ver sus propias recomendaciones.

---

### 7. `contable_audit_logs` - Logs de Auditoría

**Función:** Registra todas las acciones importantes realizadas en el sistema para auditoría.

**Columnas:**

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | ID único del log (PK) |
| `user_id` | uuid | SÍ | - | ID del usuario que realizó la acción (FK → `contable_users.id`) |
| `accion` | varchar | SÍ | - | Tipo de acción (transaction_created, user_created, etc.) |
| `detalles` | jsonb | SÍ | - | Detalles adicionales en formato JSON |
| `fecha` | timestamptz | SÍ | `now()` | Fecha de la acción |

**Índices:**
- `contable_audit_logs_pkey` (PRIMARY KEY): `id`

**RLS:** ✅ Habilitado

**Política RLS:** `contable_audit_owner` - SELECT solo para logs del usuario o logs públicos (user_id IS NULL).

**Nota:** Esta tabla registra automáticamente acciones importantes como creación de usuarios, transacciones desde webhooks, etc.

---

## 🔒 POLÍTICAS RLS (ROW LEVEL SECURITY)

### Resumen de Políticas

Todas las tablas con RLS habilitado utilizan políticas que restringen el acceso basado en `auth.uid()` (ID del usuario autenticado).

### Políticas por Tabla

#### `contable_users`
- **RLS:** ✅ Habilitado
- **Política:** Los usuarios solo pueden ver/modificar sus propios datos

#### `contable_transactions`
- **RLS:** ✅ Habilitado
- **Políticas:**
  - `contable_transactions_is_owner_select`: SELECT solo si `user_id = auth.uid()`
  - `contable_transactions_is_owner_mod`: INSERT/UPDATE/DELETE solo si `user_id = auth.uid()`

#### `contable_accounts`
- **RLS:** ✅ Habilitado
- **Política:** `contable_accounts_owner` - ALL solo si `user_id = auth.uid()`

#### `contable_kpi_summary`
- **RLS:** ✅ Habilitado
- **Política:** `contable_kpi_owner` - ALL solo si `user_id = auth.uid()`

#### `contable_advice`
- **RLS:** ✅ Habilitado
- **Política:** `contable_advice_owner` - ALL solo si `user_id = auth.uid()`

#### `contable_audit_logs`
- **RLS:** ✅ Habilitado
- **Política:** `contable_audit_owner` - SELECT si `user_id IS NULL` o `user_id = auth.uid()`

#### `contable_categories`
- **RLS:** ❌ Deshabilitado (tabla compartida)

---

## ⚙️ FUNCIONES Y TRIGGERS

### Funciones

#### 1. `contable_recompute_kpi_for_period(uid UUID, periodo_param VARCHAR)`

**Función:** Recalcula los KPIs para un usuario y período específico.

**Parámetros:**
- `uid`: UUID del usuario
- `periodo_param`: Período en formato `YYYY-MM`

**Lógica:**
1. Calcula el rango de fechas del período (primer y último día del mes)
2. Suma todos los ingresos del período
3. Suma todos los gastos del período
4. Suma todos los ahorros del período
5. Suma todas las inversiones del período
6. Calcula porcentaje de ahorro: `(ahorros/ingresos)*100`
7. Calcula margen neto: `((ingresos - gastos)/ingresos)*100`
8. Inserta o actualiza el registro en `contable_kpi_summary`

**Uso:**
```sql
SELECT contable_recompute_kpi_for_period('user-uuid-here', '2024-10');
```

#### 2. `contable_transactions_kpi_trigger()`

**Función:** Trigger function que se ejecuta automáticamente después de cambios en `contable_transactions`.

**Lógica:**
- **INSERT:** Calcula KPIs para el período de la nueva transacción
- **UPDATE:** Calcula KPIs para el período nuevo y el período anterior (si cambió la fecha)
- **DELETE:** Calcula KPIs para el período de la transacción eliminada

**Nota:** Esta función garantiza que los KPIs siempre estén actualizados automáticamente.

### Triggers

#### `trg_contable_transactions_kpi`

**Tabla:** `contable_transactions`  
**Eventos:** INSERT, UPDATE, DELETE  
**Timing:** AFTER  
**Función:** `contable_transactions_kpi_trigger()`

**Propósito:** Recalcular automáticamente los KPIs cuando se modifican transacciones.

---

## 🔗 RELACIONES ENTRE TABLAS

### Diagrama de Foreign Keys

```
contable_users (id)
    │
    ├── contable_transactions.user_id → contable_users.id
    ├── contable_accounts.user_id → contable_users.id
    ├── contable_kpi_summary.user_id → contable_users.id
    ├── contable_advice.user_id → contable_users.id
    └── contable_audit_logs.user_id → contable_users.id

contable_accounts (id)
    └── contable_transactions.account_id → contable_accounts.id

contable_categories (id)
    └── contable_transactions.category_id → contable_categories.id
```

### Resumen de Relaciones

1. **contable_users → contable_transactions:** Un usuario puede tener muchas transacciones
2. **contable_users → contable_accounts:** Un usuario puede tener muchas cuentas
3. **contable_users → contable_kpi_summary:** Un usuario puede tener muchos KPIs (uno por período)
4. **contable_users → contable_advice:** Un usuario puede tener muchas recomendaciones
5. **contable_users → contable_audit_logs:** Un usuario puede tener muchos logs de auditoría
6. **contable_accounts → contable_transactions:** Una cuenta puede tener muchas transacciones
7. **contable_categories → contable_transactions:** Una categoría puede tener muchas transacciones

---

## 📝 QUERIES ÚTILES

### Para el Agente n8n

#### 1. Obtener Usuario por Teléfono

```sql
SELECT * FROM contable_users 
WHERE telefono = '+34612345678';
```

#### 2. Crear Usuario (si no existe)

```sql
INSERT INTO contable_users (nombre, telefono, email)
VALUES ('Nombre Usuario', '+34612345678', 'email@ejemplo.com')
ON CONFLICT (telefono) DO NOTHING
RETURNING *;
```

#### 3. Insertar Transacción

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
  'user-uuid-here',
  'gasto',
  50.00,
  'Descripción de la transacción',
  '2024-10-23',
  'telegram',
  'n8n'
)
RETURNING *;
```

**Nota:** El trigger `trg_contable_transactions_kpi` recalculará automáticamente los KPIs.

#### 4. Obtener Transacciones de un Usuario por Período

```sql
SELECT * FROM contable_transactions
WHERE user_id = 'user-uuid-here'
  AND fecha >= '2024-10-01'
  AND fecha <= '2024-10-31'
ORDER BY fecha DESC;
```

#### 5. Sumar Gastos de un Usuario en un Período

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

#### 6. Sumar Ingresos de un Usuario en un Período

```sql
SELECT 
  SUM(monto) as total_ingresos,
  COUNT(*) as num_transacciones
FROM contable_transactions
WHERE user_id = 'user-uuid-here'
  AND tipo = 'ingreso'
  AND fecha >= '2024-10-01'
  AND fecha <= '2024-10-31';
```

#### 7. Obtener Balance de un Usuario por Período

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

#### 8. Obtener Top 5 Gastos Más Altos de un Usuario

```sql
SELECT 
  descripcion,
  monto,
  fecha
FROM contable_transactions
WHERE user_id = 'user-uuid-here'
  AND tipo = 'gasto'
ORDER BY monto DESC
LIMIT 5;
```

#### 9. Actualizar Transacción

```sql
UPDATE contable_transactions
SET 
  tipo = 'gasto',
  monto = 75.00,
  descripcion = 'Nueva descripción',
  fecha = '2024-10-24'
WHERE id = 'transaction-uuid-here'
  AND user_id = 'user-uuid-here'
RETURNING *;
```

**Nota:** El trigger recalculará automáticamente los KPIs del período afectado.

#### 10. Eliminar Transacción

```sql
DELETE FROM contable_transactions
WHERE id = 'transaction-uuid-here'
  AND user_id = 'user-uuid-here';
```

**Nota:** El trigger recalculará automáticamente los KPIs del período afectado.

#### 11. Obtener Transacciones por Categoría

```sql
SELECT 
  c.nombre as categoria,
  SUM(t.monto) as total,
  COUNT(*) as cantidad
FROM contable_transactions t
JOIN contable_categories c ON t.category_id = c.id
WHERE t.user_id = 'user-uuid-here'
  AND t.fecha >= '2024-10-01'
  AND t.fecha <= '2024-10-31'
GROUP BY c.nombre
ORDER BY total DESC;
```

#### 12. Obtener Resumen Diario de Transacciones

```sql
SELECT 
  fecha,
  SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as ingresos,
  SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as gastos,
  COUNT(*) as num_transacciones
FROM contable_transactions
WHERE user_id = 'user-uuid-here'
  AND fecha >= '2024-10-01'
  AND fecha <= '2024-10-31'
GROUP BY fecha
ORDER BY fecha DESC;
```

---

## 🌐 APIS DISPONIBLES

### 1. GET /api/transactions

**Descripción:** Obtener transacciones del usuario autenticado.

**Autenticación:** Requerida (Bearer token)

**Query Parameters:**
- `periodo`: Período en formato `YYYY-MM` (ej: `2024-10`)
- `tipo`: Tipo de transacción (`ingreso`, `gasto`, `inversion`, `ahorro`, `transferencia`)
- `categoria`: ID de categoría
- `fecha_desde`: Fecha de inicio (YYYY-MM-DD)
- `fecha_hasta`: Fecha de fin (YYYY-MM-DD)
- `limit`: Límite de resultados
- `offset`: Offset para paginación

**Ejemplo:**
```bash
curl -X GET "http://localhost:3000/api/transactions?periodo=2024-10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. POST /api/transactions

**Descripción:** Crear una nueva transacción.

**Autenticación:** Requerida (Bearer token)

**Body:**
```json
{
  "tipo": "gasto",
  "monto": 50.00,
  "descripcion": "Descripción de la transacción",
  "fecha": "2024-10-23",
  "metodo_pago": "tarjeta",
  "account_id": "uuid-optional",
  "category_id": "uuid-optional"
}
```

**Ejemplo:**
```bash
curl -X POST "http://localhost:3000/api/transactions" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "gasto",
    "monto": 50.00,
    "descripcion": "Test",
    "fecha": "2024-10-23"
  }'
```

### 3. PUT /api/transactions/[id]

**Descripción:** Actualizar una transacción existente.

**Autenticación:** Requerida (Bearer token)

**Body:**
```json
{
  "tipo": "gasto",
  "monto": 75.00,
  "descripcion": "Nueva descripción",
  "fecha": "2024-10-24"
}
```

**Ejemplo:**
```bash
curl -X PUT "http://localhost:3000/api/transactions/transaction-uuid" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "monto": 75.00,
    "descripcion": "Actualizada"
  }'
```

### 4. DELETE /api/transactions/[id]

**Descripción:** Eliminar una transacción.

**Autenticación:** Requerida (Bearer token)

**Ejemplo:**
```bash
curl -X DELETE "http://localhost:3000/api/transactions/transaction-uuid" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. POST /api/webhook/n8n

**Descripción:** Webhook para n8n (bypassa autenticación normal, usa token especial).

**Autenticación:** Requerida (Bearer token del webhook)

**Body:**
```json
{
  "telefono": "+34612345678",
  "tipo": "gasto",
  "monto": 50.00,
  "descripcion": "Transacción desde Telegram",
  "fecha": "2024-10-23",
  "metodo_pago": "telegram"
}
```

**Ejemplo:**
```bash
curl -X POST "http://localhost:3000/api/webhook/n8n" \
  -H "Authorization: Bearer WEBHOOK_SECRET_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "telefono": "+34612345678",
    "tipo": "gasto",
    "monto": 50.00,
    "descripcion": "Test desde n8n"
  }'
```

**Nota:** Este endpoint:
- Busca o crea el usuario por teléfono
- Crea la transacción automáticamente
- Registra la acción en audit_logs
- Usa `supabaseServer` (bypassa RLS)

### 6. GET /api/advice

**Descripción:** Obtener recomendaciones del usuario autenticado.

**Autenticación:** Requerida (Bearer token)

### 7. POST /api/advice/generate

**Descripción:** Generar recomendaciones con IA para el período especificado.

**Autenticación:** Requerida (Bearer token)

**Body:**
```json
{
  "periodo": "2024-10"
}
```

---

## 🔌 CONEXIÓN DESDE N8N

### Opción 1: PostgreSQL Directo

**Ventajas:**
- Acceso directo a la base de datos
- Más rápido para queries complejas
- Permite usar todas las funciones SQL

**Desventajas:**
- Requiere Service Role Key (bypassa RLS)
- Menos seguro (requiere manejar credenciales)
- No usa las APIs REST

**Conexión:**
```
Host: tu-proyecto.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: [SUPABASE_DB_PASSWORD]
```

**Nota:** Para bypassar RLS, necesitas usar el Service Role Key o conectarte como usuario específico.

### Opción 2: API REST (Recomendado)

**Ventajas:**
- Más seguro (usa autenticación por token)
- Respetan RLS automáticamente
- Validación de datos integrada
- Logs de auditoría automáticos

**Desventajas:**
- Ligeramente más lento
- Limitado a las operaciones expuestas en las APIs

**Endpoints disponibles:**
- `POST /api/webhook/n8n` - Para crear transacciones desde Telegram
- `GET /api/transactions` - Para consultar transacciones
- `PUT /api/transactions/[id]` - Para actualizar transacciones
- `DELETE /api/transactions/[id]` - Para eliminar transacciones

**Autenticación:**
- **Webhook:** Usa `WEBHOOK_SECRET_TOKEN` en header `Authorization: Bearer TOKEN`
- **API normal:** Requiere token de sesión del usuario (Bearer token de Supabase Auth)

### Opción 3: PostgreSQL con Service Role (Solo para queries)

**Uso:** Para consultas de solo lectura o cuando necesitas bypassar RLS.

**Importante:** Usa solo cuando sea absolutamente necesario (creación de usuarios, logs de auditoría, etc.).

---

## 📋 RESUMEN PARA EL AGENTE N8N

### Tablas Principales

1. **contable_users** - Usuarios (buscar por `telefono` o `email`)
2. **contable_transactions** - Transacciones (buscar/crear/modificar por `user_id`)
3. **contable_kpi_summary** - KPIs calculados (consultar por `user_id` y `periodo`)
4. **contable_categories** - Categorías disponibles (tabla compartida)

### Operaciones Más Comunes

1. **Buscar usuario:** `SELECT * FROM contable_users WHERE telefono = ?`
2. **Crear transacción:** `INSERT INTO contable_transactions (...)`
3. **Consultar transacciones:** `SELECT * FROM contable_transactions WHERE user_id = ? AND fecha BETWEEN ? AND ?`
4. **Sumar gastos:** `SELECT SUM(monto) FROM contable_transactions WHERE user_id = ? AND tipo = 'gasto' AND fecha BETWEEN ? AND ?`
5. **Sumar ingresos:** `SELECT SUM(monto) FROM contable_transactions WHERE user_id = ? AND tipo = 'ingreso' AND fecha BETWEEN ? AND ?`
6. **Obtener KPIs:** `SELECT * FROM contable_kpi_summary WHERE user_id = ? AND periodo = ?`

### Importante para el Agente

- **RLS está habilitado:** El agente debe usar Service Role Key o APIs REST para bypassar RLS
- **Triggers automáticos:** Al insertar/modificar/eliminar transacciones, los KPIs se recalculan automáticamente
- **Validaciones:** Tipo debe ser: `ingreso`, `gasto`, `inversion`, `ahorro`, `transferencia`
- **Formato de fecha:** `YYYY-MM-DD` para fechas, `YYYY-MM` para períodos
- **Usuario por teléfono:** El webhook de n8n crea usuarios automáticamente si no existen

---

## 🎯 PRÓXIMOS PASOS

El siguiente documento (`N8N-AGENT-CONFIG.md`) detallará cómo configurar el agente en n8n para interactuar con esta base de datos.

