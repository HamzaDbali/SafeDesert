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

// ─── LOCATION SCHEMA (needed for verifiedCount sync) ─────────────────────────
const locationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['water', 'danger', 'safe'], required: true },
    coordinates: {
      type: { type: String, enum: ['Point'], required: true, default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    description:   { type: String },
    reportedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    verifiedCount: { type: Number, default: 0 },
    status:        { type: String, enum: ['active', 'inactive'], default: 'active' },
    version:       { type: Number, default: 1 },
    deleted:       { type: Boolean, default: false },
  },
  { timestamps: true }
);
locationSchema.index({ coordinates: '2dsphere' });

const Location = mongoose.model('Location', locationSchema);

// ─── VERIFICATION SCHEMA (self-contained) ─────────────────────────────────────
const verificationSchema = new mongoose.Schema(
  {
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status:     { type: String, enum: ['confirm', 'deny'], required: true },
  },
  { timestamps: true }
);

const Verification = mongoose.model('Verification', verificationSchema);

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

// ─── POST /add ────────────────────────────────────────────────────────────────
app.post('/add', authentification, async (req, res) => {
  try {
    const { locationId, status } = req.body;

    if (!locationId || !status)
      return res.status(400).json({ message: 'locationId and status are required' });

    if (!['confirm', 'deny'].includes(status))
      return res.status(400).json({ message: 'status must be "confirm" or "deny"' });

    const location = await Location.findById(locationId);
    if (!location || location.deleted)
      return res.status(404).json({ message: 'Location not found' });

    // Prevent reporter from verifying their own location
    if (location.reportedBy.toString() === req.user.id)
      return res.status(403).json({ message: 'You cannot verify your own location' });

    // Prevent duplicate verification
    const alreadyVerified = await Verification.findOne({ locationId, userId: req.user.id });
    if (alreadyVerified)
      return res.status(409).json({ message: 'You already verified this location' });

    const newVerification = new Verification({ locationId, userId: req.user.id, status });
    const result = await newVerification.save();

    // Sync verifiedCount on the location
    if (status === 'confirm') {
      location.verifiedCount += 1;
      await location.save();
    }

    res.status(201).json({ message: 'Verification added successfully', verification: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server or connection error' });
  }
});

// ─── GET /location/:locationId ────────────────────────────────────────────────
app.get('/location/:locationId', authentification, async (req, res) => {
  try {
    const verifications = await Verification.find({ locationId: req.params.locationId })
      .populate('userId', 'username email');

    res.status(200).json({ verifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server or connection error' });
  }
});

// ─── GET /mine ────────────────────────────────────────────────────────────────
app.get('/mine', authentification, async (req, res) => {
  try {
    const verifications = await Verification.find({ userId: req.user.id })
      .populate('locationId');

    res.status(200).json({ verifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server or connection error' });
  }
});

// ─── PUT /:id — change confirm <-> deny ───────────────────────────────────────
app.put('/:id', authentification, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['confirm', 'deny'].includes(status))
      return res.status(400).json({ message: 'status must be "confirm" or "deny"' });

    const verification = await Verification.findById(req.params.id);
    if (!verification)
      return res.status(404).json({ message: 'Verification not found' });

    if (verification.userId.toString() !== req.user.id)
      return res.status(403).json({ message: 'Unauthorized' });

    // No-op if status hasn't changed
    if (verification.status === status)
      return res.status(200).json({ message: 'Status unchanged', verification });

    const oldStatus = verification.status;
    verification.status = status;
    const result = await verification.save();

    // Sync verifiedCount on the location
    const location = await Location.findById(verification.locationId);
    if (location) {
      if (oldStatus === 'deny' && status === 'confirm') {
        location.verifiedCount += 1;
      } else if (oldStatus === 'confirm' && status === 'deny') {
        location.verifiedCount = Math.max(0, location.verifiedCount - 1);
      }
      await location.save();
    }

    res.status(200).json({ message: 'Verification updated successfully', verification: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server or connection error' });
  }
});

// ─── DELETE /:id ──────────────────────────────────────────────────────────────
app.delete('/:id', authentification, async (req, res) => {
  try {
    const verification = await Verification.findById(req.params.id);
    if (!verification)
      return res.status(404).json({ message: 'Verification not found' });

    if (verification.userId.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Unauthorized' });

    // If it was a confirm, decrement verifiedCount
    if (verification.status === 'confirm') {
      const location = await Location.findById(verification.locationId);
      if (location) {
        location.verifiedCount = Math.max(0, location.verifiedCount - 1);
        await location.save();
      }
    }

    await Verification.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Verification deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server or connection error' });
  }
});

app.listen(3005, () => console.log('Verification service running on port 3005'));