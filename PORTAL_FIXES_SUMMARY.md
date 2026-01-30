# Portal Fixes Summary

## Issues Identified:

### 1. IT Portal - Device Assignment
**Problem**: No dropdown for device brands (Dell, Mac, HP)
**Location**: `src/pages/it/RequestDetail.jsx` - Step 2 (Asset Management)
**Fix Required**: Add device brand dropdown in asset allocation

### 2. IT Portal - Workflow Enforcement
**Problem**: Can finalize without creating credentials first
**Current Flow**: Credentials → Assets → Finalize (but not enforced)
**Fix Required**: 
- Disable "Next" button in Step 1 until credentials are created
- Auto-navigate from Step 1 to Step 2 after credential creation
- Disable "Finalize" in Step 2 until at least one asset is allocated

### 3. HR Portal - Policy Updates
**Problem**: Slow policy update reflection
**Location**: `src/pages/hr/CandidateProfile.jsx`
**Fix Required**: Add real-time subscription or force refresh after policy updates

### 4. Admin Portal - Data Sync
**Problem**: IT/HR data not reflecting in Admin portal
**Fix Required**: Ensure proper database triggers and real-time subscriptions

## Files to Modify:

1. **src/pages/it/RequestDetail.jsx**
   - Add device brand dropdown
   - Enforce workflow order
   - Add validation before navigation

2. **src/pages/hr/CandidateProfile.jsx**
   - Add real-time policy updates
   - Optimize data fetching

3. **src/pages/admin/AdminDashboard.jsx**
   - Add real-time subscriptions for IT/HR data

## Implementation Priority:
1. ✅ IT Portal workflow enforcement (CRITICAL)
2. ✅ Device brand dropdown (HIGH)
3. ⚠️ Policy update optimization (MEDIUM)
4. ⚠️ Admin data sync (MEDIUM)

---

## Next Steps:
I will now implement these fixes one by one. Please confirm if you want me to proceed with all fixes or focus on specific ones first.
