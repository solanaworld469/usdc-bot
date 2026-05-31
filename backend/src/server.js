const express = require('express');
const cors = require('cors'); // 📦 Lifted directly to the top imports deck
require('dotenv').config();
const db = require('./config/db');
const authMiddleware = require('./middlewares/auth');

const machineRouter = require('./routes/machines');
const historyRouter = require('./routes/history');
const miningRouter = require('./routes/mining');
const hardwareRouter = require('./routes/hardware');
const fleetRouter = require('./routes/fleet');
const nodesRouter = require('./routes/nodes');
const adminRouter = require('./routes/admin'); 
const app = express();
const PORT = process.env.PORT || 5000;

// 🛡️ CRITICAL FIX: Global CORS Policies must be instantiated BEFORE any endpoint router mounts
app.use(cors({
  origin: 'http://localhost:5173', // Confirms communication access with your local Vite engine
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Fixed wildcard regular expression structure for path-to-regexp v10 compliance
app.options(/(.*)/, cors());

// Standard parser middlewares
app.use(express.json());

// 🧭 MOUNTED ROUTE CLUSTERS (Now fully protected by CORS headers)
app.use('/api/machines', machineRouter);
app.use('/api/history', historyRouter);
app.use('/api/mining', miningRouter);
app.use('/api/hardware', hardwareRouter);
app.use('/api/hardware', fleetRouter);
app.use('/api/nodes', nodesRouter);
app.use('/api/admin-panel', adminRouter)

// Global Server Diagnostics Endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbCheck = await db.query('SELECT NOW()');
    res.status(200).json({ status: 'OPERATIONAL', server_time: dbCheck.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'DEGRADED', error: err.message });
  }
});

// Secure Profile Endpoint (Triggers Auth Onboarding)
app.get('/api/user/profile', authMiddleware, (req, res) => {
  res.status(200).json({
    message: 'SECURE AUTHENTICATION SUCCESSFUL',
    user_profile: req.user
  });
});

/**
 * 👑 SECURE MASTER API: Only streams JSON to your React Godmode Frontend
 */
app.get('/api/admin/console', async (req, res) => {
  // 🛡️ MILITARY-GRADE LOCK: Request must contain your secret header
  const providedKey = req.headers['x-admin-key'];
  
  if (providedKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(403).json({ error: '⛔ SECURE FACILITY. CONNECTION TERMINATED.' });
  }

  const activeTab = req.query.tab || 'users';
  
  try {
    let queryText = '';

    if (activeTab === 'users') {
      queryText = 'SELECT * FROM users ORDER BY created_at DESC';
    } else if (activeTab === 'user_machines') {
      queryText = 'SELECT * FROM user_machines ORDER BY created_at DESC'; 
    } else if (activeTab === 'activation_keys') {
      queryText = 'SELECT * FROM activation_keys ORDER BY created_at DESC';
    } else if (activeTab === 'historical_ledgers') {
      queryText = 'SELECT * FROM historical_ledgers ORDER BY created_at DESC';
    } else {
      return res.status(400).json({ error: 'Invalid cluster data scope targeted.' });
    }

    const result = await db.query(queryText);
    
    // 🚀 Streams pure data directly to your frontend components
    return res.status(200).json(result.rows);

  } catch (err) {
    return res.status(500).json({ error: `Failed to query targeted cluster matrix: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 [Server]: Multi-Chain Core Node initiated successfully.`);
  console.log(`🌐 [Server]: Listening on interface: http://localhost:${PORT}`);
});