import { parseIngredient } from 'parse-ingredient';

export interface ParsedIngredient {
  quantity: number | null;
  unit: string | null;
  name: string;
  prep: string | null;
}

export function parseIngredientString(raw: string): ParsedIngredient {
  const cleaned = raw.trim();
  if (!cleaned) {
    return { quantity: null, unit: null, name: '', prep: null };
  }

  try {
    const results = parseIngredient(cleaned);
    if (results.length > 0) {
      const result = results[0];
      let name = (result.description || '').toLowerCase().trim();
      let prep: string | null = null;

      // Split on comma to separate prep instructions
      const commaIndex = name.indexOf(',');
      if (commaIndex > 0) {
        prep = name.slice(commaIndex + 1).trim();
        name = name.slice(0, commaIndex).trim();
      }

      // Remove parenthetical notes
      name = name.replace(/\(.*?\)/g, '').trim();

      return {
        quantity: result.quantity ?? null,
        unit: result.unitOfMeasure?.toLowerCase() || null,
        name,
        prep,
      };
    }
  } catch {
    // Fall through to manual parsing
  }

  // Manual fallback: just lowercase the whole string as the name
  return { quantity: null, unit: null, name: cleaned.toLowerCase(), prep: null };
}

export function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/,.*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseIngredientList(rawList: string[]): {
  parsed: ParsedIngredient[];
  normalized: string[];
} {
  const parsed = rawList.map(parseIngredientString);
  const normalized = [...new Set(
    parsed
      .map(p => normalizeIngredientName(p.name))
      .filter(n => n.length > 0)
  )];
  return { parsed, normalized };
}
