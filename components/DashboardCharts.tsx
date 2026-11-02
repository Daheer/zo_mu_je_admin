"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const PIE_COLORS = ["#56A48C", "#3B82F6", "#F59E0B", "#10B981", "#EF4444"];

interface PieDataItem {
  name: string;
  value: number;
}

interface BarDataItem {
  date: string;
  earnings: number;
}

export function DashboardCharts({
  pieData,
  earningsByDay,
}: {
  pieData: PieDataItem[];
  earningsByDay: BarDataItem[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 [&_.recharts-pie-label-text]:fill-foreground">
      <div className="rounded-2xl border border-border bg-background p-5 shadow-card">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Trips by status
        </h2>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                isAnimationActive={false}
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                labelLine={false}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend formatter={(value) => {
                const total = pieData.reduce((sum, item) => sum + item.value, 0);
                const count = pieData.find(item => item.name === value)?.value ?? 0;
                return <span className="text-foreground">{String(value).replace(/_/g, " ")} {total ? Math.round(count / total * 100) : 0}%</span>;
              }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted-foreground py-8 text-center">No trip data yet</p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-background p-5 shadow-card">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Earnings (last 7 days)
        </h2>
        {earningsByDay.some((d) => d.earnings > 0) ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={earningsByDay}>
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "rgb(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 12, fill: "rgb(var(--muted-foreground))" }} />
              <Tooltip
                itemStyle={{ color: "var(--foreground)" }}
                labelStyle={{ color: "var(--foreground)" }}
                contentStyle={{ background: "var(--background)", color: "var(--foreground)", borderColor: "rgb(var(--border))" }}
                formatter={(v: number | undefined) => [
                  `₦${(v ?? 0).toLocaleString()}`,
                  "Earnings",
                ]}
              />
              <Bar isAnimationActive={false} dataKey="earnings" fill="#56A48C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted-foreground py-8 text-center">
            No earnings in the last 7 days
          </p>
        )}
      </div>
    </div>
  );
}
