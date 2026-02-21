const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

app.use(express.json());
app.use(cors());

const JWT_SECRET = 'sahara';

// ─── DB CONNECTION ────────────────────────────────────────────────────────────
mongoose.connect('mongodb://localhost:27017/saharadb')
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Database connection error:', err));

// ─── SYNCLOG SCHEMA (self-contained) ─────────────────────────────────────────
const syncLogSchema = new mongoose.Schema(
  {
    userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lastSyncClient: { type: Date },
    serverTime:     { type: Date },
    recordsSent:    { type: Number, default: 0 },
  },
  { timestamps: true }
);

const SyncLog = mongoose.model('SyncLog', syncLogSchema);

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
function authentification(req, res, next) {
  try {
    const token = req.headers.authorization.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, userData) => {
      if (err) return res.status(401).json({ message: 'Authentication failed' });
      req.user = userData;
      next();
    });
  } catch (err) {
    res.status(401).json({ message: 'Authentication failed' });
  }
}

// ─── POST /sync ───────────────────────────────────────────────────────────────
app.post('/sync', authentification, async (req, res) => {
  try {
    const { lastSyncClient, recordsSent } = req.body;

    if (recordsSent !== undefined && (typeof recordsSent !== 'number' || recordsSent < 0))
      return res.status(400).json({ message: 'recordsSent must be a non-negative number' });

    const newSyncLog = new SyncLog({
      userId: req.user.id,
      lastSyncClient: lastSyncClient ? new Date(lastSyncClient) : undefined,
      serverTime: new Date(), // always set by server, never trust client time
      recordsSent: recordsSent ?? 0,
    });

    const result = await newSyncLog.save();
    res.status(201).json({ message: 'Sync logged successfully', syncLog: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server or connection error' });
  }
});

// ─── GET /mine ────────────────────────────────────────────────────────────────
app.get('/mine', authentification, async (req, res) => {
  try {
    const logs = await SyncLog.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({ syncLogs: logs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server or connection error' });
  }
});

// ─── GET /last ────────────────────────────────────────────────────────────────
app.get('/last', authentification, async (req, res) => {
  try {
    const lastSync = await SyncLog.findOne({ userId: req.user.id })
      .sort({ createdAt: -1 });

    if (!lastSync)
      return res.status(404).json({ message: 'No sync history found' });

    res.status(200).json({ syncLog: lastSync });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server or connection error' });
  }
});

// ─── GET /all (admin only) ────────────────────────────────────────────────────
app.get('/all', authentification, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ message: 'Admin access required' });

    const logs = await SyncLog.find()
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json({ syncLogs: logs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server or connection error' });
  }
});

// ─── DELETE /:id ──────────────────────────────────────────────────────────────
app.delete('/:id', authentification, async (req, res) => {
  try {
    const log = await SyncLog.findById(req.params.id);

    if (!log)
      return res.status(404).json({ message: 'Sync log not found' });

    // Only the owner or an admin can delete
    if (log.userId.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Unauthorized' });

    await SyncLog.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Sync log deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server or connection error' });
  }
});

app.listen(3004, () => console.log('Sync service running on port 3004'));