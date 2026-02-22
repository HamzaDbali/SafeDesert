// Import necessary packages
const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const { User } = require('./models/allshemas');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const authentification = require('./models/Midelware')
require('../models/dbconnect');

// Middleware
app.use(express.json());
app.use(cors());

const JWT_SECRET = 'sahara'; // ⚠️ Move to .env in production: process.env.JWT_SECRET

// POST /signup — Register a new user
app.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required' });
    }

    const checkUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }]
    });
    if (checkUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, email: email.toLowerCase() });
    const result = await newUser.save();

    // Don't return the password in the response
    const { password: _, ...userWithoutPassword } = result.toObject();
    res.status(201).json({ message: 'User added successfully', user: userWithoutPassword });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server or connection error' });
  }
});

// POST /login — Authenticate and return JWT
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const payload = { id: user._id, username: user.username, email: user.email, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server or connection error' });
  }
});

// GET /verify — Validate JWT token (protected)
app.get('/verify', authentification, (req, res) => {
  res.status(200).json({ message: 'Token is valid', user: req.user });
});

// GET /profile/:id — Get user profile by ID (protected)
app.get('/profile/:id', authentification, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server or connection error' });
  }
});

// PATCH /profile/:id — Update user profile (protected, own profile only)
app.patch('/profile/:id', authentification, async (req, res) => {
  try {
    // Only allow users to update their own profile (admins can update any)
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { username, email } = req.body;
    const updates = {};
    if (username) updates.username = username;
    if (email) updates.email = email.toLowerCase();

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updated) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: 'Profile updated', user: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server or connection error' });
  }
});

app.listen(3001, () => console.log('Auth service running on port 3001'));