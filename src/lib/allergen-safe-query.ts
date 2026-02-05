import { mealsDb } from './meals-db';
import { householdAllergens, householdMembers, recipes } from '../../drizzle/meals-schema';
import { eq, and, sql, SQL } from 'drizzle-orm';

export interface AllergenExclusion {
  allergenKey: string;
  severity: 'exclude' | 'warn';
}

export async function getHouseholdAllergens(userId: string): Promise<AllergenExclusion[]> {
  const membership = await mealsDb.query.householdMembers.findFirst({
    where: eq(householdMembers.userId, userId),
  });

  if (!membership) return [];

  const allergens = await mealsDb.query.householdAllergens.findMany({
    where: and(
      eq(householdAllergens.householdId, membership.householdId),
      eq(householdAllergens.isActive, true)
    ),
  });

  return allergens.map(a => ({
    allergenKey: a.allergenKey,
    severity: a.severity,
  }));
}

export function buildAllergenExclusionFilter(exclusions: AllergenExclusion[]): SQL | undefined {
  const excludeKeys = exclusions
    .filter(e => e.severity === 'exclude')
    .map(e => e.allergenKey);

  if (excludeKeys.length === 0) return undefined;

  // Build a condition that excludes recipes containing any excluded allergens
  // allergen_flags is stored as a JSON array, e.g. '["peanut","dairy"]'
  const conditions = excludeKeys.map(key =>
    sql`${recipes.allergenFlags} NOT LIKE ${'%"' + key + '"%'}`
  );

  return sql.join(conditions, sql` AND `);
}

export async function getAllergenSafeFilter(userId: string): Promise<SQL | undefined> {
  const exclusions = await getHouseholdAllergens(userId);
  return buildAllergenExclusionFilter(exclusions);
}

export function getWarningAllergens(exclusions: AllergenExclusion[]): string[] {
  return exclusions
    .filter(e => e.severity === 'warn')
    .map(e => e.allergenKey);
}
