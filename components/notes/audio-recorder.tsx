"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
	Mic, 
	MicOff, 
	Play, 
	Pause, 
	Square, 
	X,
	Download,
	Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AudioRecorderProps {
	mode: 'transcribe' | 'attach'
	onSave: (audioBlob: Blob, duration: number) => void
	onCancel: () => void
}

export function AudioRecorder({ mode, onSave, onCancel }: AudioRecorderProps) {
	const [isRecording, setIsRecording] = useState(false)
	const [isPlaying, setIsPlaying] = useState(false)
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
	const [duration, setDuration] = useState(0)
	const [currentTime, setCurrentTime] = useState(0)
	
	const mediaRecorderRef = useRef<MediaRecorder | null>(null)
	const audioChunksRef = useRef<Blob[]>([])
	const audioRef = useRef<HTMLAudioElement | null>(null)
	const streamRef = useRef<MediaStream | null>(null)
	const intervalRef = useRef<NodeJS.Timeout | null>(null)

	// Limpiar recursos al desmontar
	useEffect(() => {
		return () => {
			if (streamRef.current) {
				streamRef.current.getTracks().forEach(track => track.stop())
			}
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
			}
		}
	}, [])

	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
			streamRef.current = stream
			
			const mediaRecorder = new MediaRecorder(stream)
			mediaRecorderRef.current = mediaRecorder
			audioChunksRef.current = []

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					audioChunksRef.current.push(event.data)
				}
			}

			mediaRecorder.onstop = () => {
				const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
				setAudioBlob(audioBlob)
				
				// Crear URL para reproducir
				const audioUrl = URL.createObjectURL(audioBlob)
				if (audioRef.current) {
					audioRef.current.src = audioUrl
				}
			}

			mediaRecorder.start()
			setIsRecording(true)
			setDuration(0)
			setCurrentTime(0)

			// Actualizar duración cada segundo
			intervalRef.current = setInterval(() => {
				setDuration(prev => prev + 1)
			}, 1000)

		} catch (error) {
			console.error('Error accessing microphone:', error)
		}
	}

	const stopRecording = () => {
		if (mediaRecorderRef.current && isRecording) {
			mediaRecorderRef.current.stop()
			setIsRecording(false)
			
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
			}

			// Detener el stream
			if (streamRef.current) {
				streamRef.current.getTracks().forEach(track => track.stop())
			}
		}
	}

	const togglePlayback = () => {
		if (!audioRef.current || !audioBlob) return

		if (isPlaying) {
			audioRef.current.pause()
			setIsPlaying(false)
		} else {
			audioRef.current.play()
			setIsPlaying(true)
		}
	}

	const handleSave = () => {
		if (audioBlob) {
			onSave(audioBlob, duration)
		}
	}

	const handleCancel = () => {
		// Limpiar recursos
		if (streamRef.current) {
			streamRef.current.getTracks().forEach(track => track.stop())
		}
		if (intervalRef.current) {
			clearInterval(intervalRef.current)
		}
		onCancel()
	}

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins}:${secs.toString().padStart(2, '0')}`
	}

	return (
		<Card className="p-6 max-w-md mx-auto">
			<div className="text-center mb-6">
				<h3 className="text-lg font-semibold mb-2">
					{mode === 'transcribe' ? 'Grabar para transcribir' : 'Grabar audio'}
				</h3>
				<p className="text-sm text-muted-foreground">
					{mode === 'transcribe' 
						? 'El audio se convertirá automáticamente a texto'
						: 'El audio se adjuntará como archivo a la nota'
					}
				</p>
			</div>

			{/* Controles de grabación */}
			<div className="flex flex-col items-center gap-4 mb-6">
				{!audioBlob ? (
					<>
						{/* Botón de grabación */}
						<Button
							onClick={isRecording ? stopRecording : startRecording}
							className={cn(
								"h-16 w-16 rounded-full",
								isRecording 
									? "bg-red-500 hover:bg-red-600" 
									: "bg-primary hover:bg-primary/90"
							)}
							size="icon"
						>
							{isRecording ? (
								<Square className="h-6 w-6" />
							) : (
								<Mic className="h-6 w-6" />
							)}
						</Button>

						{/* Duración */}
						<div className="text-2xl font-mono">
							{formatTime(duration)}
						</div>

						{/* Estado */}
						<div className="flex items-center gap-2">
							{isRecording && (
								<div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
							)}
							<span className="text-sm text-muted-foreground">
								{isRecording ? 'Grabando...' : 'Listo para grabar'}
							</span>
						</div>
					</>
				) : (
					<>
						{/* Reproductor */}
						<div className="w-full">
							<audio
								ref={audioRef}
								onEnded={() => setIsPlaying(false)}
								onTimeUpdate={(e) => {
									const audio = e.target as HTMLAudioElement
									setCurrentTime(audio.currentTime)
								}}
								className="w-full"
								controls
							/>
						</div>

						{/* Información del audio */}
						<div className="text-center">
							<div className="text-sm text-muted-foreground">
								Duración: {formatTime(duration)}
							</div>
						</div>
					</>
				)}
			</div>

			{/* Botones de acción */}
			<div className="flex gap-3">
				<Button
					variant="outline"
					onClick={handleCancel}
					className="flex-1"
				>
					<X className="h-4 w-4 mr-2" />
					Cancelar
				</Button>
				
				{audioBlob && (
					<Button
						onClick={handleSave}
						className="flex-1"
					>
						{mode === 'transcribe' ? (
							<>
								<Mic className="h-4 w-4 mr-2" />
								Transcribir
							</>
						) : (
							<>
								<Download className="h-4 w-4 mr-2" />
								Adjuntar
							</>
						)}
					</Button>
				)}
			</div>
		</Card>
	)
}


