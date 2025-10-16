# Test de Performance de Navegación

## Instrucciones de Prueba

### 1. Verificar Prefetch
1. Abrir http://localhost:3000/notes
2. Abrir DevTools → Network tab
3. Hacer hover sobre los links de navegación (Home, Tareas, etc.)
4. **Verificar**: Deberían aparecer requests de prefetch en la pestaña Network

### 2. Verificar Estado Persistente
1. Ir a http://localhost:3000/notes
2. Hacer scroll hacia abajo
3. Navegar a Home (click en logo o link)
4. Regresar a Notes
5. **Verificar**: El scroll debería mantenerse en la misma posición

### 3. Verificar Caché de Datos
1. Ir a http://localhost:3000/notes
2. Abrir DevTools → Console
3. **Verificar**: Deberían aparecer logs como:
   - "Notes page - isMobile: true/false"
   - "Notes page - contents: [...]"
   - "Notes page - folders: [...]"
   - "Notes page - pageState: {...}"

### 4. Verificar Navegación Rápida
1. Ir a http://localhost:3000/notes
2. Navegar a Home
3. Navegar a Notes
4. **Verificar**: La navegación debería ser instantánea (sin loading)

## Problemas Comunes

### Si no funciona el prefetch:
- Verificar que los Links tengan `prefetch={true}`
- Verificar que Next.js esté configurado correctamente

### Si no funciona el estado persistente:
- Verificar que AppStateProvider esté en el layout
- Verificar que usePersistedState esté siendo usado
- Revisar console para errores

### Si no funciona el caché de datos:
- Verificar que SWR esté instalado
- Verificar que los hooks estén siendo usados
- Revisar console para errores de SWR

## Logs Esperados

En la consola deberías ver:
```
Notes page - isMobile: true
Notes page - contents: Array(0) o Array(n)
Notes page - folders: Array(0) o Array(n)
Notes page - pageState: {scrollPosition: 0, currentView: "folders", ...}
```
