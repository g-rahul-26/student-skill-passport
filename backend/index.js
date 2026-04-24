// 1. SYSTEM & DNS CONFIG
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Fixes Windows DNS lookup issues
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "passport_secret_2026";

// 2. CLOUDINARY CONFIGURATION
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'skill_passports',
    resource_type: 'auto', // Support for PDF and Images
  },
});
const upload = multer({ storage });

// 3. DATABASE MODELS
// User for Auth (Stage 1)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Profile for Dashboard (Stage 2 & 3)
const profileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  personalProfile: Object,
  education: Object,
  codingStats: Object,
  technicalSkills: Object,
  certificates: [{ 
    title: String, 
    url: String, 
    uploadedAt: { type: Date, default: Date.now } 
  }],
  updatedAt: { type: Date, default: Date.now }
});
const Profile = mongoose.model('Profile', profileSchema);

// 4. API ROUTES (STAGE 1: AUTH)
app.post('/api/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: "User registered" });
  } catch (error) {
    res.status(400).json({ error: "Email already exists" });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username: user.username, userId: user._id });
  } catch (error) {
    res.status(500).json({ error: "Login error" });
  }
});

// 5. API ROUTES (STAGE 2 & 3: DASHBOARD & CLOUD)
app.post('/api/profile/update', upload.single('certificate'), async (req, res) => {
  try {
    const { userId, widgetTitle, details } = req.body;
    const parsedDetails = JSON.parse(details);
    const fileUrl = req.file ? req.file.path : null;

    // Mapping widget titles to database fields
    const fieldMap = {
      "Personal Profile": "personalProfile",
      "Education": "education",
      "Coding Stats": "codingStats",
      "Technical Skills": "technicalSkills"
    };

    let updateQuery = {};
    const dbField = fieldMap[widgetTitle];

    if (dbField) {
      updateQuery[dbField] = parsedDetails;
    }

    // If it's a certificate upload, push to the certificates array
    if (fileUrl) {
      updateQuery.$push = { certificates: { title: widgetTitle, url: fileUrl } };
    }

    updateQuery.updatedAt = Date.now();

    const profile = await Profile.findOneAndUpdate(
      { userId: userId },
      updateQuery,
      { upsert: true, new: true }
    );

    res.json({ message: "Saved to Cloud successfully!", data: profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Fetch existing profile data
app.get('/api/profile/:userId', async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.params.userId });
    res.json(profile || {});
  } catch (error) {
    res.status(500).json({ error: "Fetch error" });
  }
});

// 6. SERVER START
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(5000, () => {
      console.log("-----------------------------------------");
      console.log("🚀 Server: http://localhost:5000");
      console.log("📦 Database: Connected to MongoDB Atlas");
      console.log("-----------------------------------------");
    });
  })
  .catch(err => console.error("❌ MongoDB Connection Error:", err));