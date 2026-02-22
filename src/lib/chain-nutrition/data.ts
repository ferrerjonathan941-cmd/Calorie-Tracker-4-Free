import { FoodItem } from '@/lib/types'

export interface ChainItem extends Omit<FoodItem, 'autoCorrected'> {
  id: string
  aliases: string[]
}

export interface ChainData {
  id: string
  name: string
  aliases: string[]
  type: 'build-your-own' | 'fixed-menu'
  items: ChainItem[]
}

// ─── Build-Your-Own Chains ───

const chipotle: ChainData = {
  id: 'chipotle',
  name: 'Chipotle',
  aliases: ['chipotle', 'chipotle mexican grill'],
  type: 'build-your-own',
  items: [
    // Proteins
    { id: 'chip-chicken', name: 'Chicken', calories: 180, protein: 32, carbs: 0, fat: 7, quantity: '1 serving (4 oz)', category: 'protein', aliases: ['chicken', 'grilled chicken', 'pollo'] },
    { id: 'chip-steak', name: 'Steak', calories: 150, protein: 21, carbs: 1, fat: 6, quantity: '1 serving (4 oz)', category: 'protein', aliases: ['steak', 'carne asada'] },
    { id: 'chip-barbacoa', name: 'Barbacoa', calories: 170, protein: 24, carbs: 2, fat: 7, quantity: '1 serving (4 oz)', category: 'protein', aliases: ['barbacoa', 'shredded beef'] },
    { id: 'chip-carnitas', name: 'Carnitas', calories: 210, protein: 23, carbs: 0, fat: 12, quantity: '1 serving (4 oz)', category: 'protein', aliases: ['carnitas', 'pulled pork', 'pork'] },
    { id: 'chip-sofritas', name: 'Sofritas', calories: 150, protein: 8, carbs: 9, fat: 10, quantity: '1 serving (4 oz)', category: 'protein', aliases: ['sofritas', 'tofu'] },
    // Bases
    { id: 'chip-white-rice', name: 'White Rice', calories: 210, protein: 4, carbs: 40, fat: 4, quantity: '1 serving', category: 'grain', aliases: ['white rice', 'rice', 'cilantro lime rice'] },
    { id: 'chip-brown-rice', name: 'Brown Rice', calories: 210, protein: 5, carbs: 39, fat: 4.5, quantity: '1 serving', category: 'grain', aliases: ['brown rice'] },
    { id: 'chip-flour-tortilla', name: 'Flour Tortilla', calories: 320, protein: 8, carbs: 50, fat: 9, quantity: '1 tortilla', category: 'grain', aliases: ['flour tortilla', 'tortilla', 'burrito tortilla', 'burrito wrap'] },
    { id: 'chip-crispy-tortilla', name: 'Crispy Corn Tortilla', calories: 200, protein: 3, carbs: 26, fat: 9, quantity: '3 shells', category: 'grain', aliases: ['crispy tortilla', 'taco shell', 'hard shell', 'crispy corn tortilla'] },
    // Beans
    { id: 'chip-black-beans', name: 'Black Beans', calories: 130, protein: 8, carbs: 22, fat: 1, quantity: '1 serving', category: 'protein', aliases: ['black beans', 'frijoles negros'] },
    { id: 'chip-pinto-beans', name: 'Pinto Beans', calories: 130, protein: 8, carbs: 22, fat: 1, quantity: '1 serving', category: 'protein', aliases: ['pinto beans'] },
    // Toppings
    { id: 'chip-fajita-veggies', name: 'Fajita Veggies', calories: 20, protein: 1, carbs: 4, fat: 0, quantity: '1 serving', category: 'vegetable', aliases: ['fajita veggies', 'fajita vegetables', 'peppers and onions', 'grilled veggies'] },
    { id: 'chip-fresh-tomato-salsa', name: 'Fresh Tomato Salsa', calories: 25, protein: 1, carbs: 4, fat: 0, quantity: '1 serving', category: 'condiment', aliases: ['fresh tomato salsa', 'pico de gallo', 'pico', 'mild salsa', 'tomato salsa'] },
    { id: 'chip-roasted-chili-corn', name: 'Roasted Chili-Corn Salsa', calories: 80, protein: 1, carbs: 15, fat: 1.5, quantity: '1 serving', category: 'condiment', aliases: ['roasted chili corn salsa', 'corn salsa', 'medium salsa', 'roasted chili-corn salsa'] },
    { id: 'chip-green-chili-salsa', name: 'Tomatillo-Green Chili Salsa', calories: 15, protein: 0, carbs: 3, fat: 0, quantity: '1 serving', category: 'condiment', aliases: ['green chili salsa', 'tomatillo green chili salsa', 'green salsa', 'tomatillo salsa'] },
    { id: 'chip-red-chili-salsa', name: 'Tomatillo-Red Chili Salsa', calories: 30, protein: 1, carbs: 4, fat: 1.5, quantity: '1 serving', category: 'condiment', aliases: ['red chili salsa', 'tomatillo red chili salsa', 'red salsa', 'hot salsa'] },
    { id: 'chip-sour-cream', name: 'Sour Cream', calories: 110, protein: 2, carbs: 2, fat: 9, quantity: '1 serving', category: 'dairy', aliases: ['sour cream', 'crema'] },
    { id: 'chip-cheese', name: 'Cheese', calories: 110, protein: 6, carbs: 2, fat: 8, quantity: '1 serving', category: 'dairy', aliases: ['cheese', 'shredded cheese', 'monterey jack cheese'] },
    { id: 'chip-guacamole', name: 'Guacamole', calories: 230, protein: 2, carbs: 8, fat: 22, quantity: '1 serving', category: 'fat', aliases: ['guacamole', 'guac'] },
    { id: 'chip-lettuce', name: 'Romaine Lettuce', calories: 5, protein: 0, carbs: 1, fat: 0, quantity: '1 serving', category: 'vegetable', aliases: ['lettuce', 'romaine lettuce', 'romaine'] },
    { id: 'chip-queso', name: 'Queso Blanco', calories: 120, protein: 5, carbs: 3, fat: 9, quantity: '1 serving', category: 'dairy', aliases: ['queso', 'queso blanco', 'cheese sauce'] },
    // Sides
    { id: 'chip-chips', name: 'Chips', calories: 540, protein: 7, carbs: 68, fat: 26, quantity: '1 serving', category: 'snack', aliases: ['chips', 'tortilla chips'] },
    { id: 'chip-chips-guac', name: 'Chips & Guacamole', calories: 770, protein: 9, carbs: 76, fat: 48, quantity: '1 serving', category: 'snack', aliases: ['chips and guac', 'chips & guacamole', 'chips and guacamole'] },
    { id: 'chip-chips-queso', name: 'Chips & Queso', calories: 660, protein: 12, carbs: 71, fat: 35, quantity: '1 serving', category: 'snack', aliases: ['chips and queso', 'chips & queso'] },
  ],
}

const subway: ChainData = {
  id: 'subway',
  name: 'Subway',
  aliases: ['subway'],
  type: 'build-your-own',
  items: [
    // Breads (6-inch)
    { id: 'sub-italian', name: 'Italian Bread (6")', calories: 200, protein: 7, carbs: 38, fat: 2, quantity: '6-inch', category: 'grain', aliases: ['italian bread', 'italian', 'white bread'] },
    { id: 'sub-wheat', name: '9-Grain Wheat Bread (6")', calories: 210, protein: 8, carbs: 40, fat: 2, quantity: '6-inch', category: 'grain', aliases: ['wheat bread', '9-grain wheat', 'wheat', '9 grain wheat'] },
    { id: 'sub-flatbread', name: 'Flatbread (6")', calories: 220, protein: 7, carbs: 37, fat: 4.5, quantity: '6-inch', category: 'grain', aliases: ['flatbread'] },
    { id: 'sub-wrap', name: 'Spinach Wrap', calories: 290, protein: 8, carbs: 45, fat: 8, quantity: '1 wrap', category: 'grain', aliases: ['spinach wrap', 'wrap', 'tomato basil wrap'] },
    // Proteins
    { id: 'sub-turkey', name: 'Turkey Breast', calories: 60, protein: 11, carbs: 2, fat: 1, quantity: '6-inch portion', category: 'protein', aliases: ['turkey', 'turkey breast', 'oven roasted turkey'] },
    { id: 'sub-ham', name: 'Black Forest Ham', calories: 70, protein: 10, carbs: 3, fat: 2, quantity: '6-inch portion', category: 'protein', aliases: ['ham', 'black forest ham'] },
    { id: 'sub-roast-beef', name: 'Roast Beef', calories: 90, protein: 15, carbs: 1, fat: 3, quantity: '6-inch portion', category: 'protein', aliases: ['roast beef'] },
    { id: 'sub-italian-bmt', name: 'Italian B.M.T. Meats', calories: 180, protein: 12, carbs: 2, fat: 14, quantity: '6-inch portion', category: 'protein', aliases: ['italian bmt', 'bmt', 'salami pepperoni ham'] },
    { id: 'sub-chicken-breast', name: 'Rotisserie-Style Chicken', calories: 80, protein: 16, carbs: 0, fat: 2, quantity: '6-inch portion', category: 'protein', aliases: ['rotisserie chicken', 'chicken breast', 'chicken'] },
    { id: 'sub-steak', name: 'Steak', calories: 110, protein: 18, carbs: 5, fat: 3, quantity: '6-inch portion', category: 'protein', aliases: ['steak', 'shaved steak'] },
    { id: 'sub-tuna', name: 'Tuna', calories: 250, protein: 16, carbs: 0, fat: 21, quantity: '6-inch portion', category: 'protein', aliases: ['tuna', 'tuna salad'] },
    { id: 'sub-meatball', name: 'Meatball Marinara', calories: 240, protein: 12, carbs: 10, fat: 17, quantity: '6-inch portion', category: 'protein', aliases: ['meatball', 'meatball marinara', 'meatballs'] },
    // Cheese
    { id: 'sub-american', name: 'American Cheese', calories: 40, protein: 2, carbs: 1, fat: 3.5, quantity: '2 triangles', category: 'dairy', aliases: ['american cheese', 'american'] },
    { id: 'sub-provolone', name: 'Provolone', calories: 50, protein: 4, carbs: 0, fat: 4, quantity: '2 triangles', category: 'dairy', aliases: ['provolone', 'provolone cheese'] },
    { id: 'sub-pepper-jack', name: 'Pepper Jack', calories: 50, protein: 3, carbs: 0, fat: 4, quantity: '2 triangles', category: 'dairy', aliases: ['pepper jack', 'pepperjack'] },
    { id: 'sub-swiss', name: 'Swiss Cheese', calories: 50, protein: 4, carbs: 1, fat: 4, quantity: '2 triangles', category: 'dairy', aliases: ['swiss', 'swiss cheese'] },
    // Veggies (most are negligible)
    { id: 'sub-lettuce', name: 'Lettuce', calories: 0, protein: 0, carbs: 0, fat: 0, quantity: '1 serving', category: 'vegetable', aliases: ['lettuce'] },
    { id: 'sub-tomatoes', name: 'Tomatoes', calories: 5, protein: 0, carbs: 1, fat: 0, quantity: '3 slices', category: 'vegetable', aliases: ['tomatoes', 'tomato'] },
    { id: 'sub-onions', name: 'Onions', calories: 5, protein: 0, carbs: 1, fat: 0, quantity: '1 serving', category: 'vegetable', aliases: ['onions', 'onion', 'red onion'] },
    { id: 'sub-pickles', name: 'Pickles', calories: 0, protein: 0, carbs: 0, fat: 0, quantity: '3 slices', category: 'vegetable', aliases: ['pickles', 'pickle'] },
    { id: 'sub-peppers', name: 'Green Peppers', calories: 0, protein: 0, carbs: 0, fat: 0, quantity: '3 rings', category: 'vegetable', aliases: ['green peppers', 'peppers', 'bell peppers'] },
    // Sauces
    { id: 'sub-mayo', name: 'Mayonnaise', calories: 100, protein: 0, carbs: 0, fat: 11, quantity: '1 serving', category: 'condiment', aliases: ['mayo', 'mayonnaise'] },
    { id: 'sub-mustard', name: 'Yellow Mustard', calories: 10, protein: 0, carbs: 1, fat: 0, quantity: '1 serving', category: 'condiment', aliases: ['mustard', 'yellow mustard'] },
    { id: 'sub-ranch', name: 'Ranch', calories: 110, protein: 0, carbs: 2, fat: 11, quantity: '1 serving', category: 'condiment', aliases: ['ranch', 'ranch dressing'] },
    { id: 'sub-chipotle-sw', name: 'Chipotle Southwest', calories: 100, protein: 0, carbs: 1, fat: 10, quantity: '1 serving', category: 'condiment', aliases: ['chipotle southwest', 'southwest sauce', 'chipotle sauce'] },
    { id: 'sub-oil-vinegar', name: 'Oil & Vinegar', calories: 45, protein: 0, carbs: 0, fat: 5, quantity: '1 serving', category: 'condiment', aliases: ['oil and vinegar', 'oil & vinegar'] },
  ],
}

// ─── Fixed-Menu Chains ───

const mcdonalds: ChainData = {
  id: 'mcdonalds',
  name: "McDonald's",
  aliases: ['mcdonalds', "mcdonald's", 'mcd', 'mickey d', "mickey d's"],
  type: 'fixed-menu',
  items: [
    // Burgers
    { id: 'mcd-big-mac', name: 'Big Mac', calories: 550, protein: 25, carbs: 45, fat: 30, quantity: '1 sandwich', category: 'mixed', aliases: ['big mac'] },
    { id: 'mcd-qpc', name: 'Quarter Pounder with Cheese', calories: 520, protein: 30, carbs: 42, fat: 26, quantity: '1 sandwich', category: 'mixed', aliases: ['quarter pounder', 'quarter pounder with cheese', 'qpc'] },
    { id: 'mcd-double-qpc', name: 'Double Quarter Pounder with Cheese', calories: 740, protein: 48, carbs: 43, fat: 42, quantity: '1 sandwich', category: 'mixed', aliases: ['double quarter pounder', 'double qpc'] },
    { id: 'mcd-mcdouble', name: 'McDouble', calories: 400, protein: 22, carbs: 33, fat: 20, quantity: '1 sandwich', category: 'mixed', aliases: ['mcdouble', 'mc double'] },
    { id: 'mcd-cheeseburger', name: 'Cheeseburger', calories: 300, protein: 15, carbs: 33, fat: 12, quantity: '1 sandwich', category: 'mixed', aliases: ['cheeseburger', 'cheese burger'] },
    { id: 'mcd-double-cheese', name: 'Double Cheeseburger', calories: 450, protein: 25, carbs: 34, fat: 24, quantity: '1 sandwich', category: 'mixed', aliases: ['double cheeseburger'] },
    { id: 'mcd-hamburger', name: 'Hamburger', calories: 250, protein: 12, carbs: 32, fat: 9, quantity: '1 sandwich', category: 'mixed', aliases: ['hamburger'] },
    // Chicken
    { id: 'mcd-mcchicken', name: 'McChicken', calories: 400, protein: 14, carbs: 39, fat: 21, quantity: '1 sandwich', category: 'mixed', aliases: ['mcchicken', 'mc chicken'] },
    { id: 'mcd-crispy-chicken', name: 'Crispy Chicken Sandwich', calories: 470, protein: 26, carbs: 45, fat: 20, quantity: '1 sandwich', category: 'mixed', aliases: ['crispy chicken sandwich', 'crispy chicken'] },
    { id: 'mcd-spicy-chicken', name: 'Spicy Chicken Sandwich', calories: 530, protein: 27, carbs: 47, fat: 26, quantity: '1 sandwich', category: 'mixed', aliases: ['spicy chicken sandwich', 'spicy crispy chicken', 'spicy mcchicken'] },
    { id: 'mcd-10pc-nuggets', name: '10pc Chicken McNuggets', calories: 410, protein: 23, carbs: 25, fat: 24, quantity: '10 pieces', category: 'protein', aliases: ['10 piece nuggets', '10pc nuggets', '10 piece mcnuggets', '10pc mcnuggets', 'chicken mcnuggets 10'] },
    { id: 'mcd-6pc-nuggets', name: '6pc Chicken McNuggets', calories: 250, protein: 14, carbs: 15, fat: 15, quantity: '6 pieces', category: 'protein', aliases: ['6 piece nuggets', '6pc nuggets', '6 piece mcnuggets', '6pc mcnuggets', 'chicken mcnuggets 6'] },
    { id: 'mcd-4pc-nuggets', name: '4pc Chicken McNuggets', calories: 170, protein: 9, carbs: 10, fat: 10, quantity: '4 pieces', category: 'protein', aliases: ['4 piece nuggets', '4pc nuggets', '4 piece mcnuggets', '4pc mcnuggets', 'chicken mcnuggets'] },
    // Sides
    { id: 'mcd-fries-sm', name: 'Small Fries', calories: 220, protein: 3, carbs: 29, fat: 10, quantity: '1 small', category: 'snack', aliases: ['small fries', 'small french fries'] },
    { id: 'mcd-fries-md', name: 'Medium Fries', calories: 320, protein: 5, carbs: 43, fat: 15, quantity: '1 medium', category: 'snack', aliases: ['medium fries', 'fries', 'french fries', 'medium french fries'] },
    { id: 'mcd-fries-lg', name: 'Large Fries', calories: 480, protein: 7, carbs: 65, fat: 23, quantity: '1 large', category: 'snack', aliases: ['large fries', 'large french fries'] },
    // Breakfast
    { id: 'mcd-egg-mcmuffin', name: 'Egg McMuffin', calories: 310, protein: 17, carbs: 30, fat: 13, quantity: '1 sandwich', category: 'mixed', aliases: ['egg mcmuffin', 'egg mc muffin'] },
    { id: 'mcd-sausage-mcmuffin', name: 'Sausage McMuffin with Egg', calories: 480, protein: 21, carbs: 30, fat: 31, quantity: '1 sandwich', category: 'mixed', aliases: ['sausage mcmuffin with egg', 'sausage egg mcmuffin', 'sausage mcmuffin'] },
    { id: 'mcd-hotcakes', name: 'Hotcakes', calories: 580, protein: 9, carbs: 101, fat: 16, quantity: '3 hotcakes', category: 'grain', aliases: ['hotcakes', 'pancakes'] },
    { id: 'mcd-hash-brown', name: 'Hash Brown', calories: 140, protein: 1, carbs: 15, fat: 8, quantity: '1 piece', category: 'snack', aliases: ['hash brown', 'hashbrown'] },
    // Drinks
    { id: 'mcd-coke-md', name: 'Medium Coca-Cola', calories: 200, protein: 0, carbs: 55, fat: 0, quantity: '1 medium', category: 'beverage', aliases: ['medium coke', 'coke', 'coca-cola', 'coca cola', 'medium coca-cola'] },
    { id: 'mcd-sprite-md', name: 'Medium Sprite', calories: 200, protein: 0, carbs: 54, fat: 0, quantity: '1 medium', category: 'beverage', aliases: ['medium sprite', 'sprite'] },
    // McFlurry
    { id: 'mcd-mcflurry-oreo', name: 'McFlurry with OREO Cookies', calories: 510, protein: 12, carbs: 80, fat: 17, quantity: '1 regular', category: 'snack', aliases: ['mcflurry oreo', 'oreo mcflurry', 'mcflurry'] },
  ],
}

const chickfila: ChainData = {
  id: 'chickfila',
  name: 'Chick-fil-A',
  aliases: ['chick-fil-a', 'chickfila', 'chick fil a', 'cfa'],
  type: 'fixed-menu',
  items: [
    { id: 'cfa-original', name: 'Chick-fil-A Chicken Sandwich', calories: 440, protein: 28, carbs: 40, fat: 19, quantity: '1 sandwich', category: 'mixed', aliases: ['chicken sandwich', 'original chicken sandwich', 'chick-fil-a sandwich', 'chick fil a sandwich'] },
    { id: 'cfa-deluxe', name: 'Chick-fil-A Deluxe Sandwich', calories: 500, protein: 28, carbs: 42, fat: 22, quantity: '1 sandwich', category: 'mixed', aliases: ['deluxe sandwich', 'chicken deluxe', 'chick-fil-a deluxe'] },
    { id: 'cfa-spicy', name: 'Spicy Chicken Sandwich', calories: 450, protein: 28, carbs: 42, fat: 19, quantity: '1 sandwich', category: 'mixed', aliases: ['spicy chicken sandwich', 'spicy sandwich', 'spicy deluxe'] },
    { id: 'cfa-nuggets-8', name: '8-count Nuggets', calories: 250, protein: 27, carbs: 11, fat: 11, quantity: '8 pieces', category: 'protein', aliases: ['8 count nuggets', '8 piece nuggets', '8pc nuggets', 'nuggets', 'chicken nuggets'] },
    { id: 'cfa-nuggets-12', name: '12-count Nuggets', calories: 380, protein: 40, carbs: 16, fat: 17, quantity: '12 pieces', category: 'protein', aliases: ['12 count nuggets', '12 piece nuggets', '12pc nuggets'] },
    { id: 'cfa-grilled-nuggets-8', name: '8-count Grilled Nuggets', calories: 130, protein: 25, carbs: 1, fat: 3, quantity: '8 pieces', category: 'protein', aliases: ['grilled nuggets', '8 count grilled nuggets', '8pc grilled nuggets'] },
    { id: 'cfa-waffle-fries-md', name: 'Medium Waffle Fries', calories: 420, protein: 5, carbs: 45, fat: 24, quantity: '1 medium', category: 'snack', aliases: ['waffle fries', 'medium waffle fries', 'fries', 'medium fries'] },
    { id: 'cfa-waffle-fries-lg', name: 'Large Waffle Fries', calories: 560, protein: 7, carbs: 60, fat: 32, quantity: '1 large', category: 'snack', aliases: ['large waffle fries', 'large fries'] },
    { id: 'cfa-mac-cheese', name: 'Mac & Cheese', calories: 450, protein: 17, carbs: 44, fat: 23, quantity: '1 medium', category: 'mixed', aliases: ['mac and cheese', 'mac & cheese', 'mac n cheese'] },
    { id: 'cfa-chicken-biscuit', name: 'Chick-fil-A Chicken Biscuit', calories: 460, protein: 18, carbs: 48, fat: 22, quantity: '1 biscuit', category: 'mixed', aliases: ['chicken biscuit'] },
    { id: 'cfa-cobb-salad', name: 'Cobb Salad', calories: 510, protein: 40, carbs: 27, fat: 27, quantity: '1 salad', category: 'mixed', aliases: ['cobb salad'] },
    { id: 'cfa-lemonade-md', name: 'Medium Lemonade', calories: 220, protein: 0, carbs: 58, fat: 0, quantity: '1 medium', category: 'beverage', aliases: ['lemonade', 'medium lemonade', 'chick-fil-a lemonade'] },
    { id: 'cfa-iced-coffee', name: 'Iced Coffee', calories: 200, protein: 3, carbs: 41, fat: 4, quantity: '1 medium', category: 'beverage', aliases: ['iced coffee'] },
    { id: 'cfa-shake-cookies', name: 'Cookies & Cream Milkshake', calories: 660, protein: 14, carbs: 95, fat: 27, quantity: '1 small', category: 'beverage', aliases: ['cookies and cream milkshake', 'milkshake', 'cookies & cream shake'] },
    { id: 'cfa-cfa-sauce', name: 'Chick-fil-A Sauce', calories: 140, protein: 0, carbs: 7, fat: 13, quantity: '1 packet', category: 'condiment', aliases: ['chick-fil-a sauce', 'cfa sauce'] },
    { id: 'cfa-poly-sauce', name: 'Polynesian Sauce', calories: 110, protein: 0, carbs: 13, fat: 6, quantity: '1 packet', category: 'condiment', aliases: ['polynesian sauce', 'polynesian'] },
    { id: 'cfa-ranch-sauce', name: 'Garden Herb Ranch Sauce', calories: 140, protein: 0, carbs: 2, fat: 15, quantity: '1 packet', category: 'condiment', aliases: ['ranch sauce', 'garden herb ranch'] },
  ],
}

const tacobell: ChainData = {
  id: 'tacobell',
  name: 'Taco Bell',
  aliases: ['taco bell', 'tacobell'],
  type: 'fixed-menu',
  items: [
    { id: 'tb-crunchy-taco', name: 'Crunchy Taco', calories: 170, protein: 8, carbs: 13, fat: 10, quantity: '1 taco', category: 'mixed', aliases: ['crunchy taco', 'taco'] },
    { id: 'tb-crunchy-supreme', name: 'Crunchy Taco Supreme', calories: 210, protein: 9, carbs: 15, fat: 13, quantity: '1 taco', category: 'mixed', aliases: ['crunchy taco supreme', 'taco supreme'] },
    { id: 'tb-soft-taco', name: 'Soft Taco', calories: 180, protein: 9, carbs: 18, fat: 9, quantity: '1 taco', category: 'mixed', aliases: ['soft taco'] },
    { id: 'tb-doritos-locos', name: 'Doritos Locos Taco', calories: 170, protein: 8, carbs: 13, fat: 10, quantity: '1 taco', category: 'mixed', aliases: ['doritos locos taco', 'doritos taco', 'dlt'] },
    { id: 'tb-burrito-supreme', name: 'Burrito Supreme', calories: 390, protein: 16, carbs: 51, fat: 14, quantity: '1 burrito', category: 'mixed', aliases: ['burrito supreme'] },
    { id: 'tb-bean-burrito', name: 'Bean Burrito', calories: 380, protein: 14, carbs: 55, fat: 11, quantity: '1 burrito', category: 'mixed', aliases: ['bean burrito'] },
    { id: 'tb-cheesy-bean-rice', name: 'Cheesy Bean and Rice Burrito', calories: 420, protein: 12, carbs: 56, fat: 16, quantity: '1 burrito', category: 'mixed', aliases: ['cheesy bean and rice burrito', 'cheesy bean and rice'] },
    { id: 'tb-quesadilla-chicken', name: 'Chicken Quesadilla', calories: 500, protein: 27, carbs: 37, fat: 27, quantity: '1 quesadilla', category: 'mixed', aliases: ['chicken quesadilla', 'quesadilla'] },
    { id: 'tb-crunchwrap', name: 'Crunchwrap Supreme', calories: 530, protein: 16, carbs: 71, fat: 21, quantity: '1 crunchwrap', category: 'mixed', aliases: ['crunchwrap supreme', 'crunchwrap'] },
    { id: 'tb-mexican-pizza', name: 'Mexican Pizza', calories: 540, protein: 20, carbs: 46, fat: 31, quantity: '1 pizza', category: 'mixed', aliases: ['mexican pizza'] },
    { id: 'tb-nachos-bellgrande', name: 'Nachos BellGrande', calories: 740, protein: 16, carbs: 82, fat: 38, quantity: '1 serving', category: 'mixed', aliases: ['nachos bellgrande', 'nachos bell grande', 'nachos'] },
    { id: 'tb-chalupa-supreme', name: 'Chalupa Supreme', calories: 350, protein: 15, carbs: 30, fat: 19, quantity: '1 chalupa', category: 'mixed', aliases: ['chalupa supreme', 'chalupa'] },
    { id: 'tb-cheesy-gordita', name: 'Cheesy Gordita Crunch', calories: 490, protein: 20, carbs: 40, fat: 28, quantity: '1 item', category: 'mixed', aliases: ['cheesy gordita crunch', 'gordita crunch', 'cgc'] },
    { id: 'tb-cinnabon', name: 'Cinnabon Delights 4-Pack', calories: 310, protein: 4, carbs: 32, fat: 18, quantity: '4 pieces', category: 'snack', aliases: ['cinnabon delights', 'cinnabon'] },
    { id: 'tb-baja-blast-md', name: 'Medium Baja Blast', calories: 220, protein: 0, carbs: 60, fat: 0, quantity: '1 medium', category: 'beverage', aliases: ['baja blast', 'medium baja blast', 'mountain dew baja blast'] },
  ],
}

const wendys: ChainData = {
  id: 'wendys',
  name: "Wendy's",
  aliases: ['wendys', "wendy's"],
  type: 'fixed-menu',
  items: [
    { id: 'wen-daves-single', name: "Dave's Single", calories: 570, protein: 30, carbs: 39, fat: 34, quantity: '1 sandwich', category: 'mixed', aliases: ["dave's single", 'daves single', 'single'] },
    { id: 'wen-daves-double', name: "Dave's Double", calories: 810, protein: 48, carbs: 40, fat: 51, quantity: '1 sandwich', category: 'mixed', aliases: ["dave's double", 'daves double', 'double'] },
    { id: 'wen-daves-triple', name: "Dave's Triple", calories: 1090, protein: 69, carbs: 41, fat: 72, quantity: '1 sandwich', category: 'mixed', aliases: ["dave's triple", 'daves triple', 'triple'] },
    { id: 'wen-baconator', name: 'Baconator', calories: 940, protein: 57, carbs: 38, fat: 62, quantity: '1 sandwich', category: 'mixed', aliases: ['baconator'] },
    { id: 'wen-jr-bacon', name: 'Jr. Bacon Cheeseburger', calories: 370, protein: 19, carbs: 27, fat: 21, quantity: '1 sandwich', category: 'mixed', aliases: ['jr bacon cheeseburger', 'jr bacon', 'junior bacon'] },
    { id: 'wen-spicy-chicken', name: 'Spicy Chicken Sandwich', calories: 490, protein: 29, carbs: 51, fat: 19, quantity: '1 sandwich', category: 'mixed', aliases: ['spicy chicken sandwich', 'spicy chicken'] },
    { id: 'wen-classic-chicken', name: 'Classic Chicken Sandwich', calories: 490, protein: 27, carbs: 49, fat: 20, quantity: '1 sandwich', category: 'mixed', aliases: ['classic chicken sandwich', 'classic chicken'] },
    { id: 'wen-nuggets-10', name: '10pc Nuggets', calories: 430, protein: 22, carbs: 26, fat: 27, quantity: '10 pieces', category: 'protein', aliases: ['10 piece nuggets', '10pc nuggets', 'nuggets'] },
    { id: 'wen-fries-md', name: 'Medium Fries', calories: 350, protein: 4, carbs: 44, fat: 17, quantity: '1 medium', category: 'snack', aliases: ['medium fries', 'fries', 'french fries'] },
    { id: 'wen-fries-lg', name: 'Large Fries', calories: 460, protein: 6, carbs: 58, fat: 23, quantity: '1 large', category: 'snack', aliases: ['large fries'] },
    { id: 'wen-chili-md', name: 'Medium Chili', calories: 250, protein: 20, carbs: 23, fat: 9, quantity: '1 medium', category: 'mixed', aliases: ['chili', 'medium chili'] },
    { id: 'wen-baked-potato', name: 'Sour Cream & Chive Baked Potato', calories: 310, protein: 7, carbs: 56, fat: 7, quantity: '1 potato', category: 'mixed', aliases: ['baked potato', 'sour cream chive baked potato'] },
    { id: 'wen-frosty-md', name: 'Medium Chocolate Frosty', calories: 460, protein: 10, carbs: 68, fat: 16, quantity: '1 medium', category: 'snack', aliases: ['frosty', 'chocolate frosty', 'medium frosty'] },
  ],
}

const pandaexpress: ChainData = {
  id: 'pandaexpress',
  name: 'Panda Express',
  aliases: ['panda express', 'pandaexpress', 'panda'],
  type: 'fixed-menu',
  items: [
    // Entrees
    { id: 'pe-orange-chicken', name: 'Orange Chicken', calories: 490, protein: 25, carbs: 51, fat: 23, quantity: '1 entree serving', category: 'mixed', aliases: ['orange chicken'] },
    { id: 'pe-beijing-beef', name: 'Beijing Beef', calories: 470, protein: 14, carbs: 56, fat: 22, quantity: '1 entree serving', category: 'mixed', aliases: ['beijing beef'] },
    { id: 'pe-kung-pao', name: 'Kung Pao Chicken', calories: 290, protein: 16, carbs: 14, fat: 19, quantity: '1 entree serving', category: 'mixed', aliases: ['kung pao chicken', 'kung pao'] },
    { id: 'pe-broccoli-beef', name: 'Broccoli Beef', calories: 150, protein: 9, carbs: 13, fat: 7, quantity: '1 entree serving', category: 'mixed', aliases: ['broccoli beef'] },
    { id: 'pe-string-bean-chicken', name: 'String Bean Chicken Breast', calories: 190, protein: 14, carbs: 13, fat: 9, quantity: '1 entree serving', category: 'mixed', aliases: ['string bean chicken', 'string bean chicken breast'] },
    { id: 'pe-grilled-teriyaki', name: 'Grilled Teriyaki Chicken', calories: 300, protein: 36, carbs: 8, fat: 13, quantity: '1 entree serving', category: 'mixed', aliases: ['grilled teriyaki chicken', 'teriyaki chicken'] },
    { id: 'pe-sweetfire-chicken', name: 'SweetFire Chicken Breast', calories: 380, protein: 18, carbs: 47, fat: 15, quantity: '1 entree serving', category: 'mixed', aliases: ['sweetfire chicken', 'sweet fire chicken'] },
    { id: 'pe-mushroom-chicken', name: 'Mushroom Chicken', calories: 220, protein: 15, carbs: 10, fat: 14, quantity: '1 entree serving', category: 'mixed', aliases: ['mushroom chicken'] },
    { id: 'pe-honey-walnut', name: 'Honey Walnut Shrimp', calories: 510, protein: 14, carbs: 54, fat: 27, quantity: '1 entree serving', category: 'mixed', aliases: ['honey walnut shrimp'] },
    { id: 'pe-black-pepper-steak', name: 'Black Pepper Angus Steak', calories: 180, protein: 19, carbs: 11, fat: 7, quantity: '1 entree serving', category: 'mixed', aliases: ['black pepper steak', 'black pepper angus steak'] },
    // Sides
    { id: 'pe-fried-rice', name: 'Fried Rice', calories: 520, protein: 11, carbs: 85, fat: 16, quantity: '1 side serving', category: 'grain', aliases: ['fried rice'] },
    { id: 'pe-white-rice', name: 'White Steamed Rice', calories: 380, protein: 7, carbs: 87, fat: 0, quantity: '1 side serving', category: 'grain', aliases: ['white rice', 'steamed rice', 'rice'] },
    { id: 'pe-brown-rice', name: 'Brown Steamed Rice', calories: 420, protein: 9, carbs: 86, fat: 4, quantity: '1 side serving', category: 'grain', aliases: ['brown rice', 'brown steamed rice'] },
    { id: 'pe-chow-mein', name: 'Chow Mein', calories: 510, protein: 13, carbs: 80, fat: 22, quantity: '1 side serving', category: 'grain', aliases: ['chow mein', 'lo mein', 'noodles'] },
    { id: 'pe-super-greens', name: 'Super Greens', calories: 90, protein: 6, carbs: 10, fat: 3, quantity: '1 side serving', category: 'vegetable', aliases: ['super greens', 'mixed vegetables', 'veggies'] },
    // Appetizers
    { id: 'pe-cream-cheese-rangoon', name: 'Cream Cheese Rangoon (3pc)', calories: 190, protein: 5, carbs: 24, fat: 8, quantity: '3 pieces', category: 'snack', aliases: ['cream cheese rangoon', 'rangoon', 'crab rangoon'] },
    { id: 'pe-egg-roll', name: 'Chicken Egg Roll (1pc)', calories: 200, protein: 8, carbs: 20, fat: 10, quantity: '1 roll', category: 'snack', aliases: ['egg roll', 'chicken egg roll'] },
    { id: 'pe-spring-roll', name: 'Veggie Spring Roll (2pc)', calories: 190, protein: 4, carbs: 22, fat: 10, quantity: '2 rolls', category: 'snack', aliases: ['spring roll', 'veggie spring roll'] },
  ],
}

const starbucks: ChainData = {
  id: 'starbucks',
  name: 'Starbucks',
  aliases: ['starbucks', 'starbucks coffee', 'sbux'],
  type: 'fixed-menu',
  items: [
    // Drinks (Grande / 16oz)
    { id: 'sbux-caramel-frap', name: 'Caramel Frappuccino (Grande)', calories: 380, protein: 5, carbs: 54, fat: 16, quantity: '16 oz', category: 'beverage', aliases: ['caramel frappuccino', 'caramel frap', 'frappuccino'] },
    { id: 'sbux-mocha-frap', name: 'Mocha Frappuccino (Grande)', calories: 370, protein: 6, carbs: 52, fat: 15, quantity: '16 oz', category: 'beverage', aliases: ['mocha frappuccino', 'mocha frap'] },
    { id: 'sbux-pike-place', name: 'Pike Place Roast (Grande)', calories: 5, protein: 1, carbs: 0, fat: 0, quantity: '16 oz', category: 'beverage', aliases: ['pike place', 'pike place roast', 'drip coffee', 'brewed coffee', 'regular coffee', 'black coffee'] },
    { id: 'sbux-caramel-macchiato', name: 'Caramel Macchiato (Grande)', calories: 250, protein: 10, carbs: 35, fat: 7, quantity: '16 oz', category: 'beverage', aliases: ['caramel macchiato'] },
    { id: 'sbux-vanilla-latte', name: 'Vanilla Latte (Grande)', calories: 250, protein: 12, carbs: 37, fat: 6, quantity: '16 oz', category: 'beverage', aliases: ['vanilla latte', 'latte'] },
    { id: 'sbux-iced-coffee', name: 'Iced Coffee (Grande)', calories: 80, protein: 1, carbs: 20, fat: 0, quantity: '16 oz', category: 'beverage', aliases: ['iced coffee'] },
    { id: 'sbux-cold-brew', name: 'Cold Brew (Grande)', calories: 5, protein: 0, carbs: 0, fat: 0, quantity: '16 oz', category: 'beverage', aliases: ['cold brew'] },
    { id: 'sbux-psl', name: 'Pumpkin Spice Latte (Grande)', calories: 380, protein: 14, carbs: 52, fat: 14, quantity: '16 oz', category: 'beverage', aliases: ['pumpkin spice latte', 'psl'] },
    { id: 'sbux-chai-latte', name: 'Chai Tea Latte (Grande)', calories: 240, protein: 8, carbs: 42, fat: 4, quantity: '16 oz', category: 'beverage', aliases: ['chai latte', 'chai tea latte'] },
    { id: 'sbux-pink-drink', name: 'Pink Drink (Grande)', calories: 140, protein: 1, carbs: 28, fat: 2.5, quantity: '16 oz', category: 'beverage', aliases: ['pink drink'] },
    { id: 'sbux-refresher-straw', name: 'Strawberry Acai Refresher (Grande)', calories: 90, protein: 0, carbs: 24, fat: 0, quantity: '16 oz', category: 'beverage', aliases: ['strawberry acai refresher', 'strawberry refresher'] },
    { id: 'sbux-hot-chocolate', name: 'Hot Chocolate (Grande)', calories: 370, protein: 14, carbs: 47, fat: 15, quantity: '16 oz', category: 'beverage', aliases: ['hot chocolate'] },
    // Food
    { id: 'sbux-bacon-gouda', name: 'Bacon, Gouda & Egg Sandwich', calories: 370, protein: 18, carbs: 34, fat: 18, quantity: '1 sandwich', category: 'mixed', aliases: ['bacon gouda sandwich', 'bacon gouda egg', 'bacon gouda & egg sandwich'] },
    { id: 'sbux-sausage-cheddar', name: 'Sausage, Cheddar & Egg Sandwich', calories: 480, protein: 15, carbs: 39, fat: 29, quantity: '1 sandwich', category: 'mixed', aliases: ['sausage cheddar sandwich', 'sausage cheddar egg sandwich'] },
    { id: 'sbux-egg-bites', name: 'Bacon & Gruyere Egg Bites (2pc)', calories: 300, protein: 19, carbs: 9, fat: 20, quantity: '2 pieces', category: 'protein', aliases: ['egg bites', 'sous vide egg bites', 'bacon gruyere egg bites'] },
    { id: 'sbux-cake-pop', name: 'Birthday Cake Pop', calories: 160, protein: 2, carbs: 18, fat: 8, quantity: '1 pop', category: 'snack', aliases: ['cake pop', 'birthday cake pop'] },
    { id: 'sbux-croissant', name: 'Butter Croissant', calories: 250, protein: 5, carbs: 28, fat: 13, quantity: '1 croissant', category: 'grain', aliases: ['croissant', 'butter croissant'] },
    { id: 'sbux-choc-croissant', name: 'Chocolate Croissant', calories: 340, protein: 5, carbs: 37, fat: 17, quantity: '1 croissant', category: 'grain', aliases: ['chocolate croissant', 'pain au chocolat'] },
  ],
}

const dunkin: ChainData = {
  id: 'dunkin',
  name: "Dunkin'",
  aliases: ['dunkin', "dunkin'", 'dunkin donuts', "dunkin' donuts"],
  type: 'fixed-menu',
  items: [
    // Donuts
    { id: 'dd-glazed', name: 'Glazed Donut', calories: 240, protein: 4, carbs: 31, fat: 11, quantity: '1 donut', category: 'snack', aliases: ['glazed donut', 'glazed', 'donut'] },
    { id: 'dd-boston-kreme', name: 'Boston Kreme Donut', calories: 300, protein: 4, carbs: 38, fat: 15, quantity: '1 donut', category: 'snack', aliases: ['boston kreme', 'boston cream donut', 'boston kreme donut'] },
    { id: 'dd-chocolate-frosted', name: 'Chocolate Frosted Donut', calories: 280, protein: 4, carbs: 36, fat: 14, quantity: '1 donut', category: 'snack', aliases: ['chocolate frosted', 'chocolate frosted donut', 'chocolate donut'] },
    { id: 'dd-jelly', name: 'Jelly Donut', calories: 300, protein: 4, carbs: 42, fat: 13, quantity: '1 donut', category: 'snack', aliases: ['jelly donut', 'jelly filled'] },
    // Breakfast
    { id: 'dd-sausage-egg-cheese', name: 'Sausage, Egg & Cheese on Croissant', calories: 650, protein: 22, carbs: 40, fat: 45, quantity: '1 sandwich', category: 'mixed', aliases: ['sausage egg cheese croissant', 'sausage egg & cheese', 'sausage egg and cheese', 'sec'] },
    { id: 'dd-bacon-egg-cheese', name: 'Bacon, Egg & Cheese on Croissant', calories: 560, protein: 21, carbs: 39, fat: 36, quantity: '1 sandwich', category: 'mixed', aliases: ['bacon egg cheese croissant', 'bacon egg & cheese', 'bacon egg and cheese', 'bec'] },
    { id: 'dd-wake-up-wrap', name: 'Bacon, Egg & Cheese Wake-Up Wrap', calories: 200, protein: 10, carbs: 14, fat: 11, quantity: '1 wrap', category: 'mixed', aliases: ['wake up wrap', 'wake-up wrap', 'bacon egg cheese wrap'] },
    { id: 'dd-hash-browns', name: 'Hash Browns (6pc)', calories: 360, protein: 3, carbs: 37, fat: 22, quantity: '6 pieces', category: 'snack', aliases: ['hash browns', 'hashbrowns'] },
    // Drinks (Medium)
    { id: 'dd-iced-coffee', name: 'Medium Iced Coffee', calories: 5, protein: 0, carbs: 1, fat: 0, quantity: '24 oz', category: 'beverage', aliases: ['iced coffee', 'medium iced coffee'] },
    { id: 'dd-iced-latte', name: 'Medium Iced Latte', calories: 120, protein: 7, carbs: 11, fat: 6, quantity: '24 oz', category: 'beverage', aliases: ['iced latte', 'medium iced latte'] },
    { id: 'dd-hot-coffee', name: 'Medium Hot Coffee', calories: 5, protein: 0, carbs: 0, fat: 0, quantity: '14 oz', category: 'beverage', aliases: ['hot coffee', 'medium hot coffee', 'coffee'] },
    { id: 'dd-frozen-choc', name: 'Medium Frozen Chocolate', calories: 730, protein: 12, carbs: 112, fat: 27, quantity: '24 oz', category: 'beverage', aliases: ['frozen chocolate', 'frozen hot chocolate'] },
    { id: 'dd-coolatta', name: 'Medium Strawberry Coolatta', calories: 350, protein: 0, carbs: 91, fat: 0, quantity: '24 oz', category: 'beverage', aliases: ['coolatta', 'strawberry coolatta'] },
    // Munchkins
    { id: 'dd-munchkins-5', name: 'Glazed Munchkins (5pc)', calories: 260, protein: 3, carbs: 31, fat: 14, quantity: '5 pieces', category: 'snack', aliases: ['munchkins', 'glazed munchkins', '5 munchkins'] },
  ],
}

export const chains: ChainData[] = [
  chipotle,
  subway,
  mcdonalds,
  chickfila,
  tacobell,
  wendys,
  pandaexpress,
  starbucks,
  dunkin,
]
