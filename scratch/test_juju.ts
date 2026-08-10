const res = await fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: "jujukalase732",
    password: "user1234" // Wait, I don't know Juju's password!
  })
});
// Juju Kalase logged in via Google, so they don't have a password.
// I'll just set a password for Juju to test.
