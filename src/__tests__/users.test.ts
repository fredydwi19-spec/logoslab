import { describe, it, expect } from "bun:test";

const BASE_URL = "http://127.0.0.1:3000";

describe("Users API", () => {
  it("GET /health should return ok", async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const body = (await res.json()) as any;
    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
  });

  it("GET /users should return array", async () => {
    const res = await fetch(`${BASE_URL}/users`);
    const body = (await res.json()) as any;
    expect(res.status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("POST /users should create user", async () => {
    const res = await fetch(`${BASE_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Bun Tester", email: `test_${Date.now()}@example.com` }),
    });
    const body = (await res.json()) as any;
    expect(res.status).toBe(200);
    expect(body.data.name).toBe("Bun Tester");
  });
});
