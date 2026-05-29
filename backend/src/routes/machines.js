const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middlewares/auth');

// CONFIGURATION: Base speed modifiers per machine tier (USDC earned per second)
const TIER_SPEEDS = {
  1: 0.000005, // Tier 1 Rig
  2: 0.000015, // Tier 2 Rig
  3: 0.000045  // Tier 3 Rig
};

const CYCLE_LIMIT = 86400; // Ironclad 24-hour limit window in seconds

/**
 * ⚙️ GET /api/machines/my-fleet
 * Fetches all machines for the dropdown list with individual live calculations.
 */
router.get('/my-fleet', authMiddleware, async (req, res) => {
  try {
    const telegramId = req.user.telegram_id;

    // Fetch all active rented rigs owned by this user
    const machineQuery = `
      SELECT id, machine_tier, started_at, last_claim_at, expires_at 
      FROM user_machines 
      WHERE telegram_id = $1 AND expires_at > NOW()
      ORDER BY started_at ASC;
    `;
    const fleetResult = await db.query(machineQuery, [telegramId]);

    // Perform state machine matrix evaluations on each individual hardware row
    const calculatedFleet = fleetResult.rows.map((machine, index) => {
      const now = new Date();
      const lastClaim = new Date(machine.last_claim_at);
      
      // Calculate total seconds elapsed since the last claim milestone
      const totalSecondsElapsed = Math.max(0, Math.floor((now - lastClaim) / 1000));
      const baseSpeed = TIER_SPEEDS[machine.machine_tier] || 0.000005;

      let activeMinedSeconds = totalSecondsElapsed;
      let lossSeconds = 0;

      // Evaluate 24-hour pool exhaustion thresholds
      if (totalSecondsElapsed > CYCLE_LIMIT) {
        activeMinedSeconds = CYCLE_LIMIT;
        lossSeconds = totalSecondsElapsed - CYCLE_LIMIT;
      }

      // Compute precise USDC ledger metrics
      const currentMined = activeMinedSeconds * baseSpeed;
      const unminedLoss = lossSeconds * baseSpeed;
      
      // Compute remaining time on the active 24-hour countdown block
      const secondsRemaining = Math.max(0, CYCLE_LIMIT - totalSecondsElapsed);

      return {
        id: machine.id,
        dropdown_label: `🖥️ Machine ${index + 1} (Tier ${machine.machine_tier})`,
        tier: machine.machine_tier,
        status: secondsRemaining > 0 ? 'MINING' : 'EXHAUSTED_LOSS',
        metrics: {
          current_mined_usdc: parseFloat(currentMined.toFixed(6)),
          unmined_loss_usdc: parseFloat(unminedLoss.toFixed(6)),
          countdown_seconds_left: secondsRemaining
        },
        timeline: {
          last_claim_at: machine.last_claim_at,
          expires_at: machine.expires_at
        }
      };
    });

    res.status(200).json({
      account_id: telegramId,
      total_fleet_count: calculatedFleet.length,
      fleet: calculatedFleet
    });

  } catch (err) {
    console.error('🔻 [Fleet Route Fault]: Failed to calculate runtime pool array:', err.message);
    res.status(500).json({ error: 'Internal server calculation error.' });
  }
});

/**
 * 💰 POST /api/machines/claim/:machineId
 * Process isolating claims for one specific machine chosen from the dropdown.
 */
router.post('/claim/:machineId', authMiddleware, async (req, res) => {
  const { machineId } = req.params;
  const telegramId = req.user.telegram_id;

  try {
    // 1. Fetch targeted machine row and lock validation scope
    const machineCheck = await db.query(
      'SELECT * FROM user_machines WHERE id = $1 AND telegram_id = $2', 
      [machineId, telegramId]
    );

    if (machineCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Targeted hardware rig profile not found.' });
    }

    const machine = machineCheck.rows[0];
    const now = new Date();
    const lastClaim = new Date(machine.last_claim_at);
    const totalSecondsElapsed = Math.max(0, Math.floor((now - lastClaim) / 1000));
    const baseSpeed = TIER_SPEEDS[machine.machine_tier] || 0.000005;

    let activeMinedSeconds = totalSecondsElapsed;
    if (totalSecondsElapsed > CYCLE_LIMIT) {
      activeMinedSeconds = CYCLE_LIMIT;
    }

    const claimAmount = activeMinedSeconds * baseSpeed;

    if (claimAmount <= 0) {
      return res.status(400).json({ error: 'Zero transactional balance accrued in this block.' });
    }

    // 2. ACID Transaction Layer Execution: Update user balance and reset rig timestamp
    await db.query('BEGIN');

    // Update Master User Ledger Wallet
    await db.query(
      'UPDATE users SET vault_balance = vault_balance + $1 WHERE telegram_id = $2',
      [claimAmount, telegramId]
    );

    // Reset targeted machine's last_claim_at timestamp to restart 24-hour cycle
    await db.query(
      'UPDATE user_machines SET last_claim_at = NOW() WHERE id = $1',
      [machineId]
    );

    await db.query('COMMIT');

    res.status(200).json({
      status: 'TRANSACTION_SUCCESSFUL',
      machine_id: machineId,
      claimed_amount_usdc: parseFloat(claimAmount.toFixed(6)),
      timestamp: now
    });

  } catch (err) {
    await db.query('ROLLBACK');
    console.error('🔻 [Claim Core Fault]: Atomic rollback executed:', err.message);
    res.status(500).json({ error: 'Failed to complete ledger asset settlement transaction.' });
  }
});

module.exports = router;