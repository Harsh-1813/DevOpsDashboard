"use client";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

type Metric = {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  timestamp: string;
};

export default function Home() {
  const [metrics, setMetrics] = useState<Metric[]>([]);

  useEffect(() => {
    fetchMetrics(); // Fetch initially
    const interval = setInterval(fetchMetrics, 60000); // Fetch every minute

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch("http://localhost:4040/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query { getLatestMetrics { cpuUsage memoryUsage diskUsage timestamp } }`,
        }),
      });

      const result = await response.json();
      if (result.data?.getLatestMetrics) {
        setMetrics((prev) => [...prev.slice(-9), result.data.getLatestMetrics]); // Keep last 10 metrics
      }
    } catch (error) {
      console.error("Error fetching metrics:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6">📊 Smart DevOps Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
        {/* CPU Usage Chart */}
        <ChartCard title="CPU Usage (%)">
          <Chart data={metrics} dataKey="cpuUsage" strokeColor="#22c55e" />
        </ChartCard>

        {/* Memory Usage Chart */}
        <ChartCard title="Memory Usage (%)">
          <Chart data={metrics} dataKey="memoryUsage" strokeColor="#3b82f6" />
        </ChartCard>

        {/* Disk Usage Chart */}
        <ChartCard title="Disk Usage (%)">
          <Chart data={metrics} dataKey="diskUsage" strokeColor="#facc15" />
        </ChartCard>
      </div>
    </div>
  );
}

// Reusable Card Component
const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-gray-800 p-4 rounded-lg shadow-lg w-full">
    <h2 className="text-lg font-semibold mb-4">{title}</h2>
    {children}
  </div>
);

// Reusable Chart Component
const Chart = ({ data, dataKey, strokeColor }: { data: Metric[]; dataKey: string; strokeColor: string }) => (
  <ResponsiveContainer width="100%" height={250}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#555" />
      <XAxis dataKey="timestamp" tick={{ fill: "white" }} tickFormatter={(t) => t.slice(11, 19)} />
      <YAxis tick={{ fill: "white" }} />
      <Tooltip />
      <Line type="monotone" dataKey={dataKey} stroke={strokeColor} strokeWidth={2} />
    </LineChart>
  </ResponsiveContainer>
);
