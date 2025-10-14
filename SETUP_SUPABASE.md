# 🚀 Configuración Rápida de Supabase para Synapse

## 📋 Pasos para Configurar Supabase

### 1. Crear Proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Haz clic en "New Project"
4. Elige tu organización
5. Nombre del proyecto: `SynapseAI`
6. Contraseña de la base de datos: (guárdala bien)
7. Región: Elige la más cercana a ti
8. Haz clic en "Create new project"

### 2. Obtener Credenciales
Una vez creado el proyecto:
1. Ve a Settings > API
2. Copia estos valores:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon public** key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **service_role** key (SUPABASE_SERVICE_ROLE_KEY)

### 3. Configurar Base de Datos
1. Ve al **SQL Editor** en el panel izquierdo
2. Haz clic en "New query"
3. Copia y pega el contenido de `supabase-schema.sql`
4. Haz clic en "Run" para ejecutar el esquema
5. Luego copia y pega el contenido de `supabase-functions.sql`
6. Haz clic en "Run" para ejecutar las funciones

### 4. Habilitar pgvector
1. Ve a Settings > Database
2. Busca la sección "Extensions"
3. Busca "vector" y haz clic en el toggle para habilitarlo
4. Confirma la activación

### 5. Configurar Google OAuth (Opcional)
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un proyecto o selecciona uno existente
3. Habilita la Google+ API
4. Ve a Credentials > Create Credentials > OAuth 2.0 Client IDs
5. Tipo: Web application
6. Authorized redirect URIs: `https://tu-proyecto.supabase.co/auth/v1/callback`
7. Copia el Client ID y Client Secret
8. En Supabase, ve a Authentication > Providers
9. Habilita Google y pega las credenciales

### 6. Crear Archivo .env.local
Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# Gemini API Configuration (YA CONFIGURADO)
GEMINI_API_KEY=AIzaSyAbJ2-IRbdX7OarBEb-N2UOcR64PVLaHE0

# Google OAuth Configuration (Opcional)
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret

# URL del sitio
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 7. Ejecutar la Aplicación
```bash
# Instalar dependencias
npm install --legacy-peer-deps

# Ejecutar en desarrollo
npm run dev
```

## ✅ Verificación
Una vez configurado todo:
1. La aplicación debería cargar en http://localhost:3000
2. Podrás registrarte con email/password
3. El onboarding funcionará
4. Podrás añadir contenido y ver el procesamiento con IA
5. La búsqueda semántica funcionará
6. El grafo se actualizará dinámicamente

## 🔗 Repositorio
Código disponible en: https://github.com/jotarampini-cell/SynapseAI.git

## 🆘 Solución de Problemas

### Error de pgvector
- Asegúrate de que la extensión esté habilitada
- Ejecuta: `CREATE EXTENSION IF NOT EXISTS vector;`

### Error de autenticación
- Verifica que las URLs de redirect estén configuradas correctamente
- Comprueba que las claves API sean correctas

### Error de permisos
- Verifica que RLS esté habilitado en todas las tablas
- Comprueba que las políticas de seguridad estén activas











