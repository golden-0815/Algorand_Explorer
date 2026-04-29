# Troubleshooting Supabase Cache 400 Errors

If you're seeing 400 errors in your Supabase API Gateway logs, follow this troubleshooting guide to identify and fix the issue.

## 🔍 Quick Diagnosis

### 1. Check the Debug Page

Navigate to `/debug` and use the new debug tools:

1. **Debug Connection** - Tests basic connectivity and insert operations
2. **Check Table** - Verifies table structure and field names
3. **Test RLS** - Checks Row Level Security policies

### 2. Common Causes of 400 Errors

#### A. RLS (Row Level Security) Policies

The most common cause is restrictive RLS policies. Check your Supabase dashboard:

```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'asset_cache';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'asset_cache';
```

**Solution**: Create permissive RLS policies for the `asset_cache` table:

```sql
-- Enable RLS
ALTER TABLE asset_cache ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (for testing)
CREATE POLICY "Allow all operations" ON asset_cache
  FOR ALL USING (true) WITH CHECK (true);

-- Or more restrictive policies:
CREATE POLICY "Allow read access" ON asset_cache
  FOR SELECT USING (true);

CREATE POLICY "Allow insert access" ON asset_cache
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access" ON asset_cache
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete access" ON asset_cache
  FOR DELETE USING (true);
```

#### B. Table Structure Mismatch

Verify your table structure matches the expected schema:

```sql
-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'asset_cache'
ORDER BY ordinal_position;
```

**Expected Structure**:
```sql
CREATE TABLE asset_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id BIGINT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  ticker TEXT NOT NULL,
  decimals INTEGER NOT NULL DEFAULT 0,
  tinyman_image_url TEXT,
  vestige_image_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### C. Missing Indexes

Ensure you have the necessary indexes:

```sql
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_asset_cache_asset_id ON asset_cache(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_cache_ticker ON asset_cache(ticker);
CREATE INDEX IF NOT EXISTS idx_asset_cache_name ON asset_cache(name);
CREATE INDEX IF NOT EXISTS idx_asset_cache_verified ON asset_cache(is_verified);
```

#### D. Environment Variables

Check your `.env` file:

```bash
# Verify these are set correctly
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: Make sure you're using the **anon key**, not the service role key.

## 🛠️ Step-by-Step Fix

### Step 1: Verify Environment Variables

```bash
# Check if variables are loaded
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

### Step 2: Test Basic Connection

Use the debug page to run "Debug Connection" and check the console output.

### Step 3: Check Table Structure

Run "Check Table" in the debug page to verify the table structure.

### Step 4: Fix RLS Policies

If RLS is the issue, run these SQL commands in your Supabase SQL editor:

```sql
-- Temporarily disable RLS for testing
ALTER TABLE asset_cache DISABLE ROW LEVEL SECURITY;

-- Test if this fixes the issue
-- If it does, then RLS policies are the problem
```

### Step 5: Re-enable RLS with Proper Policies

```sql
-- Re-enable RLS
ALTER TABLE asset_cache ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for testing
DROP POLICY IF EXISTS "Allow all operations" ON asset_cache;
CREATE POLICY "Allow all operations" ON asset_cache
  FOR ALL USING (true) WITH CHECK (true);
```

## 🔧 Advanced Debugging

### Check Supabase Logs

1. Go to your Supabase Dashboard
2. Navigate to Logs > API
3. Look for the specific 400 errors
4. Check the error details for more information

### Test with curl

```bash
# Test basic connection
curl -X GET "https://your-project.supabase.co/rest/v1/asset_cache?select=*" \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key"

# Test insert operation
curl -X POST "https://your-project.supabase.co/rest/v1/asset_cache" \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "asset_id": 999999,
    "name": "Test Asset",
    "ticker": "TEST",
    "decimals": 6,
    "is_verified": false
  }'
```

### Check Browser Network Tab

1. Open browser DevTools
2. Go to Network tab
3. Try the debug operations
4. Look for failed requests and their details

## 🚨 Common Error Messages

### "new row violates row-level security policy"
- **Cause**: RLS policies are blocking the operation
- **Fix**: Create permissive RLS policies or disable RLS temporarily

### "column does not exist"
- **Cause**: Table structure doesn't match expected schema
- **Fix**: Check and update table structure

### "duplicate key value violates unique constraint"
- **Cause**: Trying to insert asset_id that already exists
- **Fix**: Use `upsertAsset()` instead of `storeAsset()`

### "invalid input syntax for type bigint"
- **Cause**: asset_id is not a valid number
- **Fix**: Ensure asset_id is a valid integer

## ✅ Verification Steps

After fixing the issue:

1. **Test Connection** - Should show "✅ Connection successful"
2. **Run Tests** - Should complete all test operations
3. **Get Stats** - Should return cache statistics
4. **Search a wallet** - Should automatically cache assets

## 📞 Getting Help

If you're still having issues:

1. Check the browser console for detailed error messages
2. Use the debug tools in the `/debug` page
3. Check Supabase logs for server-side errors
4. Verify your Supabase project settings and permissions

## 🔄 Reset Cache

If all else fails, you can reset the cache:

```sql
-- Clear all data
DELETE FROM asset_cache;

-- Reset sequences if any
-- ALTER SEQUENCE asset_cache_id_seq RESTART WITH 1;
```

Then test with the debug tools again. 