"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
	Mic, 
	MicOff, 
	Play, 
	Pause, 
	Square,
	Trash2,
	CheckCircle,
	AlertCircle,
	Loader2,
	Sparkles,
	Volume2
} from "lucide-react"
import { toast } from "sonner"

interface VoiceCaptureProps {
	onContentExtracted: (content: string, title: string, source: string) => void
	className?: string
}

export function VoiceCapture({ onContentExtracted, className = "" }: VoiceCaptureProps) {
	const [isRecording, setIsRecording] = useState(false)
	const [isTranscribing, setIsTranscribing] = useState(false)
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
	const [audioUrl, setAudioUrl] = useState<string | null>(null)
	const [transcript, setTranscript] = useState<string>("")
	const [isPlaying, setIsPlaying] = useState(false)
	const [recordingTime, setRecordingTime] = useState(0)
	
	const mediaRecorderRef = useRef<MediaRecorder | null>(null)
	const audioRef = useRef<HTMLAudioElement | null>(null)
	const chunksRef = useRef<Blob[]>([])
	const intervalRef = useRef<NodeJS.Timeout | null>(null)

	// Verificar soporte de navegador
	const [isSupported, setIsSupported] = useState(false)

	useEffect(() => {
		// Verificar si el navegador soporta MediaRecorder
		if (typeof window !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
			setIsSupported(true)
		}
	}, [])

	useEffect(() => {
		return () => {
			// Cleanup
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
			}
			if (audioUrl) {
				URL.revokeObjectURL(audioUrl)
			}
		}
	}, [audioUrl])

	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
			const mediaRecorder = new MediaRecorder(stream)
			mediaRecorderRef.current = mediaRecorder
			chunksRef.current = []

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					chunksRef.current.push(event.data)
				}
			}

			mediaRecorder.onstop = () => {
				const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' })
				setAudioBlob(audioBlob)
				const url = URL.createObjectURL(audioBlob)
				setAudioUrl(url)
				stream.getTracks().forEach(track => track.stop())
			}

			mediaRecorder.start()
			setIsRecording(true)
			setRecordingTime(0)

			// Timer para mostrar duración de grabación
			intervalRef.current = setInterval(() => {
				setRecordingTime(prev => prev + 1)
			}, 1000)

			toast.success("Grabación iniciada")
		} catch (error) {
			console.error('Error starting recording:', error)
			toast.error("Error al iniciar la grabación. Verifica los permisos del micrófono.")
		}
	}

	const stopRecording = () => {
		if (mediaRecorderRef.current && isRecording) {
			mediaRecorderRef.current.stop()
			setIsRecording(false)
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
			}
			toast.success("Grabación detenida")
		}
	}

	const playAudio = () => {
		if (audioRef.current) {
			if (isPlaying) {
				audioRef.current.pause()
				setIsPlaying(false)
			} else {
				audioRef.current.play()
				setIsPlaying(true)
			}
		}
	}

	const deleteRecording = () => {
		setAudioBlob(null)
		setAudioUrl(null)
		setTranscript("")
		setRecordingTime(0)
		if (audioRef.current) {
			audioRef.current.pause()
			setIsPlaying(false)
		}
	}

	const transcribeAudio = async () => {
		if (!audioBlob) return

		setIsTranscribing(true)
		try {
			// Simular transcripción (en implementación real, esto sería una API call a Google Speech-to-Text)
			await new Promise(resolve => setTimeout(resolve, 3000))
			
			// Mock transcript basado en la duración de la grabación
			const mockTranscripts = [
				"Esta es una nota de voz sobre las ideas que tengo para el proyecto. Necesito revisar el código, hacer pruebas y documentar la funcionalidad. También debo contactar al equipo para coordinar la reunión de mañana.",
				"Recordatorio: comprar ingredientes para la cena, llamar al dentista para la cita, y revisar el presupuesto del mes. También necesito terminar el informe que está pendiente.",
				"Notas de la reunión: discutimos los objetivos del trimestre, las nuevas funcionalidades que vamos a implementar, y los recursos necesarios. El equipo está motivado y tenemos buenas perspectivas.",
				"Ideas para el blog: escribir sobre las tendencias de IA, crear un tutorial de React, y compartir experiencias de desarrollo. También podría hacer una serie sobre productividad.",
				"Reflexiones del día: aprendí mucho sobre el nuevo framework, el equipo trabajó muy bien juntos, y logramos completar la funcionalidad a tiempo. Mañana debo enfocarme en las pruebas."
			]
			
			const randomTranscript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)]
			setTranscript(randomTranscript)
			toast.success("Transcripción completada")
			
		} catch (error) {
			console.error('Error transcribing audio:', error)
			toast.error("Error al transcribir el audio")
		} finally {
			setIsTranscribing(false)
		}
	}

	const addToNote = () => {
		if (transcript) {
			const formattedContent = `# Nota de Voz

**Duración**: ${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')}  
**Fecha**: ${new Date().toLocaleDateString('es-ES')}  
**Transcripción automática**

---

${transcript}`
			
			onContentExtracted(formattedContent, "Nota de Voz", `voz:${Date.now()}`)
			toast.success("Nota de voz agregada")
			
			// Reset
			deleteRecording()
		}
	}

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins}:${secs.toString().padStart(2, '0')}`
	}

	if (!isSupported) {
		return (
			<Card className={className}>
				<CardContent className="py-8">
					<div className="text-center">
						<AlertCircle className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
						<h3 className="text-lg font-semibold mb-2">Grabación no soportada</h3>
						<p className="text-sm text-muted-foreground">
							Tu navegador no soporta grabación de audio. Usa Chrome, Firefox o Safari.
						</p>
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card className={className}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-sm">
					<Mic className="h-4 w-4" />
					Grabar Nota de Voz
				</CardTitle>
			</CardHeader>
			
			<CardContent className="space-y-4">
				{!audioBlob ? (
					<>
						{/* Recording Interface */}
						<div className="text-center py-6">
							<div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors ${
								isRecording 
									? 'bg-red-500 text-white animate-pulse' 
									: 'bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground'
							}`}>
								{isRecording ? (
									<MicOff className="h-8 w-8" />
								) : (
									<Mic className="h-8 w-8" />
								)}
							</div>
							
							{isRecording && (
								<div className="mb-4">
									<div className="text-2xl font-mono font-bold text-red-500">
										{formatTime(recordingTime)}
									</div>
									<div className="text-xs text-muted-foreground">
										Grabando...
									</div>
								</div>
							)}
							
							<p className="text-sm text-muted-foreground mb-4">
								{isRecording 
									? "Haz clic para detener la grabación"
									: "Haz clic para comenzar a grabar"
								}
							</p>
							
							<Button
								onClick={isRecording ? stopRecording : startRecording}
								variant={isRecording ? "destructive" : "default"}
								size="lg"
								className="gap-2"
							>
								{isRecording ? (
									<>
										<Square className="h-4 w-4" />
										Detener
									</>
								) : (
									<>
										<Mic className="h-4 w-4" />
										Iniciar Grabación
									</>
								)}
							</Button>
						</div>
					</>
				) : (
					<>
						{/* Playback Interface */}
						<div className="space-y-4">
							<div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
								<div className="flex items-center gap-3">
									<Volume2 className="h-4 w-4 text-primary" />
									<div>
										<div className="text-sm font-medium">Grabación completada</div>
										<div className="text-xs text-muted-foreground">
											Duración: {formatTime(recordingTime)}
										</div>
									</div>
								</div>
								
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={playAudio}
										className="gap-1"
									>
										{isPlaying ? (
											<Pause className="h-3 w-3" />
										) : (
											<Play className="h-3 w-3" />
										)}
										{isPlaying ? 'Pausar' : 'Reproducir'}
									</Button>
									
									<Button
										variant="outline"
										size="sm"
										onClick={deleteRecording}
										className="gap-1 text-destructive hover:text-destructive"
									>
										<Trash2 className="h-3 w-3" />
									</Button>
								</div>
							</div>
							
							{/* Audio element */}
							<audio
								ref={audioRef}
								src={audioUrl || undefined}
								onEnded={() => setIsPlaying(false)}
								className="hidden"
							/>
							
							{/* Transcription */}
							{!transcript ? (
								<Button
									onClick={transcribeAudio}
									disabled={isTranscribing}
									className="w-full gap-2"
								>
									{isTranscribing ? (
										<>
											<Loader2 className="h-4 w-4 animate-spin" />
											Transcribiendo...
										</>
									) : (
										<>
											<Sparkles className="h-4 w-4" />
											Transcribir a Texto
										</>
									)}
								</Button>
							) : (
								<div className="space-y-3">
									<div className="p-3 bg-muted/30 rounded-lg">
										<div className="flex items-center gap-2 mb-2">
											<CheckCircle className="h-4 w-4 text-green-600" />
											<span className="text-sm font-medium">Transcripción</span>
										</div>
										<p className="text-sm text-muted-foreground">
											{transcript}
										</p>
									</div>
									
									<div className="flex gap-2">
										<Button
											onClick={addToNote}
											className="flex-1 gap-2"
										>
											<CheckCircle className="h-4 w-4" />
											Agregar a Nota
										</Button>
										<Button
											variant="outline"
											onClick={() => setTranscript("")}
											className="gap-2"
										>
											<Trash2 className="h-4 w-4" />
											Re-transcribir
										</Button>
									</div>
								</div>
							)}
						</div>
					</>
				)}
			</CardContent>
		</Card>
	)
}

