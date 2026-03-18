export const migrations = [
  {
    name: 'create_food_entries',
    sql: `
      CREATE TABLE IF NOT EXISTS food_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        image_url TEXT,
        meal_type TEXT NOT NULL DEFAULT 'snack',
        food_items JSONB NOT NULL DEFAULT '[]'::jsonb,
        total_calories INTEGER NOT NULL DEFAULT 0,
        total_protein NUMERIC(6,1) NOT NULL DEFAULT 0,
        total_carbs NUMERIC(6,1) NOT NULL DEFAULT 0,
        total_fat NUMERIC(6,1) NOT NULL DEFAULT 0,
        notes TEXT,
        logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `,
  },
  {
    name: 'create_saved_meals',
    sql: `
      CREATE TABLE IF NOT EXISTS saved_meals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        meal_type TEXT NOT NULL DEFAULT 'snack',
        food_items JSONB NOT NULL DEFAULT '[]'::jsonb,
        total_calories INTEGER NOT NULL DEFAULT 0,
        total_protein NUMERIC(6,1) NOT NULL DEFAULT 0,
        total_carbs NUMERIC(6,1) NOT NULL DEFAULT 0,
        total_fat NUMERIC(6,1) NOT NULL DEFAULT 0,
        use_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `,
  },
  {
    name: 'create_indexes',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_food_entries_user_logged
        ON food_entries (user_id, logged_at DESC);
      CREATE INDEX IF NOT EXISTS idx_saved_meals_user_usage
        ON saved_meals (user_id, use_count DESC);
    `,
  },
  {
    name: 'enable_rls',
    sql: `
      ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;
      ALTER TABLE saved_meals ENABLE ROW LEVEL SECURITY;
    `,
  },
  {
    name: 'rls_food_entries',
    sql: `
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'food_entries' AND policyname = 'Users can view own entries'
        ) THEN
          CREATE POLICY "Users can view own entries" ON food_entries FOR SELECT USING (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'food_entries' AND policyname = 'Users can insert own entries'
        ) THEN
          CREATE POLICY "Users can insert own entries" ON food_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'food_entries' AND policyname = 'Users can update own entries'
        ) THEN
          CREATE POLICY "Users can update own entries" ON food_entries FOR UPDATE USING (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'food_entries' AND policyname = 'Users can delete own entries'
        ) THEN
          CREATE POLICY "Users can delete own entries" ON food_entries FOR DELETE USING (auth.uid() = user_id);
        END IF;
      END $$;
    `,
  },
  {
    name: 'rls_saved_meals',
    sql: `
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'saved_meals' AND policyname = 'Users can view own meals'
        ) THEN
          CREATE POLICY "Users can view own meals" ON saved_meals FOR SELECT USING (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'saved_meals' AND policyname = 'Users can insert own meals'
        ) THEN
          CREATE POLICY "Users can insert own meals" ON saved_meals FOR INSERT WITH CHECK (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'saved_meals' AND policyname = 'Users can update own meals'
        ) THEN
          CREATE POLICY "Users can update own meals" ON saved_meals FOR UPDATE USING (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'saved_meals' AND policyname = 'Users can delete own meals'
        ) THEN
          CREATE POLICY "Users can delete own meals" ON saved_meals FOR DELETE USING (auth.uid() = user_id);
        END IF;
      END $$;
    `,
  },
  {
    name: 'create_storage_bucket',
    sql: `
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('food-photos', 'food-photos', false)
      ON CONFLICT (id) DO NOTHING;
    `,
  },
  {
    name: 'storage_policies',
    sql: `
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can upload own photos'
        ) THEN
          CREATE POLICY "Users can upload own photos" ON storage.objects
            FOR INSERT WITH CHECK (bucket_id = 'food-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can view own photos'
        ) THEN
          CREATE POLICY "Users can view own photos" ON storage.objects
            FOR SELECT USING (bucket_id = 'food-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can delete own photos'
        ) THEN
          CREATE POLICY "Users can delete own photos" ON storage.objects
            FOR DELETE USING (bucket_id = 'food-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
        END IF;
      END $$;
    `,
  },
]
