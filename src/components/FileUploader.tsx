import React, { useCallback } from 'react'
import { Upload, X, FileText, Music, Image, Video, Link } from 'lucide-react'
import { useUploadFile } from '../hooks/useFiles'
import toast from 'react-hot-toast'

interface FileUploaderProps {
  onUploaded: (result: { publicUrl: string; path: string; bucket: string }) => void
  accept?: string
  bucket?: 'images' | 'audio' | 'documents'
}

const getBucket = (file: File): 'images' | 'audio' | 'documents' => {
  if (file.type.startsWith('image/')) return 'images'
  if (file.type.startsWith('audio/')) return 'audio'
  return 'documents'
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onUploaded, bucket }) => {
  const upload = useUploadFile()
  const [dragging, setDragging] = React.useState(false)
  const [preview, setPreview] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    const b = bucket ?? getBucket(file)
    const path = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`

    if (file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file))
    }

    try {
      const result = await upload.mutateAsync({ bucket: b, file, path })
      onUploaded({ ...result, bucket: b })
      toast.success('File uploaded!')
    } catch (e: any) {
      toast.error(e.message ?? 'Upload failed')
    }
  }, [bucket, upload, onUploaded])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
        dragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-[#2d3450] hover:border-indigo-500/50 hover:bg-white/[0.02]'
      }`}
    >
      <input ref={inputRef} type="file" className="hidden" onChange={onInputChange} />
      {upload.isPending ? (
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Uploading...</span>
        </div>
      ) : preview ? (
        <div className="relative inline-block">
          <img src={preview} alt="Preview" className="max-h-32 rounded-lg" />
          <button onClick={(e) => { e.stopPropagation(); setPreview(null) }} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5">
            <X size={12} />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-gray-500">
          <Upload size={28} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-400">Drop file here or click to upload</span>
          <span className="text-xs">Images, Audio, PDFs supported</span>
        </div>
      )}
    </div>
  )
}

interface EmbedInputProps {
  type: 'youtube' | 'embed'
  value: string
  onChange: (val: string) => void
}

export const EmbedInput: React.FC<EmbedInputProps> = ({ type, value, onChange }) => {
  const Icon = type === 'youtube' ? Video : Link
  return (
    <div className="flex items-center gap-2 bg-[#0f1117] border border-[#1e2334] rounded-lg px-3 py-2">
      <Icon size={16} className="text-gray-500 flex-shrink-0" />
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={type === 'youtube' ? 'https://youtube.com/watch?v=...' : 'Enter embed URL...'}
        className="flex-1 bg-transparent text-sm outline-none text-gray-300 placeholder-gray-600"
      />
    </div>
  )
}

export const fileTypeIcon = (type: string) => {
  switch (type) {
    case 'image': return <Image size={20} className="text-blue-400" />
    case 'audio': return <Music size={20} className="text-purple-400" />
    case 'pdf': return <FileText size={20} className="text-red-400" />
    case 'youtube': return <Video size={20} className="text-red-500" />
    default: return <Link size={20} className="text-green-400" />
  }
}

export const fileTypeBadgeClass = (type: string) => {
  switch (type) {
    case 'image': return 'bg-blue-500/15 text-blue-400'
    case 'audio': return 'bg-purple-500/15 text-purple-400'
    case 'pdf': return 'bg-red-500/15 text-red-400'
    case 'youtube': return 'bg-red-600/15 text-red-500'
    default: return 'bg-green-500/15 text-green-400'
  }
}
