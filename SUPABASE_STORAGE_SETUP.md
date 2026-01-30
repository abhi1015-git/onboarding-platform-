# Supabase Storage Setup Guide

## Required Storage Bucket Configuration

To enable policy document uploads, you need to create a storage bucket in Supabase.

### Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **"New bucket"**
5. Configure the bucket:
   - **Name**: `documents`
   - **Public bucket**: ✅ **Enable** (so candidates can view PDFs)
   - Click **"Create bucket"**

### Step 2: Set Storage Policies

After creating the bucket, you need to set up policies:

1. Click on the `documents` bucket
2. Go to **"Policies"** tab
3. Click **"New Policy"**

#### Policy 1: Allow Public Read Access
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'documents' );
```

#### Policy 2: Allow Authenticated Upload
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'documents' );
```

#### Policy 3: Allow Authenticated Delete
```sql
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'documents' );
```

### Alternative: Use Supabase SQL Editor

You can also run this SQL directly in the SQL Editor:

```sql
-- Enable storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'documents' );

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'documents' );

CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'documents' );
```

### Step 3: Verify Setup

1. Try uploading a policy document from the HR portal
2. Check the browser console for any error messages
3. Verify the file appears in Storage > documents bucket

### Folder Structure

The application will create this structure automatically:
```
documents/
├── policies/
│   ├── code_of_conduct_1234567890.pdf
│   ├── isp_1234567891.pdf
│   └── ...
└── (other document types in future)
```

### Troubleshooting

**Error: "Bucket not found"**
- Ensure the bucket name is exactly `documents`
- Check that the bucket was created successfully

**Error: "Permission denied"**
- Verify the storage policies are set up correctly
- Ensure the bucket is set to public

**Error: "File upload failed"**
- Check file size (Supabase free tier has limits)
- Ensure file is a valid PDF
- Check browser console for detailed error messages

### Security Notes

- The bucket is public so candidates can view PDFs
- Only authenticated users can upload/delete
- Consider adding file size limits in production
- Consider adding virus scanning for uploaded files
