# 🔧 Configuración de Synapse

## Variables de Entorno Requeridas

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Gemini API Configuration (YA CONFIGURADO)
GEMINI_API_KEY=AIzaSyAbJ2-IRbdX7OarBEb-N2UOcR64PVLaHE0

# Google OAuth Configuration (for Supabase)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# URL del sitio (para OAuth redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 🚀 Pasos para Configurar Supabase

### 1. Crear Proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Anota la URL y las claves API

### 2. Configurar Base de Datos
Ejecuta estos archivos SQL en el SQL Editor de Supabase:

1. **Primero**: `supabase-schema.sql` - Esquema completo de la base de datos
2. **Segundo**: `supabase-functions.sql` - Funciones SQL para búsqueda semántica

### 3. Habilitar pgvector
En la configuración de la base de datos de Supabase:
1. Ve a Settings > Database
2. Busca "Extensions"
3. Habilita la extensión `pgvector`

### 4. Configurar Google OAuth
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un proyecto o selecciona uno existente
3. Habilita la Google+ API
4. Crea credenciales OAuth 2.0
5. En Supabase, ve a Authentication > Providers
6. Habilita Google y añade las credenciales

## 🎯 Comandos para Ejecutar

```bash
# Instalar dependencias
npm install --legacy-peer-deps

# Ejecutar en desarrollo
npm run dev

# La aplicación estará disponible en http://localhost:3000
```

## ✅ Verificación

Una vez configurado todo:
1. La aplicación debería cargar sin errores
2. Podrás registrarte e iniciar sesión
3. El onboarding funcionará correctamente
4. Podrás añadir contenido y ver el procesamiento con IA
5. La búsqueda semántica funcionará
6. El grafo de conocimiento se actualizará dinámicamente

## 🔗 Repositorio GitHub

El código está conectado al repositorio: https://github.com/jotarampini-cell/SynapseAI.git

## 📝 Notas Importantes

- El API key de Gemini ya está configurado
- Solo necesitas configurar Supabase y Google OAuth
- Todos los archivos de la aplicación están listos
- La base de datos se configurará automáticamente con los archivos SQL













