import Database from 'better-sqlite3';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { importRecipes, importRatings } from './importers/foodcom-importer';

const USAGE = `
Usage: npx tsx scripts/import-recipes.ts [options]

Options:
  --recipes <path>       Path to RAW_recipes.csv (required)
  --interactions <path>  Path to RAW_interactions.csv (optional, for ratings)
  --db <path>            Path to meals.db (default: ./data/meals.db)
  --limit <n>            Max recipes to import (default: all)
  --batch-size <n>       Rows per transaction batch (default: 10000)
  --rebuild-fts          Rebuild FTS5 index after import
  --help                 Show this message
`;

function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : 'true';
      result[key] = value;
      if (value !== 'true') i++;
    }
  }
  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(USAGE);
    process.exit(0);
  }

  const recipesPath = args.recipes;
  if (!recipesPath) {
    console.error('Error: --recipes <path> is required');
    console.log(USAGE);
    process.exit(1);
  }

  const resolvedRecipesPath = resolve(recipesPath);
  if (!existsSync(resolvedRecipesPath)) {
    console.error(`Error: Recipes file not found: ${resolvedRecipesPath}`);
    process.exit(1);
  }

  const dbPath = args.db || './data/meals.db';
  const limit = args.limit ? parseInt(args.limit) : undefined;
  const batchSize = args['batch-size'] ? parseInt(args['batch-size']) : undefined;

  console.log(`Opening database: ${dbPath}`);
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');

  const startTime = Date.now();

  // Import recipes
  console.log(`\nImporting recipes from: ${resolvedRecipesPath}`);
  if (limit) console.log(`  Limit: ${limit} recipes`);

  const recipeResult = await importRecipes(resolvedRecipesPath, db, { batchSize, limit });
  console.log(`  Done: ${recipeResult.count} recipes imported`);

  // Import interactions/ratings if provided
  const interactionsPath = args.interactions;
  if (interactionsPath) {
    const resolvedInteractionsPath = resolve(interactionsPath);
    if (!existsSync(resolvedInteractionsPath)) {
      console.error(`Warning: Interactions file not found: ${resolvedInteractionsPath}`);
    } else {
      console.log(`\nImporting ratings from: ${resolvedInteractionsPath}`);
      const ratingsResult = await importRatings(resolvedInteractionsPath, db, { batchSize: 50000 });
      console.log(`  Done: ${ratingsResult.updated} ratings updated`);
    }
  }

  // Rebuild FTS5 index
  if (args['rebuild-fts'] || args['rebuild-fts'] === undefined) {
    console.log('\nRebuilding FTS5 index...');
    db.exec("INSERT INTO recipes_fts(recipes_fts) VALUES('rebuild')");
    console.log('  FTS5 index rebuilt');
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nImport complete in ${elapsed}s`);

  db.close();
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
