import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { adventuresStubRouter } from "./adventures.stub.router";

const app = express();
app.use("/adventures", adventuresStubRouter);

describe("adventures stub router (AC-10)", () => {
  it("GET /adventures returns { success: true, data: [] } (AC-10)", async () => {
    const res = await request(app).get("/adventures");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: [] });
  });

  it("GET /adventures?status=active returns empty array (AC-10)", async () => {
    const res = await request(app).get("/adventures?status=active");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it("GET /adventures?status=completed returns empty array (AC-10)", async () => {
    const res = await request(app).get("/adventures?status=completed");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});
