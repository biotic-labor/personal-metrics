import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import Database from 'better-sqlite3';
import { parseIngredientList } from '../parsers/ingredient-parser';
import { detectAllergens } from '../parsers/allergen-detector';

interface FoodComRecipe {
  name: string;
  id: string;
  minutes: string;
  contributor_id: string;
  submitted: string;
  tags: string;
  nutrition: string;
  n_steps: string;
  steps: string;
  description: string;
  ingredients: string;
  n_ingredients: string;
}

interface FoodComInteraction {
  user_id: string;
  recipe_id: string;
  date: string;
  rating: string;
  review: string;
}

// Parse Food.com's Python-style list strings: "['item1', 'item2']"
function parsePythonList(raw: string): string[] {
  if (!raw || raw === '[]') return [];
  try {
    // Replace single quotes with double quotes for JSON parsing
    const jsonStr = raw.replace(/'/g, '"');
    return JSON.parse(jsonStr);
  } catch {
    // Fallback: strip brackets and split
    return raw
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map(s => s.replace(/['"]/g, '').trim())
      .filter(Boolean);
  }
}

function classifyTags(tags: string[]): {
  cuisine: string | null;
  mealType: string | null;
  dietaryTags: string[];
  difficulty: 'easy' | 'medium' | 'hard' | null;
} {
  const tagSet = new Set(tags.map(t => t.toLowerCase()));

  const cuisineMap: Record<string, string> = {
    'italian': 'italian', 'mexican': 'mexican', 'chinese': 'chinese',
    'japanese': 'japanese', 'indian': 'indian', 'thai': 'thai',
    'french': 'french', 'greek': 'greek', 'korean': 'korean',
    'vietnamese': 'vietnamese', 'mediterranean': 'mediterranean',
    'middle-eastern': 'middle-eastern', 'caribbean': 'caribbean',
    'african': 'african', 'american': 'american', 'southern': 'southern',
    'cajun': 'cajun', 'tex-mex': 'tex-mex', 'spanish': 'spanish',
    'german': 'german', 'british': 'british',
  };

  const mealTypeMap: Record<string, string> = {
    'breakfast': 'breakfast', 'brunch': 'breakfast',
    'lunch': 'lunch', 'dinner': 'dinner', 'main-dish': 'dinner',
    'snack': 'snack', 'appetizer': 'snack', 'dessert': 'dessert',
    'side-dish': 'side',
  };

  const dietaryKeys = [
    'vegetarian', 'vegan', 'gluten-free', 'dairy-free',
    'low-carb', 'keto', 'paleo', 'whole30', 'low-fat',
    'low-sodium', 'sugar-free', 'nut-free',
  ];

  let cuisine: string | null = null;
  let mealType: string | null = null;
  const dietaryTags: string[] = [];
  let difficulty: 'easy' | 'medium' | 'hard' | null = null;

  for (const tag of tagSet) {
    if (!cuisine && cuisineMap[tag]) cuisine = cuisineMap[tag];
    if (!mealType && mealTypeMap[tag]) mealType = mealTypeMap[tag];
    if (dietaryKeys.includes(tag)) dietaryTags.push(tag);
    if (tag === 'easy' || tag === 'beginner-cook') difficulty = 'easy';
    if (tag === 'intermediate') difficulty = 'medium';
    if (tag === 'advanced' || tag === 'difficult') difficulty = 'hard';
  }

  return { cuisine, mealType, dietaryTags, difficulty };
}

export async function importRecipes(
  recipeCsvPath: string,
  db: Database.Database,
  options: { batchSize?: number; limit?: number } = {}
): Promise<{ count: number }> {
  const batchSize = options.batchSize || 10000;
  const limit = options.limit || Infinity;

  const insertStmt = db.prepare(`
    INSERT INTO recipes (
      title, description, ingredients_raw, ingredients_parsed, instructions,
      cuisine, meal_type, prep_time_minutes, cook_time_minutes, total_time_minutes,
      servings, difficulty, dietary_tags, allergen_flags, normalized_ingredients,
      source_url, source_dataset, rating, rating_count, imported_at
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )
  `);

  const batchInsert = db.transaction((rows: unknown[][]) => {
    for (const row of rows) {
      insertStmt.run(...row);
    }
  });

  let count = 0;
  let batch: unknown[][] = [];
  const now = new Date().toISOString();

  return new Promise((resolve, reject) => {
    const stream = createReadStream(recipeCsvPath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
        relax_column_count: true,
      }));

    stream.on('data', (row: FoodComRecipe) => {
      if (count >= limit) {
        stream.destroy();
        return;
      }

      const ingredients = parsePythonList(row.ingredients);
      const steps = parsePythonList(row.steps);
      const tags = parsePythonList(row.tags);
      const totalMinutes = parseInt(row.minutes) || null;
      const { parsed, normalized } = parseIngredientList(ingredients);
      const allergenFlags = detectAllergens(ingredients);
      const { cuisine, mealType, dietaryTags, difficulty } = classifyTags(tags);

      batch.push([
        row.name || 'Untitled Recipe',
        row.description || null,
        JSON.stringify(ingredients),
        JSON.stringify(parsed),
        JSON.stringify(steps),
        cuisine,
        mealType,
        null, // prep_time_minutes (not available separately in Food.com)
        null, // cook_time_minutes
        totalMinutes,
        null, // servings (not reliably in the dataset)
        difficulty,
        JSON.stringify(dietaryTags),
        JSON.stringify(allergenFlags),
        JSON.stringify(normalized),
        row.id ? `https://www.food.com/recipe/${row.id}` : null,
        'food.com',
        null, // rating (will be updated from interactions)
        null, // rating_count
        now,
      ]);

      count++;

      if (batch.length >= batchSize) {
        stream.pause();
        batchInsert(batch);
        process.stdout.write(`\r  Imported ${count} recipes...`);
        batch = [];
        stream.resume();
      }
    });

    stream.on('end', () => {
      if (batch.length > 0) {
        batchInsert(batch);
      }
      process.stdout.write(`\r  Imported ${count} recipes total.\n`);
      resolve({ count });
    });

    stream.on('error', reject);
  });
}

export async function importRatings(
  interactionsCsvPath: string,
  db: Database.Database,
  options: { batchSize?: number } = {}
): Promise<{ updated: number }> {
  const batchSize = options.batchSize || 50000;

  // Accumulate ratings in memory, then batch update
  const ratingsMap = new Map<string, { sum: number; count: number }>();

  return new Promise((resolve, reject) => {
    let rowCount = 0;

    const stream = createReadStream(interactionsCsvPath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
        relax_column_count: true,
      }));

    stream.on('data', (row: FoodComInteraction) => {
      rowCount++;
      const rating = parseFloat(row.rating);
      if (isNaN(rating) || rating === 0) return; // Skip zero ratings (they mean "not rated")

      const recipeId = row.recipe_id;
      const existing = ratingsMap.get(recipeId);
      if (existing) {
        existing.sum += rating;
        existing.count++;
      } else {
        ratingsMap.set(recipeId, { sum: rating, count: 1 });
      }

      if (rowCount % 100000 === 0) {
        process.stdout.write(`\r  Processed ${rowCount} interactions...`);
      }
    });

    stream.on('end', () => {
      process.stdout.write(`\r  Processed ${rowCount} interactions total.\n`);
      console.log(`  Updating ratings for ${ratingsMap.size} recipes...`);

      // Build a lookup from Food.com recipe ID to DB row ID for fast updates
      console.log('  Building source URL to ID lookup...');
      const foodcomIdToDbId = new Map<string, number>();
      const rows = db.prepare(
        "SELECT id, source_url FROM recipes WHERE source_dataset = 'food.com' AND source_url IS NOT NULL"
      ).all() as { id: number; source_url: string }[];
      for (const row of rows) {
        const match = row.source_url.match(/\/recipe\/(\d+)/);
        if (match) {
          foodcomIdToDbId.set(match[1], row.id);
        }
      }
      console.log(`  Lookup built: ${foodcomIdToDbId.size} entries`);

      const updateStmt = db.prepare(
        'UPDATE recipes SET rating = ?, rating_count = ? WHERE id = ?'
      );

      const batchUpdate = db.transaction((entries: [number, number, number][]) => {
        for (const [avgRating, ratingCount, dbId] of entries) {
          updateStmt.run(avgRating, ratingCount, dbId);
        }
      });

      let updated = 0;
      let skipped = 0;
      let updateBatch: [number, number, number][] = [];

      for (const [recipeId, data] of ratingsMap) {
        const dbId = foodcomIdToDbId.get(recipeId);
        if (!dbId) { skipped++; continue; }
        const avgRating = Math.round((data.sum / data.count) * 10) / 10;
        updateBatch.push([avgRating, data.count, dbId]);

        if (updateBatch.length >= batchSize) {
          batchUpdate(updateBatch);
          updated += updateBatch.length;
          process.stdout.write(`\r  Updated ${updated} recipe ratings...`);
          updateBatch = [];
        }
      }

      if (updateBatch.length > 0) {
        batchUpdate(updateBatch);
        updated += updateBatch.length;
      }

      process.stdout.write(`\r  Updated ${updated} recipe ratings total.\n`);
      resolve({ updated });
    });

    stream.on('error', reject);
  });
}
