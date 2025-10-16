"use client"

import useSWR from 'swr'
import { getUserContents } from '@/app/actions/content'
import { getFolderTree } from '@/app/actions/folders'

// Hook para obtener contenidos del usuario con SWR
export function useUserContents() {
	const { data, error, mutate, isLoading } = useSWR(
		'user-contents',
		async () => {
			const result = await getUserContents()
			return result.success ? result.contents : null
		},
		{
			revalidateOnFocus: false,
			dedupingInterval: 30000, // 30 segundos
			revalidateOnReconnect: true,
			errorRetryCount: 3,
		}
	)

	return {
		contents: data,
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
			const result = await getFolderTree()
			return result.success ? result.folders : null
		},
		{
			revalidateOnFocus: false,
			dedupingInterval: 30000, // 30 segundos
			revalidateOnReconnect: true,
			errorRetryCount: 3,
		}
	)

	return {
		folders: data,
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
