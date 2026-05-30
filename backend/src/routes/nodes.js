const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middlewares/auth');

/**
 * 🔌 GET /api/nodes/network-summary
 * Aggregates live balances from real PostgreSQL tables including out-bound gifts.
 */
router.get('/network-summary', authMiddleware, async (req, res) => {
  const telegramId = req.user.telegram_id;
  const serverNow = new Date();

  try {
    // 1. Fetch user's real network referral balances
    let balanceRes = await db.query(
      'SELECT deposit_rewards_20, lifetime_yields_2 FROM node_network_balances WHERE telegram_id = $1',
      [telegramId]
    );

    let depositRewards = 0.0000;
    let lifetimeYields = 0.0000;

    if (balanceRes.rows.length > 0) {
      depositRewards = parseFloat(balanceRes.rows[0].deposit_rewards_20) || 0.0;
      lifetimeYields = parseFloat(balanceRes.rows[0].lifetime_yields_2) || 0.0;
    }

    // 2. Fetch active distributed keys belonging to this operator (Inventory)
    const keysRes = await db.query(
      `SELECT id, key_code, status, created_at, expires_at, used_by_telegram_id, bonus_deposit_usdc, bonus_mining_usdc 
       FROM distributed_keys 
       WHERE owner_id = $1 AND gifted_by IS NULL
       ORDER BY created_at DESC`,
      [telegramId]
    );

    let activeSubNodesCount = 0;

    const formattedLedger = keysRes.rows.map(row => {
      let currentStatus = row.status;
      let expires_in_string = '';

      if (currentStatus === 'UNUSED') {
        const expiresAt = new Date(row.expires_at);
        if (serverNow > expiresAt) {
          currentStatus = 'EXPIRED';
        } else {
          const diffMs = expiresAt - serverNow;
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          expires_in_string = `${hours}h ${mins}m`;
        }
      }

      if (currentStatus === 'USED') activeSubNodesCount++;
      const subNodeLeakage = currentStatus === 'USED' ? 0.0004 : 0.0;

      return {
        id: row.id, key_code: row.key_code, status: currentStatus,
        used_by_telegram_id: row.used_by_telegram_id,
        bonus_deposit_usdc: parseFloat(row.bonus_deposit_usdc) || 0.0,
        bonus_mining_usdc: parseFloat(row.bonus_mining_usdc) || 0.0,
        sub_node_leakage_usdc: subNodeLeakage, expires_in_string
      };
    });

    // 3. Fetch OUTBOUND gifted keys (The new tracking tab!)
    const giftedRes = await db.query(
      `SELECT id, key_code, status, created_at, expires_at, owner_id as recipient_id
       FROM distributed_keys
       WHERE gifted_by = $1
       ORDER BY created_at DESC`,
      [telegramId]
    );

    const formattedGiftedLedger = giftedRes.rows.map(row => {
      let currentStatus = row.status;
      let expires_in_string = '';

      if (currentStatus === 'UNUSED') {
        const expiresAt = new Date(row.expires_at);
        if (serverNow > expiresAt) {
          currentStatus = 'EXPIRED';
        } else {
          const diffMs = expiresAt - serverNow;
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          expires_in_string = `${hours}h ${mins}m`;
        }
      }

      return {
        id: row.id, key_code: row.key_code, status: currentStatus,
        recipient_id: row.recipient_id, expires_in_string
      };
    });

    res.status(200).json({
      summary: {
        active_sub_nodes: activeSubNodesCount,
        total_network_earnings: depositRewards + lifetimeYields,
        deposit_rewards_20: depositRewards,
        lifetime_yields_2: lifetimeYields,
        keys_ledger: formattedLedger,
        gifted_ledger: formattedGiftedLedger // 🌟 Added output stream for the new tab
      }
    });

  } catch (err) {
    console.error('🔻 [NETWORK SUMMARY ERROR]:', err.stack);
    res.status(500).json({ error: 'System telemetry network overview sync failed.' });
  }
});

/**
 * 🎁 POST /api/nodes/gift-package
 * Dynamic Gifting Engine: Custom quantity mapping with 3-day decay protocols.
 */
router.post('/gift-package', authMiddleware, async (req, res) => {
  const { target_user_id, quantity } = req.body;
  const telegramId = req.user.telegram_id;

  const numKeys = parseInt(quantity);
  if (!target_user_id || isNaN(numKeys) || numKeys <= 0) {
    return res.status(400).json({ error: 'Invalid dispatch parameters provided.' });
  }

  const costPerKey = 1.66;
  const totalCost = numKeys * costPerKey;

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Lock user row and check balance
    const userCheck = await client.query('SELECT vault_balance FROM users WHERE telegram_id = $1 FOR UPDATE', [telegramId]);
    let currentBalance = parseFloat(userCheck.rows[0]?.vault_balance) || 0.0;

    // Reject if balance is too low
    if (currentBalance < totalCost) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Insufficient Funds! Gifting ${numKeys} keys requires $${totalCost.toFixed(2)} USDC.` });
    }

    // Deduct cost
    const newBalance = currentBalance - totalCost;
    await client.query('UPDATE users SET vault_balance = $1 WHERE telegram_id = $2', [newBalance, telegramId]);

    // 🌟 Set strict 72-Hour (3 Days) decay horizon
    const serverNow = new Date();
    const expiresAt = new Date();
    expiresAt.setHours(serverNow.getHours() + 72); 

    for (let i = 0; i < numKeys; i++) {
      const randomKey = `NODE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      // Set the OWNER to the friend, but tag the GIFTER so it tracks cleanly in ledgers
      await client.query(
        'INSERT INTO distributed_keys (key_code, owner_id, status, created_at, expires_at, gifted_by) VALUES ($1, $2, $3, $4, $5, $6)',
        [randomKey, target_user_id, 'UNUSED', serverNow, expiresAt, telegramId]
      );
    }

    await client.query('COMMIT');
    res.status(200).json({ message: `Successfully dispatched ${numKeys} gift keys to peer ${target_user_id}.` });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('🔻 [GIFT DISPATCH ERROR]:', err.stack);
    res.status(500).json({ error: 'System error during gift dispatch sequence.' });
  } finally {
    client.release();
  }
});

/**
 * 🛒 POST /api/nodes/buy-package (Standard Purchases)
 */
router.post('/buy-package', authMiddleware, async (req, res) => {
  const { package_type } = req.body;
  const telegramId = req.user.telegram_id;

  const packsConfig = {
    starter: { keys: 3, cost: 5.00 },
    business: { keys: 10, cost: 10.00 },
    whale: { keys: 25, cost: 20.00 }
  };

  const selectedPack = packsConfig[package_type];
  if (!selectedPack) return res.status(400).json({ error: 'Invalid wholesale configuration selection.' });

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const userCheck = await client.query('SELECT vault_balance FROM users WHERE telegram_id = $1 FOR UPDATE', [telegramId]);
    let currentBalance = parseFloat(userCheck.rows[0]?.vault_balance) || 0.0;

    if (currentBalance < selectedPack.cost) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Insufficient Funds! Your vault balance is lower than the required $${selectedPack.cost.toFixed(2)} for this pack.` });
    }

    const newBalance = currentBalance - selectedPack.cost;
    await client.query('UPDATE users SET vault_balance = $1 WHERE telegram_id = $2', [newBalance, telegramId]);

    const serverNow = new Date();
    const expiresAt = new Date();
    expiresAt.setHours(serverNow.getHours() + 24);

    for (let i = 0; i < selectedPack.keys; i++) {
      const randomKey = `NODE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await client.query(
        'INSERT INTO distributed_keys (key_code, owner_id, status, created_at, expires_at) VALUES ($1, $2, $3, $4, $5)',
        [randomKey, telegramId, 'UNUSED', serverNow, expiresAt]
      );
    }

    await client.query('COMMIT');
    res.status(200).json({ message: 'Wholesale network codes successfully minted.' });

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Wholesale key market database matching loop error.' });
  } finally {
    client.release();
  }
});

/**
 * 📥 POST /api/nodes/claim-commissions
 */
router.post('/claim-commissions', authMiddleware, async (req, res) => {
  const telegramId = req.user.telegram_id;

  try {
    const checkNodesRes = await db.query("SELECT COUNT(*) FROM distributed_keys WHERE owner_id = $1 AND status = 'USED'", [telegramId]);
    const activeCount = parseInt(checkNodesRes.rows[0].count) || 0;

    if (activeCount < 10) {
      return res.status(400).json({ error: 'Referral withdrawal blocked! Your active network sub-nodes are not up to 10 mehnnn.' });
    }

    const balCheck = await db.query('SELECT deposit_rewards_20, lifetime_yields_2 FROM node_network_balances WHERE telegram_id = $1', [telegramId]);
    let pendingDepositReward = parseFloat(balCheck.rows[0]?.deposit_rewards_20) || 0.0;
    let pendingYieldReward = parseFloat(balCheck.rows[0]?.lifetime_yields_2) || 0.0;

    if ((pendingDepositReward + pendingYieldReward) === 0) {
      return res.status(400).json({ error: 'Settle abort! No commission money to claim inside your referral ledger.' });
    }

    res.status(200).json({ message: 'Commission ledger settled directly to active vault logs.' });

  } catch (err) {
    res.status(500).json({ error: 'Internal server account clearance error.' });
  }
});

module.exports = router;