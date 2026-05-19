const request = require("supertest");
const app = require("../src/app");

jest.mock("../src/config/database", () => ({
  pool: {
    query: jest.fn(),
  },
  initDB: jest.fn(),
}));

// Mock Redis
jest.mock("../src/config/redis", () => ({
  client: {
    get: jest.fn(),
    setEx: jest.fn(),
    connect: jest.fn(),
  },
  connectRedis: jest.fn(),
}));

const { pool } = require("../src/config/database");
const { client: redis } = require("../src/config/redis");

describe("GET /health", () => {
  it("retourne status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("POST /shorten", () => {
  it("crée un lien court", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ code: "abc1234", original: "https://google.com" }],
    });

    const res = await request(app)
      .post("/shorten")
      .send({ url: "https://google.com" });

    expect(res.statusCode).toBe(201);
    expect(res.body.code).toBeDefined();
    expect(res.body.short).toContain(res.body.code);
  });

  it("retourne 400 si url manquante", async () => {
    const res = await request(app).post("/shorten").send({});
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /:code", () => {
  it("redirige depuis le cache Redis", async () => {
    redis.get.mockResolvedValueOnce("https://google.com");
    pool.query.mockResolvedValueOnce({});

    const res = await request(app).get("/abc1234");
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe("https://google.com");
  });

  it("retourne 404 si code inexistant", async () => {
    redis.get.mockResolvedValueOnce(null);
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get("/inexistant");
    expect(res.statusCode).toBe(404);
  });
});

describe("GET /stats/:code", () => {
  it("retourne les stats d'un lien", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        code: "abc1234",
        original: "https://google.com",
        clicks: 42,
        created_at: new Date(),
      }],
    });

    const res = await request(app).get("/stats/abc1234");
    expect(res.statusCode).toBe(200);
    expect(res.body.clicks).toBe(42);
  });
});