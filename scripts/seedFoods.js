import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { readFileSync } from "fs";

// Common foods data
const commonFoodsData = [
  // Proteins
  { name: "Chicken Breast", protein: 31, carbs: 0, fat: 3.6, calories: 165, servingSize: "100g", category: "Protein" },
  { name: "Chicken Thigh", protein: 26, carbs: 0, fat: 10, calories: 209, servingSize: "100g", category: "Protein" },
  { name: "Ground Beef (90% lean)", protein: 26, carbs: 0, fat: 10, calories: 196, servingSize: "100g", category: "Protein" },
  { name: "Ground Beef (80% lean)", protein: 25, carbs: 0, fat: 15, calories: 243, servingSize: "100g", category: "Protein" },
  { name: "Salmon", protein: 25, carbs: 0, fat: 13, calories: 208, servingSize: "100g", category: "Protein" },
  { name: "Tuna (canned in water)", protein: 26, carbs: 0, fat: 1, calories: 116, servingSize: "100g", category: "Protein" },
  { name: "Shrimp", protein: 24, carbs: 0, fat: 0.3, calories: 99, servingSize: "100g", category: "Protein" },
  { name: "Tilapia", protein: 26, carbs: 0, fat: 2.7, calories: 128, servingSize: "100g", category: "Protein" },
  { name: "Turkey Breast", protein: 30, carbs: 0, fat: 1, calories: 135, servingSize: "100g", category: "Protein" },
  { name: "Pork Tenderloin", protein: 26, carbs: 0, fat: 3, calories: 143, servingSize: "100g", category: "Protein" },
  { name: "Bacon", protein: 11, carbs: 0.3, fat: 12.6, calories: 162, servingSize: "2 slices (30g)", category: "Protein" },
  { name: "Egg (whole)", protein: 6, carbs: 0.6, fat: 5, calories: 72, servingSize: "1 large", category: "Protein" },
  { name: "Egg White", protein: 3.6, carbs: 0.2, fat: 0, calories: 17, servingSize: "1 large", category: "Protein" },
  { name: "Tofu (firm)", protein: 17, carbs: 2, fat: 9, calories: 144, servingSize: "100g", category: "Protein" },
  { name: "Tempeh", protein: 19, carbs: 9, fat: 11, calories: 193, servingSize: "100g", category: "Protein" },
  { name: "Cod", protein: 23, carbs: 0, fat: 1, calories: 105, servingSize: "100g", category: "Protein" },
  { name: "Halibut", protein: 23, carbs: 0, fat: 2.3, calories: 111, servingSize: "100g", category: "Protein" },
  { name: "Sardines (canned in oil)", protein: 25, carbs: 0, fat: 11, calories: 208, servingSize: "100g", category: "Protein" },
  { name: "Crab", protein: 19, carbs: 0, fat: 1.5, calories: 97, servingSize: "100g", category: "Protein" },
  { name: "Lobster", protein: 19, carbs: 0, fat: 0.9, calories: 89, servingSize: "100g", category: "Protein" },
  { name: "Scallops", protein: 17, carbs: 3, fat: 0.8, calories: 88, servingSize: "100g", category: "Protein" },
  { name: "Duck Breast", protein: 23, carbs: 0, fat: 11, calories: 201, servingSize: "100g", category: "Protein" },
  { name: "Lamb Chop", protein: 25, carbs: 0, fat: 17, calories: 258, servingSize: "100g", category: "Protein" },
  { name: "Bison", protein: 28, carbs: 0, fat: 7, calories: 179, servingSize: "100g", category: "Protein" },
  { name: "Venison", protein: 30, carbs: 0, fat: 3, calories: 150, servingSize: "100g", category: "Protein" },
  { name: "Ham", protein: 21, carbs: 1, fat: 5, calories: 139, servingSize: "100g", category: "Protein" },
  { name: "Sausage (pork)", protein: 13, carbs: 2, fat: 28, calories: 301, servingSize: "100g", category: "Protein" },
  { name: "Ground Turkey", protein: 27, carbs: 0, fat: 8, calories: 176, servingSize: "100g", category: "Protein" },
  { name: "Chicken Wings", protein: 27, carbs: 0, fat: 19, calories: 266, servingSize: "100g", category: "Protein" },

  // Dairy
  { name: "Greek Yogurt (nonfat)", protein: 10, carbs: 4, fat: 0, calories: 59, servingSize: "100g", category: "Dairy" },
  { name: "Greek Yogurt (2%)", protein: 9, carbs: 4, fat: 2, calories: 73, servingSize: "100g", category: "Dairy" },
  { name: "Cottage Cheese (2%)", protein: 12, carbs: 4, fat: 2, calories: 84, servingSize: "100g", category: "Dairy" },
  { name: "Milk (whole)", protein: 3.4, carbs: 5, fat: 3.9, calories: 64, servingSize: "100ml", category: "Dairy" },
  { name: "Milk (2%)", protein: 3.4, carbs: 5, fat: 2, calories: 50, servingSize: "100ml", category: "Dairy" },
  { name: "Milk (skim)", protein: 3.4, carbs: 5, fat: 0.1, calories: 35, servingSize: "100ml", category: "Dairy" },
  { name: "Cheddar Cheese", protein: 7, carbs: 0.3, fat: 9.2, calories: 113, servingSize: "1 oz (28g)", category: "Dairy" },
  { name: "Mozzarella Cheese", protein: 7.8, carbs: 0.8, fat: 4.8, calories: 78, servingSize: "1 oz (28g)", category: "Dairy" },
  { name: "Parmesan Cheese", protein: 3.8, carbs: 0.4, fat: 2.5, calories: 39, servingSize: "2 tbsp (10g)", category: "Dairy" },
  { name: "Cream Cheese", protein: 1.7, carbs: 1.1, fat: 9.5, calories: 96, servingSize: "2 tbsp (28g)", category: "Dairy" },
  { name: "Butter", protein: 0.1, carbs: 0, fat: 11.3, calories: 100, servingSize: "1 tbsp (14g)", category: "Dairy" },
  { name: "Feta Cheese", protein: 4, carbs: 1, fat: 6, calories: 75, servingSize: "1 oz (28g)", category: "Dairy" },
  { name: "Goat Cheese", protein: 5, carbs: 0, fat: 8, calories: 90, servingSize: "1 oz (28g)", category: "Dairy" },
  { name: "Swiss Cheese", protein: 8, carbs: 0.4, fat: 8, calories: 106, servingSize: "1 oz (28g)", category: "Dairy" },
  { name: "Brie Cheese", protein: 6, carbs: 0.1, fat: 8, calories: 95, servingSize: "1 oz (28g)", category: "Dairy" },
  { name: "Ricotta Cheese", protein: 3.2, carbs: 1, fat: 3.7, calories: 49, servingSize: "2 tbsp (30g)", category: "Dairy" },
  { name: "Sour Cream", protein: 0.7, carbs: 1.2, fat: 5.8, calories: 59, servingSize: "2 tbsp (30g)", category: "Dairy" },
  { name: "Heavy Cream", protein: 0.4, carbs: 0.4, fat: 5.4, calories: 51, servingSize: "1 tbsp (15ml)", category: "Dairy" },
  { name: "Half and Half", protein: 0.4, carbs: 0.6, fat: 1.7, calories: 20, servingSize: "1 tbsp (15ml)", category: "Dairy" },
  { name: "Yogurt (whole milk)", protein: 3.5, carbs: 5, fat: 3.3, calories: 61, servingSize: "100g", category: "Dairy" },
  { name: "Kefir", protein: 3.3, carbs: 4, fat: 2, calories: 52, servingSize: "100ml", category: "Dairy" },

  // Grains
  { name: "White Rice (cooked)", protein: 2.7, carbs: 28, fat: 0.3, calories: 130, servingSize: "100g", category: "Grains" },
  { name: "Brown Rice (cooked)", protein: 2.6, carbs: 23, fat: 0.9, calories: 112, servingSize: "100g", category: "Grains" },
  { name: "Pasta (cooked)", protein: 5, carbs: 25, fat: 1, calories: 131, servingSize: "100g", category: "Grains" },
  { name: "Bread (white)", protein: 9, carbs: 49, fat: 3.2, calories: 265, servingSize: "100g", category: "Grains" },
  { name: "Bread (whole wheat)", protein: 13, carbs: 43, fat: 3.4, calories: 252, servingSize: "100g", category: "Grains" },
  { name: "Oatmeal (dry)", protein: 5.2, carbs: 27.2, fat: 2.8, calories: 156, servingSize: "1/2 cup (40g)", category: "Grains" },
  { name: "Quinoa (cooked)", protein: 4.4, carbs: 21, fat: 1.9, calories: 120, servingSize: "100g", category: "Grains" },
  { name: "Tortilla (flour)", protein: 8, carbs: 48, fat: 8, calories: 304, servingSize: "100g", category: "Grains" },
  { name: "Tortilla (corn)", protein: 5, carbs: 44, fat: 3, calories: 218, servingSize: "100g", category: "Grains" },
  { name: "Couscous (cooked)", protein: 3.8, carbs: 23, fat: 0.2, calories: 112, servingSize: "100g", category: "Grains" },
  { name: "Barley (cooked)", protein: 2.3, carbs: 28, fat: 0.4, calories: 123, servingSize: "100g", category: "Grains" },
  { name: "Farro (cooked)", protein: 5.5, carbs: 29, fat: 1.3, calories: 150, servingSize: "100g", category: "Grains" },
  { name: "Bulgur (cooked)", protein: 3.1, carbs: 19, fat: 0.2, calories: 83, servingSize: "100g", category: "Grains" },
  { name: "Bagel", protein: 10, carbs: 53, fat: 1.4, calories: 270, servingSize: "1 medium", category: "Grains" },
  { name: "English Muffin", protein: 5, carbs: 25, fat: 1, calories: 132, servingSize: "1 muffin", category: "Grains" },
  { name: "Croissant", protein: 5, carbs: 26, fat: 12, calories: 231, servingSize: "1 medium", category: "Grains" },
  { name: "Pita Bread", protein: 5.5, carbs: 33, fat: 1.2, calories: 165, servingSize: "1 pita", category: "Grains" },
  { name: "Naan Bread", protein: 9, carbs: 45, fat: 5, calories: 262, servingSize: "1 piece", category: "Grains" },
  { name: "Pancake", protein: 6, carbs: 28, fat: 7, calories: 175, servingSize: "1 medium", category: "Grains" },
  { name: "Waffle", protein: 6, carbs: 25, fat: 10, calories: 218, servingSize: "1 waffle", category: "Grains" },
  { name: "Cornbread", protein: 4, carbs: 28, fat: 8, calories: 198, servingSize: "1 piece", category: "Grains" },
  { name: "Granola", protein: 4, carbs: 25, fat: 9, calories: 196, servingSize: "1/4 cup (30g)", category: "Grains" },
  { name: "Cereal (bran flakes)", protein: 3, carbs: 24, fat: 0.7, calories: 96, servingSize: "1 cup (30g)", category: "Grains" },

  // Vegetables
  { name: "Broccoli", protein: 2.8, carbs: 7, fat: 0.4, calories: 34, servingSize: "100g", category: "Vegetables" },
  { name: "Spinach", protein: 2.9, carbs: 3.6, fat: 0.4, calories: 23, servingSize: "100g", category: "Vegetables" },
  { name: "Kale", protein: 4.3, carbs: 9, fat: 0.9, calories: 49, servingSize: "100g", category: "Vegetables" },
  { name: "Sweet Potato", protein: 1.6, carbs: 20, fat: 0.1, calories: 86, servingSize: "100g", category: "Vegetables" },
  { name: "Potato", protein: 2, carbs: 17, fat: 0.1, calories: 77, servingSize: "100g", category: "Vegetables" },
  { name: "Carrots", protein: 0.9, carbs: 10, fat: 0.2, calories: 41, servingSize: "100g", category: "Vegetables" },
  { name: "Bell Pepper", protein: 1, carbs: 6, fat: 0.3, calories: 31, servingSize: "100g", category: "Vegetables" },
  { name: "Tomato", protein: 0.9, carbs: 3.9, fat: 0.2, calories: 18, servingSize: "100g", category: "Vegetables" },
  { name: "Onion", protein: 1.1, carbs: 9, fat: 0.1, calories: 40, servingSize: "100g", category: "Vegetables" },
  { name: "Cucumber", protein: 0.7, carbs: 3.6, fat: 0.1, calories: 15, servingSize: "100g", category: "Vegetables" },
  { name: "Zucchini", protein: 1.2, carbs: 3.1, fat: 0.3, calories: 17, servingSize: "100g", category: "Vegetables" },
  { name: "Asparagus", protein: 2.2, carbs: 3.9, fat: 0.1, calories: 20, servingSize: "100g", category: "Vegetables" },
  { name: "Green Beans", protein: 1.8, carbs: 7, fat: 0.1, calories: 31, servingSize: "100g", category: "Vegetables" },
  { name: "Mushrooms", protein: 3.1, carbs: 3.3, fat: 0.3, calories: 22, servingSize: "100g", category: "Vegetables" },
  { name: "Cauliflower", protein: 1.9, carbs: 5, fat: 0.3, calories: 25, servingSize: "100g", category: "Vegetables" },
  { name: "Brussels Sprouts", protein: 3.4, carbs: 9, fat: 0.3, calories: 43, servingSize: "100g", category: "Vegetables" },
  { name: "Cabbage", protein: 1.3, carbs: 6, fat: 0.1, calories: 25, servingSize: "100g", category: "Vegetables" },
  { name: "Celery", protein: 0.7, carbs: 3, fat: 0.2, calories: 14, servingSize: "100g", category: "Vegetables" },
  { name: "Eggplant", protein: 1, carbs: 6, fat: 0.2, calories: 25, servingSize: "100g", category: "Vegetables" },
  { name: "Artichoke", protein: 3.3, carbs: 11, fat: 0.2, calories: 47, servingSize: "1 medium", category: "Vegetables" },
  { name: "Beets", protein: 1.6, carbs: 10, fat: 0.2, calories: 43, servingSize: "100g", category: "Vegetables" },
  { name: "Radishes", protein: 0.7, carbs: 3.4, fat: 0.1, calories: 16, servingSize: "100g", category: "Vegetables" },
  { name: "Leeks", protein: 1.5, carbs: 14, fat: 0.3, calories: 61, servingSize: "100g", category: "Vegetables" },
  { name: "Bok Choy", protein: 1.5, carbs: 2.2, fat: 0.2, calories: 13, servingSize: "100g", category: "Vegetables" },
  { name: "Swiss Chard", protein: 1.8, carbs: 3.7, fat: 0.2, calories: 19, servingSize: "100g", category: "Vegetables" },
  { name: "Collard Greens", protein: 3, carbs: 5.4, fat: 0.6, calories: 32, servingSize: "100g", category: "Vegetables" },
  { name: "Butternut Squash", protein: 1, carbs: 12, fat: 0.1, calories: 45, servingSize: "100g", category: "Vegetables" },
  { name: "Acorn Squash", protein: 1, carbs: 15, fat: 0.1, calories: 56, servingSize: "100g", category: "Vegetables" },
  { name: "Peas", protein: 5.4, carbs: 14, fat: 0.4, calories: 81, servingSize: "100g", category: "Vegetables" },
  { name: "Corn", protein: 3.2, carbs: 19, fat: 1.2, calories: 86, servingSize: "100g", category: "Vegetables" },
  { name: "Edamame", protein: 11, carbs: 10, fat: 5, calories: 121, servingSize: "100g", category: "Vegetables" },
  { name: "Lettuce (romaine)", protein: 1.2, carbs: 3.3, fat: 0.3, calories: 17, servingSize: "100g", category: "Vegetables" },
  { name: "Arugula", protein: 2.6, carbs: 3.7, fat: 0.7, calories: 25, servingSize: "100g", category: "Vegetables" },
  { name: "Garlic", protein: 0.2, carbs: 1, fat: 0, calories: 4, servingSize: "1 clove", category: "Vegetables" },
  { name: "Ginger", protein: 0.2, carbs: 1.8, fat: 0.1, calories: 8, servingSize: "1 tbsp", category: "Vegetables" },
  { name: "Jalapeño", protein: 0.1, carbs: 0.5, fat: 0, calories: 4, servingSize: "1 pepper", category: "Vegetables" },

  // Fruits
  { name: "Banana", protein: 1.1, carbs: 23, fat: 0.3, calories: 89, servingSize: "1 medium", category: "Fruits" },
  { name: "Apple", protein: 0.3, carbs: 14, fat: 0.2, calories: 52, servingSize: "1 medium", category: "Fruits" },
  { name: "Orange", protein: 0.9, carbs: 12, fat: 0.1, calories: 47, servingSize: "1 medium", category: "Fruits" },
  { name: "Strawberries", protein: 0.7, carbs: 8, fat: 0.3, calories: 32, servingSize: "100g", category: "Fruits" },
  { name: "Blueberries", protein: 0.7, carbs: 14, fat: 0.3, calories: 57, servingSize: "100g", category: "Fruits" },
  { name: "Grapes", protein: 0.7, carbs: 18, fat: 0.2, calories: 69, servingSize: "100g", category: "Fruits" },
  { name: "Avocado", protein: 2, carbs: 9, fat: 15, calories: 160, servingSize: "100g", category: "Fruits" },
  { name: "Mango", protein: 0.8, carbs: 15, fat: 0.4, calories: 60, servingSize: "100g", category: "Fruits" },
  { name: "Pear", protein: 0.4, carbs: 15, fat: 0.1, calories: 57, servingSize: "1 medium", category: "Fruits" },
  { name: "Peach", protein: 0.9, carbs: 10, fat: 0.3, calories: 39, servingSize: "1 medium", category: "Fruits" },
  { name: "Plum", protein: 0.7, carbs: 11, fat: 0.3, calories: 46, servingSize: "1 medium", category: "Fruits" },
  { name: "Cherries", protein: 1, carbs: 16, fat: 0.3, calories: 63, servingSize: "100g", category: "Fruits" },
  { name: "Raspberries", protein: 1.2, carbs: 12, fat: 0.7, calories: 52, servingSize: "100g", category: "Fruits" },
  { name: "Blackberries", protein: 1.4, carbs: 10, fat: 0.5, calories: 43, servingSize: "100g", category: "Fruits" },
  { name: "Watermelon", protein: 0.6, carbs: 8, fat: 0.2, calories: 30, servingSize: "100g", category: "Fruits" },
  { name: "Cantaloupe", protein: 0.8, carbs: 8, fat: 0.2, calories: 34, servingSize: "100g", category: "Fruits" },
  { name: "Honeydew", protein: 0.5, carbs: 9, fat: 0.1, calories: 36, servingSize: "100g", category: "Fruits" },
  { name: "Pineapple", protein: 0.5, carbs: 13, fat: 0.1, calories: 50, servingSize: "100g", category: "Fruits" },
  { name: "Kiwi", protein: 1.1, carbs: 15, fat: 0.5, calories: 61, servingSize: "1 medium", category: "Fruits" },
  { name: "Grapefruit", protein: 0.8, carbs: 11, fat: 0.1, calories: 42, servingSize: "1/2 fruit", category: "Fruits" },
  { name: "Pomegranate Seeds", protein: 1.7, carbs: 19, fat: 1.2, calories: 83, servingSize: "100g", category: "Fruits" },
  { name: "Papaya", protein: 0.5, carbs: 11, fat: 0.3, calories: 43, servingSize: "100g", category: "Fruits" },
  { name: "Lemon", protein: 0.4, carbs: 3, fat: 0.1, calories: 12, servingSize: "1 medium", category: "Fruits" },
  { name: "Lime", protein: 0.3, carbs: 4, fat: 0.1, calories: 11, servingSize: "1 medium", category: "Fruits" },
  { name: "Coconut (fresh)", protein: 3.3, carbs: 15, fat: 33, calories: 354, servingSize: "100g", category: "Fruits" },
  { name: "Dates", protein: 0.6, carbs: 18, fat: 0, calories: 66, servingSize: "2 dates", category: "Fruits" },
  { name: "Dried Apricots", protein: 1, carbs: 17, fat: 0.2, calories: 67, servingSize: "1 oz (28g)", category: "Fruits" },
  { name: "Raisins", protein: 0.9, carbs: 22, fat: 0.1, calories: 85, servingSize: "1 oz (28g)", category: "Fruits" },
  { name: "Dried Cranberries", protein: 0, carbs: 23, fat: 0.4, calories: 92, servingSize: "1 oz (28g)", category: "Fruits" },

  // Fats & Oils
  { name: "Olive Oil", protein: 0, carbs: 0, fat: 15, calories: 133, servingSize: "1 tbsp (15ml)", category: "Fats & Oils" },
  { name: "Coconut Oil", protein: 0, carbs: 0, fat: 15, calories: 134, servingSize: "1 tbsp (15ml)", category: "Fats & Oils" },
  { name: "Almonds", protein: 5.9, carbs: 6.2, fat: 13.7, calories: 162, servingSize: "1 oz (28g)", category: "Fats & Oils" },
  { name: "Peanuts", protein: 7.3, carbs: 4.5, fat: 13.7, calories: 159, servingSize: "1 oz (28g)", category: "Fats & Oils" },
  { name: "Peanut Butter", protein: 8, carbs: 6.4, fat: 16, calories: 188, servingSize: "2 tbsp (32g)", category: "Fats & Oils" },
  { name: "Almond Butter", protein: 6.7, carbs: 6.1, fat: 17.9, calories: 196, servingSize: "2 tbsp (32g)", category: "Fats & Oils" },
  { name: "Walnuts", protein: 4.2, carbs: 3.9, fat: 18.2, calories: 183, servingSize: "1 oz (28g)", category: "Fats & Oils" },
  { name: "Cashews", protein: 5, carbs: 8.4, fat: 12.3, calories: 155, servingSize: "1 oz (28g)", category: "Fats & Oils" },
  { name: "Avocado Oil", protein: 0, carbs: 0, fat: 14, calories: 124, servingSize: "1 tbsp (15ml)", category: "Fats & Oils" },
  { name: "Sesame Oil", protein: 0, carbs: 0, fat: 14, calories: 120, servingSize: "1 tbsp (15ml)", category: "Fats & Oils" },
  { name: "Macadamia Nuts", protein: 2.2, carbs: 3.9, fat: 21.5, calories: 204, servingSize: "1 oz (28g)", category: "Fats & Oils" },
  { name: "Pecans", protein: 2.6, carbs: 3.9, fat: 20.4, calories: 196, servingSize: "1 oz (28g)", category: "Fats & Oils" },
  { name: "Pistachios", protein: 5.7, carbs: 7.8, fat: 12.9, calories: 159, servingSize: "1 oz (28g)", category: "Fats & Oils" },
  { name: "Hazelnuts", protein: 4.2, carbs: 4.7, fat: 17.2, calories: 178, servingSize: "1 oz (28g)", category: "Fats & Oils" },
  { name: "Brazil Nuts", protein: 4, carbs: 3.4, fat: 19, calories: 186, servingSize: "1 oz (28g)", category: "Fats & Oils" },
  { name: "Pine Nuts", protein: 3.9, carbs: 3.7, fat: 19.4, calories: 191, servingSize: "1 oz (28g)", category: "Fats & Oils" },
  { name: "Sunflower Seeds", protein: 5.8, carbs: 5.6, fat: 14.5, calories: 165, servingSize: "1 oz (28g)", category: "Fats & Oils" },
  { name: "Pumpkin Seeds", protein: 8.5, carbs: 3, fat: 13.9, calories: 158, servingSize: "1 oz (28g)", category: "Fats & Oils" },
  { name: "Chia Seeds", protein: 4.7, carbs: 12, fat: 8.7, calories: 138, servingSize: "1 oz (28g)", category: "Fats & Oils" },
  { name: "Flax Seeds", protein: 5.1, carbs: 8.1, fat: 11.8, calories: 150, servingSize: "1 oz (28g)", category: "Fats & Oils" },
  { name: "Hemp Seeds", protein: 8.8, carbs: 2.4, fat: 13.7, calories: 155, servingSize: "1 oz (28g)", category: "Fats & Oils" },
  { name: "Tahini", protein: 5.1, carbs: 6.4, fat: 16, calories: 178, servingSize: "2 tbsp (30g)", category: "Fats & Oils" },
  { name: "Ghee", protein: 0, carbs: 0, fat: 13, calories: 112, servingSize: "1 tbsp (14g)", category: "Fats & Oils" },

  // Legumes
  { name: "Black Beans (cooked)", protein: 8.9, carbs: 24, fat: 0.5, calories: 132, servingSize: "100g", category: "Protein" },
  { name: "Chickpeas (cooked)", protein: 8.9, carbs: 27, fat: 2.6, calories: 164, servingSize: "100g", category: "Protein" },
  { name: "Lentils (cooked)", protein: 9, carbs: 20, fat: 0.4, calories: 116, servingSize: "100g", category: "Protein" },
  { name: "Kidney Beans (cooked)", protein: 8.7, carbs: 22, fat: 0.5, calories: 127, servingSize: "100g", category: "Protein" },
  { name: "White Beans (cooked)", protein: 9.7, carbs: 25, fat: 0.4, calories: 139, servingSize: "100g", category: "Protein" },
  { name: "Pinto Beans (cooked)", protein: 9, carbs: 26, fat: 0.7, calories: 143, servingSize: "100g", category: "Protein" },
  { name: "Navy Beans (cooked)", protein: 8.2, carbs: 26, fat: 0.6, calories: 140, servingSize: "100g", category: "Protein" },
  { name: "Lima Beans (cooked)", protein: 7.8, carbs: 21, fat: 0.4, calories: 115, servingSize: "100g", category: "Protein" },
  { name: "Split Peas (cooked)", protein: 8.3, carbs: 21, fat: 0.4, calories: 118, servingSize: "100g", category: "Protein" },

  // Beverages
  { name: "Orange Juice", protein: 0.7, carbs: 10, fat: 0.2, calories: 45, servingSize: "100ml", category: "Beverages" },
  { name: "Apple Juice", protein: 0.1, carbs: 11, fat: 0.1, calories: 46, servingSize: "100ml", category: "Beverages" },
  { name: "Almond Milk (unsweetened)", protein: 0.4, carbs: 0.3, fat: 1.1, calories: 13, servingSize: "100ml", category: "Beverages" },
  { name: "Oat Milk", protein: 1, carbs: 7, fat: 1.5, calories: 47, servingSize: "100ml", category: "Beverages" },
  { name: "Protein Shake (whey)", protein: 24, carbs: 3, fat: 1, calories: 120, servingSize: "1 scoop (30g)", category: "Beverages" },
  { name: "Coconut Water", protein: 0.7, carbs: 9, fat: 0.2, calories: 46, servingSize: "240ml", category: "Beverages" },
  { name: "Soy Milk", protein: 7, carbs: 4, fat: 4, calories: 80, servingSize: "240ml", category: "Beverages" },
  { name: "Coconut Milk (canned)", protein: 2.3, carbs: 3.3, fat: 24, calories: 230, servingSize: "100ml", category: "Beverages" },
  { name: "Coconut Milk (carton)", protein: 0.5, carbs: 1, fat: 4.5, calories: 45, servingSize: "240ml", category: "Beverages" },
  { name: "Coffee (black)", protein: 0.3, carbs: 0, fat: 0, calories: 2, servingSize: "240ml", category: "Beverages" },
  { name: "Tea (unsweetened)", protein: 0, carbs: 0, fat: 0, calories: 2, servingSize: "240ml", category: "Beverages" },
  { name: "Cranberry Juice", protein: 0, carbs: 31, fat: 0.1, calories: 116, servingSize: "240ml", category: "Beverages" },
  { name: "Grape Juice", protein: 0.6, carbs: 36, fat: 0.2, calories: 152, servingSize: "240ml", category: "Beverages" },
  { name: "Tomato Juice", protein: 1.9, carbs: 10, fat: 0.1, calories: 41, servingSize: "240ml", category: "Beverages" },
  { name: "Smoothie (fruit)", protein: 2, carbs: 30, fat: 0.5, calories: 130, servingSize: "240ml", category: "Beverages" },
  { name: "Hot Chocolate", protein: 3, carbs: 26, fat: 3, calories: 140, servingSize: "240ml", category: "Beverages" },
  { name: "Protein Shake (casein)", protein: 24, carbs: 3, fat: 1, calories: 110, servingSize: "1 scoop (30g)", category: "Beverages" },
  { name: "Protein Shake (plant)", protein: 20, carbs: 4, fat: 2, calories: 110, servingSize: "1 scoop (30g)", category: "Beverages" },

  // Snacks
  { name: "Protein Bar", protein: 20, carbs: 25, fat: 8, calories: 250, servingSize: "1 bar", category: "Snacks" },
  { name: "Rice Cakes", protein: 2, carbs: 23, fat: 0.4, calories: 104, servingSize: "2 cakes", category: "Snacks" },
  { name: "Hummus", protein: 2.4, carbs: 4.2, fat: 3, calories: 50, servingSize: "2 tbsp (30g)", category: "Snacks" },
  { name: "Dark Chocolate (70%)", protein: 2.2, carbs: 12.9, fat: 12, calories: 167, servingSize: "1 oz (28g)", category: "Snacks" },
  { name: "Popcorn (air-popped)", protein: 3, carbs: 19, fat: 1.1, calories: 93, servingSize: "3 cups", category: "Snacks" },
  { name: "Pretzels", protein: 2.6, carbs: 23, fat: 0.9, calories: 108, servingSize: "1 oz (28g)", category: "Snacks" },
  { name: "Tortilla Chips", protein: 2, carbs: 18, fat: 7, calories: 140, servingSize: "1 oz (28g)", category: "Snacks" },
  { name: "Potato Chips", protein: 2, carbs: 15, fat: 10, calories: 152, servingSize: "1 oz (28g)", category: "Snacks" },
  { name: "Trail Mix", protein: 4, carbs: 13, fat: 14, calories: 173, servingSize: "1 oz (28g)", category: "Snacks" },
  { name: "Beef Jerky", protein: 9, carbs: 3, fat: 1, calories: 82, servingSize: "1 oz (28g)", category: "Snacks" },
  { name: "Cheese Crackers", protein: 3, carbs: 17, fat: 7, calories: 142, servingSize: "1 oz (28g)", category: "Snacks" },
  { name: "Graham Crackers", protein: 2, carbs: 22, fat: 3, calories: 118, servingSize: "2 sheets", category: "Snacks" },
  { name: "Milk Chocolate", protein: 2.2, carbs: 16, fat: 8.5, calories: 150, servingSize: "1 oz (28g)", category: "Snacks" },
  { name: "Energy Bar", protein: 10, carbs: 40, fat: 6, calories: 250, servingSize: "1 bar", category: "Snacks" },
  { name: "Fruit Snacks", protein: 0, carbs: 22, fat: 0, calories: 80, servingSize: "1 pouch", category: "Snacks" },
  { name: "Mixed Nuts", protein: 5, carbs: 6, fat: 16, calories: 172, servingSize: "1 oz (28g)", category: "Snacks" },
  { name: "Dried Mango", protein: 1, carbs: 28, fat: 0, calories: 110, servingSize: "1 oz (28g)", category: "Snacks" },
  { name: "Seaweed Snacks", protein: 1, carbs: 1, fat: 2.5, calories: 30, servingSize: "1 pack", category: "Snacks" },

  // Condiments & Sauces
  { name: "Mayonnaise", protein: 0.1, carbs: 0.1, fat: 10, calories: 94, servingSize: "1 tbsp", category: "Condiments" },
  { name: "Ketchup", protein: 0.1, carbs: 4, fat: 0, calories: 17, servingSize: "1 tbsp", category: "Condiments" },
  { name: "Mustard", protein: 0.2, carbs: 0.3, fat: 0.2, calories: 3, servingSize: "1 tsp", category: "Condiments" },
  { name: "Hot Sauce", protein: 0, carbs: 0, fat: 0, calories: 1, servingSize: "1 tsp", category: "Condiments" },
  { name: "Soy Sauce", protein: 1, carbs: 1, fat: 0, calories: 9, servingSize: "1 tbsp", category: "Condiments" },
  { name: "BBQ Sauce", protein: 0, carbs: 6, fat: 0, calories: 29, servingSize: "1 tbsp", category: "Condiments" },
  { name: "Salsa", protein: 0.2, carbs: 1, fat: 0, calories: 5, servingSize: "2 tbsp", category: "Condiments" },
  { name: "Guacamole", protein: 0.6, carbs: 2, fat: 4.5, calories: 50, servingSize: "2 tbsp", category: "Condiments" },
  { name: "Ranch Dressing", protein: 0.1, carbs: 0.7, fat: 7.7, calories: 73, servingSize: "1 tbsp", category: "Condiments" },
  { name: "Italian Dressing", protein: 0, carbs: 1.5, fat: 4.3, calories: 43, servingSize: "1 tbsp", category: "Condiments" },
  { name: "Balsamic Vinaigrette", protein: 0, carbs: 2.7, fat: 2.9, calories: 40, servingSize: "1 tbsp", category: "Condiments" },
  { name: "Honey", protein: 0, carbs: 17, fat: 0, calories: 64, servingSize: "1 tbsp", category: "Condiments" },
  { name: "Maple Syrup", protein: 0, carbs: 13, fat: 0, calories: 52, servingSize: "1 tbsp", category: "Condiments" },
  { name: "Jam/Jelly", protein: 0, carbs: 13, fat: 0, calories: 50, servingSize: "1 tbsp", category: "Condiments" },
  { name: "Pesto", protein: 1.3, carbs: 0.5, fat: 8, calories: 80, servingSize: "1 tbsp", category: "Condiments" },
  { name: "Teriyaki Sauce", protein: 1, carbs: 3, fat: 0, calories: 16, servingSize: "1 tbsp", category: "Condiments" },
  { name: "Fish Sauce", protein: 1, carbs: 0.6, fat: 0, calories: 6, servingSize: "1 tbsp", category: "Condiments" },
  { name: "Worcestershire Sauce", protein: 0, carbs: 1, fat: 0, calories: 4, servingSize: "1 tsp", category: "Condiments" },
  { name: "Apple Cider Vinegar", protein: 0, carbs: 0.1, fat: 0, calories: 3, servingSize: "1 tbsp", category: "Condiments" },
  { name: "Coconut Aminos", protein: 0, carbs: 1, fat: 0, calories: 5, servingSize: "1 tbsp", category: "Condiments" },
];

async function seedDatabase() {
  // Load service account key
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(
      readFileSync("./serviceAccountKey.json", "utf8")
    );
  } catch (error) {
    console.error("Error: Could not find serviceAccountKey.json");
    console.log("\nTo get this file:");
    console.log("1. Go to Firebase Console > Project Settings > Service Accounts");
    console.log("2. Click 'Generate new private key'");
    console.log("3. Save the file as 'serviceAccountKey.json' in the scripts folder");
    console.log("4. Add serviceAccountKey.json to .gitignore (NEVER commit this file!)");
    process.exit(1);
  }

  // Initialize Firebase Admin
  initializeApp({
    credential: cert(serviceAccount),
  });

  const db = getFirestore();
  const foodsCollection = db.collection("foods");

  // Check if already seeded
  const existingFoods = await foodsCollection.limit(1).get();
  if (!existingFoods.empty) {
    console.log("Database already has foods. Skipping seed.");
    console.log("To re-seed, first delete all documents in the 'foods' collection.");
    process.exit(0);
  }

  console.log(`Seeding ${commonFoodsData.length} foods...`);

  // Use batched writes for efficiency
  const batchSize = 500;
  let batch = db.batch();
  let count = 0;

  for (const food of commonFoodsData) {
    const docRef = foodsCollection.doc();
    batch.set(docRef, {
      name: food.name,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      calories: food.calories,
      servingSize: food.servingSize,
      category: food.category,
      createdAt: Timestamp.now(),
    });

    count++;

    if (count % batchSize === 0) {
      await batch.commit();
      console.log(`Committed ${count} foods...`);
      batch = db.batch();
    }
  }

  // Commit remaining
  if (count % batchSize !== 0) {
    await batch.commit();
  }

  console.log(`\nSuccessfully seeded ${commonFoodsData.length} foods!`);
}

seedDatabase().catch(console.error);
