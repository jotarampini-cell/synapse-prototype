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
		<div style={{ padding: '16px' }}>
			<h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'black' }}>
				Debug List View - {notes.length} notas
			</h2>
			{notes.map((note) => (
				<div 
					key={note.id}
					style={{ 
						padding: '12px', 
						border: '1px solid #ccc', 
						backgroundColor: 'white',
						marginBottom: '8px',
						borderRadius: '8px'
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
						<FileText style={{ width: '16px', height: '16px', color: 'blue' }} />
						<div style={{ flex: 1 }}>
							<h3 style={{ 
								fontWeight: 'bold', 
								fontSize: '14px', 
								color: 'black',
								margin: '0 0 4px 0'
							}}>
								{note.title}
							</h3>
							<p style={{ 
								fontSize: '12px', 
								color: '#666',
								margin: '0 0 4px 0'
							}}>
								{note.content}
							</p>
							<div style={{ 
								display: 'flex', 
								alignItems: 'center', 
								gap: '4px',
								fontSize: '10px',
								color: '#999'
							}}>
								<Clock style={{ width: '12px', height: '12px' }} />
								<span>{new Date(note.updated_at).toLocaleString()}</span>
							</div>
						</div>
					</div>
				</div>
			))}
		</div>
	)
}
