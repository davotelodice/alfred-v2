# 💰 Asistente Contable Inteligente

Sistema de gestión financiera personal con integración de Telegram y automatización mediante n8n. Permite registrar y consultar transacciones financieras (ingresos, gastos, ahorros, inversiones) desde Telegram usando inteligencia artificial.

## 🚀 Características

- 📱 **Integración con Telegram**: Registra transacciones directamente desde Telegram
- 🤖 **IA Integrada**: Procesa mensajes naturales y extractos bancarios automáticamente
- 📊 **Dashboard Web**: Visualiza tus finanzas con gráficos y KPIs
- 🔒 **Seguridad**: Row Level Security (RLS) en Supabase
- 🔄 **Automatización**: Triggers automáticos para recálculo de KPIs
- 📄 **Procesamiento de Extractos**: Procesa PDFs de extractos bancarios automáticamente

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de Datos**: PostgreSQL (Supabase)
- **Autenticación**: Supabase Auth
- **IA**: OpenAI GPT
- **Automatización**: n8n (requerido para integración con Telegram)

## 📋 Requisitos Previos

- **Node.js 18.17 o superior** (Next.js 14 requiere Node.js 18.17+)
- npm o yarn
- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [OpenAI](https://platform.openai.com) (opcional, para consejos IA)
- Instancia de [n8n](https://n8n.io) (para integración con Telegram)
- Bot de Telegram configurado

## 🔧 Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/davotelodice/alfred-v2.git
cd alfred-v2/bandeja
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Copia el archivo `env.example` a `.env.local`:

```bash
cp env.example .env.local
```

Edita `.env.local` con tus credenciales:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# OpenAI (Opcional - para consejos IA)
OPENAI_API_KEY=sk-tu-api-key-de-openai
OPENAI_MODEL=gpt-4o-mini

# Webhooks (Genera un token seguro)
WEBHOOK_SECRET_TOKEN=tu-token-secreto-para-webhooks
```

**⚠️ IMPORTANTE**: 
- Nunca commitees el archivo `.env.local`
- Genera un `WEBHOOK_SECRET_TOKEN` seguro (puedes usar: `openssl rand -hex 32`)

### 4. Configurar Base de Datos en Supabase

1. Crea un nuevo proyecto en Supabase
2. Ve a SQL Editor
3. Ejecuta el script SQL completo desde `docs/DATABASE-SETUP.md`
4. Verifica que todas las tablas, políticas RLS y triggers se hayan creado correctamente

### 5. Ejecutar en Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### 6. Configurar n8n

Consulta la documentación completa en `docs/N8N-SETUP.md` para configurar los flujos de n8n que integran Telegram con el sistema.

## 📚 Documentación

Consulta el [índice de documentación](docs/README.md) para ver todos los documentos disponibles.

**Documentos principales:**
- **[DATABASE-SETUP.md](docs/DATABASE-SETUP.md)**: Script SQL completo para crear la base de datos
- **[N8N-SETUP.md](docs/N8N-SETUP.md)**: Guía completa de configuración de n8n
- **[DATABASE-SCHEMA.md](docs/DATABASE-SCHEMA.md)**: Documentación del esquema de base de datos

## 🏗️ Estructura del Proyecto

```
bandeja/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API Routes
│   │   ├── dashboard/    # Dashboard de usuario
│   │   └── auth/         # Páginas de autenticación
│   ├── components/       # Componentes React
│   └── lib/              # Utilidades y clientes
├── docs/                 # Documentación
└── sql/                  # Scripts SQL
```

## 🔐 Seguridad

- ✅ Row Level Security (RLS) habilitado en todas las tablas
- ✅ Autenticación mediante Supabase Auth
- ✅ Webhooks protegidos con Bearer Token
- ✅ Validación de datos en todas las APIs
- ✅ Logs de auditoría automáticos

## 📝 Uso Básico

### Registro de Usuario

1. Accede a `/auth` y crea una cuenta
2. Inicia sesión
3. Ve a tu perfil y vincula tu `telegram_chat_id`

### Registrar Transacciones desde Telegram

Envía mensajes a tu bot de Telegram:

```
Gasté 50 euros en supermercado
Ingresé 1500 de salario
Ahorré 200 euros hoy
```

El bot procesará automáticamente tus mensajes y registrará las transacciones.

### Consultar Transacciones

Desde Telegram:

```
Quiero saber mis gastos
Muéstrame mis ingresos de octubre
Cuánto gasté este mes
```

## 🚢 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en Vercel
3. Despliega

### Otras Plataformas

El proyecto es compatible con cualquier plataforma que soporte Next.js:
- Netlify
- Railway
- Render
- AWS Amplify

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación en `docs/`
2. Abre un issue en GitHub
3. Consulta los logs de la aplicación

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org)
- [Supabase](https://supabase.com)
- [n8n](https://n8n.io)
- [OpenAI](https://openai.com)
