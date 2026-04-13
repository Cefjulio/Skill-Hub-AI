import React, { useState } from 'react'
import { Plus, Search, FolderOpen, Music, FileText, Video, Link, Pencil, Trash2, X, Check, Filter, Eye, ExternalLink, ZoomIn, ZoomOut } from 'lucide-react'
import { useFiles, useCreateFile, useUpdateFile, useDeleteFile } from '../../hooks/useFiles'
import { Header } from '../../components/Header'
import { TagSelector } from '../../components/TagSelector'
import { FileUploader, EmbedInput, fileTypeIcon, fileTypeBadgeClass } from '../../components/FileUploader'
import { RichTextEditor } from '../../components/RichTextEditor'
import type { FileItem } from '../../types'
import { useAuthStore } from '../../stores'
import toast from 'react-hot-toast'

const FILE_TYPES = ['image','audio','pdf','youtube','embed'] as const

const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return ''
  // Handle shorts and other variants
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
  const match = url.match(regExp)
  return (match && match[2].length === 11)
    ? `https://www.youtube.com/embed/${match[2]}`
    : url
}

export const RepositoryPage: React.FC = () => {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const { data: files = [], isLoading } = useFiles(typeFilter ? { file_type: typeFilter } : undefined)
  const createFile = useCreateFile()
  const updateFile = useUpdateFile()
  const deleteFile = useDeleteFile()

  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<FileItem | null>(null)
  const [viewingFile, setViewingFile] = useState<FileItem | null>(null)
  const [isZoomed, setIsZoomed] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [fileType, setFileType] = useState<typeof FILE_TYPES[number]>('image')
  const [fileUrl, setFileUrl] = useState('')
  const [embedUrl, setEmbedUrl] = useState('')
  const [storagePath, setStoragePath] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  const openCreate = () => {
    setTitle(''); setDescription(''); setFileType('image'); setFileUrl(''); setEmbedUrl(''); setStoragePath(''); setSelectedTagIds([])
    setEditing(null); setModal('create')
  }

  const openEdit = (f: FileItem) => {
    setTitle(f.title); setDescription(f.description ?? ''); setFileType(f.file_type)
    setFileUrl(f.file_url ?? ''); setEmbedUrl(f.embed_url ?? ''); setStoragePath(f.storage_path ?? '')
    setSelectedTagIds(f.tags?.map((t) => t.id) ?? [])
    setEditing(f); setModal('edit')
  }

  const closeModal = () => { setModal(null); setEditing(null) }

  const save = async () => {
    if (!title.trim()) return toast.error('Title is required')
    try {
      const payload = {
        title: title.trim(),
        description,
        file_type: fileType,
        file_url: fileUrl || undefined,
        embed_url: fileType === 'youtube' ? getYouTubeEmbedUrl(embedUrl) : (embedUrl || undefined),
        storage_path: storagePath || undefined,
        user_id: user?.id
      }
      
      if (modal === 'create') {
        await createFile.mutateAsync({ file: payload as any, tagIds: selectedTagIds })
        toast.success('File added to repository!')
      } else if (editing) {
        await updateFile.mutateAsync({ id: editing.id, file: payload, tagIds: selectedTagIds })
        toast.success('File updated!')
      }
      closeModal()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save file')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this file?')) return
    await deleteFile.mutateAsync(id)
    toast.success('File deleted')
  }

  const filtered = files.filter((f) =>
    f.title.toLowerCase().includes(search.toLowerCase())
  )

  const needsUpload = fileType === 'image' || fileType === 'audio' || fileType === 'pdf'
  const needsEmbed = fileType === 'youtube' || fileType === 'embed'

  return (
    <>
      <Header title="File Repository" />
      <div className="page-content flex flex-col gap-5">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-48">
            <div className="search-input-wrapper">
              <Search size={15} className="search-icon" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search files..." className="form-input search-input py-2 text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-gray-500" />
            {['', ...FILE_TYPES].map((type) => (
              <button key={type} onClick={() => setTypeFilter(type)}
                className={`btn btn-sm capitalize ${typeFilter === type ? 'btn-primary' : 'btn-secondary'}`}>
                {type || 'All'}
              </button>
            ))}
          </div>
          <button onClick={openCreate} className="btn btn-primary gap-2 ml-auto"><Plus size={15} /> Add File</button>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FolderOpen size={28} className="text-gray-600" /></div>
            <p className="font-medium text-gray-400">No files yet</p>
            <p className="text-sm text-gray-600 mt-1">Upload images, audio, PDFs or embed videos</p>
          </div>
        ) : (
          <div className="file-grid">
            {filtered.map((file) => (
              <div key={file.id} className="file-card group">
                <div className="file-thumbnail" onClick={() => setViewingFile(file)}>
                  {file.file_type === 'image' && file.file_url ? (
                    <img src={file.file_url} alt={file.title} className="w-full h-full object-cover" />
                  ) : file.file_type === 'youtube' ? (
                    <div className="flex flex-col items-center gap-1 text-gray-600">
                      <Video size={32} className="text-red-500" />
                      <span className="text-xs">YouTube Video</span>
                    </div>
                  ) : file.file_type === 'audio' ? (
                    <div className="flex flex-col items-center gap-1 text-gray-600">
                      <Music size={32} className="text-purple-400" />
                      {file.file_url && <audio controls className="w-full mt-1 max-w-[90%]" src={file.file_url} />}
                    </div>
                  ) : file.file_type === 'pdf' ? (
                    <div className="flex flex-col items-center gap-1 text-gray-600">
                      <FileText size={32} className="text-red-400" />
                      <span className="text-xs">PDF Document</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-gray-600">
                      <Link size={32} className="text-green-400" />
                      <span className="text-xs">Embed</span>
                    </div>
                  )}
                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto">
                    <button onClick={(e) => { e.stopPropagation(); setViewingFile(file) }} className="btn btn-icon btn-primary btn-sm" title="View"><Eye size={13} /></button>
                    <button onClick={(e) => { e.stopPropagation(); openEdit(file) }} className="btn btn-icon btn-secondary btn-sm" title="Edit"><Pencil size={13} /></button>
                    <button onClick={(e) => { e.stopPropagation(); remove(file.id) }} className="btn btn-icon btn-danger btn-sm" title="Delete"><Trash2 size={13} /></button>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-sm font-medium text-gray-200 truncate flex-1">{file.title}</h3>
                    <span className={`file-type-badge flex-shrink-0 ${fileTypeBadgeClass(file.file_type)}`}>{file.file_type}</span>
                  </div>
                  {file.tags && file.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {file.tags.slice(0, 3).map((tag) => (
                        <span key={tag.id} className="tag-chip" style={{ background: tag.color + '20', color: tag.color }}>
                          {tag.name}
                        </span>
                      ))}
                      {file.tags.length > 3 && <span className="text-xs text-gray-600">+{file.tags.length - 3}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {modal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="font-semibold text-base">{modal === 'create' ? 'Add File' : 'Edit File'}</h2>
                <button onClick={closeModal} className="btn btn-icon btn-ghost btn-sm"><X size={15} /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="form-input" placeholder="File title" />
                </div>

                <div className="form-group">
                  <label className="form-label">File Type</label>
                  <div className="flex flex-wrap gap-2">
                    {FILE_TYPES.map((t) => (
                      <button key={t} onClick={() => { setFileType(t); setFileUrl(''); setEmbedUrl('') }}
                        className={`btn btn-sm capitalize gap-1.5 ${fileType === t ? 'btn-primary' : 'btn-secondary'}`}>
                        {fileTypeIcon(t)} {t}
                      </button>
                    ))}
                  </div>
                </div>

                {needsUpload && (
                  <div className="form-group">
                    <label className="form-label">Upload File</label>
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
                  <label className="form-label">Description (optional)</label>
                  <RichTextEditor content={description} onChange={setDescription} placeholder="Add a description..." minHeight="100px" />
                </div>

                <div className="form-group">
                  <label className="form-label">Tags</label>
                  <TagSelector selectedIds={selectedTagIds} onChange={setSelectedTagIds} />
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={closeModal} className="btn btn-secondary">Cancel</button>
                <button onClick={save} disabled={createFile.isPending || updateFile.isPending} className="btn btn-primary gap-1.5">
                  <Check size={14} /> {modal === 'create' ? 'Add File' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Viewer Modal */}
        {viewingFile && (
          <div className="modal-overlay" onClick={() => { setViewingFile(null); setIsZoomed(false); }}>
            <div className="modal-content" style={{ maxWidth: '1000px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${fileTypeBadgeClass(viewingFile.file_type)}`}>
                    {fileTypeIcon(viewingFile.file_type)}
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg leading-tight">{viewingFile.title}</h2>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">{viewingFile.file_type}</span>
                  </div>
                </div>
                <button onClick={() => setViewingFile(null)} className="btn btn-icon btn-ghost btn-sm"><X size={15} /></button>
              </div>
              
              <div className="modal-body space-y-6">
                {/* Media Preview Section */}
                <div className={`bg-gray-900/50 rounded-xl overflow-hidden border border-gray-800 flex items-center justify-center min-h-[400px] relative ${isZoomed ? 'overflow-auto cursor-zoom-out' : ''}`}>
                  {viewingFile.file_type === 'image' && viewingFile.file_url ? (
                    <div 
                      className={`relative flex items-center justify-center w-full h-full ${isZoomed ? 'p-0 block' : 'p-4'}`}
                      onClick={() => setIsZoomed(!isZoomed)}
                    >
                      <img 
                        src={viewingFile.file_url} 
                        alt={viewingFile.title} 
                        className={`transition-all duration-300 shadow-2xl ${isZoomed ? 'max-w-none w-auto' : 'max-w-full max-h-[60vh] rounded-lg'}`} 
                      />
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsZoomed(!isZoomed); }}
                        className="absolute bottom-4 right-4 btn btn-secondary btn-icon shadow-xl backdrop-blur-md bg-black/40 border-white/10"
                        title={isZoomed ? 'Zoom Out' : 'Zoom In'}
                      >
                        {isZoomed ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
                      </button>
                    </div>
                  ) : viewingFile.file_type === 'youtube' && viewingFile.embed_url ? (
                    <div className="w-full p-4">
                      <iframe 
                        src={getYouTubeEmbedUrl(viewingFile.embed_url)} 
                        className="w-full aspect-video rounded-lg shadow-2xl" 
                        allowFullScreen 
                        title={viewingFile.title}
                      />
                    </div>
                  ) : viewingFile.file_type === 'audio' && viewingFile.file_url ? (
                    <div className="w-full max-w-md p-8 text-center space-y-4">
                      <div className="w-20 h-20 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center mx-auto">
                        <Music size={40} />
                      </div>
                      <audio controls className="w-full" src={viewingFile.file_url} />
                    </div>
                  ) : viewingFile.file_type === 'pdf' && viewingFile.file_url ? (
                    <div className="w-full h-full flex flex-col">
                      <iframe 
                        src={viewingFile.file_url} 
                        className="w-full h-[70vh] border-none" 
                        title={viewingFile.title}
                      />
                    </div>
                  ) : viewingFile.embed_url ? (
                    <iframe 
                      src={viewingFile.embed_url} 
                      className="w-full min-h-[500px] border-none rounded-lg" 
                      title={viewingFile.title}
                    />
                  ) : (
                    <div className="text-gray-500 italic p-8">Preview not available</div>
                  )}
                </div>

                {/* Info Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 tracking-wider">Description</h3>
                      {viewingFile.description ? (
                        <div 
                          className="tiptap-content prose prose-invert max-w-none text-gray-300 text-sm bg-white/5 p-4 rounded-lg border border-white/5"
                          dangerouslySetInnerHTML={{ __html: viewingFile.description }}
                        />
                      ) : (
                        <p className="text-sm text-gray-600 italic">No description provided.</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 tracking-wider">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {viewingFile.tags && viewingFile.tags.length > 0 ? (
                          viewingFile.tags.map(tag => (
                            <span 
                              key={tag.id} 
                              className="tag-chip text-xs px-2.5 py-1" 
                              style={{ background: tag.color + '20', color: tag.color, border: `1px solid ${tag.color}30` }}
                            >
                              {tag.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-600 italic">No tags</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1 tracking-wider">Created</h3>
                      <p className="text-sm text-gray-400">
                        {new Date(viewingFile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button onClick={() => { setViewingFile(null); openEdit(viewingFile); setIsZoomed(false); }} className="btn btn-secondary gap-2 mr-auto">
                  <Pencil size={15} /> Edit Details
                </button>
                {viewingFile.file_url && (viewingFile.file_type === 'pdf' || viewingFile.file_type === 'image') && (
                  <a href={viewingFile.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary gap-2">
                    <ExternalLink size={15} /> Open Full View
                  </a>
                )}
                <button onClick={() => { setViewingFile(null); setIsZoomed(false); }} className="btn btn-primary">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
