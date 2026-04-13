import React, { useState } from 'react'
import { Search, X, Check, Filter, Upload, Folder, Loader2 } from 'lucide-react'
import { useFiles, useCreateFile } from '../hooks/useFiles'
import { FileUploader, EmbedInput, fileTypeIcon, fileTypeBadgeClass } from './FileUploader'
import { TagSelector } from './TagSelector'
import { useAuthStore } from '../stores'
import type { FileItem } from '../types'
import toast from 'react-hot-toast'

interface FilePickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (file: FileItem) => void
  title?: string
  allowedTypes?: string[]
}

const FILE_TYPES = ['image', 'audio', 'pdf', 'youtube', 'embed'] as const

const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return ''
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
  const match = url.match(regExp)
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url
}

export const FilePickerModal: React.FC<FilePickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = 'Select or Add File',
  allowedTypes
}) => {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<'library' | 'upload'>('library')

  // Library State
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const { data: files = [], isLoading } = useFiles(typeFilter ? { file_type: typeFilter } : undefined)

  // Upload State
  const createFile = useCreateFile()
  const [fileTitle, setFileTitle] = useState('')
  const [fileType, setFileType] = useState<typeof FILE_TYPES[number]>('image')
  const [fileDesc, setFileDesc] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [embedUrl, setEmbedUrl] = useState('')
  const [storagePath, setStoragePath] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  if (!isOpen) return null

  // Restrict types based on allowedTypes
  const validTypesToShow = allowedTypes 
    ? FILE_TYPES.filter(t => allowedTypes.includes(t))
    : FILE_TYPES

  const filtered = files.filter((f) =>
    f.title.toLowerCase().includes(search.toLowerCase()) &&
    (!allowedTypes || allowedTypes.includes(f.file_type))
  )

  const handleCreate = async () => {
    if (!fileTitle.trim()) return toast.error('Title is required')
    
    // Auto-derive embed url formatting if Youtube
    let finalEmbedUrl = embedUrl;
    if (fileType === 'youtube' && embedUrl) {
       finalEmbedUrl = getYouTubeEmbedUrl(embedUrl);
    }

    try {
      const payload = {
        title: fileTitle.trim(),
        description: fileDesc ? `<p>${fileDesc.trim().replace(/\n/g, '<br />')}</p>` : undefined,
        file_type: fileType,
        file_url: fileUrl || undefined,
        embed_url: finalEmbedUrl || undefined,
        storage_path: storagePath || undefined,
        user_id: user?.id
      }
      
      const newFiles = await createFile.mutateAsync({ file: payload as any, tagIds: selectedTagIds })
      const newFile = newFiles[0] // Because it returns the inserted row
      toast.success('File added to repository!')
      
      // Auto-select the newly created file
      if (newFile) {
        onSelect(newFile as FileItem)
      }
      onClose()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save file')
    }
  }

  const needsUpload = fileType === 'image' || fileType === 'audio' || fileType === 'pdf'
  const needsEmbed = fileType === 'youtube' || fileType === 'embed'

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 60 }}>
      <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header border-b-0 pb-0">
          <div className="flex items-center justify-between w-full">
            <h2 className="font-semibold text-base">{title}</h2>
            <button onClick={onClose} className="btn btn-icon btn-ghost btn-sm"><X size={15} /></button>
          </div>
          <div className="flex gap-4 mt-3 border-b border-[#1e2334] w-full">
            <button 
              onClick={() => setTab('library')} 
              className={`pb-2 border-b-2 transition-colors gap-2 flex items-center text-sm font-medium ${tab === 'library' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              <Folder size={14} /> Repository
            </button>
            <button 
              onClick={() => setTab('upload')} 
              className={`pb-2 border-b-2 transition-colors gap-2 flex items-center text-sm font-medium ${tab === 'upload' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              <Upload size={14} /> Upload New
            </button>
          </div>
        </div>
        
        <div className="modal-body space-y-4 pt-4">
          {tab === 'library' ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-48">
                  <div className="search-input-wrapper">
                    <Search size={15} className="search-icon" />
                    <input 
                      type="text" 
                      value={search} 
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search files..." 
                      className="form-input search-input py-2 text-sm" 
                      autoFocus
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                  <Filter size={15} className="text-gray-500 flex-shrink-0" />
                  <button 
                      onClick={() => setTypeFilter('')}
                      className={`btn btn-xs py-1 px-2 capitalize shrink-0 ${typeFilter === '' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      All
                  </button>
                  {validTypesToShow.map((type) => (
                    <button 
                      key={type} 
                      onClick={() => setTypeFilter(type)}
                      className={`btn btn-xs py-1 px-2 capitalize shrink-0 ${typeFilter === type ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {isLoading ? (
                  <div className="col-span-full flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="col-span-full text-center py-12 bg-white/5 rounded-xl border border-dashed border-white/10">
                    <p className="text-gray-500 text-sm">No matching files found</p>
                  </div>
                ) : (
                  filtered.map((file) => (
                    <div 
                      key={file.id} 
                      onClick={() => { onSelect(file); onClose(); }}
                      className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-indigo-500/30 cursor-pointer transition-all group"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${fileTypeBadgeClass(file.file_type)}`}>
                        {fileTypeIcon(file.file_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-200 truncate">{file.title}</h3>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{file.file_type}</p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Check size={14} className="text-indigo-400" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-4">
               {/* Upload Form */}
               <div className="form-group">
                  <label className="form-label">Asset Title *</label>
                  <input value={fileTitle} onChange={(e) => setFileTitle(e.target.value)} className="form-input" placeholder="e.g. Intro PDF" autoFocus />
                </div>

                <div className="form-group">
                  <label className="form-label">File Type</label>
                  <div className="flex flex-wrap gap-2">
                    {validTypesToShow.map((t) => (
                      <button key={t} onClick={() => { setFileType(t); setFileUrl(''); setEmbedUrl('') }}
                        className={`btn btn-sm capitalize gap-1.5 ${fileType === t ? 'btn-primary' : 'btn-secondary'}`}>
                        {fileTypeIcon(t)} {t}
                      </button>
                    ))}
                  </div>
                </div>

                {needsUpload && (
                  <div className="form-group">
                    <label className="form-label">Upload Data</label>
                    <FileUploader
                      bucket={fileType === 'image' ? 'images' : fileType === 'audio' ? 'audio' : 'documents'}
                      onUploaded={({ publicUrl, path }) => { setFileUrl(publicUrl); setStoragePath(path) }}
                    />
                    {fileUrl && <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1"><Check size={11} /> Uploaded: {fileUrl.split('/').pop()}</div>}
                  </div>
                )}

                {needsEmbed && (
                  <div className="form-group">
                    <label className="form-label">{fileType === 'youtube' ? 'YouTube URL' : 'Embed URL'}</label>
                    <EmbedInput type={fileType as 'youtube' | 'embed'} value={embedUrl} onChange={setEmbedUrl} />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Tags</label>
                  <TagSelector selectedIds={selectedTagIds} onChange={setSelectedTagIds} />
                </div>

                <div className="form-group">
                  <label className="form-label">Description (optional)</label>
                  <textarea 
                    value={fileDesc} 
                    onChange={e => setFileDesc(e.target.value)} 
                    className="form-input py-2" 
                    rows={2} 
                    placeholder="Short inner description..." 
                  />
                  <p className="text-xs text-gray-500 mt-1">This desc is just for repository search, it won't render over your lesson.</p>
                </div>
            </div>
          )}
        </div>
        
        <div className="modal-footer flexjustify-end border-t border-[#1e2334] pt-4 mt-4">
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          {tab === 'upload' && (
            <button onClick={handleCreate} disabled={createFile.isPending || (!fileUrl && needsUpload) || (!embedUrl && needsEmbed)} className="btn btn-primary gap-2">
              {createFile.isPending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Embed into Lesson
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
