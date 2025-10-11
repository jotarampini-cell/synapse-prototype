'use client'

import { useState, useEffect, useCallback } from 'react'

export function useCommandPalette() {
	const [isOpen, setIsOpen] = useState(false)

	const openCommandPalette = useCallback(() => {
		setIsOpen(true)
	}, [])

	const closeCommandPalette = useCallback(() => {
		setIsOpen(false)
	}, [])

	const toggleCommandPalette = useCallback(() => {
		setIsOpen(prev => !prev)
	}, [])

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// Ctrl+K o Cmd+K para abrir command palette
			if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
				event.preventDefault()
				toggleCommandPalette()
			}

			// Escape para cerrar
			if (event.key === 'Escape' && isOpen) {
				event.preventDefault()
				closeCommandPalette()
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [isOpen, toggleCommandPalette, closeCommandPalette])

	return {
		isOpen,
		openCommandPalette,
		closeCommandPalette,
		toggleCommandPalette
	}
}




