const express = require("express");
const { initDB } = require("./config/database");
const { connectRedis } = require("./config/redis");
const { register, metricsMiddleware } = require("./middleware/metrics");
const urlRoutes = require("./routes/urlRoutes");

const app = express();
app.use(express.json());
app.use(metricsMiddleware);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", version: "1.0.0", env: process.env.NODE_ENV });
});

// Metrics Prometheus
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.get("/", (req, res) => {
  res.json({ message: "URL Shortener API", docs: "/health" });
});

app.use("/", urlRoutes);

// Démarrage
const start = async () => {
  await connectRedis();
  await initDB();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
};

if (require.main === module) {
  start();
}

module.exports = app;