"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { FileText, Clock } from "lucide-react"

interface Note {
	id: string
	title: string
	content: string
	updated_at: string
}

export function DebugListView() {
	const [notes, setNotes] = useState<Note[]>([])

	useEffect(() => {
		// Datos de prueba simples
		const testNotes: Note[] = [
			{
				id: '1',
				title: 'Nota de Prueba 1',
				content: 'Este es el contenido de la primera nota de prueba',
				updated_at: new Date().toISOString()
			},
			{
				id: '2',
				title: 'Nota de Prueba 2',
				content: 'Este es el contenido de la segunda nota de prueba',
				updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
			}
		]
		setNotes(testNotes)
	}, [])

	console.log('DebugListView rendering with notes:', notes)

	return (
		<div className="p-4 space-y-2">
			<h2 className="text-lg font-bold mb-4">Debug List View</h2>
			{notes.map((note) => (
				<Card 
					key={note.id}
					className="p-3 border bg-white"
				>
					<div className="flex items-center gap-3">
						<FileText className="h-4 w-4 text-blue-500" />
						<div className="flex-1">
							<h3 className="font-semibold text-sm text-black">
								{note.title}
							</h3>
							<p className="text-sm text-gray-600">
								{note.content}
							</p>
							<div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
								<Clock className="h-3 w-3" />
								<span>{new Date(note.updated_at).toLocaleString()}</span>
							</div>
						</div>
					</div>
				</Card>
			))}
		</div>
	)
}
