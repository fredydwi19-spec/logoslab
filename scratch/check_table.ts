import mysql from 'mysql2/promise';

async function test() {
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);
    const [rows] = await connection.execute('SHOW TABLES LIKE "game_word_search"');
    console.log('Tables found:', rows);
    await connection.end();
  } catch (err) {
    console.error('Check failed:', err);
  }
}

test();
