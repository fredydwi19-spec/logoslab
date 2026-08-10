import { db } from "./src/db/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    console.log("Updating question_bank...");
    await db.execute(sql`ALTER TABLE question_bank MODIFY difficulty ENUM('RENDAH', 'MUDAH', 'SEDANG', 'SULIT', 'BONUS') NOT NULL`);
    await db.execute(sql`UPDATE question_bank SET difficulty = 'MUDAH' WHERE difficulty = 'RENDAH'`);
    await db.execute(sql`ALTER TABLE question_bank MODIFY difficulty ENUM('MUDAH', 'SEDANG', 'SULIT', 'BONUS') NOT NULL`);

    console.log("Updating game_questions_bank...");
    await db.execute(sql`ALTER TABLE game_questions_bank MODIFY difficulty ENUM('RENDAH', 'MUDAH', 'SEDANG', 'SULIT') NOT NULL`);
    await db.execute(sql`UPDATE game_questions_bank SET difficulty = 'MUDAH' WHERE difficulty = 'RENDAH'`);
    await db.execute(sql`ALTER TABLE game_questions_bank MODIFY difficulty ENUM('MUDAH', 'SEDANG', 'SULIT') NOT NULL`);

    console.log("Updating game_fill_the_blank...");
    await db.execute(sql`ALTER TABLE game_fill_the_blank MODIFY difficulty ENUM('RENDAH', 'MUDAH', 'SEDANG', 'SULIT') NOT NULL`);
    await db.execute(sql`UPDATE game_fill_the_blank SET difficulty = 'MUDAH' WHERE difficulty = 'RENDAH'`);
    await db.execute(sql`ALTER TABLE game_fill_the_blank MODIFY difficulty ENUM('MUDAH', 'SEDANG', 'SULIT') NOT NULL`);

    console.log("All enums updated successfully.");
  } catch (err) {
    console.error("Failed to update enums:", err);
  }
  process.exit(0);
}

run();
