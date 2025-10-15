import { useEffect, useState } from 'react'

/**
 * Hook para ocultar la toolbar del navegador al hacer scroll hacia abajo
 * y mostrarla al hacer scroll hacia arriba
 */
export function useHideBrowserToolbar() {
	const [isToolbarHidden, setIsToolbarHidden] = useState(false)
	const [lastScrollY, setLastScrollY] = useState(0)

	useEffect(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY
			
			// Solo aplicar en dispositivos móviles
			if (window.innerWidth < 768) {
				console.log('Mobile scroll detected:', { currentScrollY, lastScrollY, isToolbarHidden })
				
				// Si el scroll es hacia abajo y hemos scrolleado más de 100px
				if (currentScrollY > lastScrollY && currentScrollY > 100) {
					console.log('Hiding toolbar - scrolling down')
					setIsToolbarHidden(true)
				}
				// Si el scroll es hacia arriba
				else if (currentScrollY < lastScrollY) {
					console.log('Showing toolbar - scrolling up')
					setIsToolbarHidden(false)
				}
			}
			
			setLastScrollY(currentScrollY)
		}

		// Throttle del scroll para mejor rendimiento
		let ticking = false
		const throttledHandleScroll = () => {
			if (!ticking) {
				requestAnimationFrame(() => {
					handleScroll()
					ticking = false
				})
				ticking = true
			}
		}

		window.addEventListener('scroll', throttledHandleScroll, { passive: true })
		
		return () => {
			window.removeEventListener('scroll', throttledHandleScroll)
		}
	}, [lastScrollY])

	// Aplicar estilos CSS para ocultar la toolbar
	useEffect(() => {
		if (typeof window !== 'undefined') {
			const style = document.createElement('style')
			style.id = 'hide-browser-toolbar'
			
			if (isToolbarHidden) {
				style.textContent = `
					/* Ocultar toolbar del navegador en móviles */
					@media screen and (max-width: 767px) {
						/* Para navegadores que soportan viewport-fit */
						@supports (padding: max(0px)) {
							html {
								height: 100vh;
								height: -webkit-fill-available;
							}
						}
						
						/* Intentar ocultar la toolbar del navegador */
						body {
							position: fixed;
							top: 0;
							left: 0;
							right: 0;
							bottom: 0;
							overflow-y: auto;
							-webkit-overflow-scrolling: touch;
						}
						
						/* Asegurar que el contenido principal tenga el scroll */
						main, [role="main"] {
							height: 100vh;
							overflow-y: auto;
							-webkit-overflow-scrolling: touch;
						}
					}
				`
			} else {
				style.textContent = `
					/* Restaurar comportamiento normal */
					@media screen and (max-width: 767px) {
						body {
							position: static;
							overflow: visible;
						}
						
						main, [role="main"] {
							height: auto;
							overflow: visible;
						}
					}
				`
			}
			
			// Remover estilo anterior si existe
			const existingStyle = document.getElementById('hide-browser-toolbar')
			if (existingStyle) {
				existingStyle.remove()
			}
			
			document.head.appendChild(style)
			
			return () => {
				const styleToRemove = document.getElementById('hide-browser-toolbar')
				if (styleToRemove) {
					styleToRemove.remove()
				}
			}
		}
	}, [isToolbarHidden])

	return { isToolbarHidden }
}

/**
 * Hook alternativo que usa viewport units para ocultar la toolbar
 */
export function useViewportHeight() {
	const [viewportHeight, setViewportHeight] = useState('100vh')

	useEffect(() => {
		const setHeight = () => {
			// Usar la altura real del viewport
			const vh = window.innerHeight * 0.01
			document.documentElement.style.setProperty('--vh', `${vh}px`)
			setViewportHeight(`${window.innerHeight}px`)
		}

		setHeight()
		window.addEventListener('resize', setHeight)
		window.addEventListener('orientationchange', setHeight)

		return () => {
			window.removeEventListener('resize', setHeight)
			window.removeEventListener('orientationchange', setHeight)
		}
	}, [])

	return { viewportHeight }
}
