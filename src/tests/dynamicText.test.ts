import { describe, it, expect } from 'vitest'
import {
  hasDynamicTokens,
  resolveDynamicText,
  getRandomInt,
} from '../utils/dynamicText'

describe('dynamicText: hasDynamicTokens', () => {
  it('detects valid dynamic number tokens', () => {
    expect(hasDynamicTokens('Code: {random:1}')).toBe(true)
    expect(hasDynamicTokens('ID: {rand:3}')).toBe(true)
    expect(hasDynamicTokens('Range: {random:1-9}')).toBe(true)
    expect(hasDynamicTokens('Range: {rand:000-999}')).toBe(true)
    expect(hasDynamicTokens('Hash: {#}')).toBe(true)
    expect(hasDynamicTokens('Hash: {###}')).toBe(true)
    expect(hasDynamicTokens('{RANDOM:4}')).toBe(true)
  })

  it('returns false for static text and non-matching braces', () => {
    expect(hasDynamicTokens('Hello World')).toBe(false)
    expect(hasDynamicTokens('Price: $100')).toBe(false)
    expect(hasDynamicTokens('{name}')).toBe(false)
    expect(hasDynamicTokens('{date}')).toBe(false)
    expect(hasDynamicTokens('')).toBe(false)
  })
})

describe('dynamicText: getRandomInt', () => {
  it('returns integer within specified inclusive range', () => {
    for (let i = 0; i < 50; i++) {
      const val = getRandomInt(1, 9)
      expect(val).toBeGreaterThanOrEqual(1)
      expect(val).toBeLessThanOrEqual(9)
      expect(Number.isInteger(val)).toBe(true)
    }
  })

  it('handles inverted min and max gracefully', () => {
    const val = getRandomInt(10, 5)
    expect(val).toBeGreaterThanOrEqual(5)
    expect(val).toBeLessThanOrEqual(10)
  })

  it('returns single number when min equals max', () => {
    expect(getRandomInt(7, 7)).toBe(7)
  })
})

describe('dynamicText: resolveDynamicText', () => {
  it('resolves 1 random digit (0-9) via {random:1} and {rand:1}', () => {
    for (let i = 0; i < 30; i++) {
      const result = resolveDynamicText('Ticket #{random:1}')
      const match = result.match(/^Ticket #(\d)$/)
      expect(match).not.toBeNull()
      const num = parseInt(match![1], 10)
      expect(num).toBeGreaterThanOrEqual(0)
      expect(num).toBeLessThanOrEqual(9)
    }

    const rand1Result = resolveDynamicText('Num {rand:1}')
    expect(rand1Result).toMatch(/^Num \d$/)
  })

  it('resolves 2 random digits (00-99) via {random:2}', () => {
    for (let i = 0; i < 30; i++) {
      const result = resolveDynamicText('Code: {random:2}')
      const match = result.match(/^Code: (\d{2})$/)
      expect(match).not.toBeNull()
      const num = parseInt(match![1], 10)
      expect(num).toBeGreaterThanOrEqual(0)
      expect(num).toBeLessThanOrEqual(99)
    }
  })

  it('resolves 3 random digits (000-999) with zero padding via {random:3}', () => {
    for (let i = 0; i < 30; i++) {
      const result = resolveDynamicText('Serial: {random:3}')
      const match = result.match(/^Serial: (\d{3})$/)
      expect(match).not.toBeNull()
      const strVal = match![1]
      expect(strVal.length).toBe(3)
      const num = parseInt(strVal, 10)
      expect(num).toBeGreaterThanOrEqual(0)
      expect(num).toBeLessThanOrEqual(999)
    }
  })

  it('resolves N random digits (e.g. 2 digits, 4 digits)', () => {
    for (let i = 0; i < 20; i++) {
      const res2 = resolveDynamicText('Code-{random:2}')
      expect(res2).toMatch(/^Code-\d{2}$/)

      const res4 = resolveDynamicText('PIN-{random:4}')
      expect(res4).toMatch(/^PIN-\d{4}$/)
    }
  })

  it('resolves explicit range syntax {random:min-max}', () => {
    for (let i = 0; i < 20; i++) {
      // Range 10 to 20
      const resRange = resolveDynamicText('Val: {random:10-20}')
      const num = parseInt(resRange.replace('Val: ', ''), 10)
      expect(num).toBeGreaterThanOrEqual(10)
      expect(num).toBeLessThanOrEqual(20)

      // Range with leading zeros e.g. 000-999
      const resPad = resolveDynamicText('Pad: {random:000-999}')
      expect(resPad).toMatch(/^Pad: \d{3}$/)
    }
  })

  it('resolves hash format {#} and {###}', () => {
    const singleHash = resolveDynamicText('No: {#}')
    expect(singleHash).toMatch(/^No: \d$/)

    const tripleHash = resolveDynamicText('No: {###}')
    expect(tripleHash).toMatch(/^No: \d{3}$/)
  })

  it('resolves multiple dynamic tokens in the same string', () => {
    for (let i = 0; i < 10; i++) {
      const res = resolveDynamicText('Order #{random:1}-{random:3}-{random:4}')
      expect(res).toMatch(/^Order #\d-\d{3}-\d{4}$/)
    }
  })

  it('handles multiline text preserving line breaks and static words', () => {
    const template = 'HEADER\nID: {random:3}\nFOOTER'
    const resolved = resolveDynamicText(template)
    const lines = resolved.split('\n')
    expect(lines).toHaveLength(3)
    expect(lines[0]).toBe('HEADER')
    expect(lines[1]).toMatch(/^ID: \d{3}$/)
    expect(lines[2]).toBe('FOOTER')
  })

  it('returns original string if no tokens are present', () => {
    expect(resolveDynamicText('Static text only')).toBe('Static text only')
    expect(resolveDynamicText('')).toBe('')
  })
})

