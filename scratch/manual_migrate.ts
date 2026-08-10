import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

async function test() {
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);
    const sql = fs.readFileSync(path.join(process.cwd(), 'drizzle', '0006_daffy_psylocke.sql'), 'utf8');
    
    // Split statements by statement-breakpoint or semicolon
    const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s.length > 0);
    
    for (const statement of statements) {
      console.log('Executing:', statement);
      await connection.execute(statement);
    }
    
    console.log('Migration applied manually');
    await connection.end();
  } catch (err) {
    console.error('Manual migration failed:', err);
  }
}

test();
