import { useState, useRef, useCallback, useEffect, type DragEvent } from 'react'
import { HeaderToolbar } from './components/layout/HeaderToolbar'
import { CanvasViewport } from './components/canvas/CanvasViewport'
import { CanvasTextLayer } from './components/canvas/CanvasTextLayer'
import { CanvasTransformer } from './components/canvas/CanvasTransformer'
import { PropertiesPanel } from './components/properties/PropertiesPanel'
import { BottomThumbnails } from './components/layout/BottomThumbnails'
import { ExportSingleModal } from './components/dialogs/ExportSingleModal'
import { ExportBatchModal } from './components/dialogs/ExportBatchModal'
import { usePhotoStore } from './stores/usePhotoStore'
import { useLayerStore } from './stores/useLayerStore'
import { openFileDialog } from './services/platformAdapter'
import { createPhotoItemFromFile, isSupportedImageFile } from './services/fileReader'

export function App() {
  const { photos, activePhotoId, addPhoto, setActivePhoto, removePhoto, clearPhotos } =
    usePhotoStore()
  const activePhoto = photos.find((p) => p.id === activePhotoId)

  const {
    layers,
    selectedLayerId,
    addTextLayer,
    updateLayer,
    deleteLayer,
    selectLayer,
    moveLayerUp,
    moveLayerDown,
    toggleVisibility,
    applyLayersToAllPhotos,
    clearLayers,
  } = useLayerStore()

  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isBatchExportModalOpen, setIsBatchExportModalOpen] = useState(false)

  // Keyboard shortcut to delete selected layer (Del or Backspace)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
        return
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && activePhotoId && selectedLayerId) {
        e.preventDefault()
        deleteLayer(activePhotoId, selectedLayerId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activePhotoId, selectedLayerId, deleteLayer])

  const handleProcessFiles = useCallback(
    async (files: File[]) => {
      const validImageFiles = files.filter(isSupportedImageFile)
      if (validImageFiles.length === 0) {
        if (files.length > 0) {
          setErrorMessage('Format file tidak didukung. Harap pilih file JPG, PNG, atau WebP.')
          setTimeout(() => setErrorMessage(null), 4000)
        }
        return
      }

      try {
        for (const file of validImageFiles) {
          const photoItem = await createPhotoItemFromFile(file)
          addPhoto(photoItem)
        }
      } catch (err) {
        console.error('Error loading image file:', err)
        setErrorMessage('Gagal memuat gambar. Pastikan file gambar valid.')
        setTimeout(() => setErrorMessage(null), 4000)
      }
    },
    [addPhoto]
  )

  const handleOpenPhoto = useCallback(async () => {
    try {
      const files = await openFileDialog({
        multiple: true,
        accept: 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
      })
      if (files.length > 0) {
        await handleProcessFiles(files)
      }
    } catch (err) {
      console.error('Failed to open file dialog:', err)
    }
  }, [handleProcessFiles])

  const handleApplyToAll = useCallback(() => {
    if (!activePhotoId || photos.length <= 1) return
    const allIds = photos.map((p) => p.id)
    applyLayersToAllPhotos(activePhotoId, allIds)
    setInfoMessage(`Teks berhasil disalin ke seluruh ${photos.length} foto!`)
    setTimeout(() => setInfoMessage(null), 3500)
  }, [activePhotoId, photos, applyLayersToAllPhotos])

  const handleRemovePhoto = useCallback(
    (id: string) => {
      removePhoto(id)
      clearLayers(id)
    },
    [removePhoto, clearLayers]
  )

  const handleAddText = useCallback(() => {
    if (!activePhotoId) return
    addTextLayer(activePhotoId)
  }, [activePhotoId, addTextLayer])

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current += 1
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current -= 1
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current = 0
    setIsDragging(false)

    const files = e.dataTransfer?.files ? Array.from(e.dataTransfer.files) : []
    if (files.length > 0) {
      await handleProcessFiles(files)
    }
  }

  const activeLayers = activePhotoId ? (layers[activePhotoId] ?? []) : []
  const selectedLayer = activeLayers.find((l) => l.id === selectedLayerId)

  return (
    <div
      className="flex h-screen w-screen flex-col overflow-hidden bg-slate-900 text-slate-100"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <HeaderToolbar
        activePhoto={activePhoto}
        photosCount={photos.length}
        onOpenPhoto={handleOpenPhoto}
        onReset={clearPhotos}
        onAddText={handleAddText}
        onExport={() => setIsExportModalOpen(true)}
        onExportBatch={() => setIsBatchExportModalOpen(true)}
      />

      {infoMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 rounded-lg border border-indigo-500/40 bg-indigo-950/90 px-4 py-2 text-xs text-indigo-200 shadow-xl backdrop-blur-sm animate-fade-in">
          {infoMessage}
        </div>
      )}

      {errorMessage && (
        <div className="absolute top-16 right-4 z-50 rounded-lg border border-red-500/30 bg-red-950/80 px-4 py-2 text-xs text-red-200 shadow-lg backdrop-blur-sm animate-fade-in">
          {errorMessage}
        </div>
      )}

      <main className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="relative flex flex-1 overflow-hidden">
            <CanvasViewport
              photo={activePhoto}
              onOpenFile={handleOpenPhoto}
              isDragging={isDragging}
              onDeselect={() => selectLayer(null)}
            >
              {(fit) => (
                <>
                  {activeLayers.map((layer) => (
                    <CanvasTextLayer
                      key={layer.id}
                      layer={layer}
                      fit={fit}
                      isSelected={layer.id === selectedLayerId}
                      onSelect={selectLayer}
                      onChange={(updates) =>
                        activePhotoId && updateLayer(activePhotoId, layer.id, updates)
                      }
                    />
                  ))}
                  <CanvasTransformer
                    selectedLayerId={selectedLayerId}
                    updateKey={selectedLayer}
                  />
                </>
              )}
            </CanvasViewport>
          </div>

          <BottomThumbnails
            photos={photos}
            activePhotoId={activePhotoId}
            layersMap={layers}
            onSelectPhoto={setActivePhoto}
            onRemovePhoto={handleRemovePhoto}
            onAddMorePhotos={handleOpenPhoto}
            onApplyLayersToAll={handleApplyToAll}
            onOpenBatchExport={() => setIsBatchExportModalOpen(true)}
          />
        </div>

        <PropertiesPanel
          photoId={activePhotoId}
          selectedLayer={selectedLayer}
          layers={activeLayers}
          onSelectLayer={selectLayer}
          onUpdateLayer={(layerId, updates) =>
            activePhotoId && updateLayer(activePhotoId, layerId, updates)
          }
          onDeleteLayer={(layerId) =>
            activePhotoId && deleteLayer(activePhotoId, layerId)
          }
          onToggleVisibility={(layerId) =>
            activePhotoId && toggleVisibility(activePhotoId, layerId)
          }
          onMoveUp={(layerId) =>
            activePhotoId && moveLayerUp(activePhotoId, layerId)
          }
          onMoveDown={(layerId) =>
            activePhotoId && moveLayerDown(activePhotoId, layerId)
          }
        />
      </main>

      {activePhoto && (
        <ExportSingleModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          photo={activePhoto}
          layers={activeLayers}
        />
      )}

      {photos.length > 0 && (
        <ExportBatchModal
          isOpen={isBatchExportModalOpen}
          onClose={() => setIsBatchExportModalOpen(false)}
          photos={photos}
          layersMap={layers}
        />
      )}
    </div>
  )
}

export default App
