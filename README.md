# FOXWEB

Portfolio, learning notes, contact forms, and doubt submission app.

## Folders

- `Frontend`: React/Vite public website and admin UI foundation.
- `Backend`: Express API for messages, feedback, doubts, and PDF/image storage.

## Local run

1. In `Backend`, copy `.env.example` to `.env` and fill the Supabase values.
2. Run `npm install` and `npm start` in `Backend`.
3. In `Frontend`, run `npm install`, then set `VITE_API_URL=http://localhost:5000/api` in `.env` and run `npm run dev`.
4. Run `Backend/schema.sql` in the Supabase SQL editor first.

Never put `SUPABASE_SERVICE_ROLE_KEY` in the frontend or commit `.env`.
