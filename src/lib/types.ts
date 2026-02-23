export interface IdentifiedFoodItem {
  name: string
  estimatedWeightG: number
  category?: string
}

export interface FoodItem {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  quantity: string
  category?: string
  autoCorrected?: boolean
  estimatedWeightG?: number
}

export interface FoodAnalysis {
  food_items: FoodItem[]
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  needsInput?: boolean
  warnings?: string[]
  corrections?: string[]
  correctionCount?: number
}

export interface FoodEntry {
  id: string
  image_url: string | null
  meal_type: string
  food_items: FoodItem[]
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  logged_at: string
  notes?: string | null
}

export interface DailySummary {
  date: string
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  entry_count: number
}