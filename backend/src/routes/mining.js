const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middlewares/auth');

router.post('/claim', authMiddleware, async (req, res) => {
  const telegramId = req.user.telegram_id;
  const serverNow = new Date();

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock user profile to prevent double-click balance attacks
    const userResult = await client.query(
      'SELECT vault_balance, total_usdc_earned, total_usdc_leaked FROM users WHERE telegram_id = $1 FOR UPDATE',
      [telegramId]
    );

    if (userResult.rows.length === 0) throw new Error('USER_NOT_FOUND');
    const userData = userResult.rows[0];

    // 2. Fetch all actively mining rigs for this user
    const fleetResult = await client.query(
      `SELECT id, hourly_yield_rate, last_ignition_time FROM user_machines 
       WHERE telegram_id = $1 AND status = 'ACTIVE' AND expires_at > $2`,
      [telegramId, serverNow]
    );

    if (fleetResult.rows.length === 0) {
      await client.query('COMMIT');
      return res.status(200).json({ message: 'No active machines to settle.', new_vault_balance: userData.vault_balance });
    }

    let totalClaimableUsdc = 0;
    let totalLeakageUsdc = 0;

    // 3. ⏱️ THE 3-PHASE HARDWARE LOOP
    for (const machine of fleetResult.rows) {
      const hourlyRate = parseFloat(machine.hourly_yield_rate);
      const lastIgnition = new Date(machine.last_ignition_time);
      const elapsedSeconds = Math.max(0, Math.floor((serverNow - lastIgnition) / 1000));
      const elapsedHours = elapsedSeconds / 3600;

      let machineClaim = 0;
      let machineLeakage = 0;

      if (elapsedHours <= 24) {
        // PHASE 1: Active Mining (Normal Accrual)
        machineClaim = elapsedHours * hourlyRate;
      } else if (elapsedHours > 24 && elapsedHours <= 25) {
        // PHASE 2: Grace Period (Frozen at max 24hr yield)
        machineClaim = 24 * hourlyRate;
      } else {
        // PHASE 3: Thermal Leakage (Penalizes late claims using exact same speed)
        const leakHours = elapsedHours - 25;
        machineLeakage = leakHours * hourlyRate;
        machineClaim = (24 * hourlyRate) - machineLeakage;

        // Hard floor constraint: Prevent negative daily balances
        if (machineClaim < 0) machineClaim = 0; 
      }

      totalClaimableUsdc += machineClaim;
      totalLeakageUsdc += machineLeakage;

      // Reset loop timers and permanently track leaked money for UI display
      await client.query(
        `UPDATE user_machines 
         SET last_ignition_time = $1, last_claim_at = $1, unmined_loss_pool = unmined_loss_pool + $2
         WHERE id = $3`,
        [serverNow, machineLeakage, machine.id]
      );
    }

    // 4. Master Account Settlement
    const newVaultBalance = parseFloat(userData.vault_balance) + totalClaimableUsdc;
    const newTotalEarned = parseFloat(userData.total_usdc_earned || 0) + totalClaimableUsdc;
    const newTotalLeaked = parseFloat(userData.total_usdc_leaked || 0) + totalLeakageUsdc;

    await client.query(
      `UPDATE users 
       SET vault_balance = $1, total_usdc_earned = $2, total_usdc_leaked = $3, last_claim_at = $4 
       WHERE telegram_id = $5`,
      [newVaultBalance, newTotalEarned, newTotalLeaked, serverNow, telegramId]
    );

    // Ledger Logging
    await client.query(
      `INSERT INTO historical_ledgers (telegram_id, category, amount, status, created_at) 
       VALUES ($1, $2, $3, $4, $5)`,
      [telegramId, 'CLAIM_MINED', totalClaimableUsdc, 'COMPLETED', serverNow]
    );

    if (totalLeakageUsdc > 0) {
      await client.query(
        `INSERT INTO historical_ledgers (telegram_id, category, amount, status, created_at) 
         VALUES ($1, $2, $3, $4, $5)`,
        [telegramId, 'UNMINED_LOSS', totalLeakageUsdc, 'COMPLETED', serverNow]
      );
    }

    await client.query('COMMIT');

    res.status(200).json({
      message: totalLeakageUsdc > 0 
        ? `Claimed $${totalClaimableUsdc.toFixed(4)}. Grid lost $${totalLeakageUsdc.toFixed(4)} to thermal leakage.` 
        : `Ignition settled. Successfully claimed $${totalClaimableUsdc.toFixed(4)} USDC.`,
      new_vault_balance: newVaultBalance
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`🔻 [IGNITION CLAIM FAULT]:`, err.stack);
    res.status(500).json({ error: 'Failed to settle grid claims.' });
  } finally {
    client.release();
  }
});

module.exports = router;