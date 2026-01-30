# Backend Setup Guide

To use this project on a different Supabase account, follow these steps:

### 1. Create a Supabase Project
- Go to [Supabase](https://supabase.com/) and create a new project.
- Take note of your **API URL** and **Anon Key** (found in Project Settings > API).

### 2. Set Up the Database
- Open the **SQL Editor** in your Supabase dashboard.
- Create a new query and paste the contents of `database_setup.sql`.
- Run the script. This will create all tables, policies, and sample data.

### 3. Set Up Storage
- Go to the **Storage** section in Supabase.
- Create a new bucket named `documents`.
- Set the bucket to **Public** (or add a policy allowing public access/authenticated uploads if you prefer).

### 4. Configure the Environment
- Rename `.env.example` to `.env`.
- Replace the placeholder values with your own Supabase project details:
  ```
  VITE_SUPABASE_URL=your_project_url_here
  VITE_SUPABASE_ANON_KEY=your_anon_key_here
  ```

### 5. Run the Project
- Run `npm install` to install dependencies.
- Run `npm run dev` to start the frontend.

The project will now be fully connected to your own Supabase backend!
