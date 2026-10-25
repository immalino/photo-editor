import { describe, it, expect } from 'vitest'
import {
  resolveDimensionBasis,
  pxToPercent,
  percentToPx,
  resolveEffectiveSize,
  resolveFontSize,
  resolveStrokeWidth,
  resolveShadow,
  resolveBackground,
} from '../utils/unitMath'
import type { TextLayer } from '../types/layer'
import { DEFAULT_TEXT_STYLE } from '../constants/defaultStyles'

describe('unitMath utility', () => {
  it('correctly resolves dimension basis for width and height', () => {
    expect(resolveDimensionBasis('width', 1920, 1080)).toBe(1920)
    expect(resolveDimensionBasis('height', 1920, 1080)).toBe(1080)
    expect(resolveDimensionBasis(undefined, 1920, 1080)).toBe(1920)
  })

  it('converts px to percent and percent to px correctly', () => {
    expect(pxToPercent(192, 1920)).toBe(10)
    expect(pxToPercent(54, 1080)).toBe(5)
    expect(percentToPx(10, 1920)).toBe(192)
    expect(percentToPx(5, 1080)).toBe(54)
    expect(pxToPercent(100, 0)).toBe(0)
    expect(percentToPx(10, 0)).toBe(0)
  })

  it('resolves effective size when unit is px or %', () => {
    // px mode
    expect(
      resolveEffectiveSize('px', 48, undefined, 'width', 2000, 1000)
    ).toBe(48)

    // % mode with percentValue provided
    expect(
      resolveEffectiveSize('%', 48, 5, 'width', 2000, 1000)
    ).toBe(100)

    // % mode relative to height
    expect(
      resolveEffectiveSize('%', 48, 10, 'height', 2000, 1000)
    ).toBe(100)

    // % mode with percentValue calculated from pxValue
    expect(
      resolveEffectiveSize('%', 100, undefined, 'width', 2000, 1000)
    ).toBe(100)
  })

  const baseLayer: TextLayer = {
    id: 'test-1',
    text: 'Test Layer',
    relativeX: 0.5,
    relativeY: 0.5,
    rotation: 0,
    zIndex: 0,
    visible: true,
    style: {
      ...DEFAULT_TEXT_STYLE,
      fontSize: 48,
    },
  }

  it('resolves font size in px and % modes', () => {
    // default px
    expect(resolveFontSize(baseLayer, 1000, 500)).toBe(48)

    // % mode 8% of width (1000 * 0.08 = 80px)
    const layerPercent: TextLayer = {
      ...baseLayer,
      style: {
        ...baseLayer.style,
        fontSizeUnit: '%',
        fontSizeRef: 'width',
        fontSizePercent: 8,
      },
    }
    expect(resolveFontSize(layerPercent, 1000, 500)).toBe(80)

    // % mode 10% of height (500 * 0.10 = 50px)
    const layerHeightPercent: TextLayer = {
      ...baseLayer,
      style: {
        ...baseLayer.style,
        fontSizeUnit: '%',
        fontSizeRef: 'height',
        fontSizePercent: 10,
      },
    }
    expect(resolveFontSize(layerHeightPercent, 1000, 500)).toBe(50)
  })

  it('resolves stroke, shadow, and background with dual units', () => {
    const styledLayer: TextLayer = {
      ...baseLayer,
      style: {
        ...baseLayer.style,
        stroke: {
          enabled: true,
          color: '#000000',
          width: 4,
          unit: '%',
          ref: 'width',
          widthPercent: 1, // 1% of 1000 = 10px
        },
        shadow: {
          enabled: true,
          color: '#000000',
          blur: 10,
          offsetX: 5,
          offsetY: 5,
          unit: '%',
          ref: 'height',
          blurPercent: 2, // 2% of 500 = 10px
          offsetXPercent: 1, // 1% of 500 = 5px
          offsetYPercent: 1,
        },
        background: {
          enabled: true,
          color: '#ffffff',
          opacity: 0.8,
          padding: 12,
          borderRadius: 6,
          unit: '%',
          ref: 'width',
          paddingPercent: 3, // 3% of 1000 = 30px
          borderRadiusPercent: 1, // 1% of 1000 = 10px
        },
      },
    }

    expect(resolveStrokeWidth(styledLayer, 1000, 500)).toBe(10)
    expect(resolveShadow(styledLayer, 1000, 500)).toEqual({
      blur: 10,
      offsetX: 5,
      offsetY: 5,
    })
    expect(resolveBackground(styledLayer, 1000, 500)).toEqual({
      padding: 30,
      borderRadius: 10,
    })
  })
})

