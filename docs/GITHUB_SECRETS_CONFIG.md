# 🔐 Configuración de Secretos en GitHub

## Secretos Detectados por GitHub

GitHub detectó los siguientes secretos en el commit y los bloqueó por seguridad:

- **Google OAuth Client ID**
- **Google OAuth Client Secret**

## Pasos para Configurar Secretos

### 1. Configurar en GitHub Repository

1. **Ir al repositorio:** `https://github.com/jotarampini-cell/SynapseAI`
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret** para cada uno:

```
GOOGLE_OAUTH_CLIENT_ID=tu-google-client-id
GOOGLE_OAUTH_CLIENT_SECRET=tu-google-client-secret
```

### 2. Variables de Entorno Completas

```bash
# =================================
# SUPABASE
# =================================
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# =================================
# GOOGLE OAUTH
# =================================
GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-oauth-client-secret

# =================================
# GEMINI AI (Opcional)
# =================================
GEMINI_API_KEY=your-gemini-api-key

# =================================
# NEXTAUTH
# =================================
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXTAUTH_URL=http://localhost:3000

# =================================
# FUNCIONALIDADES AVANZADAS (Opcional)
# =================================
# ENABLE_REALTIME_SYNC=true
# ENABLE_PUSH_NOTIFICATIONS=true
# ENABLE_TOUCH_GESTURES=true
```

### 3. Configurar en Vercel (Recomendado)

1. **Ir a Vercel Dashboard**
2. **Tu Proyecto** → **Settings** → **Environment Variables**
3. **Add** cada variable de entorno
4. **Redeploy** el proyecto

### 4. Configurar en Netlify (Alternativa)

1. **Site settings** → **Environment variables**
2. **Add variable** para cada secreto
3. **Deploy site** nuevamente

## Verificación

Después de configurar los secretos:

1. **Verificar en GitHub:** Los secretos aparecen en Settings → Secrets
2. **Verificar en Vercel/Netlify:** Las variables están configuradas
3. **Test local:** Crear `.env.local` con los valores reales
4. **Deploy:** Hacer push y verificar que funciona

## Seguridad

- ✅ **Nunca** commits secretos en el código
- ✅ **Siempre** usa variables de entorno
- ✅ **Usa** `.env.example` para documentar variables necesarias
- ✅ **Rota** secretos regularmente
- ✅ **Usa** diferentes secretos para desarrollo/producción

## Troubleshooting

### Error: "Repository rule violations found"
- **Causa:** Secretos detectados en el commit
- **Solución:** Configurar secretos en GitHub Settings

### Error: "Environment variable not found"
- **Causa:** Variable no configurada en deployment
- **Solución:** Agregar variable en Vercel/Netlify

### Error: "Invalid OAuth credentials"
- **Causa:** Client ID/Secret incorrectos
- **Solución:** Verificar credenciales en Google Console
