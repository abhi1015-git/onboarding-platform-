# ADMIN PORTAL TROUBLESHOOTING GUIDE

## 🔍 Common Admin Portal Issues & Fixes

### Issue 1: Dashboard Not Loading / Blank Page
**Cause:** Missing `operational_units` table or missing data
**Fix:** Run `FIX_ADMIN_PORTAL.sql`

### Issue 2: "No Departments Found"
**Cause:** `operational_units` table is empty
**Fix:** Run `FIX_ADMIN_PORTAL.sql` - it will seed departments

### Issue 3: User Management Not Working
**Cause:** Missing columns in `profiles` table
**Fix:** Run `FIX_CANDIDATES_TABLE.sql` and `FIX_ADMIN_PORTAL.sql`

### Issue 4: Team Management Shows No Data
**Cause:** No operational units in database
**Fix:** Run `FIX_ADMIN_PORTAL.sql`

### Issue 5: Analytics Page Errors
**Cause:** Missing `audit_logs` table
**Fix:** Run `RUN_THIS_ONE.sql` (creates audit_logs table)

### Issue 6: Payroll Page Not Loading
**Cause:** Missing salary-related fields in candidates
**Fix:** Run `FIX_CANDIDATES_TABLE.sql` (adds ctc column)

---

## ✅ COMPLETE FIX - Run These Scripts in Order:

### Step 1: Fix Database Structure
```sql
-- Run: FIX_CANDIDATES_TABLE.sql
-- Adds all missing columns to candidates table
```

### Step 2: Fix Admin Portal Specific Issues
```sql
-- Run: FIX_ADMIN_PORTAL.sql
-- Creates departments, users, and fixes data
```

### Step 3: Verify Everything Works
```sql
-- The script will show you:
-- ✅ All tables exist
-- ✅ Departments are created
-- ✅ Users exist
-- ✅ Candidates have proper status
```

---

## 📋 What Each Admin Page Needs:

| Page | Required Tables | Required Columns |
|------|----------------|------------------|
| Dashboard | candidates, it_requests, operational_units | progress, status, hr_status, it_status |
| Team Management | operational_units, candidates | department, position |
| User Management | profiles | email, full_name, role, status |
| Analytics | candidates, audit_logs | progress, status, created_at |
| Payroll | candidates | full_name, position, ctc, department |
| Settings | profiles | All profile fields |

---

## 🚀 Quick Test After Running Scripts:

1. **Refresh your browser** (F5)
2. **Go to Admin Portal**
3. **Check each page:**
   - ✅ Dashboard shows stats
   - ✅ Teams Overview shows departments
   - ✅ User Management shows users
   - ✅ Payroll shows salary data
   - ✅ Analytics shows charts

---

## 🔧 If Still Not Working:

1. **Open Browser Console** (F12)
2. **Look for errors** (red text)
3. **Common errors:**
   - "table does not exist" → Run `RUN_THIS_ONE.sql`
   - "column does not exist" → Run `FIX_CANDIDATES_TABLE.sql`
   - "relationship not found" → Run `FIX_ADMIN_PORTAL.sql`

4. **Share the error message** and I'll help fix it!

---

## 📝 Summary:

**Just run these 2 scripts and Admin Portal will work:**

1. `FIX_CANDIDATES_TABLE.sql` ← Run this first
2. `FIX_ADMIN_PORTAL.sql` ← Run this second

Then refresh your browser! 🎉
