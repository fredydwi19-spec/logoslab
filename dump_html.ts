const loginRes = await fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: "jujukalase732",
    password: "user1234"
  })
});

const cookie = loginRes.headers.get("set-cookie");

const dashRes = await fetch("http://localhost:3000/dashboard/user", {
  headers: { "Cookie": cookie || "" }
});

const html = await dashRes.text();
const fs = require("fs");
fs.writeFileSync("dash_dump.html", html);
console.log("HTML length:", html.length);
process.exit(0);
