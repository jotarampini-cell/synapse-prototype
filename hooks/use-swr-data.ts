"use client"

import useSWR from 'swr'
import { getUserContents } from '@/app/actions/content'
import { getFolderTree } from '@/app/actions/folders'

// Hook para obtener contenidos del usuario con SWR
export function useUserContents() {
	const { data, error, mutate, isLoading } = useSWR(
		'user-contents',
		async () => {
			try {
				console.log('🔄 useUserContents: Iniciando request...')
				const result = await getUserContents()
				console.log('📊 useUserContents: Resultado:', result)
				
				if (!result.success) {
					console.error('❌ useUserContents: Error en server action:', result.error)
					return []
				}
				return result.contents || []
			} catch (error) {
				console.error('❌ useUserContents: Error en SWR:', error)
				return []
			}
		},
		{
			revalidateOnFocus: false,
			dedupingInterval: 30000, // 30 segundos
			revalidateOnReconnect: true,
			errorRetryCount: 1, // Reducir reintentos
			onError: (error) => {
				console.error('❌ SWR Error in useUserContents:', error)
			}
		}
	)

	return {
		contents: data || [],
		isLoading,
		error,
		mutate
	}
}

// Hook para obtener árbol de carpetas con SWR
export function useFolderTree() {
	const { data, error, mutate, isLoading } = useSWR(
		'folder-tree',
		async () => {
			try {
				console.log('🔄 useFolderTree: Iniciando request...')
				const result = await getFolderTree()
				console.log('📊 useFolderTree: Resultado:', result)
				
				if (!result.success) {
					console.error('❌ useFolderTree: Error en server action:', result.error)
					return []
				}
				return result.folders || []
			} catch (error) {
				console.error('❌ useFolderTree: Error en SWR:', error)
				return []
			}
		},
		{
			revalidateOnFocus: false,
			dedupingInterval: 30000, // 30 segundos
			revalidateOnReconnect: true,
			errorRetryCount: 1, // Reducir reintentos
			onError: (error) => {
				console.error('❌ SWR Error in useFolderTree:', error)
			}
		}
	)

	return {
		folders: data || [],
		isLoading,
		error,
		mutate
	}
}

// Hook genérico para datos con SWR
export function useSWRData<T>(
	key: string,
	fetcher: () => Promise<T>,
	options?: {
		revalidateOnFocus?: boolean
		dedupingInterval?: number
		revalidateOnReconnect?: boolean
		errorRetryCount?: number
	}
) {
	const { data, error, mutate, isLoading } = useSWR(
		key,
		fetcher,
		{
			revalidateOnFocus: false,
			dedupingInterval: 30000,
			revalidateOnReconnect: true,
			errorRetryCount: 3,
			...options
		}
	)

	return {
		data,
		isLoading,
		error,
		mutate
	}
}
