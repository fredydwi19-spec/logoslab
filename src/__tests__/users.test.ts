import { describe, it, expect } from "bun:test";

const BASE_URL = "http://127.0.0.1:3000";

describe("Users API", () => {
  it("GET /users/count should be public and return a number", async () => {
    const res = await fetch(`${BASE_URL}/users/count`);
    const body = (await res.json()) as any;
    expect(res.status).toBe(200);
    expect(typeof body.count).toBe("number");
  });

  it("GET /users without login should be rejected", async () => {
    const res = await fetch(`${BASE_URL}/users`);
    expect(res.status).toBe(401);
  });

  it("POST /users without login should be rejected", async () => {
    const res = await fetch(`${BASE_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Bun Tester", email: `test_${Date.now()}@example.com` }),
    });
    expect(res.status).toBe(401);
  });
});
