const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middlewares/auth');

/**
 * 📥 POST /api/mining/claim
 * Bulletproof Revenue Settlement Engine
 * Calculates true elapsed time windows and settles accrued credit balances securely.
 */
router.post('/claim', authMiddleware, async (req, res) => {
  const telegramId = req.user.telegram_id;
  const serverNow = new Date();

  const client = await db.connect();
  try {
    await client.query('BEGIN'); // Open isolated database transaction wall

    // 1. Fetch user profile with strict row locking to kill double-click exploits
    const userResult = await client.query(
      'SELECT vault_balance, last_claim_at FROM users WHERE telegram_id = $1 FOR UPDATE',
      [telegramId]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Operator node profile not found.' });
    }

    const userData = userResult.rows[0];
    const currentVaultBalance = parseFloat(userData.vault_balance) || 0.00;
    
    // Default fallback if last_claim_at is blank (e.g. brand new user)
    const lastClaimAt = userData.last_claim_at ? new Date(userData.last_claim_at) : serverNow;

    // 2. Compute the exact time delta window in seconds
    const elapsedSeconds = Math.max(0, Math.floor((serverNow - lastClaimAt) / 1000));

    if (elapsedSeconds === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Core engine throttling. Coils settled too recently.' });
    }

    // 3. Fetch all actively running machine assets (Ignoring any expired lines)
    const fleetResult = await client.query(
      `SELECT machine_id, price_usdc, lease_days 
       FROM user_machines 
       WHERE telegram_id = $1 AND status = 'ACTIVE' AND expires_at > $2`,
      [telegramId, serverNow]
    );

    // If they click claim but don't own any active machinery, reset their timer and stop
    if (fleetResult.rows.length === 0) {
      await client.query(
        'UPDATE users SET last_claim_at = $1 WHERE telegram_id = $2',
        [serverNow, telegramId]
      );
      await client.query('COMMIT');
      return res.status(200).json({
        message: 'Claim sync complete. Core active fleet size is currently empty.',
        new_vault_balance: currentVaultBalance
      });
    }

    // 4. Run the master accumulation math loops across the active fleet rows
    let totalAccumulatedUCredits = 0;

    fleetResult.rows.forEach(machine => {
      const price = parseFloat(machine.price_usdc) || 0;
      
      // Strict configuration matching your exact system tier ROI requirements
      const roiPercentage = machine.lease_days === 30 ? 60.76 
                          : machine.lease_days === 60 ? 65.70 
                          : 70.06;

      const totalContractYieldUsdc = price * (1 + roiPercentage / 100);
      const totalSecondsInLease = machine.lease_days * 86400;
      
      // Calculate micro uCredits accrued per single second tick window
      const uCreditsPerSecond = (totalContractYieldUsdc * 1000000) / totalSecondsInLease;
      
      // Accumulate this machine's contribution over the elapsed timeframe
      totalAccumulatedUCredits += (elapsedSeconds * uCreditsPerSecond);
    });

    // 5. Convert accumulated uCredits pool into standard USDC dollars for the vault
    const earnedUsdc = totalAccumulatedUCredits / 1000000;
    const newVaultBalance = currentVaultBalance + earnedUsdc;

    // 6. Push balance settlements and update the timer checkpoint to the current server timestamp
    await client.query(
      'UPDATE users SET vault_balance = $1, last_claim_at = $2 WHERE telegram_id = $3',
      [newVaultBalance, serverNow, telegramId]
    );

    // 7. Write an audit record directly into historical logs
    await client.query(
      `INSERT INTO historical_ledgers (telegram_id, category, amount, status, created_at) 
       VALUES ($1, $2, $3, $4, $5)`,
      [telegramId, 'DEPOSIT', earnedUsdc, 'COMPLETED', serverNow]
    );

    await client.query('COMMIT'); // Commit all accounting changes permanently to PostgreSQL logs

    res.status(200).json({
      message: `Successfully synchronized core coils! Settled +${totalAccumulatedUCredits.toFixed(2)} uCredits ($${earnedUsdc.toFixed(4)} USDC) into your terminal vault.`,
      new_vault_balance: newVaultBalance
    });

  } catch (err) {
    await client.query('ROLLBACK'); // Core safety mechanism protects client balance from corruption loops
    
    // Local secure log output strictly for your terminal console window (The Admin)
    console.error(`🔻 [BULLETPROOF CLAIM EVENT FAULT][User: ${telegramId}]:`, err.stack);

    // Sanitized soft error message shown to user
    res.status(500).json({ 
      error: 'Settlement transaction failed. Node synchronization dropped. Contact grid team.' 
    });
  } finally {
    client.release(); // Free database line back to the connection pool instantly
  }
});

module.exports = router;