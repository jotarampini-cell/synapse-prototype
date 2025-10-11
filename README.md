# Synapse - Tu Segundo Cerebro

Una aplicación de gestión de conocimiento impulsada por IA que te permite capturar, procesar y descubrir conexiones entre tus ideas.

## 🚀 Características

- **Autenticación completa** con email/password y Google OAuth
- **Captura de contenido** en múltiples formatos (texto, URL, archivos, voz)
- **Procesamiento con IA** usando Google Gemini para resúmenes y extracción de conceptos
- **Búsqueda semántica** con embeddings vectoriales
- **Grafo de conocimiento** interactivo para visualizar conexiones
- **Dashboard personalizado** con estadísticas y resúmenes

## 🛠️ Tecnologías

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **IA**: Google Gemini API
- **Búsqueda**: pgvector para embeddings
- **UI**: Radix UI, Lucide Icons

## 📋 Configuración

### 1. Clonar y instalar dependencias

```bash
git clone <tu-repo>
cd synapse-prototype
npm install
```

### 2. Configurar Supabase

1. Crear un proyecto en [Supabase](https://supabase.com)
2. Ejecutar el esquema SQL:
   ```bash
   # En el SQL Editor de Supabase, ejecutar:
   # - supabase-schema.sql
   # - supabase-functions.sql
   ```
3. Habilitar la extensión `pgvector` en la configuración de la base de datos
4. Configurar Google OAuth en Authentication > Providers

### 3. Configurar Google Gemini

1. Obtener API key de [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Instalar Gemini CLI:
   ```bash
   npm install -g @google/generative-ai-cli
   gemini-cli configure
   ```

### 4. Variables de entorno

Crear archivo `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key

# Gemini API
GEMINI_API_KEY=tu_gemini_api_key

# Google OAuth (para Supabase)
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret

# URL del sitio (para OAuth redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 5. Ejecutar la aplicación

```bash
npm run dev
```

## 🗄️ Esquema de Base de Datos

### Tablas principales:

- **profiles**: Perfiles de usuario extendidos
- **contents**: Contenidos/notas con embeddings
- **summaries**: Resúmenes generados por IA
- **connections**: Conexiones entre conceptos
- **graph_nodes**: Nodos del grafo de conocimiento

### Funciones SQL:

- **match_contents()**: Búsqueda semántica con vectores
- **get_user_stats()**: Estadísticas del usuario
- **get_graph_data()**: Datos del grafo

## 🔐 Autenticación

La aplicación soporta:
- Registro/inicio de sesión con email y contraseña
- OAuth con Google
- Protección de rutas con middleware
- Row Level Security (RLS) en todas las tablas

## 🤖 Integración con IA

### Gemini API se usa para:
- **Embeddings**: Generar vectores para búsqueda semántica
- **Resúmenes**: Crear resúmenes automáticos del contenido
- **Extracción de conceptos**: Identificar conceptos clave
- **Sugerencias de conexiones**: Proponer relaciones entre ideas
- **Extracción de URL**: Procesar contenido de enlaces

## 🔍 Búsqueda Semántica

- Usa embeddings vectoriales de Gemini
- Búsqueda por similitud coseno
- Fallback a búsqueda de texto si falla
- Resultados ordenados por relevancia

## 📊 Dashboard

Muestra:
- Estadísticas del usuario (contenidos, conexiones, nodos)
- Resúmenes recientes generados por IA
- Sugerencias de conexiones
- Estado de procesamiento

## 🎯 Flujo de Usuario

1. **Registro/Login** → Autenticación
2. **Onboarding** → Configurar intereses
3. **Dashboard** → Ver resumen y estadísticas
4. **Añadir contenido** → Capturar ideas
5. **Búsqueda** → Encontrar información
6. **Grafo** → Visualizar conexiones

## 🚀 Deployment

### Vercel (Recomendado)

1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Deploy automático

### Variables de entorno en producción:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url_prod
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key_prod
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key_prod
GEMINI_API_KEY=tu_gemini_api_key
NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
```

## 🐛 Solución de Problemas

### Error de dependencias
```bash
npm install --legacy-peer-deps
```

### Error de pgvector
- Verificar que la extensión esté habilitada en Supabase
- Ejecutar: `CREATE EXTENSION IF NOT EXISTS vector;`

### Error de autenticación
- Verificar configuración de OAuth en Supabase
- Comprobar URLs de redirect

### Error de Gemini API
- Verificar API key
- Comprobar límites de cuota

## 📝 Notas de Desarrollo

- La aplicación usa Server Actions de Next.js para operaciones de backend
- RLS está habilitado en todas las tablas para seguridad
- Los embeddings se generan automáticamente al crear contenido
- El grafo se actualiza dinámicamente con nuevos conceptos

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.








