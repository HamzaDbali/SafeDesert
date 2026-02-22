// models/AllSchemas.js
const mongoose = require("mongoose");


// 1️⃣ User Schema
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    reputation: { type: Number, default: 0 },
    lastSync: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);


// 2️⃣ Location Schema
const locationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["water", "danger", "safe"], required: true },
    coordinates: {
      type: { type: String, enum: ["Point"], required: true, default: "Point" },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    description: { type: String },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    verifiedCount: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    version: { type: Number, default: 1 },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Geo index for nearby queries
locationSchema.index({ coordinates: "2dsphere" });

const Location = mongoose.model("Location", locationSchema);


// 3️⃣ Verification Schema

const verificationSchema = new mongoose.Schema(
  {
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["confirm", "deny"], required: true },
  },
  { timestamps: true }
);

const Verification = mongoose.model("Verification", verificationSchema);

// 4️⃣ SOS Schema

const sosSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    coordinates: {
      type: { type: String, enum: ["Point"], required: true, default: "Point" },
      coordinates: { type: [Number], required: true },
    },
    message: { type: String },
    status: { type: String, enum: ["active", "resolved"], default: "active" },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

sosSchema.index({ coordinates: "2dsphere" });

const SOS = mongoose.model("SOS", sosSchema);
// 5️⃣ SyncLog Schema

const syncLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lastSyncClient: { type: Date },
    serverTime: { type: Date },
    recordsSent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const SyncLog = mongoose.model("SyncLog", syncLogSchema);


// Export all models
module.exports = {
  User,
  Location,
  Verification,
  SOS,
  SyncLog,
};