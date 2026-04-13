import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Image } from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Youtube from '@tiptap/extension-youtube'
import { Node, mergeAttributes } from '@tiptap/core'

/**
 * Custom PDF Embed Extension for Tiptap
 */
const PdfEmbed = Node.create({
  name: 'pdfEmbed',
  group: 'block',

  addAttributes() {
    return {
      src: { 
        default: null,
        parseHTML: element => element.querySelector('iframe')?.getAttribute('src'),
      },
      title: { 
        default: 'PDF Document',
        parseHTML: element => element.querySelector('.pdf-title-text')?.textContent?.replace('PDF: ', '') || 'PDF Document',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="pdf-embed"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { class: 'pdf-embed-container', 'data-type': 'pdf-embed', contenteditable: 'false' }),
      ['iframe', { src: HTMLAttributes.src, class: 'pdf-iframe' }],
      [
        'div',
        { class: 'pdf-caption' },
        ['span', { class: 'pdf-title-text font-medium text-gray-400' }, `PDF: ${HTMLAttributes.title}`],
        ['a', { href: HTMLAttributes.src, target: '_blank', class: 'text-indigo-400 underline ml-2' }, 'Open in New Tab'],
      ],
    ]
  },

  // @ts-ignore
  addCommands() {
    return {
      setPdfEmbed: (options: { src: string; title: string }) => ({ commands }: any) => {
        return commands.insertContent(`
          <div class="pdf-embed-container" data-type="pdf-embed" contenteditable="false">
            <iframe src="${options.src}" class="pdf-iframe"></iframe>
            <div class="pdf-caption">
              <span class="pdf-title-text font-medium text-gray-400">PDF: ${options.title}</span>
              <a href="${options.src}" target="_blank" class="text-indigo-400 underline ml-2">Open in New Tab</a>
            </div>
          </div><p></p>
        `)
      },
    }
  },
})
import {
  Bold, Italic, List, ListOrdered, Quote, Code, Heading2, Heading3,
  Link as LinkIcon, Image as ImageIcon, Video as YoutubeIcon, Undo, Redo,
  FolderOpen
} from 'lucide-react'
import { FilePickerModal } from './FilePickerModal'
import type { FileItem } from '../types'

interface RichTextEditorProps {
  content?: string
  onChange?: (html: string) => void
  placeholder?: string
  readOnly?: boolean
  minHeight?: string
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content = '',
  onChange,
  placeholder = 'Start writing...',
  readOnly = false,
  minHeight = '200px',
}) => {
  const [isPickerOpen, setIsPickerOpen] = React.useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Placeholder.configure({ placeholder }),
      Youtube.configure({ controls: false }),
      PdfEmbed,
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
  })

  // Keep editor in sync with content prop if it changes from outside
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) return null

  const ToolbarBtn: React.FC<{
    onClick: () => void
    active?: boolean
    title: string
    children: React.ReactNode
  }> = ({ onClick, active, title, children }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`btn btn-icon btn-sm transition-colors ${
        active ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
      }`}
    >
      {children}
    </button>
  )

  const addLink = () => {
    const url = window.prompt('Enter URL')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }

  const addImage = () => {
    const url = window.prompt('Enter image URL')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  const addYoutube = () => {
    const url = window.prompt('Enter YouTube URL')
    if (url) editor.commands.setYoutubeVideo({ src: url })
  }

  const handleFileSelect = (file: FileItem) => {
    if (!editor) return

    if (file.file_type === 'image' && file.file_url) {
      editor.chain().focus().setImage({ src: file.file_url }).run()
    } else if (file.file_type === 'youtube' && (file.embed_url || file.file_url)) {
      editor.chain().focus().setYoutubeVideo({ src: file.embed_url || file.file_url! }).run()
    } else if (file.file_type === 'audio' && file.file_url) {
      editor.chain().focus().insertContent(`<audio controls src="${file.file_url}"></audio>`).run()
    } else if (file.file_type === 'pdf' && file.file_url) {
      console.log('Inserting PDF Embed HTML:', file.title, file.file_url)
      
      // Use the command which now inserts RAW HTML allowing Tiptap parser to kick in
      ;(editor.chain().focus() as any).setPdfEmbed({ 
        src: `${file.file_url}#toolbar=1`, 
        title: file.title 
      }).focus().run()
    } else {
      const url = file.file_url || file.embed_url
      if (url) {
        editor.chain().focus().insertContent(`<a href="${url}" target="_blank" class="text-indigo-400 underline">${file.title}</a>`).run()
      }
    }
  }

  if (readOnly) {
    return (
      <div
        className="tiptap-content prose prose-invert max-w-none"
        style={{ minHeight }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )
  }

  return (
    <div className="tiptap-editor">
      <div className="tiptap-toolbar">
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <Bold size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <Italic size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="H2">
          <Heading2 size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="H3">
          <Heading3 size={14} />
        </ToolbarBtn>
        <div className="w-px h-5 bg-gray-700 mx-0.5" />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
          <List size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List">
          <ListOrdered size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
          <Quote size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Code">
          <Code size={14} />
        </ToolbarBtn>
        <div className="w-px h-5 bg-gray-700 mx-0.5" />
        <ToolbarBtn onClick={addLink} active={editor.isActive('link')} title="Add Link">
          <LinkIcon size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={addImage} title="Add Image">
          <ImageIcon size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={addYoutube} title="Add YouTube">
          <YoutubeIcon size={14} />
        </ToolbarBtn>
        <div className="w-px h-5 bg-gray-700 mx-0.5" />
        <ToolbarBtn onClick={() => setIsPickerOpen(true)} title="Pick from Repository">
          <FolderOpen size={14} className="text-indigo-400" />
        </ToolbarBtn>
        <div className="w-px h-5 bg-gray-700 mx-0.5 ml-auto" />
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo size={14} />
        </ToolbarBtn>
      </div>
      <div style={{ minHeight }}>
        <EditorContent editor={editor} className="tiptap-content" />
      </div>

      <FilePickerModal 
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleFileSelect}
      />
    </div>
  )
}
