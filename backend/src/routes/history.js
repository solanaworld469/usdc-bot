const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middlewares/auth');

/**
 * 📊 GET /api/history/ledger
 * Fetches transaction history with strict filters for month/year and operational status.
 */
router.get('/ledger', authMiddleware, async (req, res) => {
  try {
    const telegramId = req.user.telegram_id;
    
    // Extract query parameters from frontend actions
    const { month, year, status } = req.query;

    // Default to current month and year if not specified by the user
    const targetMonth = parseInt(month) || (new Date().getMonth() + 1);
    const targetYear = parseInt(year) || new Date().getFullYear();

    // Mathematically construct the precise start and end dates for the database scan window
    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01 00:00:00`;
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59).toLocaleString('sv-SE'); // Formats to YYYY-MM-DD HH:MM:SS

    let queryText = `
      SELECT id, category, amount, status, created_at 
      FROM historical_ledgers 
      WHERE telegram_id = $1 
        AND created_at >= $2 AND created_at <= $3
    `;
    
    const queryParams = [telegramId, startDate, endDate];

    // If the user selects a specific status filter button (instead of 'All Transactions')
    if (status && status !== 'ALL') {
      queryParams.push(status.toUpperCase());
      queryText += ` AND status = $${queryParams.length}`;
    }

    // Always sort by newest transactions first
    queryText += ` ORDER BY created_at DESC;`;

    const result = await db.query(queryText, queryParams);

    res.status(200).json({
      filter_scope: {
        month: targetMonth,
        year: targetYear,
        status_filter: status || 'ALL'
      },
      records_returned: result.rows.length,
      ledger: result.rows
    });

  } catch (err) {
    console.error('🔻 [Ledger Route Fault]: Failed to fetch history matrix:', err.message);
    res.status(500).json({ error: 'Internal server query error.' });
  }
});

module.exports = router;