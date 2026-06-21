import express from 'express';
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = path.join(__dirname, 'gygyt.db');

app.use(express.json());

let db: any;
async function initDb() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  db.run('PRAGMA journal_mode=WAL');
  db.run('PRAGMA foreign_keys=ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatarUrl TEXT,
      rank TEXT NOT NULL DEFAULT 'BRONZE',
      age INTEGER,
      school TEXT,
      joinedDate TEXT,
      achievements TEXT DEFAULT '[]',
      stats TEXT DEFAULT '{"eventsJoined":0}',
      isMuted INTEGER DEFAULT 0,
      isBanned INTEGER DEFAULT 0
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      authorId TEXT NOT NULL,
      authorName TEXT,
      authorAvatar TEXT,
      authorRank TEXT,
      mediaUrls TEXT DEFAULT '[]',
      mediaType TEXT DEFAULT 'image',
      caption TEXT DEFAULT '',
      likes TEXT DEFAULT '[]',
      comments TEXT DEFAULT '[]',
      hashtags TEXT DEFAULT '[]',
      createdAt TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      dateTime TEXT,
      locationName TEXT,
      difficulty TEXT DEFAULT 'Közepes',
      type TEXT DEFAULT 'Ride',
      creatorId TEXT,
      creatorName TEXT,
      rsvps TEXT DEFAULT '{}',
      photos TEXT DEFAULT '[]'
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      channelId TEXT NOT NULL,
      senderId TEXT NOT NULL,
      senderName TEXT,
      senderRank TEXT,
      senderAvatar TEXT,
      content TEXT DEFAULT '',
      imageUrl TEXT,
      videoUrl TEXT,
      timestamp TEXT,
      repliedTo TEXT,
      reactions TEXT DEFAULT '{}',
      readBy TEXT DEFAULT '[]',
      isEdited INTEGER DEFAULT 0
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS join_requests (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER,
      school TEXT,
      introduction TEXT DEFAULT '',
      submittedAt TEXT,
      status TEXT DEFAULT 'pending'
    )
  `);

  const existing = db.exec('SELECT id FROM users WHERE id = ?', ['user_gyurka']);
  if (existing.length === 0 || existing[0].values.length === 0) {
    db.run(`INSERT INTO users (id, name, avatarUrl, rank, age, school, joinedDate, achievements, stats, isMuted, isBanned)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`, [
      'user_gyurka',
      'Kovács Gyurka',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      'ADMIN', 19, 'BME - Villamosmérnöki Kar', '2025-03-12',
      JSON.stringify(['first_ride', 'event_master', 'chat_legend', 'veteran']),
      JSON.stringify({ eventsJoined: 18 })
    ]);
  }

  saveDb();
}

function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

interface Row { [col: string]: any }

function queryAll(sql: string, params: any[] = []): Row[] {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows: Row[] = [];
  while (stmt.step()) {
    const r = stmt.getAsObject();
    rows.push(r);
  }
  stmt.free();
  return rows;
}

function queryOne(sql: string, params: any[] = []): Row | null {
  const rows = queryAll(sql, params);
  return rows[0] || null;
}

function run(sql: string, params: any[] = []) {
  db.run(sql, params);
  saveDb();
}

function jsonParse(val: string | null, fallback: any = null) {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

function rowToUser(row: Row) {
  return { ...row, achievements: jsonParse(row.achievements, []), stats: jsonParse(row.stats, {}), isMuted: !!row.isMuted, isBanned: !!row.isBanned };
}

function rowToPost(row: Row) {
  return { ...row, mediaUrls: jsonParse(row.mediaUrls, []), likes: jsonParse(row.likes, []), comments: jsonParse(row.comments, []), hashtags: jsonParse(row.hashtags, []) };
}

function rowToEvent(row: Row) {
  return { ...row, rsvps: jsonParse(row.rsvps, {}), photos: jsonParse(row.photos, []) };
}

function rowToChat(row: Row) {
  return { ...row, repliedTo: jsonParse(row.repliedTo, null), reactions: jsonParse(row.reactions, {}), readBy: jsonParse(row.readBy, []), isEdited: !!row.isEdited };
}

// --- USERS ---
app.get('/api/users', (_, res) => {
  const rows = queryAll('SELECT * FROM users ORDER BY joinedDate ASC');
  res.json(rows.map(rowToUser));
});

app.get('/api/users/:id', (req, res) => {
  const row = queryOne('SELECT * FROM users WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'User not found' });
  res.json(rowToUser(row));
});

app.put('/api/users/:id', (req, res) => {
  const u = req.body;
  run(`UPDATE users SET name=?, avatarUrl=?, rank=?, age=?, school=?, joinedDate=?, achievements=?, stats=?, isMuted=?, isBanned=? WHERE id=?`, [
    u.name, u.avatarUrl, u.rank, u.age, u.school, u.joinedDate,
    JSON.stringify(u.achievements || []), JSON.stringify(u.stats || {}),
    u.isMuted ? 1 : 0, u.isBanned ? 1 : 0, req.params.id
  ]);
  const updated = queryOne('SELECT * FROM users WHERE id = ?', [req.params.id]);
  res.json(rowToUser(updated!));
});

app.post('/api/users', (req, res) => {
  const u = req.body;
  const id = u.id || `user_${Date.now()}`;
  run(`INSERT INTO users (id, name, avatarUrl, rank, age, school, joinedDate, achievements, stats, isMuted, isBanned) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`, [
    id, u.name, u.avatarUrl, u.rank || 'BRONZE', u.age, u.school,
    u.joinedDate || new Date().toISOString().split('T')[0],
    JSON.stringify(u.achievements || []), JSON.stringify(u.stats || {})
  ]);
  const created = queryOne('SELECT * FROM users WHERE id = ?', [id])!;
  res.status(201).json(rowToUser(created));
});

// --- POSTS ---
app.get('/api/posts', (_, res) => {
  const rows = queryAll('SELECT * FROM posts ORDER BY createdAt DESC');
  res.json(rows.map(rowToPost));
});

app.post('/api/posts', (req, res) => {
  const p = req.body;
  const id = p.id || `post_${Date.now()}`;
  run(`INSERT INTO posts (id, authorId, authorName, authorAvatar, authorRank, mediaUrls, mediaType, caption, likes, comments, hashtags, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    id, p.authorId, p.authorName, p.authorAvatar, p.authorRank,
    JSON.stringify(p.mediaUrls || []), p.mediaType || 'image', p.caption || '',
    JSON.stringify(p.likes || []), JSON.stringify(p.comments || []),
    JSON.stringify(p.hashtags || []), p.createdAt || new Date().toISOString()
  ]);
  const created = queryOne('SELECT * FROM posts WHERE id = ?', [id])!;
  res.status(201).json(rowToPost(created));
});

app.put('/api/posts/:id', (req, res) => {
  const p = req.body;
  run(`UPDATE posts SET caption=?, mediaUrls=?, mediaType=?, likes=?, comments=?, hashtags=? WHERE id=?`, [
    p.caption || '', JSON.stringify(p.mediaUrls || []), p.mediaType || 'image',
    JSON.stringify(p.likes || []), JSON.stringify(p.comments || []),
    JSON.stringify(p.hashtags || []), req.params.id
  ]);
  const updated = queryOne('SELECT * FROM posts WHERE id = ?', [req.params.id])!;
  res.json(rowToPost(updated));
});

app.delete('/api/posts/:id', (req, res) => {
  run('DELETE FROM posts WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// --- EVENTS ---
app.get('/api/events', (_, res) => {
  const rows = queryAll('SELECT * FROM events ORDER BY dateTime ASC');
  res.json(rows.map(rowToEvent));
});

app.post('/api/events', (req, res) => {
  const e = req.body;
  const id = e.id || `event_${Date.now()}`;
  run(`INSERT INTO events (id, title, description, dateTime, locationName, difficulty, type, creatorId, creatorName, rsvps, photos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    e.id, e.title, e.description, e.dateTime, e.locationName,
    e.difficulty, e.type, e.creatorId, e.creatorName,
    JSON.stringify(e.rsvps || {}), JSON.stringify(e.photos || [])
  ]);
  const created = queryOne('SELECT * FROM events WHERE id = ?', [id])!;
  res.status(201).json(rowToEvent(created));
});

app.put('/api/events/:id', (req, res) => {
  const e = req.body;
  run(`UPDATE events SET title=?, description=?, dateTime=?, locationName=?, difficulty=?, type=?, rsvps=?, photos=? WHERE id=?`, [
    e.title, e.description || '', e.dateTime, e.locationName,
    e.difficulty || 'Közepes', e.type || 'Ride',
    JSON.stringify(e.rsvps || {}), JSON.stringify(e.photos || []), req.params.id
  ]);
  const updated = queryOne('SELECT * FROM events WHERE id = ?', [req.params.id])!;
  res.json(rowToEvent(updated));
});

app.delete('/api/events/:id', (req, res) => {
  run('DELETE FROM events WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// --- CHATS ---
app.get('/api/chats', (req, res) => {
  const channelId = req.query.channelId as string;
  let rows: Row[];
  if (channelId) {
    rows = queryAll('SELECT * FROM chats WHERE channelId = ? ORDER BY timestamp ASC', [channelId]);
  } else {
    rows = queryAll('SELECT * FROM chats ORDER BY timestamp ASC');
  }
  res.json(rows.map(rowToChat));
});

app.post('/api/chats', (req, res) => {
  const c = req.body;
  const id = c.id || `message_${Date.now()}`;
  run(`INSERT INTO chats (id, channelId, senderId, senderName, senderRank, senderAvatar, content, imageUrl, videoUrl, timestamp, repliedTo, reactions, readBy, isEdited) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`, [
    id, c.channelId, c.senderId, c.senderName, c.senderRank, c.senderAvatar,
    c.content || '', c.imageUrl || null, c.videoUrl || null, c.timestamp || new Date().toISOString(),
    c.repliedTo ? JSON.stringify(c.repliedTo) : null,
    JSON.stringify(c.reactions || {}), JSON.stringify(c.readBy || [])
  ]);
  const created = queryOne('SELECT * FROM chats WHERE id = ?', [id])!;
  res.status(201).json(rowToChat(created));
});

app.put('/api/chats/:id', (req, res) => {
  const c = req.body;
  run(`UPDATE chats SET content=?, imageUrl=?, reactions=?, readBy=?, isEdited=? WHERE id=?`, [
    c.content || '', c.imageUrl || null,
    JSON.stringify(c.reactions || {}), JSON.stringify(c.readBy || []),
    c.isEdited ? 1 : 0, req.params.id
  ]);
  const updated = queryOne('SELECT * FROM chats WHERE id = ?', [req.params.id])!;
  res.json(rowToChat(updated));
});

app.delete('/api/chats/:id', (req, res) => {
  run('DELETE FROM chats WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// --- JOIN REQUESTS ---
app.get('/api/join_requests', (_, res) => {
  const rows = queryAll('SELECT * FROM join_requests ORDER BY submittedAt DESC');
  res.json(rows);
});

app.post('/api/join_requests', (req, res) => {
  const j = req.body;
  const id = j.id || `req_${Date.now()}`;
  run(`INSERT INTO join_requests (id, name, age, school, introduction, submittedAt, status) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
    id, j.name, j.age || null, j.school || '', j.introduction || '', j.submittedAt || new Date().toISOString(), j.status || 'pending'
  ]);
  const created = queryOne('SELECT * FROM join_requests WHERE id = ?', [id])!;
  res.status(201).json(created);
});

app.put('/api/join_requests/:id', (req, res) => {
  run('UPDATE join_requests SET status=? WHERE id=?', [req.body.status, req.params.id]);
  const updated = queryOne('SELECT * FROM join_requests WHERE id = ?', [req.params.id])!;
  res.json(updated);
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`GYGYT server running on http://localhost:${PORT}`);
  });
});
