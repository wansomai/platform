export function parseRulesForDisplay(rulesForThinking?: string | null): string[] {
  if (!rulesForThinking) return [];

  const lines = rulesForThinking
    .split('\n')
    .map((line) => line.replace(/\r/g, '').trim())
    .filter((line) => line.length > 0);

  const formatted: string[] = [];

  for (const rawLine of lines) {
    const isLikelyNewRule = /^(\d+[.)]\s+|[-*]\s+|•\s+)/.test(rawLine);

    let line = rawLine
      .replace(/^#{1,6}\s+/, '')
      .replace(/^(\d+[.)]\s+|[-*]\s+|•\s+)/, '')
      .trim();

    line = line
      .replace(/\*\*(.+?)\*\*:\s*/g, '$1: ')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();

    if (!line) continue;

    if (!isLikelyNewRule && formatted.length > 0) {
      formatted[formatted.length - 1] = `${formatted[formatted.length - 1]} ${line}`.replace(/\s+/g, ' ').trim();
      continue;
    }

    formatted.push(line);
  }

  return formatted;
}
