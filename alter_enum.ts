import { pool } from "./src/db/db";

async function main() {
  try {
    const conn = await pool.getConnection();
    await conn.query("ALTER TABLE projects MODIFY COLUMN materi_type ENUM('TEKS','VIDEO','MANUAL');");
    console.log("Enum modified successfully");
    conn.release();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
