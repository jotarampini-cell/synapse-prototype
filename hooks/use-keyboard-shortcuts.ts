"use client"

import { useEffect, useCallback } from "react"

export interface KeyboardShortcut {
	key: string
	ctrlKey?: boolean
	shiftKey?: boolean
	altKey?: boolean
	metaKey?: boolean
	action: () => void
	description: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
	const handleKeyDown = useCallback((event: KeyboardEvent) => {
		// Ignorar si estamos en un input, textarea o contenteditable
		const target = event.target as HTMLElement
		if (
			target.tagName === 'INPUT' ||
			target.tagName === 'TEXTAREA' ||
			target.contentEditable === 'true' ||
			target.closest('[contenteditable="true"]')
		) {
			// Solo permitir ciertos atajos en inputs
			const allowedInInputs = ['Escape']
			if (!allowedInInputs.includes(event.key)) {
				return
			}
		}

		// Buscar el atajo que coincida
		const matchingShortcut = shortcuts.find(shortcut => {
			return (
				shortcut.key.toLowerCase() === event.key.toLowerCase() &&
				!!shortcut.ctrlKey === event.ctrlKey &&
				!!shortcut.shiftKey === event.shiftKey &&
				!!shortcut.altKey === event.altKey &&
				!!shortcut.metaKey === event.metaKey
			)
		})

		if (matchingShortcut) {
			event.preventDefault()
			matchingShortcut.action()
		}
	}, [shortcuts])

	useEffect(() => {
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [handleKeyDown])
}

// Atajos específicos para tareas
export const TASK_SHORTCUTS = {
	NEW_TASK: 'n',
	COMPLETE_TASK: 'Enter',
	DELETE_TASK: 'Delete',
	EDIT_TASK: 'e',
	SEARCH: 'k',
	ESCAPE: 'Escape',
	TOGGLE_COMPLETED: 'c',
	MOVE_UP: 'ArrowUp',
	MOVE_DOWN: 'ArrowDown',
} as const

export type TaskShortcutKey = keyof typeof TASK_SHORTCUTS

// Hook específico para atajos de la aplicación (notas, etc.)
export interface AppKeyboardShortcuts {
	onToggleSearch?: () => void
	onNewNote?: () => void
	onToggleSidebar?: () => void
	onToggleAIPanel?: () => void
	onClosePanels?: () => void
}

export function useAppKeyboardShortcuts(shortcuts: AppKeyboardShortcuts) {
	const keyboardShortcuts: KeyboardShortcut[] = []

	// Mapear los atajos de la aplicación a atajos de teclado
	if (shortcuts.onToggleSearch) {
		keyboardShortcuts.push({
			key: 'k',
			ctrlKey: true,
			action: shortcuts.onToggleSearch,
			description: 'Buscar'
		})
	}

	if (shortcuts.onNewNote) {
		keyboardShortcuts.push({
			key: 'n',
			ctrlKey: true,
			action: shortcuts.onNewNote,
			description: 'Nueva nota'
		})
	}

	if (shortcuts.onToggleSidebar) {
		keyboardShortcuts.push({
			key: 'b',
			ctrlKey: true,
			action: shortcuts.onToggleSidebar,
			description: 'Toggle sidebar'
		})
	}

	if (shortcuts.onToggleAIPanel) {
		keyboardShortcuts.push({
			key: 'i',
			ctrlKey: true,
			action: shortcuts.onToggleAIPanel,
			description: 'Toggle AI panel'
		})
	}

	if (shortcuts.onClosePanels) {
		keyboardShortcuts.push({
			key: 'Escape',
			action: shortcuts.onClosePanels,
			description: 'Cerrar paneles'
		})
	}

	// Usar el hook base
	useKeyboardShortcuts(keyboardShortcuts)
}