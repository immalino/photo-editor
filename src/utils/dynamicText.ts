/**
 * Checks whether a text string contains dynamic number generation tokens.
 * Matches:
 * - {random:N} or {rand:N} (e.g. {random:1}, {random:3})
 * - {random:MIN-MAX} or {rand:MIN-MAX} (e.g. {random:1-9}, {random:000-999})
 * - {#...#} (e.g. {#}, {###})
 */
export function hasDynamicTokens(text: string): boolean {
  if (!text) return false
  return /\{(?:random|rand):\d+(?:-\d+)?\}|\{(#+)\}/i.test(text)
}

/**
 * Returns a cryptographically sound or pseudorandom integer between min and max (inclusive).
 */
export function getRandomInt(min: number, max: number): number {
  const safeMin = Math.ceil(Math.min(min, max))
  const safeMax = Math.floor(Math.max(min, max))
  const range = safeMax - safeMin + 1
  if (range <= 1) return safeMin

  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const uintArr = new Uint32Array(1)
    window.crypto.getRandomValues(uintArr)
    return safeMin + (uintArr[0] % range)
  }

  return Math.floor(Math.random() * range) + safeMin
}

/**
 * Resolves all dynamic tokens in a text template into generated random numbers.
 *
 * Supported syntaxes:
 * 1. `{random:N}` or `{rand:N}` (N >= 1) -> N digits: random 0 to 10^N - 1, 0-padded to N digits
 *    - N=1: 0 to 9
 *    - N=2: 00 to 99
 *    - N=3: 000 to 999
 *    - N=4: 0000 to 9999
 * 2. `{random:MIN-MAX}` or `{rand:MIN-MAX}` -> random integer between MIN and MAX.
 *    If MIN has leading zeros (e.g. 000-999), it is zero-padded to MIN's character length.
 * 3. `{#...#}` -> e.g. `{#}` (0-9), `{##}` (00-99), `{###}` (000-999), `{####}` (0000-9999).
 */
export function resolveDynamicText(text: string): string {
  if (!text) return ''

  // 1. Resolve {random:MIN-MAX} or {rand:MIN-MAX}
  let result = text.replace(/\{(?:random|rand):(\d+)-(\d+)\}/gi, (_, minStr, maxStr) => {
    let min = parseInt(minStr, 10)
    let max = parseInt(maxStr, 10)
    if (Number.isNaN(min) || Number.isNaN(max)) return _

    if (min > max) {
      const temp = min
      min = max
      max = temp
    }

    const padLength = minStr.startsWith('0') ? minStr.length : 0
    const val = getRandomInt(min, max)
    return padLength > 0 ? String(val).padStart(padLength, '0') : String(val)
  })

  // 2. Resolve {random:N} or {rand:N} (0 to 10^N - 1 padded to N digits)
  result = result.replace(/\{(?:random|rand):(\d+)\}/gi, (_, nStr) => {
    const rawN = parseInt(nStr, 10)
    if (Number.isNaN(rawN) || rawN <= 0) return _
    const n = Math.min(12, rawN)

    const max = Math.pow(10, n) - 1
    const val = getRandomInt(0, max)
    return String(val).padStart(n, '0')
  })

  // 3. Resolve {#...#}
  result = result.replace(/\{(#+)\}/g, (_, hashes) => {
    const n = Math.min(12, hashes.length)
    const max = Math.pow(10, n) - 1
    const val = getRandomInt(0, max)
    return String(val).padStart(n, '0')
  })

  return result
}

