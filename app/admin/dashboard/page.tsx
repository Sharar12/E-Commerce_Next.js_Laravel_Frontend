"use client";

import { useEffect, useState, useMemo } from "react";
import { useGetDashboardStatsQuery } from "../../services/dashboardApi";
import AdminLayout from "../AdminLayout";
import Link from "next/link";
import {
  Crown,
  Sparkles,
  TrendingUp,
  Package,
  ShoppingBag,
  Gem,
  ArrowUpRight,
  FileText,
  Plus,
  Users,
  ShieldCheck,
  ChevronRight,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
  PieChart as RePieChart, Pie, Cell, Sector,
  LineChart, Line,
} from "recharts";

// ─── Colour palette ───
const GOLD = "#C5A059";
const DARK = "#1C1A17";
const SOFT = "#8C6D2B";
const BG = "#FAF8F5";
const BORDER = "#E8E2D5";

const CHART_COLORS = ["#C5A059", "#1C1A17", "#8C6D2B", "#B8860B", "#D4AF37", "#5A554C"];

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  paid: "#10B981",
  shipped: "#3B82F6",
  delivered: "#8B5CF6",
  cancelled: "#EF4444",
};

interface DashboardData {
  metrics: {
    total_products: number;
    total_orders: number;
    total_users: number;
    total_revenue: number;
  };
  orders_by_status: Record<string, number>;
  weekly_chart?: { label: string; revenue: number; orders: number }[];
  monthly_chart?: { label: string; revenue: number; orders: number }[];
  yearly_chart?: { label: string; revenue: number; orders: number }[];
  monthly_revenue: { month: string; revenue: number }[];
  monthly_orders: { month: string; orders: number }[];
  top_products: { product_id: number; total_qty: number; total_revenue: number; product?: { id: number; name: string } }[];
  recent_orders: any[];
}

// ─── Custom tooltip ───
const ChartTooltip = ({ active, payload, label, prefix = "৳" }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-md border border-[#E8E2D5] rounded-xl px-4 py-3 shadow-xl text-xs">
      <p className="text-[#8C6D2B] font-bold uppercase tracking-wider mb-1">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="text-[#1C1A17] font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          {entry.name}: {prefix}{typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
};

// ─── Active shape for pie ───
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 4} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#1C1A17" fontSize={24} fontWeight="bold" fontFamily="serif">{value}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#8C6D2B" fontSize={10} fontWeight="bold" style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}>Orders</text>
    </g>
  );
};

export default function DashboardPage() {
  const { data: response, isLoading: loading } = useGetDashboardStatsQuery();
  const data = (response?.data as unknown as DashboardData) || null;
  const [activePieIndex, setActivePieIndex] = useState(0);
  const [chartType, setChartType] = useState<"area" | "bar" | "line">("area");
  const [timeframe, setTimeframe] = useState<"weekly" | "monthly" | "yearly">("monthly");

  // ── Active Chart Data based on selected timeframe (Weekly, Monthly, Yearly) ──
  const activeChartData = useMemo(() => {
    if (!data) return [];
    if (timeframe === "weekly" && data.weekly_chart && data.weekly_chart.length > 0) {
      return data.weekly_chart;
    }
    if (timeframe === "yearly" && data.yearly_chart && data.yearly_chart.length > 0) {
      return data.yearly_chart;
    }
    if (data.monthly_chart && data.monthly_chart.length > 0) {
      return data.monthly_chart;
    }
    return (data.monthly_revenue || []).map((rev) => {
      const ord = (data.monthly_orders || []).find((o) => o.month === rev.month);
      return {
        label: rev.month,
        revenue: rev.revenue,
        orders: ord?.orders || 0,
      };
    });
  }, [data, timeframe]);

  // ── Order status data for pie ──
  const orderStatusData = data
    ? Object.entries(data.orders_by_status).map(([name, value]) => ({ name, value }))
    : [];

  // ── Top products data ──
  const topProductsData = (data?.top_products || []).map((p) => ({
    name: p.product?.name || `Product #${p.product_id}`,
    qty: p.total_qty,
    revenue: p.total_revenue,
  }));

  // ── Metric cards ──
  const metrics = data
    ? [
      {
        title: "Curated Masterpieces",
        value: data.metrics.total_products.toString(),
        subtext: "Active Products in Catalog",
        growth: `${data.metrics.total_products > 0 ? "+" : ""}${data.metrics.total_products} total`,
        icon: Package,
      },
      {
        title: "Patron Reservations",
        value: data.metrics.total_orders.toString(),
        subtext: "Total Order Volume",
        growth: `${(data.orders_by_status?.delivered || 0)} delivered`,
        icon: ShoppingBag,
      },
      {
        title: "Cumulative Gross Revenue",
        value: `৳${data.metrics.total_revenue.toLocaleString()}`,
        subtext: "Verified Atelier Inflow",
        growth: `${data.metrics.total_users} active patrons`,
        icon: DollarSign,
      },
      {
        title: "Salon VIP Engagement",
        value: data.metrics.total_users.toString(),
        subtext: "Registered Patrons",
        growth: `${orderStatusData.reduce((a, b) => a + b.value, 0)} total orders`,
        icon: Users,
      },
    ]
    : [];

  return (
    <AdminLayout>
      <div className="space-y-8 selection:bg-[#C5A059] selection:text-white font-sans text-[#1C1A17] antialiased">

        {/* ─── 1. WELCOME BANNER ─── */}
        <div className="relative bg-gradient-to-br from-[#FFFDF9] via-[#FAF8F5] to-[#F5EFE4] rounded-2xl p-8 border border-[#D4AF37]/40 shadow-sm overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#D4AF37]/15 rounded-full blur-[100px] pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 border border-[#D4AF37]/30 shadow-sm backdrop-blur-md mb-3">
                <Crown className="w-3.5 h-3.5 text-[#C5A059]" />
                <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#8C6D2B]">Maison Command • Executive Suite</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif text-[#1C1A17] tracking-tight">Atelier Command Center</h1>
              <p className="text-xs sm:text-sm text-[#5A554C] font-light leading-relaxed mt-1">
                Real-time oversight of luxury curations, patron reservations, and financial flows.
                {loading && <span className="ml-2 text-[#C5A059]">Loading analytics...</span>}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/products" className="inline-flex items-center gap-2 px-5 py-3 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 shadow-md group rounded-xl">
                <Plus className="w-3.5 h-3.5 text-[#D4AF37] group-hover:text-white transition-colors" />
                <span>New Curation</span>
              </Link>
              <Link href="/admin/reports" className="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-[#FAF8F5] text-[#1C1A17] border border-[#E8E2D5] hover:border-[#C5A059] text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 shadow-sm rounded-xl">
                <FileText className="w-3.5 h-3.5 text-[#8C6D2B]" />
                <span>Executive Report</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ─── 2. METRIC CARDS ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-[#E8E2D5] shadow-sm space-y-3 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-24 bg-[#E8E2D5] rounded" />
                  <div className="w-10 h-10 rounded-full bg-[#E8E2D5]" />
                </div>
                <div className="h-8 w-28 bg-[#E8E2D5] rounded" />
                <div className="pt-2 border-t border-[#E8E2D5] flex items-center justify-between">
                  <div className="h-3 w-20 bg-[#E8E2D5] rounded" />
                  <div className="h-3 w-16 bg-[#E8E2D5] rounded" />
                </div>
              </div>
            ))
          ) : (
            metrics.map((metric, idx) => {
              const Icon = metric.icon;
              return (
                <div key={idx} className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-[#E8E2D5] shadow-sm hover:border-[#C5A059] transition-all duration-300 space-y-3 group">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C6D2B]">{metric.title}</span>
                    <div className="w-10 h-10 rounded-full bg-[#FAF8F5] border border-[#C5A059]/30 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Icon className="w-4 h-4 text-[#8C6D2B]" />
                    </div>
                  </div>
                  <div className="text-3xl font-mono font-bold text-[#1C1A17] tracking-tight">{metric.value}</div>
                  <div className="pt-2 border-t border-[#E8E2D5] flex items-center justify-between text-[11px]">
                    <span className="text-[#7A7468] font-light">{metric.subtext}</span>
                    <span className="text-[#8C6D2B] font-semibold flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {metric.growth}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ─── 3. CHARTS ROW ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Revenue & Orders Interactive Visual Chart ── */}
          <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-[#E8E2D5] shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-[#E8E2D5] pb-3 gap-3">
              <div>
                <h2 className="text-base font-serif font-bold text-[#1C1A17] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#8C6D2B]" /> Financial Progression &amp; Revenue Overview
                </h2>
                <p className="text-xs text-[#6E685E]">
                  Showing <span className="font-bold text-[#8C6D2B] capitalize">{timeframe}</span> breakdown (X-axis) vs Revenue (৳) &amp; Orders
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Time Horizon Filter (Weekly, Monthly, Yearly) */}
                <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E8E2D5]">
                  <button
                    onClick={() => setTimeframe("weekly")}
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${timeframe === "weekly" ? "bg-[#8C6D2B] text-white shadow-sm" : "text-[#6E685E] hover:text-[#1C1A17]"
                      }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setTimeframe("monthly")}
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${timeframe === "monthly" ? "bg-[#8C6D2B] text-white shadow-sm" : "text-[#6E685E] hover:text-[#1C1A17]"
                      }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setTimeframe("yearly")}
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${timeframe === "yearly" ? "bg-[#8C6D2B] text-white shadow-sm" : "text-[#6E685E] hover:text-[#1C1A17]"
                      }`}
                  >
                    Yearly
                  </button>
                </div>

                {/* Dynamic Graph Visual Switcher (Area, Bar, Line) */}
                <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E8E2D5]">
                  <button
                    onClick={() => setChartType("area")}
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${chartType === "area" ? "bg-[#1C1A17] text-white shadow-sm" : "text-[#6E685E] hover:text-[#1C1A17]"
                      }`}
                  >
                    Area
                  </button>
                  <button
                    onClick={() => setChartType("bar")}
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${chartType === "bar" ? "bg-[#1C1A17] text-white shadow-sm" : "text-[#6E685E] hover:text-[#1C1A17]"
                      }`}
                  >
                    Bar
                  </button>
                  <button
                    onClick={() => setChartType("line")}
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${chartType === "line" ? "bg-[#1C1A17] text-white shadow-sm" : "text-[#6E685E] hover:text-[#1C1A17]"
                      }`}
                  >
                    Line
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center"><p className="text-[10px] uppercase tracking-widest text-[#8C6D2B]">Loading chart...</p></div>
            ) : activeChartData.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "area" ? (
                    <AreaChart data={activeChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenueDash" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366F1" stopOpacity={0.8} />
                          <stop offset="50%" stopColor="#EC4899" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="colorOrdersDash" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#10B981" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D5" />
                      <XAxis dataKey="label" stroke="#8C6D2B" fontSize={11} fontWeight="bold" />
                      <YAxis yAxisId="left" stroke="#8C6D2B" fontSize={10} tickFormatter={(v) => `৳${v}`} />
                      <YAxis yAxisId="right" orientation="right" stroke="#1C1A17" fontSize={10} />
                      <Tooltip
                        formatter={(value: any, name: any) => [
                          name === "Revenue" ? `৳${Math.round(Number(value)).toLocaleString()}` : value,
                          name,
                        ]}
                        labelFormatter={(label) => `Period: ${label}`}
                        contentStyle={{ backgroundColor: "#1C1A17", color: "#FAF8F5", borderColor: "#C5A059", borderRadius: "14px", fontSize: "12px" }}
                      />
                      <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenueDash)" name="Revenue" />
                      <Area yAxisId="right" type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorOrdersDash)" name="Orders" />
                    </AreaChart>
                  ) : chartType === "bar" ? (
                    <BarChart data={activeChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D5" />
                      <XAxis dataKey="label" stroke="#8C6D2B" fontSize={11} fontWeight="bold" />
                      <YAxis yAxisId="left" stroke="#8C6D2B" fontSize={10} tickFormatter={(v) => `৳${v}`} />
                      <YAxis yAxisId="right" orientation="right" stroke="#1C1A17" fontSize={10} />
                      <Tooltip
                        formatter={(value: any, name: any) => [
                          name === "Revenue" ? `৳${Math.round(Number(value)).toLocaleString()}` : value,
                          name,
                        ]}
                        labelFormatter={(label) => `Period: ${label}`}
                        contentStyle={{ backgroundColor: "#1C1A17", color: "#FAF8F5", borderColor: "#C5A059", borderRadius: "14px", fontSize: "12px" }}
                      />
                      <Bar yAxisId="left" dataKey="revenue" radius={[8, 8, 0, 0]} name="Revenue">
                        {activeChartData.map((entry, index) => (
                          <Cell key={`bar-cell-${index}`} fill={["#6366F1", "#10B981", "#F59E0B", "#EC4899", "#3B82F6", "#8B5CF6"][index % 6]} />
                        ))}
                      </Bar>
                      <Bar yAxisId="right" dataKey="orders" radius={[8, 8, 0, 0]} fill="#1C1A17" name="Orders" />
                    </BarChart>
                  ) : (
                    <LineChart data={activeChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D5" />
                      <XAxis dataKey="label" stroke="#8C6D2B" fontSize={11} fontWeight="bold" />
                      <YAxis yAxisId="left" stroke="#8C6D2B" fontSize={10} tickFormatter={(v) => `৳${v}`} />
                      <YAxis yAxisId="right" orientation="right" stroke="#1C1A17" fontSize={10} />
                      <Tooltip
                        formatter={(value: any, name: any) => [
                          name === "Revenue" ? `৳${Math.round(Number(value)).toLocaleString()}` : value,
                          name,
                        ]}
                        labelFormatter={(label) => `Period: ${label}`}
                        contentStyle={{ backgroundColor: "#1C1A17", color: "#FAF8F5", borderColor: "#C5A059", borderRadius: "14px", fontSize: "12px" }}
                      />
                      <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#EC4899" strokeWidth={4} dot={{ r: 6, fill: "#3B82F6", stroke: "#FFF", strokeWidth: 3 }} name="Revenue" />
                      <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={3} dot={{ r: 5, fill: "#10B981", stroke: "#FFF", strokeWidth: 2 }} name="Orders" />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center"><p className="text-[10px] text-[#5A554C]">No graph data available for this timeframe</p></div>
            )}
          </div>

          {/* ── Order Status Donut Chart ── */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block">Distribution</span>
                <h2 className="text-lg font-serif text-[#1C1A17]">Order Status Breakdown</h2>
              </div>
              <PieChart className="w-4 h-4 text-[#8C6D2B]" />
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center"><p className="text-[10px] uppercase tracking-widest text-[#8C6D2B]">Loading chart...</p></div>
            ) : orderStatusData.length > 0 ? (
              <div className="flex flex-col md:flex-row items-center gap-4">
                <ResponsiveContainer width={200} height={220}>
                  <RePieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%" cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      {...({ activeIndex: activePieIndex, activeShape: renderActiveShape } as any)}
                      onMouseEnter={(_, idx) => setActivePieIndex(idx)}
                    >
                      {orderStatusData.map((entry, idx) => (
                        <Cell key={idx} fill={STATUS_COLORS[entry.name] || CHART_COLORS[idx % CHART_COLORS.length]} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="space-y-2.5 w-full">
                  {orderStatusData.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-[#FAF8F5] transition-colors cursor-pointer" onMouseEnter={() => setActivePieIndex(idx)}>
                      <div className="flex items-center gap-2.5">
                        <span className="w-3 h-3 rounded-full" style={{ background: STATUS_COLORS[item.name] || CHART_COLORS[idx % CHART_COLORS.length] }} />
                        <span className="text-xs font-semibold text-[#1C1A17] capitalize">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-[#8C6D2B]">{item.value}</span>
                        <span className="text-[10px] text-[#5A554C]">
                          ({Math.round((item.value / orderStatusData.reduce((a, b) => a + b.value, 0)) * 100)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center"><p className="text-[10px] text-[#5A554C]">No order data yet</p></div>
            )}
          </div>
        </div>

        {/* ─── 4. TOP PRODUCTS + RECENT ORDERS ROW ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Top Products Bar Chart ── */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block">Performance</span>
                <h2 className="text-lg font-serif text-[#1C1A17]">Top Performing Products</h2>
              </div>
              <BarChart3 className="w-4 h-4 text-[#8C6D2B]" />
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center"><p className="text-[10px] uppercase tracking-widest text-[#8C6D2B]">Loading chart...</p></div>
            ) : topProductsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topProductsData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: SOFT }} tickLine={false} axisLine={{ stroke: BORDER }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: DARK, fontWeight: 600 }} tickLine={false} axisLine={false} width={120} />
                  <Tooltip content={<ChartTooltip prefix="" />} />
                  <Bar dataKey="qty" fill={GOLD} radius={[0, 6, 6, 0]} barSize={22} name="Units Sold">
                    {topProductsData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center"><p className="text-[10px] text-[#5A554C]">No product order data yet</p></div>
            )}
          </div>

          {/* ── Recent Orders Table ── */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block">Real-Time Transactions</span>
                <h2 className="text-lg font-serif text-[#1C1A17]">Recent Patron Acquisitions</h2>
              </div>
              <Link href="/admin/orders" className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#8C6D2B] hover:text-[#1C1A17] transition-colors">
                <span>Full Ledger</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center"><p className="text-[10px] uppercase tracking-widest text-[#8C6D2B]">Loading orders...</p></div>
            ) : (data?.recent_orders || []).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E8E2D5] text-[#8C6D2B] font-bold uppercase tracking-widest text-[10px]">
                      <th className="py-2.5 px-3">Ref</th>
                      <th className="py-2.5 px-3">Patron</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D5]">
                    {(data?.recent_orders || []).slice(0, 6).map((order: any) => (
                      <tr key={order.id} className="hover:bg-[#FFFDF9] transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-[#8C6D2B]">#ACQ-{order.id}</td>
                        <td className="py-3 px-3 font-serif font-semibold text-[#1C1A17]">{order.user?.name || `User #${order.user_id}`}</td>
                        <td className="py-3 px-3 font-mono font-bold text-[#1C1A17] text-right">৳{Math.round(Number(order.final_amount)).toLocaleString()}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${order.status === "delivered" || order.status === "paid"
                              ? "bg-[#FAF8F5] border border-[#C5A059]/40 text-[#8C6D2B]"
                              : order.status === "cancelled"
                                ? "bg-rose-50 border border-rose-200 text-rose-700"
                                : "bg-amber-50 border border-amber-200 text-amber-800"
                            }`}>
                            <ShieldCheck className="w-2.5 h-2.5" />
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center"><p className="text-[10px] text-[#5A554C]">No recent orders</p></div>
            )}
          </div>
        </div>

        {/* ─── 5. FOOTER - LOADING STATE ─── */}
        <div className="flex items-center justify-between py-4 border-t border-[#E8E2D5] text-[10px] text-[#5A554C]">
          <span>Dashboard auto-refreshes on page reload</span>
          {!loading && data && (
            <span className="text-[#8C6D2B] font-semibold">
              <Activity className="w-3 h-3 inline mr-1" />
              Live — {new Date().toLocaleString()}
            </span>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}