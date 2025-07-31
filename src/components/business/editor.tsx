// components/editor.tsx
'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Undo,
  Redo,
  ChevronDown,
  Type,
} from 'lucide-react'

export default function EditorComponent({
  label = 'Content',
  defaultValue = '<p>Hello, world!</p>',
  onChange,
}: {
  label?: string
  defaultValue?: string
  onChange?: (html: string) => void
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: defaultValue,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose dark:prose-invert focus:outline-none min-h-[150px] px-3 py-2 rounded-md border border-input bg-background text-sm',
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
  })

  if (!editor) return null

  // Function to get current heading level or text type
  const getCurrentTextType = () => {
    if (editor.isActive('heading', { level: 1 })) return 'H1'
    if (editor.isActive('heading', { level: 2 })) return 'H2'
    if (editor.isActive('heading', { level: 3 })) return 'H3'
    if (editor.isActive('heading', { level: 4 })) return 'H4'
    if (editor.isActive('heading', { level: 5 })) return 'H5'
    if (editor.isActive('heading', { level: 6 })) return 'H6'
    return 'Paragraph'
  }

  // Text type options
  const textTypes = [
    { label: 'Paragraph', value: 'paragraph', action: () => editor.chain().focus().setParagraph().run() },
    { label: 'Heading 1', value: 'h1', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: 'Heading 2', value: 'h2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'Heading 3', value: 'h3', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: 'Heading 4', value: 'h4', action: () => editor.chain().focus().toggleHeading({ level: 4 }).run() },
    { label: 'Heading 5', value: 'h5', action: () => editor.chain().focus().toggleHeading({ level: 5 }).run() },
    { label: 'Heading 6', value: 'h6', action: () => editor.chain().focus().toggleHeading({ level: 6 }).run() },
  ]

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Card>
        <CardContent className="space-y-2 p-2">
          <div className="flex flex-wrap gap-1 border-b pb-2">
            {/* Text Type Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="min-w-[100px] justify-between">
                  <div className="flex items-center gap-1">
                    <Type className="w-4 h-4" />
                    <span className="text-xs">{getCurrentTextType()}</span>
                  </div>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                {textTypes.map((type) => (
                  <DropdownMenuItem
                    key={type.value}
                    onClick={type.action}
                    className="cursor-pointer"
                  >
                    <span className={type.value === 'paragraph' ? 'text-sm' : 
                                   type.value === 'h1' ? 'text-2xl font-bold' :
                                   type.value === 'h2' ? 'text-xl font-bold' :
                                   type.value === 'h3' ? 'text-lg font-bold' :
                                   type.value === 'h4' ? 'text-base font-bold' :
                                   type.value === 'h5' ? 'text-sm font-bold' :
                                   'text-xs font-bold'}>
                      {type.label}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Formatting Buttons */}
            <Button
              variant={editor.isActive('bold') ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              variant={editor.isActive('italic') ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              variant={editor.isActive('strike') ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <Strikethrough className="w-4 h-4" />
            </Button>

            {/* List Buttons */}
            <Button
              variant={editor.isActive('bulletList') ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={editor.isActive('orderedList') ? 'default' : 'outline'}
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className="w-4 h-4" />
            </Button>

            {/* Undo/Redo Buttons */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>

          <EditorContent editor={editor} />
        </CardContent>
      </Card>
    </div>
  )
}