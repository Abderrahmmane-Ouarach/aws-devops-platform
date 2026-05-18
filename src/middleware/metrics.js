const promClient = require("prom-client");

const register = promClient.register;
promClient.collectDefaultMetrics({ register });

const httpRequestCounter = new promClient.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status"],
});

const httpRequestDuration = new promClient.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration",
  labelNames: ["method", "route"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1],
});

const metricsMiddleware = (req, res, next) => {
  const end = httpRequestDuration.startTimer({
    method: req.method,
    route: req.path,
  });
  res.on("finish", () => {
    httpRequestCounter.inc({
      method: req.method,
      route: req.path,
      status: res.statusCode,
    });
    end();
  });
  next();
};

module.exports = { register, metricsMiddleware };