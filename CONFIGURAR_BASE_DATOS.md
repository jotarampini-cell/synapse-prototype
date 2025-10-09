# 🗄️ Configuración de Base de Datos - Synapse

## ✅ Variables de Entorno Configuradas

Las variables de entorno ya están configuradas en `.env.local`:

- ✅ **Supabase URL**: https://nyirmouqrptuvsxffxlv.supabase.co
- ✅ **API Keys**: Configuradas
- ✅ **Google OAuth**: Configurado
- ✅ **Gemini API**: Configurado

## 🚀 Pasos para Configurar la Base de Datos

### 1. Acceder al Panel de Supabase
1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Inicia sesión en tu cuenta
3. Selecciona tu proyecto: `nyirmouqrptuvsxffxlv`

### 2. Habilitar Extensión pgvector
1. En el panel izquierdo, ve a **Settings** > **Database**
2. Busca la sección **Extensions**
3. Busca **vector** y haz clic en el toggle para habilitarlo
4. Confirma la activación

### 3. Ejecutar Esquema de Base de Datos
1. En el panel izquierdo, ve a **SQL Editor**
2. Haz clic en **New query**
3. Copia y pega el contenido completo del archivo `supabase-schema.sql`
4. Haz clic en **Run** para ejecutar el esquema

### 4. Ejecutar Funciones SQL
1. En el SQL Editor, crea otra **New query**
2. Copia y pega el contenido completo del archivo `supabase-functions.sql`
3. Haz clic en **Run** para ejecutar las funciones

### 5. Configurar Google OAuth (Opcional)
1. En el panel izquierdo, ve a **Authentication** > **Providers**
2. Busca **Google** y haz clic en el toggle para habilitarlo
3. Pega las credenciales (consulta el archivo .env.local para los valores):
   - **Client ID**: [Valor de GOOGLE_CLIENT_ID en .env.local]
   - **Client Secret**: [Valor de GOOGLE_CLIENT_SECRET en .env.local]
4. Guarda la configuración

## 🎯 Ejecutar la Aplicación

Una vez configurada la base de datos:

```bash
# Instalar dependencias
npm install --legacy-peer-deps

# Ejecutar en desarrollo
npm run dev
```

La aplicación estará disponible en: **http://localhost:3000**

## ✅ Verificación

Después de configurar todo:

1. **Registro**: Deberías poder registrarte con email/password
2. **Google OAuth**: Deberías poder iniciar sesión con Google
3. **Onboarding**: El flujo de configuración inicial funcionará
4. **Dashboard**: Verás estadísticas reales
5. **Añadir Contenido**: Podrás crear notas y ver el procesamiento con IA
6. **Búsqueda**: La búsqueda semántica funcionará
7. **Grafo**: El grafo de conocimiento se actualizará dinámicamente

## 🔧 Solución de Problemas

### Error de pgvector
- Asegúrate de que la extensión esté habilitada
- Ejecuta manualmente: `CREATE EXTENSION IF NOT EXISTS vector;`

### Error de autenticación
- Verifica que las URLs de redirect estén configuradas
- Comprueba que las claves API sean correctas

### Error de permisos
- Verifica que RLS esté habilitado en todas las tablas
- Comprueba que las políticas de seguridad estén activas

## 📊 Estructura de la Base de Datos

Después de ejecutar los scripts SQL, tendrás estas tablas:

- **profiles**: Perfiles de usuario extendidos
- **contents**: Contenidos/notas con embeddings
- **summaries**: Resúmenes generados por IA
- **connections**: Conexiones entre conceptos
- **graph_nodes**: Nodos del grafo de conocimiento

## 🎉 ¡Listo!

Una vez completados estos pasos, tu aplicación Synapse estará 100% funcional con:
- ✅ Autenticación completa
- ✅ Base de datos configurada
- ✅ IA integrada (Gemini)
- ✅ Búsqueda semántica
- ✅ Grafo de conocimiento dinámico
