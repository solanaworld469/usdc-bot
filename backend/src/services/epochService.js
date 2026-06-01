async function initializeMachineEpochs(machineId, telegramId, client) {
    try {
        const epochs = [];
        let currentStart = new Date();

        for (let month = 1; month <= 6; month++) {
            let currentEnd = new Date(currentStart);
            currentEnd.setDate(currentEnd.getDate() + 30); 

            const initialStatus = month === 1 ? 'ACCRUING' : 'LOCKED';

            epochs.push(`(
                '${machineId}', 
                ${telegramId}, 
                ${month}, 
                0.00000, 
                0.00000, 
                '${initialStatus}', 
                '${currentStart.toISOString()}', 
                '${currentEnd.toISOString()}'
            )`);

            currentStart = new Date(currentEnd); 
        }

        const insertQuery = `
            INSERT INTO machine_monthly_epochs 
            (machine_id, telegram_id, month_number, ucredits_mined, ucredits_leaked, claim_status, start_date, end_date)
            VALUES ${epochs.join(', ')}
        `;

        // Use 'client' instead of 'pool' here!
        await client.query(insertQuery);
        console.log(`[Epoch Engine] 6-Month tracking initialized for Machine: ${machineId}`);
        return true;
    } catch (error) {
        console.error('[Epoch Engine] Error creating epochs:', error);
        throw new Error('EPOCH_GENERATION_FAILED'); // Throws back to your router's catch block!
    }
}

module.exports = { initializeMachineEpochs };