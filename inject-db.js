const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function main() {
    // Use the connection string from .env
    const sql = neon(process.env.DATABASE_URL);

    try {
        console.log('Adding intent column to StudySession...');
        await sql`ALTER TABLE "StudySession" ADD COLUMN IF NOT EXISTS "intent" TEXT;`;
        console.log('Success!');

        console.log('Creating UserTarget table...');
        await sql`
      CREATE TABLE IF NOT EXISTS "UserTarget" (
        "userId" TEXT NOT NULL,
        "dailySeconds" INTEGER NOT NULL DEFAULT 7200,
        "currentStreak" INTEGER NOT NULL DEFAULT 0,
        "lastHitDate" TEXT,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "UserTarget_pkey" PRIMARY KEY ("userId")
      );
    `;
        console.log('Success!');

        console.log('Schema injected successfully!');
    } catch (error) {
        console.error('Error injecting schema:', error);
    }
}

main();
