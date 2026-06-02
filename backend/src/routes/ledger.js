const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/epochs/:machineId', async (req, res) => {
    try {
        const { machineId } = req.params;
        
        // 🌟 FIXED: Grab the exact machine speed directly from the database
        const machineResult = await pool.query('SELECT hourly_yield_rate FROM user_machines WHERE id = $1', [machineId]);
        const hourlyRate = machineResult.rows.length > 0 ? parseFloat(machineResult.rows[0].hourly_yield_rate) : 0;

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
        
        res.json({ 
            success: true, 
            server_time: new Date().toISOString(), 
            hourly_yield_rate: hourlyRate, // 👈 INJECTED HERE
            epochs: result.rows 
        });
    } catch (error) {
        console.error('[Ledger Route] Fetch Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching ledger' });
    }
});

module.exports = router;