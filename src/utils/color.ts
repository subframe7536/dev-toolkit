export interface RGB {
  r: number
  g: number
  b: number
}

export interface HSL {
  h: number
  s: number
  l: number
}

export interface HWB {
  h: number
  w: number
  b: number
}

export interface OKLCH {
  l: number
  c: number
  h: number
}

export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'hwb' | 'oklch'

// --- Utilities ---

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max)

// --- Converters ---

// Hex to RGB
export function hexToRgb(hex: string): RGB {
  const cleaned = hex.replace(/^#/, '')

  if (cleaned.length === 3) {
    const r = Number.parseInt(cleaned[0] + cleaned[0], 16)
    const g = Number.parseInt(cleaned[1] + cleaned[1], 16)
    const b = Number.parseInt(cleaned[2] + cleaned[2], 16)
    return { r, g, b }
  }

  const intVal = Number.parseInt(cleaned, 16)
  return {
    r: (intVal >> 16) & 255,
    g: (intVal >> 8) & 255,
    b: intVal & 255,
  }
}

// RGB to Hex
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0')
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`
}

// RGB to HSL
export function rgbToHsl(rgb: RGB): HSL {
  const r = clamp(rgb.r, 0, 255) / 255
  const g = clamp(rgb.g, 0, 255) / 255
  const b = clamp(rgb.b, 0, 255) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min)

    switch (max) {
      case r:
        h = (g - b) / delta + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / delta + 2
        break
      case b:
        h = (r - g) / delta + 4
        break
    }
    h /= 6
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}

// HSL to RGB
export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360
  const s = clamp(hsl.s, 0, 100) / 100
  const l = clamp(hsl.l, 0, 100) / 100

  if (s === 0) {
    const gray = l * 255
    return { r: gray, g: gray, b: gray }
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) {
      t += 1
    }
    if (t > 1) {
      t -= 1
    }
    if (t < 1 / 6) {
      return p + (q - p) * 6 * t
    }
    if (t < 1 / 2) {
      return q
    }
    if (t < 2 / 3) {
      return p + (q - p) * (2 / 3 - t) * 6
    }
    return p
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q

  return {
    r: hue2rgb(p, q, h + 1 / 3) * 255,
    g: hue2rgb(p, q, h) * 255,
    b: hue2rgb(p, q, h - 1 / 3) * 255,
  }
}

// RGB to HWB
export function rgbToHwb(rgb: RGB): HWB {
  const r = clamp(rgb.r, 0, 255)
  const g = clamp(rgb.g, 0, 255)
  const b = clamp(rgb.b, 0, 255)

  const hsl = rgbToHsl({ r, g, b })
  const white = Math.min(r, g, b) / 255
  const black = 1 - Math.max(r, g, b) / 255

  return { h: hsl.h, w: white * 100, b: black * 100 }
}

// HWB to RGB
export function hwbToRgb(hwb: HWB): RGB {
  const h = hwb.h / 360
  const w = clamp(hwb.w, 0, 100) / 100
  const b = clamp(hwb.b, 0, 100) / 100

  // If white + black >= 1, the color is gray
  if (w + b >= 1) {
    const gray = (w / (w + b)) * 255
    return { r: gray, g: gray, b: gray }
  }

  // If saturation is irrelevant because of gray scaling above, simple logic:
  // It's easier to use the specific algorithm than round-trip HSL:
  // RGB = HSL(h, 100%, 50%) * (1 - w - b) + w

  // Get pure fully saturated color at this hue
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) {
      t += 1
    }
    if (t > 1) {
      t -= 1
    }
    if (t < 1 / 6) {
      return p + (q - p) * 6 * t
    }
    if (t < 1 / 2) {
      return q
    }
    if (t < 2 / 3) {
      return p + (q - p) * (2 / 3 - t) * 6
    }
    return p
  }

  // Pure color (S=100%, L=50%) implies q=1, p=0
  const r_pure = hue2rgb(0, 1, h + 1 / 3)
  const g_pure = hue2rgb(0, 1, h)
  const b_pure = hue2rgb(0, 1, h - 1 / 3)

  const ratio = 1 - w - b

  return {
    r: (r_pure * ratio + w) * 255,
    g: (g_pure * ratio + w) * 255,
    b: (b_pure * ratio + w) * 255,
  }
}

// RGB to OKLCH
// Optimized using direct LinearRGB -> LMS -> OKLab matrices
export function rgbToOklch(rgb: RGB): OKLCH {
  let r = clamp(rgb.r, 0, 255) / 255
  let g = clamp(rgb.g, 0, 255) / 255
  let b = clamp(rgb.b, 0, 255) / 255

  // 1. sRGB to Linear RGB
  r = r > 0.04045 ? ((r + 0.055) / 1.055) ** 2.4 : r / 12.92
  g = g > 0.04045 ? ((g + 0.055) / 1.055) ** 2.4 : g / 12.92
  b = b > 0.04045 ? ((b + 0.055) / 1.055) ** 2.4 : b / 12.92

  // 2. Linear RGB to LMS
  const l_ = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
  const m_ = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
  const s_ = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b

  // 3. Nonlinear LMS (Cube root)
  const l_nl = Math.cbrt(l_)
  const m_nl = Math.cbrt(m_)
  const s_nl = Math.cbrt(s_)

  // 4. LMS to OKLab
  const L = 0.2104542553 * l_nl + 0.7936177850 * m_nl - 0.0040720468 * s_nl
  const a = 1.9779984951 * l_nl - 2.4285922050 * m_nl + 0.4505937099 * s_nl
  const bl = 0.0259040371 * l_nl + 0.7827717662 * m_nl - 0.8086757660 * s_nl

  // 5. OKLab to OKLCH
  const C = Math.sqrt(a * a + bl * bl)
  let H = Math.atan2(bl, a) * 180 / Math.PI
  if (H < 0) {
    H += 360
  }

  // Scale L and C to 0-100 range for consistency with the rest of the library
  return { l: L * 100, c: C * 100, h: H }
}

// OKLCH to RGB
export function oklchToRgb(oklch: OKLCH): RGB {
  // Input scaling: library uses 0-100 for L and C, converting back to standard units
  const L = oklch.l / 100
  const C = oklch.c / 100
  const H = oklch.h * Math.PI / 180

  // 1. OKLCH to OKLab
  const a = C * Math.cos(H)
  const b_lab = C * Math.sin(H)

  // 2. OKLab to LMS
  const l_nl = L + 0.3963377774 * a + 0.2158037573 * b_lab
  const m_nl = L - 0.1055613458 * a - 0.0638541728 * b_lab
  const s_nl = L - 0.0894841775 * a - 1.2914855480 * b_lab

  // 3. LMS to Linear LMS (Cube)
  const l_ = l_nl * l_nl * l_nl
  const m_ = m_nl * m_nl * m_nl
  const s_ = s_nl * s_nl * s_nl

  // 4. Linear LMS to Linear RGB
  let r = +4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_
  let g = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_
  let b = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_

  // 5. Linear RGB to sRGB
  const toSRGB = (c: number) => {
    // Standard sRGB transfer function
    const val = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055
    return clamp(val * 255, 0, 255) // Clamp is essential as OKLCH can generate out-of-gamut colors
  }

  return {
    r: toSRGB(r),
    g: toSRGB(g),
    b: toSRGB(b),
  }
}

// Format converters
export function formatColor(rgb: RGB, format: ColorFormat): string {
  switch (format) {
    case 'hex':
      return rgbToHex(rgb)
    case 'rgb':
      return `rgb(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)})`
    case 'hsl': {
      const hsl = rgbToHsl(rgb)
      return `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`
    }
    case 'hwb': {
      const hwb = rgbToHwb(rgb)
      return `hwb(${Math.round(hwb.h)} ${Math.round(hwb.w)}% ${Math.round(hwb.b)}%)`
    }
    case 'oklch': {
      const oklch = rgbToOklch(rgb)
      // Format: l(0-1) c(0-0.4) h(0-360) - matching CSS standard representation
      return `oklch(${(oklch.l / 100).toFixed(3)} ${(oklch.c / 100).toFixed(3)} ${Math.round(oklch.h)})`
    }
  }
}

export function randomColor(): RGB {
  return {
    r: Math.floor(Math.random() * 256),
    g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256),
  }
}

// --- Parsers ---

// Regex constants (Compiled once)
const HEX_RE = /^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i
// Supports: rgb(r, g, b) | rgb(r g b)
const RGB_RE = /^rgba?\s*(?:\(\s*)?(\d+(?:\.\d+)?)(?:,|\s)\s*(\d+(?:\.\d+)?)(?:,|\s)\s*(\d+(?:\.\d+)?)(?:\s*\/\s*\d+(?:\.\d+)?%?|,\s*\d+(?:\.\d+)?%?)?\)?$/i
// Supports: hsl(h, s, l) | hsl(h s l)
const HSL_RE = /^hsla?\s*\(\s*(\d+(?:\.\d+)?)(?:\s*,\s*|\s+)(\d+(?:\.\d+)?)%?(?:\s*,\s*|\s+)(\d+(?:\.\d+)?)%?(?:\s*\/\s*\d+(?:\.\d+)?%?|,\s*\d+(?:\.\d+)?%?)?\)?$/i
// Supports: hwb(h w b)
const HWB_RE = /^hwb\s*\(\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%?\s+(\d+(?:\.\d+)?)%?(?:\s*\/\s*\d+(?:\.\d+)?%?|,\s*\d+(?:\.\d+)?%?)?\)?$/i
// Supports: oklch(l c h)
const OKLCH_RE = /^oklch\s*\(\s*(\d+(?:\.\d+)?%?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)(?:\s*\/\s*\d+(?:\.\d+)?%?|,\s*\d+(?:\.\d+)?%?)?\)?$/i

export function parseColor(input: string): RGB | null {
  const cleaned = input.trim().toLowerCase()

  // 1. Hex
  if (HEX_RE.test(cleaned)) {
    return hexToRgb(cleaned)
  }

  // 2. RGB
  const rgbMatch = cleaned.match(RGB_RE)
  if (rgbMatch) {
    return {
      r: clamp(Number.parseFloat(rgbMatch[1]), 0, 255),
      g: clamp(Number.parseFloat(rgbMatch[2]), 0, 255),
      b: clamp(Number.parseFloat(rgbMatch[3]), 0, 255),
    }
  }

  // 3. HSL
  const hslMatch = cleaned.match(HSL_RE)
  if (hslMatch) {
    return hslToRgb({
      h: Number.parseFloat(hslMatch[1]),
      s: Number.parseFloat(hslMatch[2]),
      l: Number.parseFloat(hslMatch[3]),
    })
  }

  // 4. HWB
  const hwbMatch = cleaned.match(HWB_RE)
  if (hwbMatch) {
    return hwbToRgb({
      h: Number.parseFloat(hwbMatch[1]),
      w: Number.parseFloat(hwbMatch[2]),
      b: Number.parseFloat(hwbMatch[3]),
    })
  }

  // 5. OKLCH
  const oklchMatch = cleaned.match(OKLCH_RE)
  if (oklchMatch) {
    let l = Number.parseFloat(oklchMatch[1])
    // Handle percentage for L in OKLCH
    if (!oklchMatch[1].includes('%')) {
      l = l * 100 // convert 0-1 to 0-100
    }

    return oklchToRgb({
      l,
      c: Number.parseFloat(oklchMatch[2]) * 100, // Convert 0-0.4 to 0-40 scale
      h: Number.parseFloat(oklchMatch[3]),
    })
  }

  return null
}
