import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatTaka } from "../../../lib/format";
import { strings } from "../../strings";

const t = strings.admin.dashboard.chart;

const compact = (value) => (value >= 1000 ? `${Math.round(value / 100) / 10}k` : String(value));

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { label, revenue, orders } = payload[0].payload;
  return (
    <div className="rounded-card border border-line bg-raised px-3 py-2 text-small text-fg shadow-surface">
      <p className="font-semibold">{label}</p>
      <p>{formatTaka(revenue)}</p>
      <p className="text-muted">{t.orders(orders)}</p>
    </div>
  );
}

// Colours come from tokens: bars use the brand fill, grid and ticks inherit `text-muted`.
function RevenueChart({ series, summary }) {
  return (
    <div role="img" aria-label={t.label(summary)} className="h-60 w-full text-muted">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={series} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.2} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "currentColor", fontSize: 12 }}
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis
            width={40}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "currentColor", fontSize: 12 }}
            tickFormatter={compact}
            allowDecimals={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "currentColor", fillOpacity: 0.08 }} />
          <Bar dataKey="revenue" className="fill-brand" radius={[2, 2, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default RevenueChart;
