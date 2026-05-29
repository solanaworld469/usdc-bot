const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middlewares/auth');
const backendPrices = require('../config/prices'); // 📊 Clean, isolated configuration sheet

/**
 * 🛒 POST /api/hardware/rent
 * Secure Checkout Engine: Validates $10 threshold, deducts balance, and deploys rig row.
 * Implements strict structural masking to shield users from database/infrastructure errors.
 */
router.post('/rent', authMiddleware, async (req, res) => {
  const { machine_id, lease_days } = req.body;
  const telegramId = req.user.telegram_id;

  // 1. Initial input validation
  if (!machine_id || !lease_days) {
    return res.status(400).json({ error: 'System alignment parameters missing.' });
  }

  // 2. Extract verification pricing from backend config sheet
  const machinePrice = backendPrices[machine_id];
  if (machinePrice === undefined) {
    return res.status(404).json({ error: 'Invalid hardware model signature.' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN'); // Start atomic database transaction isolate

    // 3. Fetch operator balance with a strict row lock to crush race conditions
    const userResult = await client.query(
      'SELECT vault_balance FROM users WHERE telegram_id = $1 FOR UPDATE',
      [telegramId]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(444).json({ error: 'Operator terminal registration not located.' });
    }

    const currentBalance = parseFloat(userResult.rows[0].vault_balance) || 0.00;

    // 4. SECURE CHECKLIST VERIFICATION: Enforce your exact $10 threshold rule
    if (currentBalance < machinePrice || currentBalance < 10.00) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: `Insufficient Funds! Your account must meet the $10 minimum threshold before continuing.` 
      });
    }

    // 5. Calculate accounting adjustments
    const newBalance = currentBalance - machinePrice;
    const serverNow = new Date();
    
    // Calculate precise lease expiration date timestamp
    const expirationDate = new Date();
    expirationDate.setDate(serverNow.getDate() + parseInt(lease_days));

    // 6. Update user account balance metrics
    await client.query(
      'UPDATE users SET vault_balance = $1, last_claim_at = $2 WHERE telegram_id = $3',
      [newBalance, serverNow, telegramId]
    );

    // 7. Instantiate active machine asset entity row into database inventory
    await client.query(
      `INSERT INTO user_machines (telegram_id, machine_id, price_usdc, lease_days, status, created_at, expires_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [telegramId, machine_id, machinePrice, lease_days, 'ACTIVE', serverNow, expirationDate]
    );

    // 8. Write a record straight into historical ledgers for accounting audits
    await client.query(
      `INSERT INTO historical_ledgers (telegram_id, category, amount, status, created_at) 
       VALUES ($1, $2, $3, $4, $5)`,
      [telegramId, 'WITHDRAWAL', machinePrice, 'COMPLETED', serverNow]
    );

    await client.query('COMMIT'); // Commit all entries safely to PostgreSQL logs

    res.status(200).json({
      message: 'Processing coils deployed and ignition loop verified.',
      machine_deployed: machine_id,
      new_vault_balance: newBalance
    });

  } catch (err) {
    // 🛑 ROLLBACK THE TRANSACTION SO USER FUNDS ARE NOT DAMAGED
    await client.query('ROLLBACK');

    // 🧑‍💻 REAL ADMIN LOGS: Spitted out safely inside your local development backend terminal window
    console.error(`🔻 [CRITICAL AUDIT ERROR][User: ${telegramId}][Time: ${new Date().toISOString()}]:`, err.stack);

    // 🛡️ MASKED SOFT ERROR TO USER: Client only sees this clean text inside their custom center alert box
    res.status(500).json({ 
      error: 'Hardware deployment anomaly. Secure connection dropped. Contact infrastructure grid team.' 
    });
  } finally {
    client.release(); // Free database client back to the pool instantly
  }
});

module.exports = router;