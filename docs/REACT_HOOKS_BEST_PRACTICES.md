# 🎣 Mejores Prácticas de React Hooks

## 🚨 Reglas de los Hooks

### 1. **Siempre llamar hooks en el nivel superior**
❌ **NUNCA** llames hooks dentro de:
- Loops
- Condiciones
- Funciones anidadas
- Event handlers

```typescript
// ❌ INCORRECTO
function MyComponent() {
  if (condition) {
    const [state, setState] = useState(0) // ❌ Hook en condición
  }
  
  return <div>...</div>
}

// ✅ CORRECTO
function MyComponent() {
  const [state, setState] = useState(0) // ✅ Hook en nivel superior
  
  if (condition) {
    // Lógica condicional aquí
  }
  
  return <div>...</div>
}
```

### 2. **Orden consistente de hooks**
Los hooks deben ejecutarse en el mismo orden en cada render.

```typescript
// ❌ INCORRECTO - Hooks después de returns condicionales
function MyComponent() {
  const [state, setState] = useState(0)
  
  if (loading) {
    return <div>Loading...</div> // ❌ Return temprano
  }
  
  useEffect(() => { // ❌ Hook después de return condicional
    // ...
  }, [])
  
  return <div>...</div>
}

// ✅ CORRECTO - Todos los hooks antes de returns condicionales
function MyComponent() {
  const [state, setState] = useState(0)
  
  useEffect(() => { // ✅ Hook antes de returns condicionales
    // ...
  }, [])
  
  if (loading) {
    return <div>Loading...</div>
  }
  
  return <div>...</div>
}
```

## 🛠️ Hooks Personalizados

### Crear hooks reutilizables
```typescript
// hooks/use-keyboard-shortcuts.ts
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Lógica de atajos
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}
```

### Hooks con dependencias condicionales
```typescript
// ✅ CORRECTO - Hook siempre se ejecuta, pero con lógica condicional
function useConditionalEffect(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return // ✅ Lógica condicional dentro del hook
    
    // Lógica del efecto
  }, [enabled])
}
```

## 🔧 Solución de Problemas Comunes

### Error: "Rendered more hooks than during the previous render"
**Causa**: Hooks ejecutándose condicionalmente
**Solución**: Mover todos los hooks al nivel superior

### Error: "React has detected a change in the order of Hooks"
**Causa**: Orden de hooks inconsistente entre renders
**Solución**: Reorganizar hooks para que siempre se ejecuten en el mismo orden

### Error: "Cannot read property of undefined"
**Causa**: Hook ejecutándose antes de que las dependencias estén listas
**Solución**: Usar validaciones o estados de loading

## 📋 Checklist de Hooks

Antes de implementar un componente con hooks:

- [ ] ¿Todos los hooks están en el nivel superior?
- [ ] ¿Los hooks se ejecutan en el mismo orden en cada render?
- [ ] ¿Los returns condicionales están después de todos los hooks?
- [ ] ¿Las dependencias de useEffect están correctamente definidas?
- [ ] ¿Los hooks personalizados siguen las reglas de hooks?

## 🎯 Patrones Recomendados

### 1. Hook de autenticación
```typescript
function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Lógica de autenticación
  }, [])
  
  return { user, loading }
}
```

### 2. Hook de detección móvil
```typescript
function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return { isMobile }
}
```

### 3. Hook de atajos de teclado
```typescript
function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Lógica de atajos
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}
```

## 🚀 Beneficios de Seguir las Mejores Prácticas

1. **🛡️ Prevención de errores**: Evita bugs relacionados con hooks
2. **🔄 Consistencia**: Código más predecible y mantenible
3. **⚡ Performance**: Mejor optimización de React
4. **🧪 Testabilidad**: Hooks más fáciles de probar
5. **📚 Legibilidad**: Código más claro y comprensible

---

**💡 Recuerda**: Los hooks son poderosos, pero requieren disciplina. Siempre sigue las reglas de hooks para evitar problemas.




