type LTReplacement = { value: string }

type LTMatch = {
  offset: number
  length: number
  replacements?: LTReplacement[]
}

type LTResponse = {
  matches?: LTMatch[]
}

function isEnabled(): boolean {
  return String(process.env.GRAMMAR_API_ENABLED ?? '').toLowerCase() === 'true'
}

function applyReplacements(text: string, matches: LTMatch[]): string {
  const sorted = [...matches]
    .filter((m) => typeof m.offset === 'number' && typeof m.length === 'number' && m.length > 0)
    .sort((a, b) => b.offset - a.offset)

  let out = text
  for (const m of sorted) {
    const replacement = m.replacements?.[0]?.value
    if (!replacement) continue

    const start = m.offset
    const end = m.offset + m.length
    if (start < 0 || end > out.length || start >= end) continue

    out = `${out.slice(0, start)}${replacement}${out.slice(end)}`
  }

  return out
}

async function callLanguageTool(text: string, language: string, url: string): Promise<string> {
  const controller = new AbortController()
  const timeoutMs = Number(process.env.GRAMMAR_TIMEOUT_MS ?? 8000)
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const body = new URLSearchParams({
      text,
      language,
    })

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: controller.signal,
    })

    if (!res.ok) return text

    const data = (await res.json()) as LTResponse
    const matches = data.matches ?? []
    if (!Array.isArray(matches) || matches.length === 0) return text

    return applyReplacements(text, matches)
  } catch {
    return text
  } finally {
    clearTimeout(timer)
  }
}

export async function correctGrammar(text: string): Promise<string> {
  if (!isEnabled()) return text

  const language = String(process.env.GRAMMAR_LANGUAGE ?? 'en-US')
  const url = String(process.env.GRAMMAR_API_URL ?? 'https://api.languagetool.org/v2/check')

  const maxChars = Number(process.env.GRAMMAR_MAX_CHARS ?? 9000)
  if (!Number.isFinite(maxChars) || maxChars <= 0) return text
  if (text.length > maxChars) return text

  return callLanguageTool(text, language, url)
}
