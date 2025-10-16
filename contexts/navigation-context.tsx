"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

interface NavigationContextType {
	showBackButton: boolean
	backButtonText: string
	onBackClick: (() => void) | undefined
	setNavigationProps: (props: {
		showBackButton: boolean
		backButtonText?: string
		onBackClick?: () => void
	}) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
	const [showBackButton, setShowBackButton] = useState(false)
	const [backButtonText, setBackButtonText] = useState('')
	const [onBackClick, setOnBackClick] = useState<(() => void) | undefined>(undefined)

	const setNavigationProps = ({
		showBackButton: show,
		backButtonText: text = '',
		onBackClick: click = undefined
	}: {
		showBackButton: boolean
		backButtonText?: string
		onBackClick?: () => void
	}) => {
		setShowBackButton(show)
		setBackButtonText(text)
		setOnBackClick(() => click)
	}

	return (
		<NavigationContext.Provider value={{
			showBackButton,
			backButtonText,
			onBackClick,
			setNavigationProps
		}}>
			{children}
		</NavigationContext.Provider>
	)
}

export function useNavigation() {
	const context = useContext(NavigationContext)
	if (context === undefined) {
		throw new Error('useNavigation must be used within a NavigationProvider')
	}
	return context
}
