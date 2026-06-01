const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Fetch the 6-month epoch layout for a specific machine
router.get('/epochs/:machineId', async (req, res) => {
    try {
        const { machineId } = req.params;
        
        const query = `
            SELECT 
                month_number, 
                ucredits_mined, 
                ucredits_leaked, 
                claim_status, 
                start_date, 
                end_date
            FROM machine_monthly_epochs
            WHERE machine_id = $1
            ORDER BY month_number ASC
        `;
        
        const result = await pool.query(query, [machineId]);
        
        res.json({ success: true, epochs: result.rows });
    } catch (error) {
        console.error('[Ledger Route] Fetch Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching ledger' });
    }
});

module.exports = router;