const express = require('express');
const app = express();
const cors = require('cors');
const { Location } = require('../models/allshemas');
const authentification = require('../models/Midelware');
require('../models/dbconnect');

app.use(express.json());
app.use(cors());

// ─── ADD LOCATION ─────────────────────────────────────────────────────────────
app.post('/add', authentification, async (req, res) => {
  try {
    const { type, coordinates, description } = req.body;

    // Validate required fields
    if (!type || !coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({ message: 'type and coordinates [lng, lat] are required' });
    }

    const newLocation = new Location({
      type,
      coordinates: {
        type: 'Point',
        coordinates, // [lng, lat]
      },
      description,
      reportedBy: req.user.id,
    });

    const result = await newLocation.save();
    res.status(201).json({ message: 'Location added successfully', location: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server or connection error' });
  }
});

// ─── GET ALL LOCATIONS ────────────────────────────────────────────────────────
app.get('/all', authentification, async (req, res) => {
  try {
    // Support optional filter by type: /all?type=water
    const filter = { deleted: false, status: 'active' };
    if (req.query.type) filter.type = req.query.type;

    const locations = await Location.find(filter)
      .populate('reportedBy', 'username email');

    res.status(200).json({ locations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server or connection error' });
  }
});

// ─── GET NEARBY LOCATIONS ─────────────────────────────────────────────────────
app.get('/nearby', authentification, async (req, res) => {
  try {
    const { lng, lat, maxDistance = 5000 } = req.query;

    // Validate coordinates
    if (!lng || !lat) {
      return res.status(400).json({ message: 'lng and lat query parameters are required' });
    }

    const parsedLng = parseFloat(lng);
    const parsedLat = parseFloat(lat);

    if (isNaN(parsedLng) || isNaN(parsedLat)) {
      return res.status(400).json({ message: 'lng and lat must be valid numbers' });
    }

    const locations = await Location.find({
      deleted: false,
      status: 'active',
      coordinates: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parsedLng, parsedLat] },
          $maxDistance: parseInt(maxDistance),
        },
      },
    }).populate('reportedBy', 'username email');

    res.status(200).json({ locations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server or connection error' });
  }
});

// ─── GET SINGLE LOCATION ──────────────────────────────────────────────────────
// ⚠️ Must be defined AFTER /all and /nearby to avoid route conflict with /:id
app.get('/:id', authentification, async (req, res) => {
  try {
    const location = await Location.findById(req.params.id)
      .populate('reportedBy', 'username email');

    if (!location || location.deleted) {
      return res.status(404).json({ message: 'Location not found' });
    }

    res.status(200).json({ location });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server or connection error' });
  }
});

// ─── UPDATE LOCATION ──────────────────────────────────────────────────────────
app.put('/:id', authentification, async (req, res) => {
  try {
    const { type, coordinates, description, status } = req.body;

    const location = await Location.findById(req.params.id);

    if (!location || location.deleted) {
      return res.status(404).json({ message: 'Location not found' });
    }

    // Only the reporter or an admin can update
    if (location.reportedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Validate coordinates if provided
    if (coordinates && (!Array.isArray(coordinates) || coordinates.length !== 2)) {
      return res.status(400).json({ message: 'coordinates must be [lng, lat]' });
    }

    if (type)        location.type = type;
    if (coordinates) location.coordinates = { type: 'Point', coordinates };
    if (description) location.description = description;
    if (status)      location.status = status;
    location.version += 1;

    const result = await location.save();
    res.status(200).json({ message: 'Location updated successfully', location: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server or connection error' });
  }
});

// ─── DELETE LOCATION (soft delete) ───────────────────────────────────────────
app.delete('/:id', authentification, async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location || location.deleted) {
      return res.status(404).json({ message: 'Location not found' });
    }

    // Only the reporter or an admin can delete
    if (location.reportedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    location.deleted = true;
    await location.save();

    res.status(200).json({ message: 'Location deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server or connection error' });
  }
});

app.listen(3002, () => console.log('Location service running on port 3002'));