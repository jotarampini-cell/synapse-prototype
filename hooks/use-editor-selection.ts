import { useState, useEffect } from 'react'
import { useMobileDetection } from './use-mobile-detection'

/**
 * Hook para seleccionar el editor apropiado según el dispositivo
 * Retorna el tipo de editor y funciones de transición
 */
export function useEditorSelection() {
	const { isMobile, isLoading } = useMobileDetection(768)
	const [editorType, setEditorType] = useState<'mobile' | 'desktop'>('desktop')

	useEffect(() => {
		if (!isLoading) {
			setEditorType(isMobile ? 'mobile' : 'desktop')
		}
	}, [isMobile, isLoading])

	// Función para forzar un tipo de editor específico (útil para testing)
	const setEditorTypeManually = (type: 'mobile' | 'desktop') => {
		setEditorType(type)
	}

	// Función para alternar entre editores
	const toggleEditorType = () => {
		setEditorType(prev => prev === 'mobile' ? 'desktop' : 'mobile')
	}

	return {
		editorType,
		isMobile,
		isLoading,
		setEditorType: setEditorTypeManually,
		toggleEditorType
	}
}

/**
 * Hook para detectar si se debe usar el editor móvil
 * Incluye lógica adicional para tablets y pantallas táctiles
 */
export function useMobileEditor() {
	const { isMobile, isLoading } = useMobileDetection(768)
	const [isTouchDevice, setIsTouchDevice] = useState(false)

	useEffect(() => {
		// Detectar si es un dispositivo táctil
		const checkTouchDevice = () => {
			const isTouch = 'ontouchstart' in window || 
				navigator.maxTouchPoints > 0 || 
				// @ts-expect-error - msMaxTouchPoints es una propiedad específica de IE/Edge
				navigator.msMaxTouchPoints > 0
			setIsTouchDevice(isTouch)
		}

		checkTouchDevice()
	}, [])

	// Usar editor móvil si:
	// 1. Es móvil (width < 768px)
	// 2. Es un dispositivo táctil Y la pantalla es pequeña (< 1024px)
	const shouldUseMobileEditor = isMobile || (isTouchDevice && window.innerWidth < 1024)

	return {
		shouldUseMobileEditor: !isLoading && shouldUseMobileEditor,
		isMobile,
		isTouchDevice,
		isLoading
	}
}
