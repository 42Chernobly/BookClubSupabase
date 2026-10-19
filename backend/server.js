require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const supabase = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const FIELDS = ['book_title', 'author', 'meeting_date', 'location', 'host_name', 'attendees', 'discussion_notes'];
const pick = (body) => Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));
const fail = (res, error) => res.status(500).json({ error: error.message });

// GET all
app.get('/api/meetings', async (req, res) => {
  const { data, error } = await supabase
    .from('meetings').select('*')
    .order('meeting_date', { ascending: false }).order('id', { ascending: false });
  if (error) return fail(res, error);
  res.json(data);
});

// GET one
app.get('/api/meetings/:id', async (req, res) => {
  const { data, error } = await supabase.from('meetings').select('*').eq('id', req.params.id).maybeSingle();
  if (error) return fail(res, error);
  if (!data) return res.status(404).json({ error: 'Meeting not found' });
  res.json(data);
});

// POST create
app.post('/api/meetings', async (req, res) => {
  const body = pick(req.body);
  if (!body.book_title || !String(body.book_title).trim()) {
    return res.status(400).json({ error: 'book_title is required' });
  }
  if (body.meeting_date === '') body.meeting_date = null;
  const { data, error } = await supabase.from('meetings').insert(body).select().single();
  if (error) return fail(res, error);
  res.status(201).json(data);
});

// PUT update
app.put('/api/meetings/:id', async (req, res) => {
  const body = pick(req.body);
  if (body.book_title !== undefined && !String(body.book_title).trim()) {
    return res.status(400).json({ error: 'book_title cannot be empty' });
  }
  if (Object.keys(body).length === 0) return res.status(400).json({ error: 'No valid fields supplied' });
  if (body.meeting_date === '') body.meeting_date = null;
  body.updated_at = new Date().toISOString();
  const { data, error } = await supabase.from('meetings').update(body).eq('id', req.params.id).select().maybeSingle();
  if (error) return fail(res, error);
  if (!data) return res.status(404).json({ error: 'Meeting not found' });
  res.json(data);
});

// DELETE
app.delete('/api/meetings/:id', async (req, res) => {
  const { data, error } = await supabase.from('meetings').delete().eq('id', req.params.id).select();
  if (error) return fail(res, error);
  if (!data || data.length === 0) return res.status(404).json({ error: 'Meeting not found' });
  res.json({ message: 'Meeting deleted', id: Number(req.params.id) });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Route not found' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
