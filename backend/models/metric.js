const mongoose = require("mongoose");

const MetricSchema = new mongoose.Schema({
  cpuUsage: Number,
  memoryUsage: Number,
  diskUsage: Number,
  timestamp: { type: Date, default: Date.now }
});

const Metric = mongoose.model("Metric", MetricSchema);

module.exports = Metric;
