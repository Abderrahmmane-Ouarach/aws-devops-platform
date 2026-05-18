const { nanoid } = require("nanoid");
const { pool } = require("../config/database");
const { client: redis } = require("../config/redis");

const CACHE_TTL = 3600; 

// POST /shorten
const shortenUrl = async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "url is required" });
  }

  try {
    const code = nanoid(7);
    const result = await pool.query(
      "INSERT INTO urls (code, original) VALUES ($1, $2) RETURNING *",
      [code, url]
    );

    res.status(201).json({
      code,
      short: `${process.env.BASE_URL}/${code}`,
      original: url,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /:code  → redirect
const redirectUrl = async (req, res) => {
  const { code } = req.params;

  try {
    // 1. Cherche dans Redis
    const cached = await redis.get(`url:${code}`);
    if (cached) {
      await pool.query("UPDATE urls SET clicks = clicks + 1 WHERE code = $1", [code]);
      return res.redirect(cached);
    }

    // 2. Pas en cache → cherche dans PostgreSQL
    const result = await pool.query(
      "SELECT original FROM urls WHERE code = $1",
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "URL not found" });
    }

    const original = result.rows[0].original;

    // 3. Met en cache pour la prochaine fois
    await redis.setEx(`url:${code}`, CACHE_TTL, original);

    // 4. Incrémente le compteur de clics
    await pool.query("UPDATE urls SET clicks = clicks + 1 WHERE code = $1", [code]);

    res.redirect(original);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /stats/:code
const getStats = async (req, res) => {
  const { code } = req.params;

  try {
    const result = await pool.query(
      "SELECT code, original, clicks, created_at FROM urls WHERE code = $1",
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "URL not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { shortenUrl, redirectUrl, getStats };