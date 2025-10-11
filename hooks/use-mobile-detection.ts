import { useState, useEffect } from 'react'

/**
 * Hook para detectar si el dispositivo es móvil
 * Proporciona una detección robusta y manejo de cambios de tamaño
 */
export function useMobileDetection(breakpoint: number = 768) {
	const [isMobile, setIsMobile] = useState(false)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		// Función para verificar si es móvil
		const checkMobile = () => {
			const mobile = window.innerWidth < breakpoint
			setIsMobile(mobile)
			setIsLoading(false)
		}

		// Verificación inicial
		checkMobile()

		// Listener para cambios de tamaño
		window.addEventListener('resize', checkMobile)

		// Cleanup
		return () => {
			window.removeEventListener('resize', checkMobile)
		}
	}, [breakpoint])

	return { isMobile, isLoading }
}

/**
 * Hook para detectar el tamaño de pantalla con más granularidad
 */
export function useScreenSize() {
	const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		const checkScreenSize = () => {
			const width = window.innerWidth
			
			if (width < 768) {
				setScreenSize('mobile')
			} else if (width < 1024) {
				setScreenSize('tablet')
			} else {
				setScreenSize('desktop')
			}
			
			setIsLoading(false)
		}

		checkScreenSize()
		window.addEventListener('resize', checkScreenSize)

		return () => {
			window.removeEventListener('resize', checkScreenSize)
		}
	}, [])

	return { screenSize, isLoading }
}




