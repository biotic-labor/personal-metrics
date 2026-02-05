import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

export const households = sqliteTable('households', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: text('created_at').notNull(),
});

export const householdMembers = sqliteTable('household_members', {
  id: text('id').primaryKey(),
  householdId: text('household_id').notNull().references(() => households.id),
  userId: text('user_id').notNull(),
  role: text('role', { enum: ['admin', 'member'] }).notNull().default('member'),
}, (table) => [
  index('idx_household_members_household').on(table.householdId),
  index('idx_household_members_user').on(table.userId),
]);

export const householdAllergens = sqliteTable('household_allergens', {
  id: text('id').primaryKey(),
  householdId: text('household_id').notNull().references(() => households.id),
  allergenKey: text('allergen_key').notNull(),
  keywords: text('keywords').notNull(),
  severity: text('severity', { enum: ['exclude', 'warn'] }).notNull().default('exclude'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
}, (table) => [
  index('idx_household_allergens_household').on(table.householdId),
]);

export const recipes = sqliteTable('recipes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  ingredientsRaw: text('ingredients_raw').notNull(),
  ingredientsParsed: text('ingredients_parsed'),
  instructions: text('instructions').notNull(),
  cuisine: text('cuisine'),
  mealType: text('meal_type'),
  prepTimeMinutes: integer('prep_time_minutes'),
  cookTimeMinutes: integer('cook_time_minutes'),
  totalTimeMinutes: integer('total_time_minutes'),
  servings: integer('servings'),
  difficulty: text('difficulty', { enum: ['easy', 'medium', 'hard'] }),
  dietaryTags: text('dietary_tags'),
  allergenFlags: text('allergen_flags'),
  normalizedIngredients: text('normalized_ingredients'),
  sourceUrl: text('source_url'),
  sourceDataset: text('source_dataset'),
  imageUrl: text('image_url'),
  rating: real('rating'),
  ratingCount: integer('rating_count'),
  importedAt: text('imported_at'),
}, (table) => [
  index('idx_recipes_cuisine').on(table.cuisine),
  index('idx_recipes_meal_type').on(table.mealType),
  index('idx_recipes_difficulty').on(table.difficulty),
  index('idx_recipes_total_time').on(table.totalTimeMinutes),
  index('idx_recipes_rating').on(table.rating),
  index('idx_recipes_source_dataset').on(table.sourceDataset),
]);

export const favorites = sqliteTable('favorites', {
  id: text('id').primaryKey(),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id),
  userId: text('user_id'),
  householdId: text('household_id').references(() => households.id),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('idx_favorites_user').on(table.userId),
  index('idx_favorites_household').on(table.householdId),
  index('idx_favorites_recipe').on(table.recipeId),
]);

export const pantryItems = sqliteTable('pantry_items', {
  id: text('id').primaryKey(),
  householdId: text('household_id').notNull().references(() => households.id),
  ingredientName: text('ingredient_name').notNull(),
  quantity: real('quantity'),
  unit: text('unit'),
  expiryDate: text('expiry_date'),
  category: text('category'),
  addedAt: text('added_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => [
  index('idx_pantry_household').on(table.householdId),
  index('idx_pantry_ingredient').on(table.ingredientName),
  index('idx_pantry_expiry').on(table.expiryDate),
]);

export const mealPlans = sqliteTable('meal_plans', {
  id: text('id').primaryKey(),
  householdId: text('household_id').notNull().references(() => households.id),
  date: text('date').notNull(),
  mealSlot: text('meal_slot', { enum: ['breakfast', 'lunch', 'dinner', 'snack'] }).notNull(),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id),
  servings: integer('servings'),
  notes: text('notes'),
  createdBy: text('created_by'),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('idx_meal_plans_household_date').on(table.householdId, table.date),
]);

export const shoppingLists = sqliteTable('shopping_lists', {
  id: text('id').primaryKey(),
  householdId: text('household_id').notNull().references(() => households.id),
  name: text('name').notNull(),
  storeMode: text('store_mode', { enum: ['standard', 'costco'] }).notNull().default('standard'),
  status: text('status', { enum: ['active', 'completed', 'archived'] }).notNull().default('active'),
  mealPlanStartDate: text('meal_plan_start_date'),
  mealPlanEndDate: text('meal_plan_end_date'),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('idx_shopping_lists_household').on(table.householdId),
]);

export const shoppingListItems = sqliteTable('shopping_list_items', {
  id: text('id').primaryKey(),
  shoppingListId: text('shopping_list_id').notNull().references(() => shoppingLists.id),
  ingredientName: text('ingredient_name').notNull(),
  quantity: real('quantity'),
  unit: text('unit'),
  category: text('category'),
  checked: integer('checked', { mode: 'boolean' }).notNull().default(false),
  fromRecipeId: integer('from_recipe_id').references(() => recipes.id),
  addedManually: integer('added_manually', { mode: 'boolean' }).notNull().default(false),
}, (table) => [
  index('idx_shopping_list_items_list').on(table.shoppingListId),
]);
