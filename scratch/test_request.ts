async function testApi() {
  const payload = {
    message: "Apa itu Logos LAB?",
    context: "Manajemen Proyek - Ketua Tim"
  };
  const res = await fetch("http://localhost:3000/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", data);
}

testApi();
