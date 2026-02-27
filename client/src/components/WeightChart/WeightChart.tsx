import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { WeightLog } from "@/types";
import styles from "./WeightChart.module.css";

type Props = {
  logs: WeightLog[];
};

export default function WeightChart({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyText}>No weight data yet. Log your first entry above.</p>
      </div>
    );
  }

  const data = logs.map((log) => {
    const date = new Date(log.date + "T12:00:00");
    const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return { label, weight: log.weight, unit: log.unit };
  });

  const unit = logs[logs.length - 1]?.unit ?? "lbs";

  return (
    <div className={styles.chartWrapper}>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
            tickLine={false}
            axisLine={false}
            unit={` ${unit}`}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              fontSize: 12,
            }}
            formatter={(value: number | undefined) => [`${value ?? ""} ${unit}`, "Weight"]}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#D4886A"
            strokeWidth={2}
            dot={{ fill: "#D4886A", r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
