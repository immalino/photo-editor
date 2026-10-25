import { describe, it, expect } from 'vitest'
import {
  calculateSnap,
  measureLayerBounds,
  getPresetAlignmentPosition,
} from '../utils/snapEngine'
import { useSnapStore } from '../stores/useSnapStore'
import { DEFAULT_TEXT_STYLE } from '../constants/defaultStyles'
import type { TextLayer } from '../types/layer'

describe('snapEngine: calculateSnap', () => {
  const photoBounds = {
    x: 100,
    y: 100,
    width: 800,
    height: 600,
  }
  // photoCenterX = 500, photoCenterY = 400

  it('snaps object center X to photo center X when within threshold', () => {
    // Dragged object at x=446, width=100 -> centerX = 496. Distance to 500 is 4px (threshold: 8px)
    const draggedBounds = {
      x: 446,
      y: 200,
      width: 100,
      height: 50,
    }

    const result = calculateSnap({
      draggedBounds,
      photoBounds,
      threshold: 8,
    })

    expect(result.deltaX).toBe(4)
    expect(result.snappedX).toBe(450) // 450 + 50 = 500
    expect(result.guides.some((g) => g.orientation === 'vertical' && g.position === 500)).toBe(true)
  })

  it('snaps object center Y to photo center Y when within threshold', () => {
    // Dragged object at y=372, height=50 -> centerY = 397. Distance to 400 is 3px
    const draggedBounds = {
      x: 200,
      y: 372,
      width: 100,
      height: 50,
    }

    const result = calculateSnap({
      draggedBounds,
      photoBounds,
      threshold: 8,
    })

    expect(result.deltaY).toBe(3)
    expect(result.snappedY).toBe(375) // 375 + 25 = 400
    expect(result.guides.some((g) => g.orientation === 'horizontal' && g.position === 400)).toBe(true)
  })

  it('snaps both X and Y simultaneously when close to photo center', () => {
    const draggedBounds = {
      x: 447, // centerX = 497 -> diff +3
      y: 378, // centerY = 403 -> diff -3
      width: 100,
      height: 50,
    }

    const result = calculateSnap({
      draggedBounds,
      photoBounds,
      threshold: 8,
    })

    expect(result.deltaX).toBe(3)
    expect(result.deltaY).toBe(-3)
    expect(result.snappedX).toBe(450)
    expect(result.snappedY).toBe(375)
    expect(result.guides.length).toBe(2)
  })

  it('snaps left edge of object to photo left edge', () => {
    // photoLeft = 100. object x = 103 -> diff = -3
    const draggedBounds = {
      x: 103,
      y: 250,
      width: 120,
      height: 40,
    }

    const result = calculateSnap({
      draggedBounds,
      photoBounds,
      threshold: 8,
    })

    expect(result.deltaX).toBe(-3)
    expect(result.snappedX).toBe(100)
    expect(
      result.guides.some(
        (g) => g.orientation === 'vertical' && g.targetType === 'photo-edge-left'
      )
    ).toBe(true)
  })

  it('snaps right edge of object to photo right edge', () => {
    // photoRight = 900. object x = 776, width = 120 -> right = 896 -> diff = +4
    const draggedBounds = {
      x: 776,
      y: 250,
      width: 120,
      height: 40,
    }

    const result = calculateSnap({
      draggedBounds,
      photoBounds,
      threshold: 8,
    })

    expect(result.deltaX).toBe(4)
    expect(result.snappedX).toBe(780)
    expect(
      result.guides.some(
        (g) => g.orientation === 'vertical' && g.targetType === 'photo-edge-right'
      )
    ).toBe(true)
  })

  it('snaps top edge to photo top edge', () => {
    // photoTop = 100. object y = 96 -> diff = +4
    const draggedBounds = {
      x: 250,
      y: 96,
      width: 120,
      height: 40,
    }

    const result = calculateSnap({
      draggedBounds,
      photoBounds,
      threshold: 8,
    })

    expect(result.deltaY).toBe(4)
    expect(result.snappedY).toBe(100)
    expect(
      result.guides.some((g) => g.orientation === 'horizontal' && g.targetType === 'photo-edge-top')
    ).toBe(true)
  })

  it('snaps bottom edge to photo bottom edge', () => {
    // photoBottom = 700. object y = 658, height = 40 -> bottom = 698 -> diff = +2
    const draggedBounds = {
      x: 250,
      y: 658,
      width: 120,
      height: 40,
    }

    const result = calculateSnap({
      draggedBounds,
      photoBounds,
      threshold: 8,
    })

    expect(result.deltaY).toBe(2)
    expect(result.snappedY).toBe(660)
    expect(
      result.guides.some(
        (g) => g.orientation === 'horizontal' && g.targetType === 'photo-edge-bottom'
      )
    ).toBe(true)
  })

  it('does not snap when distance exceeds threshold', () => {
    const draggedBounds = {
      x: 430, // centerX = 480 -> distance to 500 is 20px (> 8px)
      y: 250,
      width: 100,
      height: 50,
    }

    const result = calculateSnap({
      draggedBounds,
      photoBounds,
      threshold: 8,
    })

    expect(result.deltaX).toBe(0)
    expect(result.snappedX).toBe(430)
    expect(result.guides.length).toBe(0)
  })

  it('respects snapToCenter: false option', () => {
    const draggedBounds = {
      x: 446,
      y: 200,
      width: 100,
      height: 50,
    }

    const result = calculateSnap({
      draggedBounds,
      photoBounds,
      threshold: 8,
      snapToCenter: false,
    })

    expect(result.deltaX).toBe(0)
    expect(result.guides.length).toBe(0)
  })

  it('respects snapToEdges: false option', () => {
    const draggedBounds = {
      x: 103, // left edge near photo left
      y: 200,
      width: 100,
      height: 50,
    }

    const result = calculateSnap({
      draggedBounds,
      photoBounds,
      threshold: 8,
      snapToEdges: false,
    })

    expect(result.deltaX).toBe(0)
    expect(result.guides.length).toBe(0)
  })
})

describe('snapEngine: measureLayerBounds & getPresetAlignmentPosition', () => {
  const createMockLayer = (overrides?: Partial<TextLayer>): TextLayer => ({
    id: 'test-layer-1',
    text: 'Hello World',
    relativeX: 0.2,
    relativeY: 0.3,
    rotation: 0,
    zIndex: 1,
    visible: true,
    style: {
      ...DEFAULT_TEXT_STYLE,
      fontSize: 40,
      fontSizeUnit: 'px',
    },
    ...overrides,
  })

  it('measures layer bounds and calculates relative dimensions', () => {
    const layer = createMockLayer({ text: 'Antigravity' })
    const bounds = measureLayerBounds(layer, 1000, 500)

    expect(bounds.width).toBeGreaterThan(0)
    expect(bounds.height).toBeGreaterThan(0)
    expect(bounds.relWidth).toBe(bounds.width / 1000)
    expect(bounds.relHeight).toBe(bounds.height / 500)
  })

  it('includes background padding when background is enabled', () => {
    const withoutBg = createMockLayer()
    const withBg = createMockLayer({
      style: {
        ...DEFAULT_TEXT_STYLE,
        fontSize: 40,
        background: {
          enabled: true,
          color: '#000000',
          opacity: 0.8,
          padding: 20,
          borderRadius: 8,
        },
      },
    })

    const boundsNoBg = measureLayerBounds(withoutBg, 1000, 500)
    const boundsWithBg = measureLayerBounds(withBg, 1000, 500)

    expect(boundsWithBg.width).toBe(boundsNoBg.width + 40) // 2 * padding (20)
    expect(boundsWithBg.height).toBe(boundsNoBg.height + 40)
    expect(boundsWithBg.offsetX).toBe(-20)
    expect(boundsWithBg.offsetY).toBe(-20)
  })

  it('calculates true center alignment position', () => {
    const layer = createMockLayer()
    const photoW = 1000
    const photoH = 800

    const pos = getPresetAlignmentPosition(layer, photoW, photoH, 'center')
    const bounds = measureLayerBounds(layer, photoW, photoH)

    // Visual center: relativeX * photoW + offsetX + width / 2 must equal photoW / 2 (500)
    const visualCenterX = pos.relativeX * photoW + bounds.offsetX + bounds.width / 2
    const visualCenterY = pos.relativeY * photoH + bounds.offsetY + bounds.height / 2

    expect(Math.abs(visualCenterX - 500)).toBeLessThan(0.01)
    expect(Math.abs(visualCenterY - 400)).toBeLessThan(0.01)
  })

  it('calculates center-h and center-v presets individually', () => {
    const layer = createMockLayer({ relativeX: 0.1, relativeY: 0.2 })
    const photoW = 1000
    const photoH = 800

    const posH = getPresetAlignmentPosition(layer, photoW, photoH, 'center-h')
    expect(posH.relativeY).toBe(0.2) // Y unchanged
    expect(posH.relativeX).not.toBe(0.1)

    const posV = getPresetAlignmentPosition(layer, photoW, photoH, 'center-v')
    expect(posV.relativeX).toBe(0.1) // X unchanged
    expect(posV.relativeY).not.toBe(0.2)
  })
})

describe('useSnapStore', () => {
  it('initializes with default snap values', () => {
    const state = useSnapStore.getState()
    expect(state.snapEnabled).toBe(true)
    expect(state.snapToCenter).toBe(true)
    expect(state.snapToEdges).toBe(true)
    expect(state.snapTolerance).toBe(8)
    expect(state.activeGuides).toEqual([])
  })

  it('toggles snapEnabled and clears active guides', () => {
    useSnapStore.getState().setActiveGuides([
      {
        orientation: 'vertical',
        position: 100,
        targetType: 'photo-center-x',
        start: 0,
        end: 500,
      },
    ])
    expect(useSnapStore.getState().activeGuides.length).toBe(1)

    useSnapStore.getState().toggleSnap()
    expect(useSnapStore.getState().snapEnabled).toBe(false)
    expect(useSnapStore.getState().activeGuides).toEqual([])

    useSnapStore.getState().toggleSnap()
    expect(useSnapStore.getState().snapEnabled).toBe(true)
  })
})

