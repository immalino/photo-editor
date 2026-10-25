import { useState, useCallback, useEffect } from 'react'
import { HeaderToolbar } from './components/layout/HeaderToolbar'
import { CanvasViewport } from './components/canvas/CanvasViewport'
import { CanvasTextLayer } from './components/canvas/CanvasTextLayer'
import { CanvasTransformer } from './components/canvas/CanvasTransformer'
import { PropertiesPanel } from './components/properties/PropertiesPanel'
import { BottomThumbnails } from './components/layout/BottomThumbnails'
import { ExportSingleModal } from './components/dialogs/ExportSingleModal'
import { ExportBatchModal } from './components/dialogs/ExportBatchModal'
import { TemplateModal } from './components/dialogs/TemplateModal'
import { FontManagerModal } from './components/dialogs/FontManagerModal'
import { usePhotoStore } from './stores/usePhotoStore'
import { useLayerStore } from './stores/useLayerStore'
import { useHistoryStore } from './stores/useHistoryStore'
import { useFontStore } from './stores/useFontStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { usePhotoDrop } from './hooks/usePhotoDrop'
import { useExternalFileOpener } from './hooks/useExternalFileOpener'
import type { TextLayer } from './types/layer'

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
    setLayersForPhoto,
    applyLayersToAllPhotos,
    clearLayers,
  } = useLayerStore()

  const { pushState, undo, redo, canUndo, canRedo, clearHistory } = useHistoryStore()
  const { initFonts } = useFontStore()

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isBatchExportModalOpen, setIsBatchExportModalOpen] = useState(false)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [isFontModalOpen, setIsFontModalOpen] = useState(false)

  // Direct In-Canvas Inline Text Editing state
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null)

  // Initialize custom fonts from storage on startup
  useEffect(() => {
    initFonts()
  }, [initFonts])

  const showInfo = useCallback((msg: string, duration = 3000) => {
    setInfoMessage(msg)
    setTimeout(() => setInfoMessage(null), duration)
  }, [])

  const showError = useCallback((msg: string, duration = 4000) => {
    setErrorMessage(msg)
    setTimeout(() => setErrorMessage(null), duration)
  }, [])

  const { isDragging, handleOpenPhoto, handleDragEnter, handleDragLeave, handleDragOver, handleDrop } =
    usePhotoDrop({
      onPhotoAdded: addPhoto,
      onError: showError,
    })

  useExternalFileOpener({
    onPhotoAdded: addPhoto,
    onError: showError,
  })

  const activeLayers = activePhotoId ? (layers[activePhotoId] ?? []) : []
  const selectedLayer = activeLayers.find((l) => l.id === selectedLayerId)
  const editingLayer = activeLayers.find((l) => l.id === editingLayerId) || null

  const handleUndo = useCallback(() => {
    if (!activePhotoId) return
    const prev = undo(activeLayers)
    if (prev !== null) {
      setLayersForPhoto(activePhotoId, prev)
    }
  }, [activePhotoId, activeLayers, undo, setLayersForPhoto])

  const handleRedo = useCallback(() => {
    if (!activePhotoId) return
    const next = redo(activeLayers)
    if (next !== null) {
      setLayersForPhoto(activePhotoId, next)
    }
  }, [activePhotoId, activeLayers, redo, setLayersForPhoto])

  const handleDeleteSelected = useCallback(() => {
    if (activePhotoId && selectedLayerId && !editingLayerId) {
      pushState(activeLayers)
      deleteLayer(activePhotoId, selectedLayerId)
    }
  }, [activePhotoId, selectedLayerId, editingLayerId, activeLayers, pushState, deleteLayer])

  const handleUpdateLayer = useCallback(
    (layerId: string, updates: Partial<TextLayer>) => {
      if (!activePhotoId) return
      pushState(activeLayers)
      updateLayer(activePhotoId, layerId, updates)
    },
    [activePhotoId, activeLayers, pushState, updateLayer]
  )

  // Arrow key nudging per pixel
  const handleNudge = useCallback(
    (dx: number, dy: number) => {
      if (!activePhotoId || !selectedLayerId || !activePhoto || editingLayerId) return
      const target = activeLayers.find((l) => l.id === selectedLayerId)
      if (!target) return

      const deltaX = dx / (activePhoto.originalWidth || 1920)
      const deltaY = dy / (activePhoto.originalHeight || 1080)

      const nextX = Number(Math.max(-0.2, Math.min(1.2, target.relativeX + deltaX)).toFixed(5))
      const nextY = Number(Math.max(-0.2, Math.min(1.2, target.relativeY + deltaY)).toFixed(5))

      handleUpdateLayer(selectedLayerId, {
        relativeX: nextX,
        relativeY: nextY,
      })
    },
    [activePhotoId, selectedLayerId, activePhoto, editingLayerId, activeLayers, handleUpdateLayer]
  )

  useKeyboardShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onDelete: handleDeleteSelected,
    onNudge: handleNudge,
    enabled: !editingLayerId,
  })

  const handleApplyToAll = useCallback(() => {
    if (!activePhotoId || photos.length <= 1) return
    applyLayersToAllPhotos(activePhotoId, photos.map((p) => p.id))
    showInfo(`Teks berhasil disalin ke seluruh ${photos.length} foto!`)
  }, [activePhotoId, photos, applyLayersToAllPhotos, showInfo])

  const handleAddText = useCallback(() => {
    if (!activePhotoId) return
    pushState(activeLayers)
    addTextLayer(activePhotoId)
  }, [activePhotoId, activeLayers, pushState, addTextLayer])

  const handleDeleteLayer = useCallback(
    (layerId: string) => {
      if (!activePhotoId) return
      pushState(activeLayers)
      deleteLayer(activePhotoId, layerId)
    },
    [activePhotoId, activeLayers, pushState, deleteLayer]
  )

  const handleApplyTemplate = useCallback(
    (importedLayers: TextLayer[], mode: 'replace' | 'append') => {
      if (!activePhotoId) return
      pushState(activeLayers)
      if (mode === 'replace') {
        setLayersForPhoto(activePhotoId, importedLayers)
      } else {
        const nextZ = activeLayers.length
        const adjusted = importedLayers.map((l, i) => ({ ...l, zIndex: nextZ + i }))
        setLayersForPhoto(activePhotoId, [...activeLayers, ...adjusted])
      }
      showInfo(`Berhasil memuat ${importedLayers.length} layer dari template!`)
    },
    [activePhotoId, activeLayers, pushState, setLayersForPhoto, showInfo]
  )

  const handleReset = useCallback(() => {
    clearPhotos()
    clearHistory()
  }, [clearPhotos, clearHistory])

  // Direct In-Canvas Inline Text Edit Finish
  const handleFinishInlineEdit = useCallback(
    (newText: string) => {
      if (editingLayerId && newText !== undefined) {
        handleUpdateLayer(editingLayerId, { text: newText })
      }
      setEditingLayerId(null)
    },
    [editingLayerId, handleUpdateLayer]
  )

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
        canUndo={canUndo()}
        canRedo={canRedo()}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenTemplate={() => setIsTemplateModalOpen(true)}
        onOpenFontManager={() => setIsFontModalOpen(true)}
        onOpenPhoto={handleOpenPhoto}
        onReset={handleReset}
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
              onDeselect={() => {
                selectLayer(null)
                setEditingLayerId(null)
              }}
              editingLayer={editingLayer}
              onFinishEditing={handleFinishInlineEdit}
              onCancelEditing={() => setEditingLayerId(null)}
            >
              {(fit, zoom) => (
                <>
                  {activeLayers.map((layer) => (
                    <CanvasTextLayer
                      key={layer.id}
                      layer={layer}
                      fit={fit}
                      zoom={zoom}
                      isSelected={layer.id === selectedLayerId}
                      isEditing={layer.id === editingLayerId}
                      onSelect={(id) => {
                        selectLayer(id)
                      }}
                      onStartEditing={(id) => {
                        selectLayer(id)
                        setEditingLayerId(id)
                      }}
                      onChange={(updates) => handleUpdateLayer(layer.id, updates)}
                    />
                  ))}
                  <CanvasTransformer
                    selectedLayerId={selectedLayerId}
                    updateKey={selectedLayer}
                    isEditing={Boolean(editingLayerId)}
                  />
                </>
              )}
            </CanvasViewport>
          </div>

          <BottomThumbnails
            photos={photos}
            activePhotoId={activePhotoId}
            layersMap={layers}
            onSelectPhoto={(id) => {
              setActivePhoto(id)
              setEditingLayerId(null)
            }}
            onRemovePhoto={(id) => {
              removePhoto(id)
              clearLayers(id)
              if (activePhotoId === id) setEditingLayerId(null)
            }}
            onAddMorePhotos={handleOpenPhoto}
            onApplyLayersToAll={handleApplyToAll}
            onOpenBatchExport={() => setIsBatchExportModalOpen(true)}
          />
        </div>

        <PropertiesPanel
          photoId={activePhotoId}
          photo={activePhoto}
          selectedLayer={selectedLayer}
          layers={activeLayers}
          onSelectLayer={(id) => {
            selectLayer(id)
            if (editingLayerId && id !== editingLayerId) {
              setEditingLayerId(null)
            }
          }}
          onUpdateLayer={handleUpdateLayer}
          onDeleteLayer={handleDeleteLayer}
          onToggleVisibility={(id) => activePhotoId && toggleVisibility(activePhotoId, id)}
          onMoveUp={(id) => {
            if (activePhotoId) {
              pushState(activeLayers)
              moveLayerUp(activePhotoId, id)
            }
          }}
          onMoveDown={(id) => {
            if (activePhotoId) {
              pushState(activeLayers)
              moveLayerDown(activePhotoId, id)
            }
          }}
          onOpenFontManager={() => setIsFontModalOpen(true)}
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

      {activePhoto && (
        <TemplateModal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          currentLayers={activeLayers}
          onApplyTemplate={handleApplyTemplate}
        />
      )}

      <FontManagerModal
        isOpen={isFontModalOpen}
        onClose={() => setIsFontModalOpen(false)}
      />
    </div>
  )
}

export default App
