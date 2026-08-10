async function check() {
  try {
    const res = await fetch("https://image.pollinations.ai/prompt/test", { signal: AbortSignal.timeout(5000) });
    console.log(res.status, res.headers.get("content-type"));
  } catch (e) {
    console.log(e.message);
  }
}
check();
