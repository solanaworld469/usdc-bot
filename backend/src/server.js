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
  allowedHeaders: ['Content-Type', 'x-admin-key', 'Authorization' , 'Accept'],
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
 * 👑 SECURE MASTER API: Calculates and streams live tracking matrix to React Frontend
 */
app.get('/api/admin/console', async (req, res) => {
  // 🛡️ Lock check matching your master environmental secret configuration
  const providedKey = req.headers['x-admin-key'];
  if (providedKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(403).json({ error: '⛔ SECURE FACILITY. CONNECTION TERMINATED.' });
  }

  const activeTab = req.query.tab || 'users';
  
  try {
    let queryText = '';

    // 👑 SECURE DATA SPLIT: Prevents DashboardOverview from breaking on heavy calculations
    if (activeTab === 'users') {
      // 1. Get the raw users from the database
      const userRowsResult = await db.query('SELECT * FROM users ORDER BY created_at DESC');
      
      // 2. Check if the request is coming from DashboardOverview or UsersDirectory
      // If the frontend is just looking for a simple data dump to count totals, skip the math!
      const isOverviewRequest = req.headers['accept'] === 'application/json' && !req.url.includes('tab=users');
      
      if (req.query.tab !== 'users') {
        // Return raw profiles immediately so DashboardOverview can calculate total users/TVL cleanly
        return res.status(200).json(userRowsResult.rows);
      }

      // 3. If we are explicitly on the Users Tab, calculate the telemetry safely
      const computedRows = await Promise.all(userRowsResult.rows.map(async (user) => {
        const machineCheck = await db.query(
          'SELECT ucredits_per_sec FROM user_machines WHERE user_id = $1 AND expires_at > NOW() LIMIT 1',
          [user.id]
        );

        if (machineCheck.rows.length === 0) {
          return {
            ...user,
            live_runtime: "0h 0m 0s",
            mined_ucredits: "0.0000",
            mined_usdc: "0.000000",
            leakage_ucredits: "0.0000",
            leakage_usdc: "0.000000"
          };
        }

        const ratePerSec = parseFloat(machineCheck.rows[0].ucredits_per_sec) || 0;
        const serverNow = new Date();
        const lastIgnition = user.last_ignition_at ? new Date(user.last_ignition_at) : new Date(user.created_at);
        const elapsedSeconds = Math.max(0, Math.floor((serverNow - lastIgnition) / 1000));

        let totalMinedCredits = 0;
        let leakageCredits = 0;
        let activeMinedSeconds = 0;

        if (elapsedSeconds <= 90000) { 
          activeMinedSeconds = elapsedSeconds;
          totalMinedCredits = elapsedSeconds * ratePerSec;
          leakageCredits = 0;
        } else {
          activeMinedSeconds = 90000; 
          totalMinedCredits = 90000 * ratePerSec;
          const idleOvertimeSeconds = elapsedSeconds - 90000;
          leakageCredits = idleOvertimeSeconds * (ratePerSec * 0.5);
        }

        const hrs = Math.floor(activeMinedSeconds / 3600);
        const mins = Math.floor((activeMinedSeconds % 3600) / 60);
        const secs = activeMinedSeconds % 60;
        const durationString = `${hrs}h ${mins}m ${secs}s`;

        return {
          ...user,
          live_runtime: durationString,
          mined_ucredits: totalMinedCredits.toFixed(4),
          mined_usdc: (totalMinedCredits / 1000000).toFixed(6),
          leakage_ucredits: leakageCredits.toFixed(4),
          leakage_usdc: (leakageCredits / 1000000).toFixed(6)
        };
      }));

      return res.status(200).json(computedRows);
    }
    
    return res.status(200).json(result.rows);

  } catch (err) {
    return res.status(500).json({ error: `Failed to query targeted cluster matrix: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 [Server]: Multi-Chain Core Node initiated successfully.`);
  console.log(`🌐 [Server]: Listening on interface: http://localhost:${PORT}`);
});