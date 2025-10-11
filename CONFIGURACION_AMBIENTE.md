# 🔧 Configuración de Ambiente - Synapse

## 🚀 Inicio Rápido

### Opción 1: Configuración Automática (Recomendada)
```bash
npm run dev:setup
```
Este comando:
- ✅ Verifica si existe `.env.local`
- ✅ Lo crea automáticamente si no existe
- ✅ Inicia el servidor de desarrollo
- ✅ Mata procesos anteriores automáticamente

### Opción 2: Configuración Manual
```bash
# 1. Configurar variables de entorno
npm run setup

# 2. Iniciar servidor
npm run dev
```

## 📁 Archivos de Configuración

### `.env.local` (Generado automáticamente)
```env
NEXT_PUBLIC_SUPABASE_URL=https://nyirmouqrptuvsxffxlv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Scripts Disponibles
- `npm run setup` - Configura variables de entorno
- `npm run dev:setup` - Configuración + inicio automático
- `npm run dev` - Inicio normal (requiere configuración previa)

## 🔍 Solución de Problemas

### Error: "Supabase environment variables not found"
**Solución:**
```bash
npm run setup
npm run dev
```

### Error: "Port 3000 already in use"
**Solución:**
```bash
# El script dev:setup mata procesos automáticamente
npm run dev:setup
```

### Error: "Cannot find module"
**Solución:**
```bash
npm install
npm run dev:setup
```

## 🏗️ Arquitectura de Configuración

### Configuración Centralizada
- `lib/supabase/config.ts` - Configuración centralizada con fallbacks
- `setup-env.js` - Script de configuración automática
- `scripts/start-dev.js` - Script de inicio inteligente

### Fallbacks Integrados
La aplicación incluye valores por defecto hardcodeados para evitar fallos:
- URL de Supabase
- Clave anónima
- URL del sitio

## 🔄 Flujo de Configuración

1. **Verificación**: El sistema verifica si existe `.env.local`
2. **Creación**: Si no existe, se crea automáticamente
3. **Validación**: Se valida la configuración
4. **Inicio**: Se inicia el servidor con la configuración correcta

## 📋 Checklist de Configuración

- [ ] Variables de entorno configuradas
- [ ] Servidor iniciado sin errores
- [ ] Login funcionando
- [ ] OAuth de Google configurado (opcional)

## 🆘 Soporte

Si encuentras problemas:
1. Ejecuta `npm run dev:setup`
2. Verifica que no hay errores en la consola
3. Asegúrate de que el puerto 3000 esté libre
4. Revisa que las variables de entorno estén correctas

---

**💡 Tip**: Usa siempre `npm run dev:setup` para evitar problemas de configuración.




