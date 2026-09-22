export interface CraftTelemetryReport {
  file: string
  swainMruInversions: Array<{ line: number; excerpt: string; message: string }>
  sentenceLengthVariance: number
  crutchDensity: Array<{
    token: string
    count: number
    lineCoordinates: number[]
  }>
  slopTokens: Array<{ line: number; token: string; suggestion: string }>
}

const RLHF_SLOP_TAXONOMY: Record<string, string> = {
  palpable: 'concrete physical sensation',
  tapestry: 'pattern, web, or structure',
  delve: 'dig, inspect, or search',
  testament: 'proof or sign',
  cacophony: 'noise, clatter, or roar',
  unleash: 'free, loose, or trigger',
  pivotal: 'vital or central',
}

const PHYSICAL_CRUTCHES = [
  'nodded',
  'furrowed',
  'shrugged',
  'blinked',
  'frowned',
]

export class CraftLinter {
  public auditProse(
    prose: string,
    filePath = 'scene.md',
  ): CraftTelemetryReport {
    const lines = prose.split('\n')
    const sentences: string[] = []
    const slopFound: Array<{
      line: number
      token: string
      suggestion: string
    }> = []
    const crutchCounts: Record<string, { count: number; lines: number[] }> = {}

    PHYSICAL_CRUTCHES.forEach(
      (c) => (crutchCounts[c] = { count: 0, lines: [] }),
    )

    lines.forEach((lineText, lineIdx) => {
      const lineSentences = lineText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []
      lineSentences.forEach((s) => sentences.push(s.trim()))

      for (const [slopWord, replacement] of Object.entries(
        RLHF_SLOP_TAXONOMY,
      )) {
        if (new RegExp(`\\b${slopWord}\\b`, 'i').test(lineText)) {
          slopFound.push({
            line: lineIdx + 1,
            token: slopWord,
            suggestion: replacement,
          })
        }
      }

      PHYSICAL_CRUTCHES.forEach((crutch) => {
        if (new RegExp(`\\b${crutch}\\b`, 'i').test(lineText)) {
          crutchCounts[crutch].count++
          crutchCounts[crutch].lines.push(lineIdx + 1)
        }
      })
    })

    const lengths = sentences
      .map((s) => s.split(/\s+/).filter(Boolean).length)
      .filter((l) => l > 0)
    const mean =
      lengths.length > 0
        ? lengths.reduce((a, b) => a + b, 0) / lengths.length
        : 0
    const variance =
      lengths.length > 0
        ? lengths.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) /
          lengths.length
        : 0
    const standardDeviation = Math.sqrt(variance)

    const inversions: Array<{
      line: number
      excerpt: string
      message: string
    }> = []
    sentences.forEach((s, idx) => {
      if (
        /\b(screamed|swung|shouted|bolted|struck)\b.*before\b.*(heard|saw|registered|felt|noticed)/i.test(
          s,
        )
      ) {
        inversions.push({
          line: idx + 1,
          excerpt: s,
          message:
            'Swain MRU Inversion: Deliberate motor response precedes perception stimulus.',
        })
      }
    })

    const activeCrutches = Object.entries(crutchCounts)
      .filter(([_, data]) => data.count > 0)
      .map(([token, data]) => ({
        token,
        count: data.count,
        lineCoordinates: data.lines,
      }))

    return {
      file: filePath,
      swainMruInversions: inversions,
      sentenceLengthVariance: Math.round(standardDeviation * 100) / 100,
      crutchDensity: activeCrutches,
      slopTokens: slopFound,
    }
  }
}
