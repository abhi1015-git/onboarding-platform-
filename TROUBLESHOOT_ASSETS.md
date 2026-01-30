# 🔍 Asset Inventory - Troubleshooting Guide

## Problem: Assets Not Visible in Asset Management Page

### Possible Causes & Solutions

---

## 1️⃣ **Empty Database**
**Symptom**: Page loads but shows "No assets found in the inventory."

**Solution**: Add sample data
```sql
-- Run ADD_SAMPLE_ASSETS.sql in Supabase SQL Editor
-- This will create 6 test assets
```

---

## 2️⃣ **Database Query Error**
**Symptom**: Console shows errors, page shows empty state

**Diagnosis**: 
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages starting with "Error fetching assets:"

**Common Errors**:

### Error: "relation 'public.assets' does not exist"
**Fix**: Run the database reset script
```sql
-- Run HARD_RESET_DB.sql in Supabase SQL Editor
```

### Error: "permission denied for table assets"
**Fix**: Check RLS policies
```sql
-- Run DEBUG_ASSETS.sql section 5 & 6
-- Ensure RLS policy allows SELECT for all users
```

### Error: "column 'candidates.full_name' does not exist"
**Fix**: The join might be failing. Check if candidates table has full_name column
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'candidates' AND column_name = 'full_name';
```

---

## 3️⃣ **Row Level Security (RLS) Issue**
**Symptom**: Query returns no data even though data exists

**Diagnosis**:
```sql
-- Run this in Supabase SQL Editor
SELECT * FROM public.assets; -- If this returns data, RLS is the issue
```

**Fix**: Ensure RLS policy allows access
```sql
-- Check current policy
SELECT * FROM pg_policies WHERE tablename = 'assets';

-- If needed, recreate the policy
DROP POLICY IF EXISTS "Allow all access assets" ON public.assets;
CREATE POLICY "Allow all access assets" ON public.assets 
FOR ALL USING (true) WITH CHECK (true);
```

---

## 4️⃣ **Frontend Not Fetching Data**
**Symptom**: No console errors, but assets don't appear

**Diagnosis**:
1. Open DevTools → Console
2. Look for: "Assets fetched successfully: X assets"
3. If you see "No assets found in database" but data exists, there's a frontend issue

**Fix**: Check the fetchAssets function is being called
- Verify `useEffect` is running on component mount
- Check if `isLoading` state is stuck on `true`

---

## 5️⃣ **Supabase Client Configuration**
**Symptom**: All queries fail silently

**Check**: Verify Supabase client is configured correctly
```javascript
// In src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey)
```

---

## 🛠️ Step-by-Step Debugging Process

### Step 1: Check Browser Console
1. Press F12 to open DevTools
2. Go to Console tab
3. Refresh the Asset Management page
4. Look for any error messages

### Step 2: Run Diagnostic SQL
1. Go to Supabase Dashboard → SQL Editor
2. Run `DEBUG_ASSETS.sql`
3. Check results:
   - Does assets table exist? ✅
   - Are there any assets? ✅
   - Is RLS enabled? ✅

### Step 3: Test Database Directly
1. In Supabase SQL Editor, run:
```sql
SELECT a.*, c.full_name
FROM public.assets a
LEFT JOIN public.candidates c ON a.assigned_to = c.id
ORDER BY a.created_at DESC;
```
2. If this returns data, the issue is in the frontend
3. If this returns no data, the issue is in the database

### Step 4: Add Sample Data
1. Run `ADD_SAMPLE_ASSETS.sql`
2. Refresh the Asset Management page
3. Check if assets now appear

### Step 5: Check Network Tab
1. DevTools → Network tab
2. Refresh page
3. Look for requests to Supabase
4. Check if they return 200 OK
5. Inspect response data

---

## 📋 Quick Checklist

- [ ] Assets table exists in database
- [ ] Sample data has been inserted
- [ ] RLS policies allow SELECT access
- [ ] Supabase client is configured correctly
- [ ] No console errors in browser
- [ ] Network requests are successful
- [ ] Component is mounted and useEffect runs

---

## 🚀 Quick Fix (Most Common Issue)

**If the assets table is empty**, simply run:

```sql
-- In Supabase SQL Editor
INSERT INTO public.assets (asset_tag, category, name, type, serial_number, status) VALUES
('LOKA-001', 'Laptop', 'MacBook Pro M3', 'Laptop', 'SN123456789', 'Available');
```

Then refresh the page. You should see the asset appear!

---

## 📞 Still Not Working?

If none of the above solutions work, check:

1. **Browser Console** - Copy the full error message
2. **Network Tab** - Check the response from Supabase API
3. **Supabase Logs** - Check for any server-side errors

The improved error handling in `AssetInventory.jsx` will now log detailed error information to help diagnose the issue.
