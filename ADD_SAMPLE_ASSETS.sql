-- Add sample assets for testing
-- Run this in Supabase SQL Editor to populate test data

INSERT INTO public.assets (asset_tag, category, name, type, serial_number, status, assigned_to) VALUES
('LOKA-001', 'Laptop', 'MacBook Pro M3 - 16GB', 'Laptop', 'SN123456789', 'Available', NULL),
('LOKA-002', 'Laptop', 'Dell XPS 15', 'Laptop', 'SN987654321', 'Available', NULL),
('LOKA-003', 'Monitor', 'LG UltraWide 34"', 'Monitor', 'SN456789123', 'Available', NULL),
('LOKA-004', 'Mouse', 'Logitech MX Master 3', 'Mouse', 'SN789123456', 'Available', NULL),
('LOKA-005', 'Laptop', 'ThinkPad X1 Carbon', 'Laptop', 'SN321654987', 'Available', NULL),
('LOKA-006', 'Monitor', 'Dell UltraSharp 27"', 'Monitor', 'SN654987321', 'Maintenance', NULL)
ON CONFLICT (asset_tag) DO NOTHING;

SELECT '✅ Sample assets added successfully' as status;

-- Verify insertion
SELECT COUNT(*) as total_assets FROM public.assets;
SELECT * FROM public.assets ORDER BY asset_tag;
