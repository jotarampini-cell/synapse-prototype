'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { log } from '@/lib/logger'

export interface Folder {
	id: string
	user_id: string
	name: string
	parent_id: string | null
	color: string
	icon: string
	position: number
	created_at: string
	updated_at: string
	level?: number
	path?: string
	note_count?: number
}

export interface CreateFolderData {
	name: string
	parent_id?: string | null
	color?: string
	icon?: string
}

export interface UpdateFolderData {
	name?: string
	color?: string
	icon?: string
	position?: number
}

// =====================================================
// ACCIONES DE CARPETAS
// =====================================================

export async function createFolder(data: CreateFolderData) {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	try {
		// Validar que el parent_id existe y pertenece al usuario (si se proporciona)
		if (data.parent_id) {
			const { data: parentFolder, error: parentError } = await supabase
				.from('folders')
				.select('id')
				.eq('id', data.parent_id)
				.eq('user_id', user.id)
				.single()

			if (parentError || !parentFolder) {
				throw new Error('Carpeta padre no encontrada o no tienes permisos')
			}
		}

		// Obtener la siguiente posición
		const { data: maxPosition } = await supabase
			.from('folders')
			.select('position')
			.eq('user_id', user.id)
			.eq('parent_id', data.parent_id || null)
			.order('position', { ascending: false })
			.limit(1)
			.single()

		const nextPosition = (maxPosition?.position || 0) + 1

		const { data: folder, error } = await supabase
			.from('folders')
			.insert({
				user_id: user.id,
				name: data.name.trim(),
				parent_id: data.parent_id || null,
				color: data.color || '#3b82f6',
				icon: data.icon || 'folder',
				position: nextPosition
			})
			.select()
			.single()

		if (error) {
			throw new Error(error.message)
		}

		revalidatePath('/notes')
		return { success: true, folder }
	} catch (error) {
		log.error('Error creating folder:', { error })
		throw new Error(error instanceof Error ? error.message : 'Error al crear carpeta')
	}
}

export async function getFolderTree() {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		log.info('Usuario no autenticado en getFolderTree')
		return []
	}

	try {
		// Usar directamente el fallback ya que la función SQL no existe aún
		return await getFolderTreeFallback(user.id)
	} catch (error) {
		log.error('Error getting folder tree:', { error })
		throw new Error('Error al obtener árbol de carpetas')
	}
}

async function getFolderTreeFallback(userId: string) {
	const supabase = await createClient()
	
	try {
		// Obtener todas las carpetas del usuario
		const { data: folders, error } = await supabase
			.from('folders')
			.select(`
				id,
				name,
				parent_id,
				color,
				icon,
				position,
				created_at,
				updated_at
			`)
			.eq('user_id', userId)
			.order('position')

		if (error) {
			throw new Error(error.message)
		}

		// Obtener conteo de notas por carpeta
		const { data: noteCounts } = await supabase
			.from('contents')
			.select('folder_id')
			.eq('user_id', userId)
			.not('folder_id', 'is', null)

		const noteCountMap = new Map<string, number>()
		noteCounts?.forEach(note => {
			if (note.folder_id) {
				noteCountMap.set(note.folder_id, (noteCountMap.get(note.folder_id) || 0) + 1)
			}
		})

		// Construir árbol jerárquico
		const folderMap = new Map<string, Folder & { children?: Folder[] }>()
		const rootFolders: Folder[] = []

		folders?.forEach(folder => {
			const folderWithCount = {
				...folder,
				note_count: noteCountMap.get(folder.id) || 0,
				level: 0,
				path: folder.name
			}
			folderMap.set(folder.id, folderWithCount)

			if (!folder.parent_id) {
				rootFolders.push(folderWithCount)
			}
		})

		// Asignar hijos y calcular niveles
		folders?.forEach(folder => {
			if (folder.parent_id) {
				const parent = folderMap.get(folder.parent_id)
				const child = folderMap.get(folder.id)
				if (parent && child) {
					child.level = parent.level + 1
					child.path = parent.path + ' > ' + child.name
					if (!parent.children) parent.children = []
					parent.children.push(child)
				}
			}
		})

		// Aplanar el árbol para devolverlo como lista
		const flattenTree = (folders: Folder[], level = 0): Folder[] => {
			const result: Folder[] = []
			folders.forEach(folder => {
				result.push({ ...folder, level })
				if (folder.children) {
					result.push(...flattenTree(folder.children, level + 1))
				}
			})
			return result
		}

		return flattenTree(rootFolders)
	} catch (error) {
		log.error('Error in fallback folder tree:', { error })
		throw new Error('Error al obtener carpetas')
	}
}

export async function updateFolder(folderId: string, data: UpdateFolderData) {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	try {
		// Verificar que la carpeta pertenece al usuario
		const { data: existingFolder, error: checkError } = await supabase
			.from('folders')
			.select('id')
			.eq('id', folderId)
			.eq('user_id', user.id)
			.single()

		if (checkError || !existingFolder) {
			throw new Error('Carpeta no encontrada o no tienes permisos')
		}

		const updateData: Record<string, unknown> = {}
		if (data.name !== undefined) updateData.name = data.name.trim()
		if (data.color !== undefined) updateData.color = data.color
		if (data.icon !== undefined) updateData.icon = data.icon
		if (data.position !== undefined) updateData.position = data.position

		const { data: folder, error } = await supabase
			.from('folders')
			.update(updateData)
			.eq('id', folderId)
			.eq('user_id', user.id)
			.select()
			.single()

		if (error) {
			throw new Error(error.message)
		}

		revalidatePath('/notes')
		return { success: true, folder }
	} catch (error) {
		log.error('Error updating folder:', { error })
		throw new Error(error instanceof Error ? error.message : 'Error al actualizar carpeta')
	}
}

export async function deleteFolder(folderId: string) {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	try {
		// Verificar que la carpeta pertenece al usuario
		const { data: folder, error: checkError } = await supabase
			.from('folders')
			.select('id, name')
			.eq('id', folderId)
			.eq('user_id', user.id)
			.single()

		if (checkError || !folder) {
			throw new Error('Carpeta no encontrada o no tienes permisos')
		}

		// Verificar si tiene carpetas hijas
		const { data: childFolders, error: childrenError } = await supabase
			.from('folders')
			.select('id, name')
			.eq('parent_id', folderId)
			.eq('user_id', user.id)

		if (childrenError) {
			throw new Error(childrenError.message)
		}

		if (childFolders && childFolders.length > 0) {
			throw new Error('No se puede eliminar una carpeta que contiene subcarpetas. Mueve o elimina las subcarpetas primero.')
		}

		// Verificar si tiene notas
		const { data: notes, error: notesError } = await supabase
			.from('contents')
			.select('id, title')
			.eq('folder_id', folderId)
			.eq('user_id', user.id)
			.limit(1)

		if (notesError) {
			throw new Error(notesError.message)
		}

		if (notes && notes.length > 0) {
			throw new Error('No se puede eliminar una carpeta que contiene notas. Mueve las notas a otra carpeta primero.')
		}

		// Eliminar la carpeta
		const { error } = await supabase
			.from('folders')
			.delete()
			.eq('id', folderId)
			.eq('user_id', user.id)

		if (error) {
			throw new Error(error.message)
		}

		revalidatePath('/notes')
		return { success: true, message: `Carpeta "${folder.name}" eliminada correctamente` }
	} catch (error) {
		log.error('Error deleting folder:', { error })
		throw new Error(error instanceof Error ? error.message : 'Error al eliminar carpeta')
	}
}

export async function moveFolder(folderId: string, newParentId: string | null) {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	try {
		// Verificar que la carpeta pertenece al usuario
		const { data: folder, error: checkError } = await supabase
			.from('folders')
			.select('id, name, parent_id')
			.eq('id', folderId)
			.eq('user_id', user.id)
			.single()

		if (checkError || !folder) {
			throw new Error('Carpeta no encontrada o no tienes permisos')
		}

		// Si se está moviendo a una carpeta padre, verificar que existe
		if (newParentId) {
			const { data: parentFolder, error: parentError } = await supabase
				.from('folders')
				.select('id')
				.eq('id', newParentId)
				.eq('user_id', user.id)
				.single()

			if (parentError || !parentFolder) {
				throw new Error('Carpeta padre no encontrada o no tienes permisos')
			}

			// Verificar que no se está moviendo a sí misma o a una subcarpeta
			if (newParentId === folderId) {
				throw new Error('No se puede mover una carpeta a sí misma')
			}

			// Verificar que no se está creando un ciclo
			const { data: descendants } = await supabase
				.from('folders')
				.select('id')
				.eq('parent_id', folderId)
				.eq('user_id', user.id)

			const descendantIds = descendants?.map(d => d.id) || []
			if (descendantIds.includes(newParentId)) {
				throw new Error('No se puede mover una carpeta a una de sus subcarpetas')
			}
		}

		// Obtener la siguiente posición en la nueva ubicación
		const { data: maxPosition } = await supabase
			.from('folders')
			.select('position')
			.eq('user_id', user.id)
			.eq('parent_id', newParentId || null)
			.order('position', { ascending: false })
			.limit(1)
			.single()

		const nextPosition = (maxPosition?.position || 0) + 1

		// Actualizar la carpeta
		const { data: updatedFolder, error } = await supabase
			.from('folders')
			.update({
				parent_id: newParentId,
				position: nextPosition
			})
			.eq('id', folderId)
			.eq('user_id', user.id)
			.select()
			.single()

		if (error) {
			throw new Error(error.message)
		}

		revalidatePath('/notes')
		return { success: true, folder: updatedFolder }
	} catch (error) {
		log.error('Error moving folder:', { error })
		throw new Error(error instanceof Error ? error.message : 'Error al mover carpeta')
	}
}

export async function getFolderById(folderId: string) {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	try {
		const { data: folder, error } = await supabase
			.from('folders')
			.select('*')
			.eq('id', folderId)
			.eq('user_id', user.id)
			.single()

		if (error) {
			throw new Error(error.message)
		}

		return folder
	} catch (error) {
		log.error('Error getting folder:', { error })
		throw new Error('Error al obtener carpeta')
	}
}

// =====================================================
// ACCIONES DE INBOX (CARPETA ESPECIAL)
// =====================================================

export async function createInboxFolder() {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	try {
		// Verificar si ya existe una carpeta Inbox
		const { data: existingInbox } = await supabase
			.from('folders')
			.select('id')
			.eq('user_id', user.id)
			.eq('name', 'Inbox')
			.single()

		if (existingInbox) {
			return { success: true, folder: existingInbox, created: false }
		}

		// Crear carpeta Inbox
		const { data: inbox, error } = await supabase
			.from('folders')
			.insert({
				user_id: user.id,
				name: 'Inbox',
				parent_id: null,
				color: '#f59e0b',
				icon: 'inbox',
				position: 0
			})
			.select()
			.single()

		if (error) {
			throw new Error(error.message)
		}

		revalidatePath('/notes')
		return { success: true, folder: inbox, created: true }
	} catch (error) {
		log.error('Error creating inbox folder:', { error })
		throw new Error('Error al crear carpeta Inbox')
	}
}

export async function createDiaryFolder() {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	try {
		// Verificar si ya existe una carpeta Diario
		const { data: existingDiary } = await supabase
			.from('folders')
			.select('id')
			.eq('user_id', user.id)
			.eq('name', 'Diario')
			.single()

		if (existingDiary) {
			return { success: true, folder: existingDiary, created: false }
		}

		// Crear carpeta Diario
		const { data: diary, error } = await supabase
			.from('folders')
			.insert({
				user_id: user.id,
				name: 'Diario',
				parent_id: null,
				color: '#10b981',
				icon: 'calendar',
				position: 1
			})
			.select()
			.single()

		if (error) {
			throw new Error(error.message)
		}

		revalidatePath('/notes')
		return { success: true, folder: diary, created: true }
	} catch (error) {
		log.error('Error creating diary folder:', { error })
		throw new Error('Error al crear carpeta Diario')
	}
}

// =====================================================
// CARPETAS RÁPIDAS PERSONALIZABLES
// =====================================================

export async function getQuickFolders() {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	try {
		// Obtener todas las carpetas del usuario
		const { data: folders, error } = await supabase
			.from('folders')
			.select('*')
			.eq('user_id', user.id)
			.order('position', { ascending: true })

		if (error) {
			console.error('Error fetching folders:', error)
			throw error
		}

		// Intentar obtener configuración de carpetas rápidas del usuario
		let quickFolderIds: string[] = []
		
		try {
			const { data: quickFoldersConfig } = await supabase
				.from('user_preferences')
				.select('quick_folders')
				.eq('user_id', user.id)
				.single()

			if (quickFoldersConfig?.quick_folders) {
				quickFolderIds = quickFoldersConfig.quick_folders
			}
		} catch (prefError) {
			console.log('Tabla user_preferences no existe, usando carpetas más utilizadas')
		}

		// Si no hay configuración, usar las 4 carpetas más utilizadas
		if (quickFolderIds.length === 0) {
			const { data: folderStats } = await supabase
				.from('contents')
				.select('folder_id')
				.eq('user_id', user.id)
				.not('folder_id', 'is', null)

			// Contar uso de carpetas
			const folderCounts: Record<string, number> = {}
			folderStats?.forEach(content => {
				if (content.folder_id) {
					folderCounts[content.folder_id] = (folderCounts[content.folder_id] || 0) + 1
				}
			})

			// Obtener las 4 carpetas más utilizadas
			quickFolderIds = Object.entries(folderCounts)
				.sort(([,a], [,b]) => b - a)
				.slice(0, 4)
				.map(([folderId]) => folderId)

			// Si no hay suficientes carpetas con contenido, completar con las primeras carpetas
			if (quickFolderIds.length < 4) {
				const remainingFolders = folders
					?.filter(f => !quickFolderIds.includes(f.id))
					.slice(0, 4 - quickFolderIds.length)
					.map(f => f.id) || []
				
				quickFolderIds = [...quickFolderIds, ...remainingFolders]
			}
		}

		// Filtrar carpetas que están en la lista de rápidas
		const quickFolders = folders?.filter(f => quickFolderIds.includes(f.id)) || []

		return {
			success: true,
			quickFolders,
			allFolders: folders || []
		}
	} catch (error) {
		console.error('Error getting quick folders:', error)
		return {
			success: false,
			error: 'Error al obtener carpetas rápidas',
			quickFolders: [],
			allFolders: []
		}
	}
}

export async function updateQuickFolders(folderIds: string[]) {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	try {
		// Intentar actualizar o crear configuración de carpetas rápidas
		const { error } = await supabase
			.from('user_preferences')
			.upsert({
				user_id: user.id,
				quick_folders: folderIds,
				updated_at: new Date().toISOString()
			})

		if (error) {
			console.error('Error updating quick folders:', error)
			// Si la tabla no existe, mostrar mensaje informativo
			if (error.code === 'PGRST205') {
				return {
					success: false,
					error: 'La tabla de preferencias no está configurada. Por favor, ejecuta el script de configuración de la base de datos.'
				}
			}
			throw error
		}

		return {
			success: true,
			message: 'Carpetas rápidas actualizadas correctamente'
		}
	} catch (error) {
		console.error('Error updating quick folders:', error)
		return {
			success: false,
			error: 'Error al actualizar carpetas rápidas'
		}
	}
}

// =====================================================
// CARPETAS PREDETERMINADAS
// =====================================================

export async function createDefaultFolders() {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	try {
		// Verificar si ya existen carpetas predeterminadas
		const { data: existingFolders } = await supabase
			.from('folders')
			.select('name')
			.eq('user_id', user.id)

		const existingNames = existingFolders?.map(f => f.name) || []
		
		// Definir carpetas predeterminadas
		const defaultFolders = [
			{
				name: 'Inbox',
				color: '#f59e0b',
				icon: 'inbox',
				position: 0,
				description: 'Captura rápida y notas sin organizar'
			},
			{
				name: 'Ideas',
				color: '#8b5cf6',
				icon: 'lightbulb',
				position: 1,
				description: 'Ideas, inspiración y pensamientos'
			},
			{
				name: 'Proyectos',
				color: '#3b82f6',
				icon: 'folder',
				position: 2,
				description: 'Notas de proyectos activos'
			},
			{
				name: 'Aprendizaje',
				color: '#10b981',
				icon: 'book-open',
				position: 3,
				description: 'Notas de estudio y conocimiento'
			},
			{
				name: 'Tareas',
				color: '#f97316',
				icon: 'check-square',
				position: 4,
				description: 'Listas de tareas y recordatorios'
			},
			{
				name: 'Reuniones',
				color: '#06b6d4',
				icon: 'users',
				position: 5,
				description: 'Actas y notas de reuniones'
			},
			{
				name: 'Personal',
				color: '#ec4899',
				icon: 'heart',
				position: 6,
				description: 'Notas personales y reflexiones'
			},
			{
				name: 'Archivo',
				color: '#6b7280',
				icon: 'archive',
				position: 7,
				description: 'Notas archivadas y completadas'
			}
		]

		const foldersToCreate = defaultFolders.filter(folder => 
			!existingNames.includes(folder.name)
		)

		if (foldersToCreate.length === 0) {
			return { 
				success: true, 
				message: 'Todas las carpetas predeterminadas ya existen',
				created: 0
			}
		}

		// Crear carpetas que no existen
		const createdFolders = []
		for (const folderData of foldersToCreate) {
			const { data: folder, error } = await supabase
				.from('folders')
				.insert({
					user_id: user.id,
					name: folderData.name,
					parent_id: null,
					color: folderData.color,
					icon: folderData.icon,
					position: folderData.position
				})
				.select()
				.single()

			if (error) {
				console.error(`Error creating folder ${folderData.name}:`, error)
				continue
			}

			createdFolders.push(folder)
		}

		revalidatePath('/notes')
		return { 
			success: true, 
			message: `Creadas ${createdFolders.length} carpetas predeterminadas`,
			created: createdFolders.length,
			folders: createdFolders
		}
	} catch (error) {
		console.error('Error creating default folders:', error)
		throw new Error('Error al crear carpetas predeterminadas')
	}
}

export async function resetToDefaultFolders() {
	const supabase = await createClient()
	
	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) {
		throw new Error('Usuario no autenticado')
	}

	try {
		// Obtener todas las carpetas del usuario
		const { data: userFolders } = await supabase
			.from('folders')
			.select('id, name')
			.eq('user_id', user.id)

		// Mover todas las notas a la carpeta Inbox antes de eliminar carpetas
		if (userFolders && userFolders.length > 0) {
			// Buscar o crear carpeta Inbox
			let inboxFolder = userFolders.find(f => f.name === 'Inbox')
			
			if (!inboxFolder) {
				const { data: newInbox } = await supabase
					.from('folders')
					.insert({
						user_id: user.id,
						name: 'Inbox',
						parent_id: null,
						color: '#f59e0b',
						icon: 'inbox',
						position: 0
					})
					.select()
					.single()
				
				inboxFolder = newInbox
			}

			// Mover todas las notas a Inbox
			if (inboxFolder) {
				await supabase
					.from('contents')
					.update({ folder_id: inboxFolder.id })
					.eq('user_id', user.id)
					.neq('folder_id', inboxFolder.id)
			}

			// Eliminar todas las carpetas excepto Inbox
			const foldersToDelete = userFolders.filter(f => f.name !== 'Inbox')
			if (foldersToDelete.length > 0) {
				await supabase
					.from('folders')
					.delete()
					.eq('user_id', user.id)
					.neq('name', 'Inbox')
			}
		}

		// Crear carpetas predeterminadas
		const result = await createDefaultFolders()

		revalidatePath('/notes')
		return result
	} catch (error) {
		console.error('Error resetting to default folders:', error)
		throw new Error('Error al restablecer carpetas predeterminadas')
	}
}
