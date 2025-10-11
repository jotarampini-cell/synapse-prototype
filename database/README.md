# Database Setup for AI Analysis

## Problem
The AI analysis functionality is not working because the required database tables and columns don't exist.

## Solution
Run the SQL script to create the necessary database structure.

## Steps to Fix

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `setup_ai_analysis.sql`
4. Click **Run** to execute the script

### Option 2: Using Supabase CLI
```bash
supabase db reset
# Then run the migration
```

### Option 3: Manual Execution
1. Connect to your Supabase database
2. Execute the SQL commands from `setup_ai_analysis.sql`

## What the Script Does

1. **Adds columns to `contents` table:**
   - `ai_analysis_status` - tracks analysis status (pending, analyzing, completed, error)
   - `ai_analysis_updated_at` - timestamp of last analysis update

2. **Creates `ai_analyses` table:**
   - Stores AI analysis results (summary, tasks, concepts, connections)
   - Links to content and user
   - Includes RLS policies for security

3. **Sets up indexes and triggers:**
   - Performance optimization
   - Automatic timestamp updates

## After Running the Script

The AI analysis functionality should work properly:
- ✅ Background analysis will work
- ✅ AI Panel will show results
- ✅ Badges will display correct status
- ✅ No more "table not found" errors

## Verification

After running the script, you can verify it worked by:
1. Going to **Table Editor** in Supabase
2. Checking that `ai_analyses` table exists
3. Checking that `contents` table has the new columns
4. Testing the AI analysis functionality in the app


