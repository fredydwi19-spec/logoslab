const loginRes = await fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: "jujukalase732",
    password: "user1234"
  })
});

const cookie = loginRes.headers.get("set-cookie");
console.log("Cookie:", cookie);

const dashRes = await fetch("http://localhost:3000/dashboard/user", {
  headers: { "Cookie": cookie || "" }
});

const html = await dashRes.text();
console.log("HTML length:", html.length);
if (html.includes("Permainan Tersedia")) {
  console.log("✅ Dashboard shows available games section");
} else {
  console.log("❌ Dashboard MISSING available games section");
}

if (html.includes("Perjalanan Bangsa Israel")) {
  console.log("✅ Dashboard shows the specific game");
} else {
  console.log("❌ Dashboard MISSING the specific game");
}

process.exit(0);
