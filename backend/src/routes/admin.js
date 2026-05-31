// backend/src/routes/admin.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

/**
 * 📊 GET /api/admin/metrics
 * Handles streaming pure JSON data rows to your modular React frontend components
 */
router.get('/metrics', async (req, res) => {
  const activeTab = req.query.tab || 'users';
  
  try {
    let queryText = '';

    if (activeTab === 'users') {
      queryText = 'SELECT * FROM users ORDER BY created_at DESC';
    } else if (activeTab === 'user_machines') {
      queryText = 'SELECT * FROM user_machines ORDER BY created_at DESC'; 
    } else if (activeTab === 'activation_keys') {
      queryText = 'SELECT * FROM activation_keys ORDER BY created_at DESC';
    } else {
      return res.status(400).json({ error: 'Invalid data cluster scope targeted.' });
    }

    const result = await db.query(queryText);
    
    // 🚀 Returns clean, pure JSON arrays for your React components to loop over effortlessly
    res.status(200).json(result.rows);

  } catch (err) {
    console.error(`🔻 [Admin API Fault]:`, err.message);
    res.status(500).json({ error: 'Failed to query targeted database matrix cluster.' });
  }
});

module.exports = router;