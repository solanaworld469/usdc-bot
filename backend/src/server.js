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
 * 📊 MASTER DATABASE CONSOLE: Tabbed View for All Tables
 */
app.get('/api/admin/console', async (req, res) => {
  const activeTab = req.query.tab || 'users';
  
  try {
    let tableRows = [];
    let queryText = '';

    // 🧭 CONSOLIDATED ROUTING ENGINE: Single clean block matching your true Postgres columns
    if (activeTab === 'users') {
      queryText = 'SELECT * FROM users ORDER BY created_at DESC';
    } else if (activeTab === 'user_machines') {
      queryText = 'SELECT * FROM user_machines ORDER BY purchased_at DESC'; // 🌟 FIXED
    } else if (activeTab === 'activation_keys') {
      queryText = 'SELECT * FROM activation_keys ORDER BY generated_at DESC';
    } else if (activeTab === 'historical_ledgers') {
      queryText = 'SELECT * FROM historical_ledgers ORDER BY created_at DESC';
    } else {
      return res.status(400).send('Invalid cluster data scope targeted.');
    }

    const result = await db.query(queryText);
    tableRows = result.rows;

    // Generate dynamic dashboard layout with responsive interface tabs
    let html = `
      <html>
        <head>
          <title>Siberian Pool - Cluster Console</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; background: #090a0f; color: #e2e8f0; padding: 40px; margin: 0; }
            .container { max-width: 1200px; margin: 0 auto; }
            h2 { color: #22d3ee; margin-bottom: 5px; font-weight: 600; }
            p { color: #64748b; margin-top: 0; margin-bottom: 25px; font-size: 14px; }
            
            /* Tabs Navigation Engine */
            .tabs-bar { display: flex; gap: 10px; border-bottom: 2px solid #1e293b; padding-bottom: 0; margin-bottom: 20px; }
            .tab-btn { background: none; border: none; padding: 12px 24px; color: #94a3b8; font-size: 14px; font-weight: bold; cursor: pointer; text-decoration: none; border-radius: 6px 6px 0 0; transition: all 0.2s; }
            .tab-btn:hover { background: #151823; color: #f1f5f9; }
            .tab-btn.active { background: #1e293b; color: #22d3ee; border-bottom: 3px solid #22d3ee; margin-bottom: -2px; }
            
            /* Dynamic Table Engine Layout */
            .table-container { background: #11131e; border: 1px solid #1e293b; border-radius: 8px; overflow: hidden; }
            table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
            th { background: #161925; color: #94a3b8; padding: 14px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #1e293b; }
            td { padding: 14px 16px; border-bottom: 1px solid #1e293b; color: #cbd5e1; }
            tr:last-child td { border-bottom: none; }
            tr:hover td { background: #171b2c; }
            
            .empty-state { padding: 40px; text-align: center; color: #64748b; font-style: italic; }
            .badge { font-weight: bold; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
            .badge-true { background: rgba(52, 211, 153, 0.1); color: #34d399; }
            .badge-false { background: rgba(248, 113, 113, 0.1); color: #f87171; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>📊 Siberian Pool - Management Console</h2>
            <p>Direct inspection layer for local PostgreSQL 18 system clusters.</p>
            
            <div class="tabs-bar">
              <a href="?tab=users" class="tab-btn ${activeTab === 'users' ? 'active' : ''}">👤 Users (${activeTab === 'users' ? tableRows.length : 'View'})</a>
              <a href="?tab=user_machines" class="tab-btn ${activeTab === 'user_machines' ? 'active' : ''}">⚙️ User Machines (${activeTab === 'user_machines' ? tableRows.length : 'View'})</a>
              <a href="?tab=activation_keys" class="tab-btn ${activeTab === 'activation_keys' ? 'active' : ''}">🔑 Activation Keys (${activeTab === 'activation_keys' ? tableRows.length : 'View'})</a>
              <a href="?tab=historical_ledgers" class="tab-btn ${activeTab === 'historical_ledgers' ? 'active' : ''}">📜 History Ledgers (${activeTab === 'historical_ledgers' ? tableRows.length : 'View'})</a>
            </div>

            <div class="table-container">
              ${tableRows.length === 0 ? `<div class="empty-state">No rows found in this table cluster yet.</div>` : `
                <table>
                  <thead>
                    <tr>
                      ${Object.keys(tableRows[0]).map(key => `<th>${key}</th>`).join('')}
                    </tr>
                  </thead>
                  <tbody>
                    ${tableRows.map(row => `
                      <tr>
                        ${Object.values(row).map(val => {
                          if (val === null) return `<td><span style="color:#475569">null</span></td>`;
                          if (typeof val === 'boolean') return `<td><span class="badge badge-${val}">${val}</span></td>`;
                          if (val instanceof Date) return `<td>${val.toLocaleString()}</td>`;
                          if (!isNaN(val) && val !== '' && typeof val !== 'string') return `<td style="color:#fbbf24; font-weight:bold;">${val}</td>`;
                          return `<td>${val}</td>`;
                        }).join('')}
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              `}
            </div>
          </div>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (err) {
    res.status(500).send(`<h3>Failed to query targeted cluster matrix: ${err.message}</h3>`);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 [Server]: Multi-Chain Core Node initiated successfully.`);
  console.log(`🌐 [Server]: Listening on interface: http://localhost:${PORT}`);
});