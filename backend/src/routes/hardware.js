const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middlewares/auth');
const backendPrices = require('../config/prices'); 

/**
 * 🛒 POST /api/hardware/rent
 * Secure Checkout Engine: Validates cost + 1.5% Net Alloc Fee, checks thresholds, and deploys rig row.
 */
router.post('/rent', authMiddleware, async (req, res) => {
  const { machine_id, lease_days } = req.body;
  const telegramId = req.user.telegram_id;

  if (!machine_id || !lease_days) {
    return res.status(400).json({ error: 'System alignment parameters missing.' });
  }

  const machinePrice = backendPrices[machine_id];
  if (machinePrice === undefined) {
    return res.status(404).json({ error: 'Invalid hardware model signature.' });
  }

  // 🌟 Calculate backend Net Alloc Fee parameters (1.5%)
  const netAllocFee = machinePrice * 0.015;
  const totalRequiredCost = machinePrice + netAllocFee;

  const client = await db.connect();
  try {
    await client.query('BEGIN'); 

    const userResult = await client.query(
      'SELECT vault_balance FROM users WHERE telegram_id = $1 FOR UPDATE',
      [telegramId]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(444).json({ error: 'Operator terminal registration not located.' });
    }

    const currentBalance = parseFloat(userResult.rows[0].vault_balance) || 0.00;

    // 🛑 Check user balance against machine price + fee, enforcing the $10 floor rule
    if (currentBalance < totalRequiredCost || currentBalance < 10.00) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: `Insufficient Funds! Your account must meet the required total cost ($${totalRequiredCost.toFixed(5)}) and the $10 minimum threshold.` 
      });
    }

    // Deduct full amount including fee
    const newBalance = currentBalance - totalRequiredCost;
    const serverNow = new Date();
    
    const expirationDate = new Date();
    expirationDate.setDate(serverNow.getDate() + parseInt(lease_days));

    await client.query(
      'UPDATE users SET vault_balance = $1, last_claim_at = $2 WHERE telegram_id = $3',
      [newBalance, serverNow, telegramId]
    );

    // Instantiate active machine row inside live tracking tables
    await client.query(
      `INSERT INTO user_machines (user_id, machine_tier, hourly_yield_rate, expires_at, created_at) 
       VALUES ($1, $2, $3, $4, $5)`,
      [telegramId, machine_id, 0.0, expirationDate, serverNow]
    );

    // Log the transaction in the history audit table
    await client.query(
      `INSERT INTO historical_ledgers (telegram_id, category, amount, status, created_at) 
       VALUES ($1, $2, $3, $4, $5)`,
      [telegramId, 'WITHDRAWAL', totalRequiredCost, 'COMPLETED', serverNow]
    );

    await client.query('COMMIT'); 

    res.status(200).json({
      message: 'Processing coils deployed and ignition loop verified.',
      machine_deployed: machine_id,
      new_vault_balance: newBalance
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`🔻 [CHECKOUT ERROR]:`, err.stack);
    res.status(500).json({ 
      error: 'Hardware deployment anomaly. Secure connection dropped.' 
    });
  } finally {
    client.release(); 
  }
});

module.exports = router;