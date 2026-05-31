// backend/src/mint_keys.js
const db = require('./config/db'); // 👈 We now use your app's native database config
const crypto = require('crypto');

/**
 * 🔐 Generates a secure, cryptographically random key signature
 * Format: SOL-XXXXXXXX
 */
function generateSecureKey() {
  const hex = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `SOL-${hex}`;
}

async function mintKeys(totalToMint = 1000) {
  // Connect using your existing PostgreSQL pool
  const client = await db.pool.connect();
  let successCount = 0;

  console.log(`\n⚙️ INITIATING VAULT MINT: Generating ${totalToMint} secure network keys...`);

  try {
    await client.query('BEGIN');

    for (let i = 0; i < totalToMint; i++) {
      const signature = generateSecureKey();
      
      // Insert new keys safely
      await client.query(
        `INSERT INTO activation_keys (key_signature, status) 
         VALUES ($1, 'AVAILABLE') 
         ON CONFLICT (key_signature) DO NOTHING`,
        [signature]
      );
      successCount++;
    }

    await client.query('COMMIT');
    console.log(`✅ VAULT SECURED: Successfully minted and stored ${successCount} AVAILABLE keys.`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`🔻 MINTING FAILURE:`, error);
  } finally {
    client.release();
    // End the pool so the terminal script cleanly finishes and exits
    db.pool.end(); 
  }
}

// Execute the mint
mintKeys(1000);