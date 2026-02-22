const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

app.use(express.json());
app.use(cors());

const JWT_SECRET = 'sahara';

// ─── DB CONNECTION ────────────────────────────────────────────────────────────
mongoose.connect('mongodb+srv://saharausersaharauser123@cluster0.hf26jws.mongodb.net/')
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Database connection error:', err));

// ─── SOS SCHEMA (self-contained) ─────────────────────────────────────────────
const sosSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coordinates: {
      type: { type: String, enum: ['Point'], required: true, default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    message:    { type: String },
    status:     { type: String, enum: ['active', 'resolved'], default: 'active' },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);
sosSchema.index({ coordinates: '2dsphere' });

const SOS = mongoose.model('SOS', sosSchema);

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

// ─── POST /send ───────────────────────────────────────────────────────────────
app.post('/send', authentification, async (req, res) => {
  try {
    const { coordinates, message } = req.body;

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2)
      return res.status(400).json({ message: 'coordinates [lng, lat] are required' });

    const newSOS = new SOS({
      userId: req.user.id,
      coordinates: { type: 'Point', coordinates },
      message,
    });

    const result = await newSOS.save();
    res.status(201).json({ message: 'SOS sent successfully', sos: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server or connection error' });
  }
});

// ─── GET /active ──────────────────────────────────────────────────────────────
app.get('/active', authentification, async (req, res) => {
  try {
    const activeSOS = await SOS.find({ status: 'active' })
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json({ sos: activeSOS });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server or connection error' });
  }
});

// ─── GET /nearby ──────────────────────────────────────────────────────────────
app.get('/nearby', authentification, async (req, res) => {
  try {
    const { lng, lat, maxDistance = 5000 } = req.query;

    if (!lng || !lat)
      return res.status(400).json({ message: 'lng and lat query parameters are required' });

    const parsedLng = parseFloat(lng);
    const parsedLat = parseFloat(lat);

    if (isNaN(parsedLng) || isNaN(parsedLat))
      return res.status(400).json({ message: 'lng and lat must be valid numbers' });

    const nearbySOS = await SOS.find({
      status: 'active',
      coordinates: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parsedLng, parsedLat] },
          $maxDistance: parseInt(maxDistance),
        },
      },
    }).populate('userId', 'username email');

    res.status(200).json({ sos: nearbySOS });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server or connection error' });
  }
});

// ─── GET /mine ────────────────────────────────────────────────────────────────
app.get('/mine', authentification, async (req, res) => {
  try {
    const mySOSList = await SOS.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({ sos: mySOSList });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server or connection error' });
  }
});

// ─── PUT /resolve/:id ─────────────────────────────────────────────────────────
// ⚠️ Must be before GET /:id to avoid "resolve" being matched as an id
app.put('/resolve/:id', authentification, async (req, res) => {
  try {
    const sos = await SOS.findById(req.params.id);

    if (!sos)
      return res.status(404).json({ message: 'SOS not found' });

    if (sos.userId.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Unauthorized' });

    if (sos.status === 'resolved')
      return res.status(409).json({ message: 'SOS is already resolved' });

    sos.status = 'resolved';
    sos.resolvedAt = new Date();
    const result = await sos.save();

    res.status(200).json({ message: 'SOS resolved successfully', sos: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server or connection error' });
  }
});

// ─── GET /:id ─────────────────────────────────────────────────────────────────
app.get('/:id', authentification, async (req, res) => {
  try {
    const sos = await SOS.findById(req.params.id)
      .populate('userId', 'username email');

    if (!sos)
      return res.status(404).json({ message: 'SOS not found' });

    res.status(200).json({ sos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server or connection error' });
  }
});

// ─── DELETE /:id ──────────────────────────────────────────────────────────────
app.delete('/:id', authentification, async (req, res) => {
  try {
    const sos = await SOS.findById(req.params.id);

    if (!sos)
      return res.status(404).json({ message: 'SOS not found' });

    if (sos.userId.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Unauthorized' });

    await SOS.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'SOS deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server or connection error' });
  }
});

app.listen(3003, () => console.log('SOS service running on port 3003'));
