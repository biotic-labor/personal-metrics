const SECTION_MAP: Record<string, string[]> = {
  'Produce': [
    'lettuce', 'tomato', 'onion', 'garlic', 'potato', 'carrot', 'celery',
    'pepper', 'broccoli', 'spinach', 'kale', 'cucumber', 'zucchini',
    'mushroom', 'avocado', 'lemon', 'lime', 'orange', 'apple', 'banana',
    'berry', 'strawberry', 'blueberry', 'grape', 'melon', 'mango',
    'pineapple', 'corn', 'bean sprout', 'cabbage', 'cauliflower', 'eggplant',
    'squash', 'pumpkin', 'sweet potato', 'ginger', 'cilantro', 'parsley',
    'basil', 'mint', 'dill', 'rosemary', 'thyme', 'sage', 'scallion',
    'green onion', 'shallot', 'leek', 'asparagus', 'artichoke', 'beet',
    'radish', 'turnip', 'pea', 'green bean', 'jalapeno', 'serrano',
    'habanero', 'chili', 'arugula', 'watercress', 'chard',
  ],
  'Meat/Seafood': [
    'chicken', 'beef', 'pork', 'turkey', 'lamb', 'bacon', 'sausage',
    'ground beef', 'ground turkey', 'ground pork', 'steak', 'roast',
    'ham', 'veal', 'duck', 'salmon', 'tuna', 'shrimp', 'cod', 'tilapia',
    'crab', 'lobster', 'scallop', 'clam', 'mussel', 'anchovy', 'sardine',
    'halibut', 'trout', 'catfish', 'mahi', 'swordfish', 'squid',
    'calamari', 'octopus', 'prawn', 'crawfish',
  ],
  'Dairy': [
    'milk', 'cheese', 'butter', 'cream', 'yogurt', 'sour cream',
    'cream cheese', 'mozzarella', 'cheddar', 'parmesan', 'ricotta',
    'feta', 'gouda', 'brie', 'goat cheese', 'cottage cheese',
    'half and half', 'whipping cream', 'buttermilk', 'ghee',
    'egg', 'eggs',
  ],
  'Bakery': [
    'bread', 'roll', 'baguette', 'tortilla', 'pita', 'naan',
    'croissant', 'bun', 'english muffin', 'bagel', 'flatbread',
    'ciabatta', 'sourdough', 'cornbread',
  ],
  'Frozen': [
    'frozen', 'ice cream', 'frozen vegetable', 'frozen fruit',
    'frozen pizza', 'frozen dinner', 'frozen fries',
  ],
  'Pantry/Dry Goods': [
    'rice', 'pasta', 'noodle', 'flour', 'sugar', 'oil', 'vinegar',
    'soy sauce', 'broth', 'stock', 'canned', 'bean', 'lentil',
    'chickpea', 'quinoa', 'oat', 'cereal', 'granola', 'nut',
    'peanut butter', 'almond butter', 'jam', 'jelly', 'honey',
    'maple syrup', 'molasses', 'cornstarch', 'baking soda',
    'baking powder', 'yeast', 'cocoa', 'chocolate', 'vanilla',
    'breadcrumb', 'panko', 'crouton', 'cracker', 'chip',
    'coconut milk', 'tomato paste', 'tomato sauce', 'salsa',
    'ketchup', 'mustard', 'mayonnaise', 'worcestershire',
    'hot sauce', 'bbq sauce', 'teriyaki', 'hoisin',
    'sesame oil', 'olive oil', 'vegetable oil', 'coconut oil',
    'wine vinegar', 'balsamic', 'apple cider vinegar',
  ],
  'Spices': [
    'salt', 'pepper', 'cumin', 'paprika', 'chili powder', 'cayenne',
    'cinnamon', 'nutmeg', 'clove', 'allspice', 'cardamom', 'coriander',
    'turmeric', 'curry', 'oregano', 'thyme', 'bay leaf', 'red pepper flakes',
    'garlic powder', 'onion powder', 'smoked paprika', 'italian seasoning',
    'taco seasoning', 'cajun seasoning', 'five spice', 'garam masala',
    'saffron', 'fennel seed', 'mustard seed', 'celery seed',
  ],
};

export function categorizeIngredient(ingredientName: string): string {
  const normalized = ingredientName.toLowerCase();

  for (const [section, keywords] of Object.entries(SECTION_MAP)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        return section;
      }
    }
  }

  return 'Other';
}

export function getSections(): string[] {
  return [...Object.keys(SECTION_MAP), 'Other'];
}

const COSTCO_SECTION_MAP: Record<string, string> = {
  'Produce': 'Fresh Produce',
  'Meat/Seafood': 'Meat & Seafood',
  'Dairy': 'Dairy & Deli',
  'Bakery': 'Bakery',
  'Frozen': 'Frozen Foods',
  'Pantry/Dry Goods': 'Dry Grocery',
  'Spices': 'Dry Grocery',
  'Other': 'Other',
};

export function toCostcoSection(standardSection: string): string {
  return COSTCO_SECTION_MAP[standardSection] || standardSection;
}
