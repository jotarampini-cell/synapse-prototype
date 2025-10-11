import { useEffect, useCallback } from 'react'

interface KeyboardShortcut {
	key: string
	ctrlKey?: boolean
	metaKey?: boolean
	shiftKey?: boolean
	altKey?: boolean
	action: () => void
	description?: string
}

interface UseKeyboardShortcutsOptions {
	enabled?: boolean
	preventDefault?: boolean
}

/**
 * Hook personalizado para manejar atajos de teclado de manera segura
 * Evita problemas de orden de hooks y proporciona una API limpia
 */
export function useKeyboardShortcuts(
	shortcuts: KeyboardShortcut[],
	options: UseKeyboardShortcutsOptions = {}
) {
	const { enabled = true, preventDefault = true } = options

	const handleKeyDown = useCallback((e: KeyboardEvent) => {
		if (!enabled) return

		// Buscar el atajo que coincida
		const matchedShortcut = shortcuts.find(shortcut => {
			return (
				shortcut.key === e.key &&
				!!shortcut.ctrlKey === e.ctrlKey &&
				!!shortcut.metaKey === e.metaKey &&
				!!shortcut.shiftKey === e.shiftKey &&
				!!shortcut.altKey === e.altKey
			)
		})

		if (matchedShortcut) {
			if (preventDefault) {
				e.preventDefault()
			}
			matchedShortcut.action()
		}
	}, [shortcuts, enabled, preventDefault])

	useEffect(() => {
		if (!enabled) return

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [handleKeyDown, enabled])
}

/**
 * Hook específico para atajos de teclado comunes en la aplicación
 */
export function useAppKeyboardShortcuts(options: {
	onToggleSearch?: () => void
	onNewNote?: () => void
	onToggleSidebar?: () => void
	onToggleAIPanel?: () => void
	onClosePanels?: () => void
	enabled?: boolean
}) {
	const {
		onToggleSearch,
		onNewNote,
		onToggleSidebar,
		onToggleAIPanel,
		onClosePanels,
		enabled = true
	} = options

	const shortcuts: KeyboardShortcut[] = [
		{
			key: 'k',
			ctrlKey: true,
			metaKey: true,
			action: () => onToggleSearch?.(),
			description: 'Abrir búsqueda'
		},
		{
			key: 'n',
			ctrlKey: true,
			metaKey: true,
			action: () => onNewNote?.(),
			description: 'Nueva nota'
		},
		{
			key: 'b',
			ctrlKey: true,
			metaKey: true,
			action: () => onToggleSidebar?.(),
			description: 'Alternar sidebar'
		},
		{
			key: '/',
			ctrlKey: true,
			metaKey: true,
			action: () => onToggleAIPanel?.(),
			description: 'Alternar panel de IA'
		},
		{
			key: 'Escape',
			action: () => onClosePanels?.(),
			description: 'Cerrar paneles'
		}
	]

	useKeyboardShortcuts(shortcuts, { enabled })
}