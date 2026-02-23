const { Client } = require('pg');

async function testConnection() {
    const client = new Client({
        connectionString: "postgresql://neondb_owner:npg_B28dkgzjQRnp@ep-hidden-bird-ailfyijr.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"
    });
    try {
        await client.connect();
        console.log("Connected successfully!");
        const res = await client.query('SELECT NOW()');
        console.log(res.rows[0]);
        await client.end();
    } catch (err) {
        console.error("Connection error", err.stack);
    }
}

testConnection();
