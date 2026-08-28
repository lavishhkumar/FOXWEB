import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY) : null;
app.use(cors({ origin: process.env.FRONTEND_URL?.split(',') || true }));
app.use(express.json());

const save = async (table, payload) => {
  if (!supabase) throw new Error('Supabase environment variables are missing');
  const { error } = await supabase.from(table).insert(payload);
  if (error) throw error;
};
const handler = (fn) => async (req, res) => { try { await fn(req, res); } catch (error) { console.error(error); res.status(500).json({ error: 'Could not save your submission' }); } };

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.post('/api/messages', handler(async (req, res) => { await save('messages', { name: req.body.firstName, email: req.body.email, message: req.body.description }); res.status(201).json({ ok: true }); }));
app.post('/api/feedback', handler(async (req, res) => { await save('feedback', { name: req.body.firstName, message: req.body.description }); res.status(201).json({ ok: true }); }));
app.post('/api/doubts', upload.single('attachment'), handler(async (req, res) => {
  let attachmentUrl = null;
  if (req.file && supabase) { const path = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-')}`; const uploadResult = await supabase.storage.from('doubt-files').upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: false }); if (uploadResult.error) throw uploadResult.error; attachmentUrl = supabase.storage.from('doubt-files').getPublicUrl(path).data.publicUrl; }
  await save('doubts', { name: `${req.body.firstName || ''} ${req.body.lastName || ''}`.trim(), email: req.body.email, description: req.body.description, attachment_url: attachmentUrl }); res.status(201).json({ ok: true });
}));

app.get('/api/admin/:table', handler(async (req, res) => { if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' }); const allowed = ['messages', 'feedback', 'doubts']; if (!allowed.includes(req.params.table)) return res.status(400).json({ error: 'Invalid table' }); const { data, error } = await supabase.from(req.params.table).select('*').order('created_at', { ascending: false }); if (error) throw error; res.json(data); }));
app.listen(process.env.PORT || 5000, () => console.log(`FOXWEB API running on port ${process.env.PORT || 5000}`));