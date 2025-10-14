"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, File, Image, FileText, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface UploadedFile {
	id: string
	name: string
	size: number
	type: string
	url?: string
	status: 'uploading' | 'success' | 'error'
}

interface FileUploadProps {
	onFilesUploaded?: (files: UploadedFile[]) => void
	onFileRemove?: (fileId: string) => void
	acceptedTypes?: string[]
	maxSize?: number // en MB
	maxFiles?: number
	className?: string
}

export function FileUpload({ 
	onFilesUploaded,
	onFileRemove,
	acceptedTypes = ['image/*', '.pdf', '.doc', '.docx', '.txt'],
	maxSize = 10,
	maxFiles = 5,
	className 
}: FileUploadProps) {
	const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
	const [isDragging, setIsDragging] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes'
		const k = 1024
		const sizes = ['Bytes', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	}

	const getFileIcon = (type: string) => {
		if (type.startsWith('image/')) {
			return <Image className="h-4 w-4 text-blue-600" />
		} else if (type.includes('pdf')) {
			return <FileText className="h-4 w-4 text-red-600" />
		} else {
			return <File className="h-4 w-4 text-gray-600" />
		}
	}

	const validateFile = (file: File): string | null => {
		// Verificar tamaño
		if (file.size > maxSize * 1024 * 1024) {
			return `El archivo es demasiado grande. Máximo ${maxSize}MB.`
		}

		// Verificar tipo
		const isValidType = acceptedTypes.some(type => {
			if (type.startsWith('.')) {
				return file.name.toLowerCase().endsWith(type.toLowerCase())
			} else {
				return file.type.match(type.replace('*', '.*'))
			}
		})

		if (!isValidType) {
			return 'Tipo de archivo no permitido.'
		}

		return null
	}

	const handleFileSelect = (files: FileList | null) => {
		if (!files) return

		const newFiles: UploadedFile[] = []
		
		Array.from(files).forEach((file, index) => {
			const error = validateFile(file)
			if (error) {
				alert(`Error en ${file.name}: ${error}`)
				return
			}

			if (uploadedFiles.length + newFiles.length >= maxFiles) {
				alert(`Máximo ${maxFiles} archivos permitidos.`)
				return
			}

			const fileId = `file-${Date.now()}-${index}`
			const uploadedFile: UploadedFile = {
				id: fileId,
				name: file.name,
				size: file.size,
				type: file.type,
				status: 'uploading'
			}

			newFiles.push(uploadedFile)

			// Simular upload (en una implementación real, aquí subirías el archivo)
			setTimeout(() => {
				setUploadedFiles(prev => 
					prev.map(f => 
						f.id === fileId 
							? { ...f, status: 'success' as const, url: URL.createObjectURL(file) }
							: f
					)
				)
			}, 1000)
		})

		if (newFiles.length > 0) {
			setUploadedFiles(prev => [...prev, ...newFiles])
			onFilesUploaded?.(newFiles)
		}
	}

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault()
		setIsDragging(true)
	}

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault()
		setIsDragging(false)
	}

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault()
		setIsDragging(false)
		handleFileSelect(e.dataTransfer.files)
	}

	const handleRemoveFile = (fileId: string) => {
		setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
		onFileRemove?.(fileId)
	}

	const handleClick = () => {
		fileInputRef.current?.click()
	}

	return (
		<div className={cn("space-y-3", className)}>
			{/* Zona de drop */}
			<div
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				onClick={handleClick}
				className={cn(
					"border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
					isDragging 
						? "border-primary bg-primary/5" 
						: "border-border hover:border-primary/50 hover:bg-muted/50"
				)}
			>
				<Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
				<p className="text-sm font-medium mb-1">
					Arrastra archivos aquí o haz clic para seleccionar
				</p>
				<p className="text-xs text-muted-foreground">
					Máximo {maxFiles} archivos, {maxSize}MB cada uno
				</p>
				<p className="text-xs text-muted-foreground mt-1">
					Tipos permitidos: Imágenes, PDF, Word, Texto
				</p>
			</div>

			{/* Input oculto */}
			<input
				ref={fileInputRef}
				type="file"
				multiple
				accept={acceptedTypes.join(',')}
				onChange={(e) => handleFileSelect(e.target.files)}
				className="hidden"
			/>

			{/* Lista de archivos */}
			{uploadedFiles.length > 0 && (
				<div className="space-y-2">
					<h4 className="text-sm font-medium">Archivos adjuntos</h4>
					{uploadedFiles.map((file) => (
						<div
							key={file.id}
							className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
						>
							{getFileIcon(file.type)}
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium truncate">{file.name}</p>
								<p className="text-xs text-muted-foreground">
									{formatFileSize(file.size)}
								</p>
							</div>
							<div className="flex items-center gap-2">
								{file.status === 'uploading' && (
									<div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
								)}
								{file.status === 'success' && (
									<Check className="h-4 w-4 text-green-600" />
								)}
								{file.status === 'error' && (
									<X className="h-4 w-4 text-red-600" />
								)}
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleRemoveFile(file.id)}
									className="h-8 w-8 p-0"
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}

