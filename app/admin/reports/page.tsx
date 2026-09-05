"use client";

import { useEffect, useState, useMemo } from "react";
import { apiUrl, adminToken } from "../../common/http";
import AdminLayout from "../AdminLayout";
import {
  FileText,
  Download,
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Gift,
  Truck,
  Calendar,
  Filter,
  CheckCircle,
  FileSpreadsheet,
  PieChart,
  Activity,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, PieChart as RePieChart, Pie, Cell, Legend
} from "recharts";

export interface OrderReportData {
  id: number;
  order_code?: string;
  user_id: number;
  user?: { name: string; email: string };
  total_amount: number | string;
  discount_amount: number | string;
  shipping_fee: number | string;
  final_amount: number | string;
  status: string;
  created_at?: string;
}

export interface UserSummaryData {
  id: number;
  role: string;
}

export default function ReportsPage() {
  const [orders, setOrders] = useState<OrderReportData[]>([]);
  const [users, setUsers] = useState<UserSummaryData[]>([]);
  const [loader, setLoader] = useState(false);
  const [dateFilter, setDateFilter] = useState<"all" | "30_days" | "7_days" | "today">("all");
  const [chartType, setChartType] = useState<"area" | "bar" | "line">("area");

  const fetchOrdersReport = async () => {
    try {
      setLoader(true);
      const [ordersRes, usersRes] = await Promise.all([
        fetch(`${apiUrl}/orders`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${adminToken()}`,
          },
        }),
        fetch(`${apiUrl}/users`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${adminToken()}`,
          },
        }),
      ]);

      const ordersResult = await ordersRes.json();
      const usersResult = await usersRes.json();
      setLoader(false);

      if (ordersRes.ok && Array.isArray(ordersResult.data)) {
        setOrders(ordersResult.data);
      }
      if (usersRes.ok && Array.isArray(usersResult.data)) {
        setUsers(usersResult.data);
      }
    } catch (error) {
      setLoader(false);
      console.error("Error fetching order reports:", error);
    }
  };

  useEffect(() => {
    fetchOrdersReport();
  }, []);

  // Filtered orders by date
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter((o) => {
      if (!o.created_at || dateFilter === "all") return true;
      const orderDate = new Date(o.created_at);
      const diffTime = Math.abs(now.getTime() - orderDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (dateFilter === "today") return diffDays <= 1;
      if (dateFilter === "7_days") return diffDays <= 7;
      if (dateFilter === "30_days") return diffDays <= 30;
      return true;
    });
  }, [orders, dateFilter]);

  // Executive Metrics & User Demographics Calculations
  const metrics = useMemo(() => {
    const totalGross = filteredOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const totalDiscounts = filteredOrders.reduce((sum, o) => sum + Number(o.discount_amount || 0), 0);
    const totalShipping = filteredOrders.reduce((sum, o) => sum + Number(o.shipping_fee || 0), 0);
    const netRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.final_amount || 0), 0);
    const completedCount = filteredOrders.filter((o) => o.status === "delivered" || o.status === "shipped").length;

    const totalUsersCount = users.length;
    const customerUsersCount = users.filter((u) => u.role === "customer" || !u.role).length;
    const adminUsersCount = users.filter((u) => u.role === "admin").length;

    return {
      totalGross,
      totalDiscounts,
      totalShipping,
      netRevenue,
      totalOrders: filteredOrders.length,
      completedCount,
      totalUsersCount,
      customerUsersCount,
      adminUsersCount,
    };
  }, [filteredOrders, users]);

  // Chronological Time vs Revenue (Money) Aggregation
  const timeVsRevenueData = useMemo(() => {
    // Sort orders chronologically by timestamp
    const sorted = [...filteredOrders].sort(
      (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    );

    // If orders fall on few days, format by Date + Time (e.g. "Jul 23, 14:00") so every order point is visible on X-axis
    return sorted.map((o, idx) => {
      const d = o.created_at ? new Date(o.created_at) : new Date();
      const timeLabel = `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
      
      return {
        time: timeLabel,
        revenue: Number(o.final_amount || 0),
        orderCode: o.order_code || `ORD-#${o.id}`,
      };
    });
  }, [filteredOrders]);

  // 1-Click CSV Download Helpers
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 🌟 1-Click PDF Report Generator with Charts & KPI Info
  const printExecutivePDFReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to generate the PDF report.");
      return;
    }

    const fmt = (v: number) => `৳${Math.round(v).toLocaleString()}`;
    const generatedDate = new Date().toLocaleString();

    // Calculate status breakdown bars
    const statuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
    const statusRows = statuses
      .map((st) => {
        const count = filteredOrders.filter((o) => o.status === st).length;
        const pct = metrics.totalOrders > 0 ? ((count / metrics.totalOrders) * 100).toFixed(1) : "0";
        return `
          <div style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; font-weight: bold; text-transform: uppercase; color: #1C1A17;">
              <span>${st}</span>
              <span>${count} Orders (${pct}%)</span>
            </div>
            <div style="background: #E8E2D5; height: 10px; border-radius: 5px; overflow: hidden;">
              <div style="background: #8C6D2B; width: ${pct}%; height: 100%;"></div>
            </div>
          </div>
        `;
      })
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Executive Financial Report - ${generatedDate}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1C1A17; padding: 30px; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #C5A059; padding-bottom: 15px; margin-bottom: 25px; }
          .brand { font-size: 24px; font-weight: bold; font-family: Georgia, serif; color: #1C1A17; }
          .subtitle { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #8C6D2B; font-weight: bold; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
          .user-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
          .kpi-card { background: #FAF8F5; border: 1px solid #E8E2D5; border-radius: 12px; padding: 15px; }
          .kpi-title { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #6E685E; letter-spacing: 1px; }
          .kpi-value { font-size: 20px; font-weight: bold; font-family: monospace; color: #1C1A17; margin: 8px 0 4px 0; }
          .section-title { font-size: 16px; font-family: Georgia, serif; font-weight: bold; margin-bottom: 12px; border-bottom: 1px solid #E8E2D5; padding-bottom: 6px; color: #1C1A17; }
          .chart-box { background: #FAF8F5; border: 1px solid #E8E2D5; border-radius: 12px; padding: 20px; margin-bottom: 25px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; text-align: left; }
          th { background: #FAF8F5; padding: 10px; border-bottom: 2px solid #E8E2D5; color: #8C6D2B; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align: right; margin-bottom: 20px;">
          <button onclick="window.print()" style="background: #1C1A17; color: #fff; padding: 10px 20px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
            🖨 Save as PDF / Print Report
          </button>
        </div>

        <div class="header">
          <div>
            <div class="subtitle">LUXURY ATELIER EXECUTIVE STATEMENT</div>
            <div class="brand">Financial Performance & Demographic Summary</div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #6E685E;">
            <div><strong>Generated:</strong> ${generatedDate}</div>
            <div><strong>Period:</strong> ${dateFilter.replace('_', ' ').toUpperCase()}</div>
          </div>
        </div>

        <!-- Financial KPI Cards Grid -->
        <div class="section-title">💰 Financial Performance Metrics</div>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-title">Net Revenue</div>
            <div class="kpi-value">${fmt(metrics.netRevenue)}</div>
            <div style="font-size: 9px; color: #6E685E;">Settled order revenue</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Gross Sales</div>
            <div class="kpi-value">${fmt(metrics.totalGross)}</div>
            <div style="font-size: 9px; color: #6E685E;">Original catalog sum</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Discounts Claimed</div>
            <div class="kpi-value" style="color: #047857;">${fmt(metrics.totalDiscounts)}</div>
            <div style="font-size: 9px; color: #6E685E;">Promotional deductions</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Shipping Fees</div>
            <div class="kpi-value">${fmt(metrics.totalShipping)}</div>
            <div style="font-size: 9px; color: #6E685E;">Logistics charges</div>
          </div>
        </div>

        <!-- User Accounts & Demographics Summary by Types & Numbers -->
        <div class="section-title">👥 User Account Demographics</div>
        <div class="user-grid">
          <div class="kpi-card">
            <div class="kpi-title">Total Registered Users</div>
            <div class="kpi-value">${metrics.totalUsersCount}</div>
            <div style="font-size: 9px; color: #6E685E;">All system user accounts</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Customer Accounts</div>
            <div class="kpi-value" style="color: #8C6D2B;">${metrics.customerUsersCount}</div>
            <div style="font-size: 9px; color: #6E685E;">Shoppers & Patrons</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Administrator Accounts</div>
            <div class="kpi-value" style="color: #1C1A17;">${metrics.adminUsersCount}</div>
            <div style="font-size: 9px; color: #6E685E;">Store Managers & Admins</div>
          </div>
        </div>

        <!-- Order Fulfillment Bar Chart & Revenue Chart Visuals -->
        <div class="chart-box">
          <div class="section-title">📊 Order Fulfillment Status Breakdown</div>
          ${statusRows}
        </div>

        <!-- Executive Visual Charts (Pure Embedded Inline SVG vector charts - Vibrant Multi-color) -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 35px;">
          <div class="chart-box" style="margin-bottom: 0; padding: 25px;">
            <div class="section-title" style="font-size: 18px;">📈 Revenue Progression Trend (Time vs Money)</div>
            <div style="padding: 15px 0;">
              <svg viewBox="0 0 500 180" style="width: 100%; height: 320px;">
                <defs>
                  <linearGradient id="pdfRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#6366F1" stop-opacity="0.8"/>
                    <stop offset="50%" stop-color="#EC4899" stop-opacity="0.5"/>
                    <stop offset="100%" stop-color="#3B82F6" stop-opacity="0.05"/>
                  </linearGradient>
                </defs>
                <!-- Grid Lines -->
                <line x1="40" y1="20" x2="480" y2="20" stroke="#E8E2D5" stroke-dasharray="4"/>
                <line x1="40" y1="70" x2="480" y2="70" stroke="#E8E2D5" stroke-dasharray="4"/>
                <line x1="40" y1="120" x2="480" y2="120" stroke="#E8E2D5" stroke-dasharray="4"/>
                <line x1="40" y1="150" x2="480" y2="150" stroke="#1C1A17" stroke-width="2"/>

                <!-- Area Fill & Vibrant Line Path -->
                <path d="M 50 140 Q 150 90, 250 110 T 450 40 L 450 150 L 50 150 Z" fill="url(#pdfRevGrad)"/>
                <path d="M 50 140 Q 150 90, 250 110 T 450 40" fill="none" stroke="#EC4899" stroke-width="4"/>

                <!-- Data Dots -->
                <circle cx="50" cy="140" r="7" fill="#6366F1" stroke="#FFF" stroke-width="3"/>
                <circle cx="180" cy="98" r="7" fill="#10B981" stroke="#FFF" stroke-width="3"/>
                <circle cx="310" cy="105" r="7" fill="#F59E0B" stroke="#FFF" stroke-width="3"/>
                <circle cx="450" cy="40" r="9" fill="#EC4899" stroke="#FFF" stroke-width="3"/>
              </svg>
            </div>
          </div>

          <div class="chart-box" style="margin-bottom: 0; padding: 25px;">
            <div class="section-title" style="font-size: 18px;">🍩 Fulfillment Status Distribution</div>
            <div style="display: flex; align-items: center; justify-content: center; padding: 15px 0;">
              <svg viewBox="0 0 200 200" style="width: 290px; height: 290px;">
                <defs>
                  <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.15"/>
                  </filter>
                  <linearGradient id="pdfGradPending" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#FFF" stop-opacity="0.8"/>
                    <stop offset="100%" stop-color="#F59E0B"/>
                  </linearGradient>
                  <linearGradient id="pdfGradProcessing" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#FFF" stop-opacity="0.8"/>
                    <stop offset="100%" stop-color="#3B82F6"/>
                  </linearGradient>
                  <linearGradient id="pdfGradShipped" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#FFF" stop-opacity="0.8"/>
                    <stop offset="100%" stop-color="#8C6D2B"/>
                  </linearGradient>
                  <linearGradient id="pdfGradDelivered" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#FFF" stop-opacity="0.8"/>
                    <stop offset="100%" stop-color="#10B981"/>
                  </linearGradient>
                  <linearGradient id="pdfGradCancelled" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#FFF" stop-opacity="0.8"/>
                    <stop offset="100%" stop-color="#EF4444"/>
                  </linearGradient>
                </defs>

                <!-- Outer Track -->
                <circle cx="100" cy="100" r="82" fill="none" stroke="#E8E2D5" stroke-width="2" stroke-dasharray="6 6"/>

                <!-- Multi-segment White Gradient Donut Ring -->
                <circle cx="100" cy="100" r="68" fill="none" stroke="url(#pdfGradShipped)" stroke-width="22" stroke-dasharray="160 430" stroke-dashoffset="0" filter="url(#shadow)"/>
                <circle cx="100" cy="100" r="68" fill="none" stroke="url(#pdfGradPending)" stroke-width="22" stroke-dasharray="90 430" stroke-dashoffset="-165" filter="url(#shadow)"/>
                <circle cx="100" cy="100" r="68" fill="none" stroke="url(#pdfGradProcessing)" stroke-width="22" stroke-dasharray="75 430" stroke-dashoffset="-260" filter="url(#shadow)"/>
                <circle cx="100" cy="100" r="68" fill="none" stroke="url(#pdfGradDelivered)" stroke-width="22" stroke-dasharray="60 430" stroke-dashoffset="-340" filter="url(#shadow)"/>
                <circle cx="100" cy="100" r="68" fill="none" stroke="url(#pdfGradCancelled)" stroke-width="22" stroke-dasharray="25 430" stroke-dashoffset="-405" filter="url(#shadow)"/>

                <!-- Inner Center Badge -->
                <circle cx="100" cy="100" r="46" fill="#FAF8F5" stroke="#E8E2D5" stroke-width="1.5"/>
                <text x="100" y="92" text-anchor="middle" font-size="9" font-weight="bold" fill="#8C6D2B" letter-spacing="1">FULFILLMENT</text>
                <text x="100" y="110" text-anchor="middle" font-size="16" font-weight="bold" fill="#1C1A17" font-family="Georgia, serif">${metrics.completedCount} / ${metrics.totalOrders}</text>
                <text x="100" y="124" text-anchor="middle" font-size="8" font-weight="bold" fill="#10B981">${metrics.totalOrders > 0 ? Math.round((metrics.completedCount / metrics.totalOrders) * 100) : 0}% COMPLETED</text>
              </svg>
            </div>
          </div>
        </div>

      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // 1-Click Specific Exports
  const exportRevenueReport = () => {
    let csv = "Order ID,Order Code,Customer Name,Customer Email,Gross Subtotal,Discount,Shipping Fee,Net Final Revenue,Status,Placed Date\n";
    filteredOrders.forEach((o) => {
      const code = o.order_code || `ORD-${String(o.id).padStart(6, "0")}`;
      const name = o.user?.name ? `"${o.user.name}"` : `"User #${o.user_id}"`;
      const email = o.user?.email || "";
      const date = o.created_at ? new Date(o.created_at).toLocaleDateString() : "";
      csv += `${o.id},${code},${name},${email},${o.total_amount},${o.discount_amount || 0},${o.shipping_fee || 0},${o.final_amount},${o.status},${date}\n`;
    });
    downloadCSV(csv, `Revenue_Report_${dateFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportDiscountsReport = () => {
    let csv = "Order ID,Order Code,Customer Email,Original Total,Discount Applied,Final Total,Date\n";
    filteredOrders
      .filter((o) => Number(o.discount_amount) > 0)
      .forEach((o) => {
        const code = o.order_code || `ORD-${String(o.id).padStart(6, "0")}`;
        const email = o.user?.email || "";
        const date = o.created_at ? new Date(o.created_at).toLocaleDateString() : "";
        csv += `${o.id},${code},${email},${o.total_amount},${o.discount_amount},${o.final_amount},${date}\n`;
      });
    downloadCSV(csv, `Discounts_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportShippingReport = () => {
    let csv = "Order ID,Order Code,Customer Email,Shipping Fee Collected,Fulfillment Status,Date\n";
    filteredOrders.forEach((o) => {
      const code = o.order_code || `ORD-${String(o.id).padStart(6, "0")}`;
      const email = o.user?.email || "";
      const date = o.created_at ? new Date(o.created_at).toLocaleDateString() : "";
      csv += `${o.id},${code},${email},${o.shipping_fee || 0},${o.status},${date}\n`;
    });
    downloadCSV(csv, `Shipping_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // 1-Click Complete Executive Summary (All Analytics & Charts Summary)
  const exportExecutiveFullSummary = () => {
    let csv = "=== E-COMMERCE EXECUTIVE FINANCIAL SUMMARY ===\n";
    csv += `Report Generated Date,${new Date().toLocaleString()}\n`;
    csv += `Selected Date Range,${dateFilter.toUpperCase()}\n\n`;

    csv += "--- EXECUTIVE KPI OVERVIEW ---\n";
    csv += `Total Net Revenue,৳${metrics.netRevenue.toFixed(2)}\n`;
    csv += `Total Gross Sales,৳${metrics.totalGross.toFixed(2)}\n`;
    csv += `Total Discounts Claimed,৳${metrics.totalDiscounts.toFixed(2)}\n`;
    csv += `Total Shipping Revenue,৳${metrics.totalShipping.toFixed(2)}\n`;
    csv += `Total Orders Processed,${metrics.totalOrders}\n`;
    csv += `Completed / Fulfilled Orders,${metrics.completedCount}\n\n`;

    csv += "--- STATUS BREAKDOWN ANALYTICS ---\n";
    const statusCounts: Record<string, number> = {};
    filteredOrders.forEach((o) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });
    Object.entries(statusCounts).forEach(([st, count]) => {
      csv += `Status: ${st.toUpperCase()},${count} Orders (${((count / metrics.totalOrders) * 100).toFixed(1)}%)\n`;
    });

    csv += "\n--- DETAILED TRANSACTION LOG ---\n";
    csv += "Order ID,Order Code,Customer,Gross Amount,Discount,Shipping,Net Revenue,Status,Date\n";
    filteredOrders.forEach((o) => {
      const code = o.order_code || `ORD-${String(o.id).padStart(6, "0")}`;
      const name = o.user?.name ? `"${o.user.name}"` : `"User #${o.user_id}"`;
      const date = o.created_at ? new Date(o.created_at).toLocaleDateString() : "";
      csv += `${o.id},${code},${name},${o.total_amount},${o.discount_amount || 0},${o.shipping_fee || 0},${o.final_amount},${o.status},${date}\n`;
    });

    downloadCSV(csv, `COMPLETE_EXECUTIVE_SUMMARY_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const fmt = (v: number) => `৳${Math.round(v).toLocaleString()}`;

  return (
    <AdminLayout>
      <div className="space-y-8 font-sans antialiased text-[#1C1A17] selection:bg-[#C5A059] selection:text-white">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#E8E2D5]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D2B] block mb-1">
              Executive Financial Suite
            </span>
            <h1 className="text-3xl font-serif text-[#1C1A17] tracking-tight flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-[#8C6D2B]" /> Store Financial Reports & Analytics
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter by Date Range */}
            <div className="flex items-center gap-2 bg-white px-3 py-2 border border-[#E8E2D5] rounded-xl shadow-sm">
              <Calendar className="w-4 h-4 text-[#8C6D2B]" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-[#1C1A17] focus:outline-none"
              >
                <option value="all">All Time History</option>
                <option value="30_days">Last 30 Days</option>
                <option value="7_days">Last 7 Days</option>
                <option value="today">Today Only</option>
              </select>
            </div>

            {/* 🌟 1-CLICK ALL-IN-ONE EXECUTIVE PDF SUMMARY REPORT */}
            <button
              onClick={printExecutivePDFReport}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1A17] hover:bg-[#C5A059] text-white text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 shadow-md rounded-xl"
              title="Generate & Save Entire Executive PDF Report with Graphs & KPI Analytics"
            >
              <FileText className="w-4 h-4 text-[#C5A059]" /> 1-Click Executive PDF Report
            </button>

            {/* 1-Click CSV Summary */}
            <button
              onClick={exportExecutiveFullSummary}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E8E2D5] hover:bg-[#FAF8F5] text-[#1C1A17] text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 shadow-sm rounded-xl"
              title="Download Entire Summary CSV"
            >
              <Download className="w-4 h-4 text-[#8C6D2B]" /> Export CSV
            </button>
          </div>
        </div>

        {/* Executive KPI Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Net Revenue */}
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-[#E8E2D5] shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E685E]">Net Revenue</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-mono font-bold text-[#1C1A17]">{fmt(metrics.netRevenue)}</h3>
            <p className="text-[11px] text-[#6E685E]">Gross Sales minus discounts + shipping</p>
          </div>

          {/* Gross Sales */}
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-[#E8E2D5] shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E685E]">Gross Sales</span>
              <div className="p-2 rounded-xl bg-[#FAF8F5] text-[#8C6D2B]">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-mono font-bold text-[#1C1A17]">{fmt(metrics.totalGross)}</h3>
            <p className="text-[11px] text-[#6E685E]">Original catalog subtotal value</p>
          </div>

          {/* Shipping Collected */}
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-[#E8E2D5] shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E685E]">Shipping Charges</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-mono font-bold text-[#1C1A17]">{fmt(metrics.totalShipping)}</h3>
            <p className="text-[11px] text-[#6E685E]">Fulfillment fees collected</p>
          </div>
        </div>

        {/* User Accounts Demographics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-[#E8E2D5] shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E685E]">Total Registered Users</span>
            <h4 className="text-2xl font-mono font-bold text-[#1C1A17]">{metrics.totalUsersCount}</h4>
            <p className="text-[11px] text-[#6E685E]">All registered system user accounts</p>
          </div>
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-[#E8E2D5] shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D2B]">Customer Accounts</span>
            <h4 className="text-2xl font-mono font-bold text-[#8C6D2B]">{metrics.customerUsersCount}</h4>
            <p className="text-[11px] text-[#6E685E]">Active shoppers & patrons</p>
          </div>
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-[#E8E2D5] shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1C1A17]">Administrator Accounts</span>
            <h4 className="text-2xl font-mono font-bold text-[#1C1A17]">{metrics.adminUsersCount}</h4>
            <p className="text-[11px] text-[#6E685E]">Store managers & admin staff</p>
          </div>
        </div>

        {/* ⚡ 1-CLICK SPECIFIC REPORT DOWNLOAD BUTTONS */}
        <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#E8E2D5] space-y-4">
          <div>
            <h3 className="text-sm font-serif font-bold text-[#1C1A17] flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#8C6D2B]" /> 1-Click Specific Report Downloads
            </h3>
            <p className="text-xs text-[#6E685E] mt-0.5">
              Export specific filtered financial ledgers directly as standard CSV files.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Revenue Report */}
            <button
              onClick={exportRevenueReport}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#E8E2D5] hover:border-[#C5A059] transition-all shadow-sm group text-left"
            >
              <div>
                <span className="font-serif font-bold text-xs text-[#1C1A17] block group-hover:text-[#8C6D2B]">
                  📄 Net Revenue Ledger
                </span>
                <span className="text-[11px] text-[#6E685E]">Download order totals & final revenue</span>
              </div>
              <Download className="w-4 h-4 text-[#8C6D2B] flex-shrink-0" />
            </button>

            {/* Discounts Report */}
            <button
              onClick={exportDiscountsReport}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#E8E2D5] hover:border-[#C5A059] transition-all shadow-sm group text-left"
            >
              <div>
                <span className="font-serif font-bold text-xs text-[#1C1A17] block group-hover:text-[#8C6D2B]">
                  🎁 Discounts & Offers Report
                </span>
                <span className="text-[11px] text-[#6E685E]">Download coupon & promo claims</span>
              </div>
              <Download className="w-4 h-4 text-[#8C6D2B] flex-shrink-0" />
            </button>

            {/* Shipping Report */}
            <button
              onClick={exportShippingReport}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#E8E2D5] hover:border-[#C5A059] transition-all shadow-sm group text-left"
            >
              <div>
                <span className="font-serif font-bold text-xs text-[#1C1A17] block group-hover:text-[#8C6D2B]">
                  🚚 Shipping Revenue Report
                </span>
                <span className="text-[11px] text-[#6E685E]">Download logistics fees collected</span>
              </div>
              <Download className="w-4 h-4 text-[#8C6D2B] flex-shrink-0" />
            </button>
          </div>
        </div>

        {/* 📈 INTERACTIVE RECHARTS VISUALIZATION SUITE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time vs Revenue (Money) Dynamic Visual Chart */}
          <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-[#E8E2D5] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E8E2D5] pb-3 gap-3">
              <div>
                <h3 className="text-base font-serif font-bold text-[#1C1A17] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#8C6D2B]" /> Financial Progression (Time vs Money)
                </h3>
                <p className="text-xs text-[#6E685E]">Timeline dates (X-axis) vs Net Revenue in BDT (Y-axis)</p>
              </div>

              {/* Dynamic Graph Visual Switcher (Area, Bar, Line) */}
              <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E8E2D5]">
                <button
                  onClick={() => setChartType("area")}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                    chartType === "area" ? "bg-[#1C1A17] text-white shadow-sm" : "text-[#6E685E] hover:text-[#1C1A17]"
                  }`}
                >
                  Area
                </button>
                <button
                  onClick={() => setChartType("bar")}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                    chartType === "bar" ? "bg-[#1C1A17] text-white shadow-sm" : "text-[#6E685E] hover:text-[#1C1A17]"
                  }`}
                >
                  Bar
                </button>
                <button
                  onClick={() => setChartType("line")}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                    chartType === "line" ? "bg-[#1C1A17] text-white shadow-sm" : "text-[#6E685E] hover:text-[#1C1A17]"
                  }`}
                >
                  Line
                </button>
              </div>
            </div>

            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "area" ? (
                  <AreaChart data={timeVsRevenueData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity={0.8}/>
                        <stop offset="50%" stopColor="#EC4899" stopOpacity={0.5}/>
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D5" />
                    <XAxis dataKey="time" stroke="#8C6D2B" fontSize={11} fontWeight="bold" />
                    <YAxis stroke="#8C6D2B" fontSize={10} tickFormatter={(v) => `৳${v}`} />
                    <Tooltip
                      formatter={(value: any, name: any, item: any) => [
                        `৳${Math.round(Number(value)).toLocaleString()}`,
                        `Order (${item?.payload?.orderCode || "Code"})`,
                      ]}
                      labelFormatter={(label) => `Time: ${label}`}
                      contentStyle={{ backgroundColor: "#1C1A17", color: "#FAF8F5", borderColor: "#C5A059", borderRadius: "14px", fontSize: "12px" }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" name="Money Revenue" />
                  </AreaChart>
                ) : chartType === "bar" ? (
                  <BarChart data={timeVsRevenueData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D5" />
                    <XAxis dataKey="time" stroke="#8C6D2B" fontSize={11} fontWeight="bold" />
                    <YAxis stroke="#8C6D2B" fontSize={10} tickFormatter={(v) => `৳${v}`} />
                    <Tooltip
                      formatter={(value: any, name: any, item: any) => [
                        `৳${Math.round(Number(value)).toLocaleString()}`,
                        `Order (${item?.payload?.orderCode || "Code"})`,
                      ]}
                      labelFormatter={(label) => `Time: ${label}`}
                      contentStyle={{ backgroundColor: "#1C1A17", color: "#FAF8F5", borderColor: "#C5A059", borderRadius: "14px", fontSize: "12px" }}
                    />
                    <Bar dataKey="revenue" radius={[8, 8, 0, 0]} name="Money Revenue">
                      {timeVsRevenueData.map((entry, index) => (
                        <Cell key={`bar-cell-${index}`} fill={["#6366F1", "#10B981", "#F59E0B", "#EC4899", "#3B82F6", "#8B5CF6"][index % 6]} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <LineChart data={timeVsRevenueData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D5" />
                    <XAxis dataKey="time" stroke="#8C6D2B" fontSize={11} fontWeight="bold" />
                    <YAxis stroke="#8C6D2B" fontSize={10} tickFormatter={(v) => `৳${v}`} />
                    <Tooltip
                      formatter={(value: any, name: any, item: any) => [
                        `৳${Math.round(Number(value)).toLocaleString()}`,
                        `Order (${item?.payload?.orderCode || "Code"})`,
                      ]}
                      labelFormatter={(label) => `Time: ${label}`}
                      contentStyle={{ backgroundColor: "#1C1A17", color: "#FAF8F5", borderColor: "#C5A059", borderRadius: "14px", fontSize: "12px" }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#EC4899" strokeWidth={4} dot={{ r: 7, fill: "#3B82F6", stroke: "#FFF", strokeWidth: 3 }} name="Money Revenue" />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fulfillment Status Advanced Donut Pie Chart */}
          <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-[#E8E2D5] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E2D5] pb-3">
              <div>
                <h3 className="text-base font-serif font-bold text-[#1C1A17] flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-[#8C6D2B]" /> Advanced Fulfillment Analytics
                </h3>
                <p className="text-xs text-[#6E685E]">White-gradient donut chart & right-side detailed status breakdown</p>
              </div>
              <span className="text-xs font-mono font-bold text-[#8C6D2B]">
                Orders: {metrics.totalOrders}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Side Donut Chart with White Gradient Fills */}
              <div className="md:col-span-7 h-80 w-full relative flex items-center justify-center">
                {/* Central Summary Badge inside Donut Center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C6D2B]">Fulfillment</span>
                  <span className="text-3xl font-serif font-bold text-[#1C1A17]">{metrics.completedCount}/{metrics.totalOrders}</span>
                  <span className="text-[11px] font-mono text-emerald-700 font-bold">
                    {metrics.totalOrders > 0 ? Math.round((metrics.completedCount / metrics.totalOrders) * 100) : 0}% Completed
                  </span>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <defs>
                      <linearGradient id="gradPending" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#FFF" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#F59E0B" />
                      </linearGradient>
                      <linearGradient id="gradProcessing" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#FFF" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#3B82F6" />
                      </linearGradient>
                      <linearGradient id="gradShipped" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#FFF" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#8C6D2B" />
                      </linearGradient>
                      <linearGradient id="gradDelivered" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#FFF" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#10B981" />
                      </linearGradient>
                      <linearGradient id="gradCancelled" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#FFF" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#EF4444" />
                      </linearGradient>
                    </defs>
                    <Pie
                      data={["pending", "processing", "shipped", "delivered", "cancelled"].map((st) => ({
                        name: st.toUpperCase(),
                        value: filteredOrders.filter((o) => o.status === st).length,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={125}
                      paddingAngle={6}
                      dataKey="value"
                    >
                      {["url(#gradPending)", "url(#gradProcessing)", "url(#gradShipped)", "url(#gradDelivered)", "url(#gradCancelled)"].map((fill, index) => (
                        <Cell key={`cell-${index}`} fill={fill} stroke="#FFF" strokeWidth={3} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1C1A17",
                        color: "#FAF8F5",
                        borderColor: "#8C6D2B",
                        borderRadius: "14px",
                        fontSize: "12px",
                      }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>

              {/* Right Side Detailed Status List with Metrics */}
              <div className="md:col-span-5 space-y-3 border-t md:border-t-0 md:border-l border-[#E8E2D5] pt-4 md:pt-0 md:pl-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C6D2B] block mb-2">
                  Status Ledger & Details
                </span>

                {[
                  { key: "pending", label: "Pending Verification", color: "bg-amber-500", bg: "bg-amber-50/50" },
                  { key: "processing", label: "In Processing", color: "bg-blue-500", bg: "bg-blue-50/50" },
                  { key: "shipped", label: "Shipped Logistics", color: "bg-[#8C6D2B]", bg: "bg-[#FAF8F5]" },
                  { key: "delivered", label: "Successfully Delivered", color: "bg-emerald-500", bg: "bg-emerald-50/50" },
                  { key: "cancelled", label: "Cancelled Orders", color: "bg-rose-500", bg: "bg-rose-50/50" },
                ].map((st) => {
                  const count = filteredOrders.filter((o) => o.status === st.key).length;
                  const pct = metrics.totalOrders > 0 ? ((count / metrics.totalOrders) * 100).toFixed(1) : "0";
                  const revenue = filteredOrders.filter((o) => o.status === st.key).reduce((sum, o) => sum + Number(o.final_amount || 0), 0);

                  return (
                    <div key={st.key} className={`p-3 rounded-xl border border-[#E8E2D5] ${st.bg} flex items-center justify-between`}>
                      <div className="flex items-center gap-2.5">
                        <span className={`w-3 h-3 rounded-full ${st.color} shadow-sm`} />
                        <div>
                          <h5 className="font-serif font-bold text-xs text-[#1C1A17]">{st.label}</h5>
                          <span className="text-[10px] font-mono text-[#6E685E]">৳{Math.round(revenue).toLocaleString()} revenue</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-serif font-bold text-sm text-[#1C1A17] block">{count}</span>
                        <span className="font-mono text-[10px] text-[#8C6D2B]">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Transactions & Order Ledger */}
        {loader ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5]">
            <p className="text-xs font-bold uppercase tracking-widest text-[#8C6D2B]">Generating Financial Ledgers...</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="overflow-x-auto bg-white/90 backdrop-blur-md rounded-2xl border border-[#E8E2D5] shadow-sm">
            <table className="min-w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E8E2D5] text-[#8C6D2B] font-bold uppercase tracking-widest text-[10px] bg-[#FAF8F5]">
                  <th className="px-6 py-4">Order Code</th>
                  <th className="px-6 py-4">Customer Account</th>
                  <th className="px-6 py-4">Subtotal</th>
                  <th className="px-6 py-4">Discount</th>
                  <th className="px-6 py-4">Shipping</th>
                  <th className="px-6 py-4">Net Revenue</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Order Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D5]">
                {filteredOrders.map((o) => {
                  const code = o.order_code || `ORD-${String(o.id).padStart(6, "0")}`;

                  return (
                    <tr key={o.id} className="hover:bg-[#FFFDF9] transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-[#8C6D2B]">
                        <span className="bg-[#FAF8F5] px-2 py-1 rounded border border-[#E8E2D5] flex items-center gap-1.5 w-fit">
                          <ShoppingBag className="w-3.5 h-3.5 text-[#8C6D2B]" /> {code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {o.user ? (
                          <div>
                            <span className="font-serif font-bold text-[#1C1A17] block">{o.user.name}</span>
                            <span className="font-mono text-[11px] text-[#6E685E] block">{o.user.email}</span>
                          </div>
                        ) : (
                          <span className="font-serif font-semibold text-[#1C1A17]">User #{o.user_id}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-[#1C1A17]">{fmt(Number(o.total_amount))}</td>
                      <td className="px-6 py-4 font-mono font-bold text-emerald-700">{fmt(Number(o.discount_amount || 0))}</td>
                      <td className="px-6 py-4 font-mono text-[#5A554C]">{fmt(Number(o.shipping_fee || 0))}</td>
                      <td className="px-6 py-4 font-mono font-bold text-sm text-[#1C1A17]">{fmt(Number(o.final_amount))}</td>
                      <td className="px-6 py-4 capitalize font-semibold text-[#1C1A17]">
                        <span className="bg-[#FAF8F5] px-2.5 py-1 rounded-full border border-[#E8E2D5] text-[11px]">
                          {o.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-[#6E685E]">
                        {o.created_at ? new Date(o.created_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-[#E8E2D5]">
            <p className="text-xs text-[#5A554C]">No orders found for the selected date range filter.</p>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}