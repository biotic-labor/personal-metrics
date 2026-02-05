// Conservative allergen detection - false positives preferred over false negatives
// Each key maps to an array of regex patterns that match ingredients containing that allergen

const ALLERGEN_PATTERNS: Record<string, RegExp[]> = {
  peanut: [
    /\bpeanut/i,
    /\bgroundnut/i,
    /\barachis/i,
    /\bsatay\s+sauce/i,
    /\bkung\s+pao/i,
    /\bgado\s+gado/i,
    /\bmixed\s+nuts/i,
    /\bnut\s+butter/i,
    /\bnut\s+mix/i,
  ],
  treenut: [
    /\balmond/i,
    /\bcashew/i,
    /\bwalnut/i,
    /\bpecan/i,
    /\bpistachio/i,
    /\bmacadamia/i,
    /\bhazelnut/i,
    /\bfilbert/i,
    /\bbrazil\s+nut/i,
    /\bchestnut/i,
    /\bpine\s*nut/i,
    /\bpraline/i,
    /\bmarzipan/i,
    /\bfrangipane/i,
    /\bnougat/i,
    /\bmixed\s+nuts/i,
    /\bnut\s+butter/i,
    /\bnut\s+mix/i,
    /\bnut\s+meal/i,
    /\bnut\s+flour/i,
  ],
  dairy: [
    /\bmilk\b/i,
    /\bcream\b/i,
    /\bcheese/i,
    /\bbutter\b/i,
    /\byogurt/i,
    /\byoghurt/i,
    /\bwhey\b/i,
    /\bcasein/i,
    /\blactose/i,
    /\bghee\b/i,
    /\bkefir/i,
    /\bricotta/i,
    /\bparmesan/i,
    /\bmozzarella/i,
    /\bcheddar/i,
    /\bgouda/i,
    /\bbrie\b/i,
    /\bcurd/i,
    /\bhalf\s*and\s*half/i,
    /\bsour\s+cream/i,
    /\bcream\s+cheese/i,
    /\bice\s+cream/i,
    /\bcondensed\s+milk/i,
    /\bevaporated\s+milk/i,
    /\bbuttermilk/i,
  ],
  egg: [
    /\begg/i,
    /\bmeringue/i,
    /\bmayonnaise/i,
    /\bmayo\b/i,
    /\baioli/i,
    /\bcustard/i,
    /\bhollandaise/i,
  ],
  wheat: [
    /\bwheat/i,
    /\bflour\b/i,
    /\bbread/i,
    /\bpasta\b/i,
    /\bnoodle/i,
    /\bcouscous/i,
    /\bbulgur/i,
    /\bseitan/i,
    /\bsemolina/i,
    /\bfarina/i,
    /\bspelt/i,
    /\bkamut/i,
    /\bdurum/i,
    /\btortilla/i,
    /\bpita/i,
    /\bcracker/i,
    /\bbreadcrumb/i,
    /\bpanko/i,
    /\bcroissant/i,
    /\bcroûton/i,
  ],
  gluten: [
    /\bwheat/i,
    /\bbarley/i,
    /\brye\b/i,
    /\boat/i,
    /\bgluten/i,
    /\bseitan/i,
    /\bflour\b/i,
    /\bsoy\s+sauce/i,
    /\bmalt/i,
    /\bbeer\b/i,
  ],
  soy: [
    /\bsoy\b/i,
    /\bsoya/i,
    /\bedamame/i,
    /\btofu/i,
    /\btempeh/i,
    /\bmiso\b/i,
    /\btamari/i,
    /\bsoy\s+sauce/i,
    /\bsoy\s+milk/i,
    /\bsoybean/i,
  ],
  fish: [
    /\bfish\b/i,
    /\bsalmon/i,
    /\btuna/i,
    /\bcod\b/i,
    /\btilapia/i,
    /\bhalibut/i,
    /\banchov/i,
    /\bsardine/i,
    /\btrout/i,
    /\bswordfish/i,
    /\bbass\b/i,
    /\bmahi/i,
    /\bfish\s+sauce/i,
    /\bworcestershire/i,
  ],
  shellfish: [
    /\bshrimp/i,
    /\bprawn/i,
    /\bcrab\b/i,
    /\blobster/i,
    /\bcrawfish/i,
    /\bcrayfish/i,
    /\bclam/i,
    /\bmussel/i,
    /\boyster/i,
    /\bscallop/i,
    /\bsquid/i,
    /\bcalamari/i,
    /\boctopus/i,
    /\bshellfish/i,
  ],
  sesame: [
    /\bsesame/i,
    /\btahini/i,
    /\bhalva/i,
    /\bhummus/i,
  ],
};

export function detectAllergens(ingredients: string[]): string[] {
  const detected = new Set<string>();
  const joinedIngredients = ingredients.join(' ');

  for (const [allergenKey, patterns] of Object.entries(ALLERGEN_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(joinedIngredients)) {
        detected.add(allergenKey);
        break;
      }
    }
  }

  return Array.from(detected).sort();
}

export function getAllergenKeys(): string[] {
  return Object.keys(ALLERGEN_PATTERNS).sort();
}
