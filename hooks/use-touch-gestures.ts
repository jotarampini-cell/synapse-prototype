"use client"

import { useRef, useCallback, useEffect } from 'react'

interface TouchGestureOptions {
	onLongPress?: () => void
	onSwipeLeft?: () => void
	onSwipeRight?: () => void
	onSwipeUp?: () => void
	onSwipeDown?: () => void
	onPinchStart?: () => void
	onPinchEnd?: () => void
	onPinch?: (scale: number) => void
	longPressDelay?: number
	swipeThreshold?: number
	enablePinch?: boolean
}

interface TouchState {
	startX: number
	startY: number
	startTime: number
	isLongPress: boolean
	longPressTimer: NodeJS.Timeout | null
	pinchStartDistance: number
	pinchStartScale: number
}

export function useTouchGestures(options: TouchGestureOptions = {}) {
	// Funcionalidad desactivada por defecto para estabilidad
	const isEnabled = process.env.NODE_ENV === 'development' && process.env.ENABLE_TOUCH_GESTURES === 'true'
	
	// Todos los hooks deben estar al inicio
	const touchState = useRef<TouchState>({
		startX: 0,
		startY: 0,
		startTime: 0,
		isLongPress: false,
		longPressTimer: null,
		pinchStartDistance: 0,
		pinchStartScale: 1
	})

	// Todos los useCallback y useEffect deben estar aquí también
	const getDistance = useCallback((touch1: Touch, touch2: Touch) => {
		const dx = touch1.clientX - touch2.clientX
		const dy = touch1.clientY - touch2.clientY
		return Math.sqrt(dx * dx + dy * dy)
	}, [])

	const handleTouchStart = useCallback((e: TouchEvent) => {
		if (!isEnabled) return

		const touch = e.touches[0]
		touchState.current.startX = touch.clientX
		touchState.current.startY = touch.clientY
		touchState.current.startTime = Date.now()
		touchState.current.isLongPress = false

		// Long press timer
		if (options.onLongPress) {
			touchState.current.longPressTimer = setTimeout(() => {
				touchState.current.isLongPress = true
				options.onLongPress()
			}, options.longPressDelay || 500)
		}

		// Pinch gesture (two fingers)
		if (e.touches.length === 2 && options.enablePinch) {
			const distance = getDistance(e.touches[0], e.touches[1])
			touchState.current.pinchStartDistance = distance
			touchState.current.pinchStartScale = 1
			options.onPinchStart?.()
		}
	}, [isEnabled, options, getDistance])

	const handleTouchMove = useCallback((e: TouchEvent) => {
		if (!isEnabled) return

		// Cancel long press if moved too much
		if (touchState.current.longPressTimer && !touchState.current.isLongPress) {
			const touch = e.touches[0]
			const deltaX = Math.abs(touch.clientX - touchState.current.startX)
			const deltaY = Math.abs(touch.clientY - touchState.current.startY)
			
			if (deltaX > 10 || deltaY > 10) {
				clearTimeout(touchState.current.longPressTimer)
				touchState.current.longPressTimer = null
			}
		}

		// Pinch gesture
		if (e.touches.length === 2 && options.enablePinch) {
			const distance = getDistance(e.touches[0], e.touches[1])
			const scale = distance / touchState.current.pinchStartDistance
			options.onPinch?.(scale)
		}
	}, [isEnabled, options, getDistance])

	const handleTouchEnd = useCallback((e: TouchEvent) => {
		if (!isEnabled) return

		// Clear long press timer
		if (touchState.current.longPressTimer) {
			clearTimeout(touchState.current.longPressTimer)
			touchState.current.longPressTimer = null
		}

		// Swipe detection (only if not long press)
		if (!touchState.current.isLongPress && e.changedTouches.length === 1) {
			const touch = e.changedTouches[0]
			const deltaX = touch.clientX - touchState.current.startX
			const deltaY = touch.clientY - touchState.current.startY
			const deltaTime = Date.now() - touchState.current.startTime

			// Only detect swipe if gesture was quick (< 300ms)
			if (deltaTime < 300) {
				const absDeltaX = Math.abs(deltaX)
				const absDeltaY = Math.abs(deltaY)

				// Determine if it's a horizontal or vertical swipe
				if (absDeltaX > absDeltaY && absDeltaX > (options.swipeThreshold || 50)) {
					// Horizontal swipe
					if (deltaX > 0) {
						options.onSwipeRight?.()
					} else {
						options.onSwipeLeft?.()
					}
				} else if (absDeltaY > absDeltaX && absDeltaY > (options.swipeThreshold || 50)) {
					// Vertical swipe
					if (deltaY > 0) {
						options.onSwipeDown?.()
					} else {
						options.onSwipeUp?.()
					}
				}
			}
		}

		// End pinch gesture
		if (options.enablePinch) {
			options.onPinchEnd?.()
		}

		// Reset state
		touchState.current.isLongPress = false
	}, [isEnabled, options])

	const bindTouchEvents = useCallback((element: HTMLElement) => {
		if (!isEnabled) return () => {}

		element.addEventListener('touchstart', handleTouchStart, { passive: false })
		element.addEventListener('touchmove', handleTouchMove, { passive: false })
		element.addEventListener('touchend', handleTouchEnd, { passive: false })

		return () => {
			element.removeEventListener('touchstart', handleTouchStart)
			element.removeEventListener('touchmove', handleTouchMove)
			element.removeEventListener('touchend', handleTouchEnd)
		}
	}, [isEnabled, handleTouchStart, handleTouchMove, handleTouchEnd])

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (touchState.current.longPressTimer) {
				clearTimeout(touchState.current.longPressTimer)
			}
		}
	}, [])
	
	if (!isEnabled) {
		return {
			bindTouchEvents: () => () => {} // No-op function
		}
	}

	return {
		bindTouchEvents
	}
}

// Hook específico para swipe actions en cards
export function useSwipeActions(
	onSwipeLeft?: () => void,
	onSwipeRight?: () => void,
	threshold: number = 100
) {
	const { bindTouchEvents } = useTouchGestures({
		onSwipeLeft,
		onSwipeRight,
		swipeThreshold: threshold
	})

	return { bindTouchEvents }
}

// Hook para long press
export function useLongPress(
	onLongPress: () => void,
	delay: number = 500
) {
	const { bindTouchEvents } = useTouchGestures({
		onLongPress,
		longPressDelay: delay
	})

	return { bindTouchEvents }
}

// Hook para pinch to zoom
export function usePinchZoom(
	onPinch: (scale: number) => void,
	onPinchStart?: () => void,
	onPinchEnd?: () => void
) {
	const { bindTouchEvents } = useTouchGestures({
		onPinch,
		onPinchStart,
		onPinchEnd,
		enablePinch: true
	})

	return { bindTouchEvents }
}
