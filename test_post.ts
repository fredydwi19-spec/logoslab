import { jwt } from "@elysiajs/jwt";
import { SignJWT } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "super-secret-key");
const token = await new SignJWT({ id: 2, role: "PEMBUAT_GAME", username: "testagent2" })
  .setProtectedHeader({ alg: "HS256" })
  .sign(secret);

console.log("Testing POST /api/bank-soal/quiz");
const resPost = await fetch("http://localhost:3000/api/bank-soal/quiz", {
  method: "POST",
  headers: { 
    "Content-Type": "application/json",
    "Cookie": `auth=${token}` 
  },
  body: JSON.stringify({
    question: "Test question?",
    optionA: "A",
    optionB: "B",
    optionC: "C",
    optionD: "D",
    correctAnswer: "A",
    difficulty: "MUDAH",
    explanation: ""
  })
});

console.log("POST /quiz status:", resPost.status);
console.log("POST /quiz response:", await resPost.text());

console.log("\nTesting POST /api/bank-soal/import/quiz");
const formData = new FormData();
formData.append("file", new Blob(["question,optionA,optionB,optionC,optionD,correctAnswer,difficulty,explanation\n1+1?,1,2,3,4,B,MUDAH,"], { type: "text/csv" }), "test.csv");

const resImport = await fetch("http://localhost:3000/api/bank-soal/import/quiz", {
  method: "POST",
  headers: {
    "Cookie": `auth=${token}`
  },
  body: formData
});

console.log("POST /import/quiz status:", resImport.status);
console.log("POST /import/quiz response:", await resImport.text());
process.exit(0);
