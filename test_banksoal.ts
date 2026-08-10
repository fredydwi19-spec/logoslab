import { jwt } from "@elysiajs/jwt";
import { db } from "./src/db/db";
import { bankSoalQuiz } from "./src/db/schema";
import { BankSoalQuizUI } from "./src/views/components/BankSoalQuiz";

// Generate a JWT manually for testagent2 (PEMBUAT_GAME, id=2)
const jwtSecret = process.env.JWT_SECRET || "super-secret-key";

// Use jose to sign a JWT
import { SignJWT } from "jose";
const secret = new TextEncoder().encode(jwtSecret);
const token = await new SignJWT({ id: 2, role: "PEMBUAT_GAME", username: "testagent2" })
  .setProtectedHeader({ alg: "HS256" })
  .sign(secret);

console.log("✅ JWT token generated");

// 1. Test the API endpoint
const res = await fetch("http://localhost:3000/api/bank-soal/quiz", {
  headers: { Cookie: `auth=${token}` }
});
const json = await res.json();
console.log("API /quiz response status:", res.status);
console.log("API /quiz response:", JSON.stringify(json).slice(0, 200));

// 2. Test the page render
const pageRes = await fetch("http://localhost:3000/dashboard/bank-soal/quiz", {
  headers: { Cookie: `auth=${token}` },
  redirect: "manual"
});
console.log("\nPage /dashboard/bank-soal/quiz status:", pageRes.status);

// 3. Check the component HTML for issues
const html = BankSoalQuizUI();

// Check for script syntax
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
const script = scriptMatch?.[1];
if (script !== undefined) {
  console.log("\n✅ Script tag found, length:", script.length);

  // Check for common issues
  if (script.includes("bankSoalQuizData")) {
    console.log("✅ bankSoalQuizData function found");
  }

  // Check for unescaped template literals that could break
  const backtickCount = (script.match(/`/g) || []).length;
  console.log(`📊 Backtick count in script: ${backtickCount} (should be even number)`);

  // Show first 500 chars of script
  console.log("\n--- Script start ---");
  console.log(script.slice(0, 500));
} else {
  console.log("❌ No script tag found in component HTML!");
}

// 4. Check x-data attribute
if (html.includes('x-data="bankSoalQuizData()"')) {
  console.log('\n✅ x-data="bankSoalQuizData()" found in HTML');
} else {
  console.log('\n❌ x-data="bankSoalQuizData()" NOT found!');
}

process.exit(0);
