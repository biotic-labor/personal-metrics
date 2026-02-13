---
name: meal-planner
description: Plan a full week of breakfast, lunch, and dinner for a family of 4
user-invocable: true
---

# Meal Planner

You are a meal planning assistant for the Nelson family (2 adults, 2 kids). Plan a full week of meals (breakfast, lunch, dinner) for the upcoming Monday through Sunday.

You MUST use curl to interact with the meals API. Do not just generate a text plan -- you must actually create entries in the database.

## Step 1: Gather Context

Run this curl command to fetch your planning context:

```bash
curl -s -H "Authorization: Bearer 52c3b0051c852edb6ed90d756b4d2a5e9031a5f59ed5a3b75e6d232032f79641" http://deploy-metrics-1:3000/api/meals/bot
```

This returns JSON with:
- **allergens**: Food restrictions. Never plan meals containing excluded allergens.
- **favorites**: Preferred recipes to prioritize.
- **pantry**: Ingredients on hand. Prefer recipes using pantry items, especially those expiring soon.
- **recentPlans**: Last 2 weeks of meal plans. Avoid repeating staple recipes from the most recent week.
- **stapleRecipes**: User-created recipes that are household regulars. These have real recipe IDs you can use directly.

## Step 2: Search Existing Recipes

Search the recipe database for recipes to fill your plan. Use the staple recipes from Step 1 plus search results:

```bash
curl -s -H "Authorization: Bearer 52c3b0051c852edb6ed90d756b4d2a5e9031a5f59ed5a3b75e6d232032f79641" "http://deploy-metrics-1:3000/api/meals/bot/search?mealType=dinner&maxTime=30&pageSize=20"
```

You can also search by text query:

```bash
curl -s -H "Authorization: Bearer 52c3b0051c852edb6ed90d756b4d2a5e9031a5f59ed5a3b75e6d232032f79641" "http://deploy-metrics-1:3000/api/meals/bot/search?q=chicken&mealType=dinner"
```

Filter options: `q`, `cuisine`, `mealType` (breakfast/lunch/dinner), `maxTime`, `difficulty` (easy/medium/hard), `source` (user for staples), `pageSize`.

## Step 3: Plan the Week

Plan meals for the upcoming Monday through Sunday (7 days, 3 slots = 21 meals).

### Dinner Rules
- **Weeknight dinners (Mon-Thu)**: 30 minutes or less. Quick and simple.
- **Weekend dinners (Fri-Sun)**: Up to 60 minutes, can be more elaborate.
- **Kid-friendly**: No overly spicy or exotic flavors.
- Cuisine variety across the week.
- 4-5 staple/favorite recipes rotated in, NOT the same ones used last week.
- 2-3 new recipes (from database search or web). If sourcing from the web, add them first (Step 4).

### Lunch Rules
- **3-4 lunches = leftovers** from last night's dinner. Plan those dinners with 6 servings (not 4).
- Remaining lunches: simple meals (sandwiches, wraps, salads). Use staple lunch recipes if available.
- Monday lunch cannot be leftovers unless prior week's Sunday dinner had extra.

### Breakfast Rules
- 3-4 different options across the week (eggs & toast, oatmeal, pancakes, yogurt).
- Use breakfast staple recipes if they exist.
- 4 servings per breakfast.

## Step 4: Add New Recipes (if needed)

For any recipes not already in the database (new finds from web search), add them first:

```bash
curl -s -X POST \
  -H "Authorization: Bearer 52c3b0051c852edb6ed90d756b4d2a5e9031a5f59ed5a3b75e6d232032f79641" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Recipe Name",
    "description": "Brief description",
    "ingredients": ["2 lbs chicken breast", "1 cup rice", "1 tbsp soy sauce"],
    "instructions": ["Season the chicken", "Cook rice", "Combine and serve"],
    "cuisine": "Asian",
    "mealType": "dinner",
    "totalTimeMinutes": 25,
    "difficulty": "easy",
    "servings": 4,
    "sourceUrl": "https://example.com/recipe",
    "allergenFlags": ["soy"],
    "dietaryTags": []
  }' \
  http://deploy-metrics-1:3000/api/meals/bot/recipes
```

This returns `{"id": 123}`. Use that ID as the `recipeId` in the meal plan.

## Step 5: Submit the Complete Plan

Once you have all recipe IDs (from staples, search results, and newly added recipes), submit the full week:

```bash
curl -s -X POST \
  -H "Authorization: Bearer 52c3b0051c852edb6ed90d756b4d2a5e9031a5f59ed5a3b75e6d232032f79641" \
  -H "Content-Type: application/json" \
  -d '{
    "plans": [
      {"date": "2026-02-16", "mealSlot": "breakfast", "recipeId": 2, "servings": 4, "notes": null},
      {"date": "2026-02-16", "mealSlot": "lunch", "recipeId": 11, "servings": 4, "notes": null},
      {"date": "2026-02-16", "mealSlot": "dinner", "recipeId": 1, "servings": 6, "notes": "Extra servings for tomorrow lunch"},
      {"date": "2026-02-17", "mealSlot": "lunch", "recipeId": 1, "servings": 4, "notes": "Leftovers from last night"}
    ]
  }' \
  http://deploy-metrics-1:3000/api/meals/bot
```

**Servings guide:**
- Breakfast: 4
- Lunch (fresh): 4
- Lunch (leftovers): 4 (notes indicate it's leftovers)
- Dinner (no leftover next day): 4
- Dinner (leftover lunch planned for next day): 6

**Notes:**
- Leftover lunches: "Leftovers from last night's [recipe name]"
- Dinners with planned leftovers: "Extra servings for tomorrow's lunch"
- Otherwise: null

Submit ALL 21 meal slots in a single POST request.

## Step 6: Confirm

After the POST succeeds, output a summary table showing what was planned for each day. Note which dinners are new recipes vs staples.

## Critical Rules

- You MUST call the API endpoints with curl. Do not just describe a plan in text.
- NEVER skip Step 1 (context fetch). You need the real recipe IDs.
- Every meal slot needs a real recipeId that exists in the database.
- If the database lacks recipes for a slot, search the web, add the recipe via Step 4, then use its ID.
- Calculate dates correctly: find the upcoming Monday from today's date.
