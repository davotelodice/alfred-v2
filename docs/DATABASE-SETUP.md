# 🗄️ Configuración de Base de Datos en Supabase

Esta guía te ayudará a configurar la base de datos completa en Supabase para el Asistente Contable Inteligente.

## 📋 Requisitos Previos

- Cuenta en [Supabase](https://supabase.com)
- Proyecto creado en Supabase

## 🚀 Pasos de Configuración

### 1. Crear Proyecto en Supabase

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Crea un nuevo proyecto
3. Anota las credenciales:
   - **Project URL**: `https://tu-proyecto.supabase.co`
   - **Anon Key**: Se encuentra en Settings > API
   - **Service Role Key**: Se encuentra en Settings > API (⚠️ Mantén esto secreto)

### 2. Ejecutar Script SQL

1. Ve a **SQL Editor** en tu proyecto de Supabase
2. Crea una nueva query
3. **Copia y pega el contenido completo del archivo `sql/contable_schema.sql`**
4. Ejecuta el script haciendo clic en **RUN**

**📁 Archivo SQL:** `sql/contable_schema.sql`

**⚠️ IMPORTANTE:** Asegúrate de copiar TODO el contenido del archivo SQL, desde la primera línea hasta la última.

### 3. Verificar Instalación

Ejecuta esta query para verificar que todas las tablas se crearon:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'contable_%'
ORDER BY table_name;
```

Deberías ver estas tablas:
- `contable_users`
- `contable_transactions`
- `contable_accounts`
- `contable_categories`
- `contable_kpi_summary`
- `contable_advice`
- `contable_audit_logs`
- `contable_asientos`
- `contable_categorias_asientos`

## 📝 Script SQL

**⚠️ IMPORTANTE**: El script SQL completo está en el archivo `sql/contable_schema.sql` para facilitar su copia y pega.

**Para ejecutarlo:**

1. Abre el archivo `sql/contable_schema.sql` en tu editor de texto
2. Selecciona TODO el contenido (Ctrl+A / Cmd+A)
3. Copia el contenido completo
4. Ve a **SQL Editor** en Supabase
5. Pega el contenido en el editor
6. Haz clic en **RUN**

**📁 Ubicación del archivo:** `sql/contable_schema.sql`

**El script incluye:**
- ✅ Creación de todas las tablas
- ✅ Índices para optimización
- ✅ Políticas RLS (Row Level Security)
- ✅ Funciones para cálculo de KPIs
- ✅ Triggers automáticos
- ✅ Vistas para consultas
- ✅ Datos iniciales (categorías)
- ✅ Verificación final

## ✅ Verificación Post-Instalación

Después de ejecutar el script, verifica:

1. **Tablas creadas**: Deberías tener 9 tablas con prefijo `contable_`
2. **RLS habilitado**: Todas las tablas de usuario deben tener RLS activo
3. **Categorías insertadas**: Verifica que hay categorías en `contable_categories` y `contable_categorias_asientos`
4. **Triggers activos**: El trigger `trg_contable_transactions_kpi` debe estar activo

## 🔧 Troubleshooting

### Error: "relation already exists"
Si alguna tabla ya existe, puedes eliminarla primero:
```sql
DROP TABLE IF EXISTS contable_nombre_tabla CASCADE;
```

### Error: "permission denied"
Asegúrate de estar ejecutando el script como usuario `postgres` o con permisos de administrador.

### Verificar RLS
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'contable_%';
```

## 📚 Próximos Pasos

Una vez configurada la base de datos:

1. Configura las variables de entorno en tu aplicación
2. Configura n8n siguiendo `docs/N8N-SETUP.md`
3. Prueba la conexión ejecutando `npm run dev`

---

**¿Necesitas ayuda?** El script SQL está listo para copiar y pegar desde `sql/contable_schema.sql`. Si tienes problemas, verifica los logs de Supabase.

