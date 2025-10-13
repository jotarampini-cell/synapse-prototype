"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  Bold, Italic, Underline, Strikethrough, Code, Link2, 
  Highlighter, List, ListOrdered, Quote, Heading1, Heading2, 
  Heading3, CheckSquare, Image, Table, AlignLeft, AlignCenter, 
  AlignRight, Palette, MoreHorizontal
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface EditorToolbarProps {
  onCommand: (command: string, value?: unknown) => void
  className?: string
}

export function EditorToolbar({ onCommand, className }: EditorToolbarProps) {
  const colors = [
    { name: 'Negro', value: '#000000' },
    { name: 'Rojo', value: '#EF4444' },
    { name: 'Naranja', value: '#F97316' },
    { name: 'Amarillo', value: '#EAB308' },
    { name: 'Verde', value: '#22C55E' },
    { name: 'Azul', value: '#3B82F6' },
    { name: 'Púrpura', value: '#A855F7' },
    { name: 'Rosa', value: '#EC4899' },
  ]

  return (
    <div className={cn(
      "sticky top-0 z-10 bg-background border-b border-border",
      "overflow-x-auto scrollbar-hide",
      className
    )}>
      <div className="flex items-center gap-1 p-2 min-w-max">
        {/* Formato de texto */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCommand('bold')}
            className="h-8 w-8 p-0 hover:bg-accent"
            title="Negrita (⌘B)"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCommand('italic')}
            className="h-8 w-8 p-0 hover:bg-accent"
            title="Cursiva (⌘I)"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCommand('underline')}
            className="h-8 w-8 p-0 hover:bg-accent"
            title="Subrayado (⌘U)"
          >
            <Underline className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCommand('strikethrough')}
            className="h-8 w-8 p-0 hover:bg-accent"
            title="Tachado"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Código y resaltado */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCommand('code')}
            className="h-8 w-8 p-0 hover:bg-accent"
            title="Código inline (⌘E)"
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCommand('marker')}
            className="h-8 w-8 p-0 hover:bg-accent"
            title="Resaltar"
          >
            <Highlighter className="h-4 w-4" />
          </Button>
          
          {/* Color picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-accent"
                title="Color de texto"
              >
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="flex gap-1 flex-wrap max-w-[200px]">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    className="w-7 h-7 rounded-md border-2 border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color.value }}
                    onClick={() => onCommand('color', color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Encabezados */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCommand('header', { level: 1 })}
            className="h-8 w-8 p-0 hover:bg-accent"
            title="Título 1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCommand('header', { level: 2 })}
            className="h-8 w-8 p-0 hover:bg-accent"
            title="Título 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCommand('header', { level: 3 })}
            className="h-8 w-8 p-0 hover:bg-accent"
            title="Título 3"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Listas */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCommand('list', { style: 'unordered' })}
            className="h-8 w-8 p-0 hover:bg-accent"
            title="Lista con viñetas"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCommand('list', { style: 'ordered' })}
            className="h-8 w-8 p-0 hover:bg-accent"
            title="Lista numerada"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCommand('checklist')}
            className="h-8 w-8 p-0 hover:bg-accent"
            title="Lista de tareas"
          >
            <CheckSquare className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Bloques especiales */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCommand('quote')}
            className="h-8 w-8 p-0 hover:bg-accent"
            title="Cita"
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCommand('link')}
            className="h-8 w-8 p-0 hover:bg-accent"
            title="Enlace (⌘K)"
          >
            <Link2 className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Alineación */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCommand('align', 'left')}
            className="h-8 w-8 p-0 hover:bg-accent"
            title="Alinear izquierda"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCommand('align', 'center')}
            className="h-8 w-8 p-0 hover:bg-accent"
            title="Alinear centro"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCommand('align', 'right')}
            className="h-8 w-8 p-0 hover:bg-accent"
            title="Alinear derecha"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Insertar */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCommand('image')}
            className="h-8 w-8 p-0 hover:bg-accent"
            title="Insertar imagen"
          >
            <Image className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCommand('table')}
            className="h-8 w-8 p-0 hover:bg-accent"
            title="Insertar tabla"
          >
            <Table className="h-4 w-4" />
          </Button>
        </div>

        {/* Más opciones */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-accent"
              title="Más opciones"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => onCommand('codeblock')}
              >
                Bloque de código
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => onCommand('warning')}
              >
                Advertencia
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => onCommand('delimiter')}
              >
                Divisor
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
