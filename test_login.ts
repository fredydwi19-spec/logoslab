const res = await fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: "testagent2",
    password: "user1234"
  })
});

const data = await res.json();
console.log("Status:", res.status);
console.log("Data:", JSON.stringify(data, null, 2));
process.exit(0);
