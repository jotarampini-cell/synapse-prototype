"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Square, Play, Pause, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface VoiceRecorderProps {
	onTranscription?: (text: string) => void
	onRecordingComplete?: (audioBlob: Blob) => void
	className?: string
}

export function VoiceRecorder({ 
	onTranscription,
	onRecordingComplete,
	className 
}: VoiceRecorderProps) {
	const [isRecording, setIsRecording] = useState(false)
	const [isPaused, setIsPaused] = useState(false)
	const [recordingTime, setRecordingTime] = useState(0)
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
	const [isPlaying, setIsPlaying] = useState(false)
	const [transcription, setTranscription] = useState("")
	const [isTranscribing, setIsTranscribing] = useState(false)

	const mediaRecorderRef = useRef<MediaRecorder | null>(null)
	const audioRef = useRef<HTMLAudioElement | null>(null)
	const streamRef = useRef<MediaStream | null>(null)
	const intervalRef = useRef<NodeJS.Timeout | null>(null)

	// Limpiar recursos al desmontar
	useEffect(() => {
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
			}
			if (streamRef.current) {
				streamRef.current.getTracks().forEach(track => track.stop())
			}
		}
	}, [])

	const startTimer = () => {
		intervalRef.current = setInterval(() => {
			setRecordingTime(prev => prev + 1)
		}, 1000)
	}

	const stopTimer = () => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current)
			intervalRef.current = null
		}
	}

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
	}

	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
			streamRef.current = stream

			const mediaRecorder = new MediaRecorder(stream)
			mediaRecorderRef.current = mediaRecorder

			const chunks: BlobPart[] = []
			
			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					chunks.push(event.data)
				}
			}

			mediaRecorder.onstop = () => {
				const blob = new Blob(chunks, { type: 'audio/wav' })
				setAudioBlob(blob)
				onRecordingComplete?.(blob)
				
				// Detener todas las pistas de audio
				stream.getTracks().forEach(track => track.stop())
			}

			mediaRecorder.start()
			setIsRecording(true)
			setRecordingTime(0)
			startTimer()
		} catch (error) {
			console.error('Error accessing microphone:', error)
			alert('No se pudo acceder al micrófono. Por favor, verifica los permisos.')
		}
	}

	const stopRecording = () => {
		if (mediaRecorderRef.current && isRecording) {
			mediaRecorderRef.current.stop()
			setIsRecording(false)
			setIsPaused(false)
			stopTimer()
		}
	}

	const pauseRecording = () => {
		if (mediaRecorderRef.current && isRecording) {
			if (isPaused) {
				mediaRecorderRef.current.resume()
				startTimer()
			} else {
				mediaRecorderRef.current.pause()
				stopTimer()
			}
			setIsPaused(!isPaused)
		}
	}

	const playRecording = () => {
		if (audioBlob && audioRef.current) {
			if (isPlaying) {
				audioRef.current.pause()
				setIsPlaying(false)
			} else {
				audioRef.current.play()
				setIsPlaying(true)
			}
		}
	}

	const handleAudioEnded = () => {
		setIsPlaying(false)
	}

	const transcribeAudio = async () => {
		if (!audioBlob) return

		setIsTranscribing(true)
		try {
			// Simular transcripción (en una implementación real, usarías una API como OpenAI Whisper)
			await new Promise(resolve => setTimeout(resolve, 2000))
			
			const mockTranscription = "Esta es una transcripción de ejemplo. En una implementación real, aquí se procesaría el audio usando una API de transcripción como OpenAI Whisper o Google Speech-to-Text."
			
			setTranscription(mockTranscription)
			onTranscription?.(mockTranscription)
		} catch (error) {
			console.error('Error transcribing audio:', error)
			alert('Error al transcribir el audio. Por favor, inténtalo de nuevo.')
		} finally {
			setIsTranscribing(false)
		}
	}

	const clearRecording = () => {
		setAudioBlob(null)
		setTranscription("")
		setRecordingTime(0)
		setIsPlaying(false)
		if (audioRef.current) {
			audioRef.current.pause()
			audioRef.current.currentTime = 0
		}
	}

	return (
		<div className={cn("space-y-4", className)}>
			{/* Controles de grabación */}
			<div className="flex items-center justify-center gap-4">
				{!isRecording && !audioBlob && (
					<Button
						onClick={startRecording}
						className="h-12 w-12 rounded-full bg-red-500 hover:bg-red-600"
						size="icon"
					>
						<Mic className="h-6 w-6" />
					</Button>
				)}

				{isRecording && (
					<>
						<Button
							onClick={pauseRecording}
							variant="outline"
							className="h-10 w-10 rounded-full"
							size="icon"
						>
							{isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
						</Button>
						<Button
							onClick={stopRecording}
							className="h-12 w-12 rounded-full bg-red-500 hover:bg-red-600"
							size="icon"
						>
							<Square className="h-6 w-6" />
						</Button>
					</>
				)}

				{audioBlob && !isRecording && (
					<>
						<Button
							onClick={playRecording}
							variant="outline"
							className="h-10 w-10 rounded-full"
							size="icon"
						>
							{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
						</Button>
						<Button
							onClick={transcribeAudio}
							disabled={isTranscribing}
							className="h-10 px-4"
						>
							{isTranscribing ? "Transcribiendo..." : "Transcribir"}
						</Button>
						<Button
							onClick={clearRecording}
							variant="outline"
							className="h-10 w-10 rounded-full"
							size="icon"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</>
				)}
			</div>

			{/* Tiempo de grabación */}
			{isRecording && (
				<div className="text-center">
					<div className="text-2xl font-mono font-bold text-red-500">
						{formatTime(recordingTime)}
					</div>
					<div className="text-sm text-muted-foreground">
						{isPaused ? "Pausado" : "Grabando..."}
					</div>
				</div>
			)}

			{/* Audio element oculto */}
			{audioBlob && (
				<audio
					ref={audioRef}
					src={URL.createObjectURL(audioBlob)}
					onEnded={handleAudioEnded}
					className="hidden"
				/>
			)}

			{/* Transcripción */}
			{transcription && (
				<div className="space-y-2">
					<h4 className="text-sm font-medium">Transcripción:</h4>
					<div className="p-3 bg-muted/50 rounded-lg">
						<p className="text-sm">{transcription}</p>
					</div>
					<Button
						onClick={() => {
							onTranscription?.(transcription)
							clearRecording()
						}}
						className="w-full"
						size="sm"
					>
						Usar transcripción
					</Button>
				</div>
			)}

			{/* Instrucciones */}
			<div className="text-center text-xs text-muted-foreground">
				{!isRecording && !audioBlob && "Haz clic en el micrófono para comenzar a grabar"}
				{isRecording && "Haz clic en el cuadrado para detener la grabación"}
				{audioBlob && !transcription && "Haz clic en 'Transcribir' para convertir el audio a texto"}
			</div>
		</div>
	)
}



