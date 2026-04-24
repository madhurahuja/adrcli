export function extractJSON(text: string): unknown {
  try { return JSON.parse(text) } catch { /* fall through */ }
  const block = text.match(/```(?:json)?\s*([\s\S]+?)```/)
  if (block?.[1]) return JSON.parse(block[1].trim())
  const arr = text.match(/\[[\s\S]+\]/)
  if (arr?.[0]) return JSON.parse(arr[0])
  throw new Error(`Could not extract JSON from LLM response:\n${text.slice(0, 400)}`)
}
