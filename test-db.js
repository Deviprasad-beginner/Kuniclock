const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL,
    });

    try {
        await client.connect();
        console.log('Connected to Neon successfully using pg module!');
        const res = await client.query('SELECT NOW()');
        console.log('Time from DB:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('Connection error', err.stack);
    }
}

testConnection();
