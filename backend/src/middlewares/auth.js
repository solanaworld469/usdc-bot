const crypto = require('crypto');
const db = require('../config/db');

/**
 * Ironclad Authentication Middleware
 * Safe-guards routes using Telegram WebApp initData signatures.
 * Automatically provisions a Mock Environment when running in local development mode.
 */
module.exports = async (req, res, next) => {
  try {
    let userPayload = null;

    // 1. CONDITIONAL SECURITY CHECK: Isolate Local Development Mode
    if (process.env.NODE_ENV === 'development') {
      // Create a deterministic local test runner profile
      userPayload = {
        id: 999999999,
        username: 'test_miner_dev'
      };
    } else {
      // PRODUCTION GUARD: Enforce real cryptographic Telegram signature checks
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Access Denied. Security Authorization token missing.' });
      }

      // Parse the standard WebApp initData parameter string
      const urlParams = new URLSearchParams(authHeader);
      const hash = urlParams.get('hash');
      urlParams.delete('hash');

      // Sort keys alphabetically to match Telegram's encryption signature rule
      const dataCheckArr = [];
      for (const [key, value] of urlParams.entries()) {
        dataCheckArr.push(`${key}=${value}`);
      }
      dataCheckArr.sort();
      const dataCheckString = dataCheckArr.join('\n');

      // Generate the validation signature using your secret Bot Token
      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(process.env.TELEGRAM_BOT_TOKEN || '').digest();
      const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

      // Abort immediately if the packet signature has been tampered with
      if (hmac !== hash) {
        return res.status(403).json({ error: 'Access Denied. Cryptographic signature check failure.' });
      }

      // Extract the authenticated user JSON string from the header packet
      const userRaw = urlParams.get('user');
      if (!userRaw) {
        return res.status(400).json({ error: 'Access Denied. Profile payload data structural error.' });
      }
      userPayload = JSON.parse(userRaw);
    }

    // 2. AUTOMATIC ONBOARDING LEDGER INTEGRATION (Zero-Leak Onboarding)
    // Inserts the user if they don't exist, updates registration state if they came from the bot
    const upsertUserQuery = `
      INSERT INTO users (telegram_id, username, app_registered)
      VALUES ($1, $2, TRUE)
      ON CONFLICT (telegram_id) 
      DO UPDATE SET username = EXCLUDED.username, app_registered = TRUE
      RETURNING telegram_id, username, vault_balance, operator_rank, is_activated;
    `;

    const userResult = await db.query(upsertUserQuery, [userPayload.id, userPayload.username]);
    
    // 3. SECURE PASSING LAYER
    // Attach the verified PostgreSQL database user information onto the request channel
    req.user = userResult.rows[0];
    
    // Pass execution cleanly to the target API endpoint router
    next();

  } catch (err) {
    console.error('🔻 [Security Middleware Fault]: Critical validation loop crash:', err.message);
    return res.status(500).json({ error: 'Internal Security Gateway validation anomaly.' });
  }
};