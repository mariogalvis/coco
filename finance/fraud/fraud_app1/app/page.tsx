"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  AlertTriangle,
  DollarSign,
  Users,
  TrendingUp,
  Shield,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

interface Metrics {
  TOTAL_TRANSACTIONS: number;
  TOTAL_FRAUDS: number;
  TOTAL_AMOUNT: number;
  FRAUD_AMOUNT: number;
  UNIQUE_CUSTOMERS: number;
  FRAUD_RATE: number;
}

interface ModelPerformance {
  precision: number;
  recall: number;
  f1: number;
  accuracy: number;
}

interface FraudByTime {
  FECHA: string;
  TOTAL_TX: number;
  FRAUDES: number;
  TASA_FRAUDE: number;
}

interface FraudByCategory {
  CATEGORIA: string;
  TOTAL_TX: number;
  FRAUDES: number;
  TASA_FRAUDE: number;
  MONTO_FRAUDE: number;
}

interface Alert {
  TRANSACTION_ID: string;
  FECHA: string;
  CLIENTE: string;
  MONTO: number;
  CATEGORIA: string;
  CIUDAD: string;
  TIPO_FRAUDE: string;
  ESTADO: string;
}

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [modelPerf, setModelPerf] = useState<ModelPerformance | null>(null);
  const [fraudByTime, setFraudByTime] = useState<FraudByTime[]>([]);
  const [fraudByCategory, setFraudByCategory] = useState<FraudByCategory[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [metricsRes, modelRes, timeRes, categoryRes, alertsRes] = await Promise.all([
        fetch("/api/metrics"),
        fetch("/api/model-performance"),
        fetch("/api/fraud-by-time"),
        fetch("/api/fraud-by-category"),
        fetch("/api/alerts?limit=8"),
      ]);

      const [metricsData, modelData, timeData, categoryData, alertsData] = await Promise.all([
        metricsRes.json(),
        modelRes.json(),
        timeRes.json(),
        categoryRes.json(),
        alertsRes.json(),
      ]);

      setMetrics(metricsData?.error ? null : metricsData);
      setModelPerf(modelData?.error ? null : modelData);
      setFraudByTime(Array.isArray(timeData) ? timeData : []);
      setFraudByCategory(Array.isArray(categoryData) ? categoryData : []);
      setRecentAlerts(Array.isArray(alertsData) ? alertsData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "warning" | "danger" | "success" | "default"; label: string }> = {
      pending: { variant: "warning", label: "Pendiente" },
      investigating: { variant: "danger", label: "Investigando" },
      resolved: { variant: "success", label: "Resuelto" },
      closed: { variant: "default", label: "Cerrado" },
    };
    const { variant, label } = config[status] || config.pending;
    return <Badge variant={variant} className="text-[11px]">{label}</Badge>;
  };

  const getFraudTypeBadge = (type: string) => {
    const severity: Record<string, "critical" | "danger" | "warning"> = {
      identity_theft: "critical",
      account_takeover: "critical",
      card_stolen: "danger",
      card_not_present: "warning",
    };
    return <Badge variant={severity[type] || "warning"} className="text-[11px]">{type?.replace(/_/g, " ")}</Badge>;
  };

  const kpiCards = [
    {
      label: "Total Transacciones",
      value: formatNumber(metrics?.TOTAL_TRANSACTIONS || 0),
      change: "+12.5%",
      trend: "up",
      icon: Activity,
      iconClass: "text-blue-500",
      bgClass: "bg-blue-50",
    },
    {
      label: "Fraudes Detectados",
      value: formatNumber(metrics?.TOTAL_FRAUDS || 0),
      change: `${metrics?.FRAUD_RATE?.toFixed(2) || 0}% tasa`,
      trend: "down",
      icon: AlertTriangle,
      iconClass: "text-red-500",
      bgClass: "bg-red-50",
    },
    {
      label: "Monto Total",
      value: formatCurrency(metrics?.TOTAL_AMOUNT || 0),
      change: "+8.2%",
      trend: "up",
      icon: DollarSign,
      iconClass: "text-emerald-500",
      bgClass: "bg-emerald-50",
    },
    {
      label: "Pérdidas por Fraude",
      value: formatCurrency(metrics?.FRAUD_AMOUNT || 0),
      change: "-3.1%",
      trend: "down",
      icon: TrendingUp,
      iconClass: "text-amber-500",
      bgClass: "bg-amber-50",
    },
    {
      label: "Clientes Únicos",
      value: formatNumber(metrics?.UNIQUE_CUSTOMERS || 0),
      change: "+5.7%",
      trend: "up",
      icon: Users,
      iconClass: "text-indigo-500",
      bgClass: "bg-indigo-50",
    },
  ];

  const modelMetrics = [
    { label: "Precisión", value: modelPerf?.precision || 0, color: "#3b82f6" },
    { label: "Recall", value: modelPerf?.recall || 0, color: "#10b981" },
    { label: "F1-Score", value: modelPerf?.f1 || 0, color: "#f59e0b" },
    { label: "Exactitud", value: modelPerf?.accuracy || 0, color: "#8b5cf6" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="pl-[260px] transition-all duration-300">
        <Header
          title="Panel de Control"
          subtitle="Monitoreo de fraudes en tiempo real"
          onRefresh={fetchData}
        />

        <main className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {kpiCards.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <Card key={kpi.label} className="bg-white shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{kpi.label}</p>
                        <p className="text-xl font-bold text-slate-900">{loading ? "..." : kpi.value}</p>
                        <div className={`flex items-center gap-1 text-xs font-medium ${kpi.trend === "up" ? "text-emerald-600" : "text-red-600"}`}>
                          {kpi.trend === "up" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          {kpi.change}
                        </div>
                      </div>
                      <div className={`p-2 rounded-lg ${kpi.bgClass}`}>
                        <Icon className={`h-5 w-5 ${kpi.iconClass}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="bg-white shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <h2 className="text-base font-semibold text-slate-900">Rendimiento del Modelo ML</h2>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">XGBoost - Métricas de clasificación</p>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-4 gap-8">
                {modelMetrics.map((metric) => (
                  <div key={metric.label} className="space-y-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-slate-600">{metric.label}</span>
                      <span className="text-lg font-bold text-slate-900">{metric.value.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${metric.value}%`, backgroundColor: metric.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-semibold text-slate-900">Tendencia de Fraudes</h2>
                <p className="text-sm text-slate-500 mt-0.5">Tasa de fraude diaria</p>
              </div>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={fraudByTime}>
                    <defs>
                      <linearGradient id="colorFraude" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="FECHA"
                      tickFormatter={(value) => new Date(value).toLocaleDateString("es", { day: "2-digit", month: "short" })}
                      fontSize={11}
                      tick={{ fill: "#64748b" }}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis 
                      fontSize={11} 
                      tick={{ fill: "#64748b" }}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "6px",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [`${value.toFixed(2)}%`, "Tasa de Fraude"]}
                      labelFormatter={(label) => new Date(label).toLocaleDateString("es", { dateStyle: "long" })}
                    />
                    <Area
                      type="monotone"
                      dataKey="TASA_FRAUDE"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorFraude)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-semibold text-slate-900">Fraudes por Categoría</h2>
                <p className="text-sm text-slate-500 mt-0.5">Tasa de fraude por tipo de comercio</p>
              </div>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={fraudByCategory.slice(0, 6)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis 
                      type="number" 
                      fontSize={11} 
                      tick={{ fill: "#64748b" }}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis 
                      dataKey="CATEGORIA" 
                      type="category" 
                      width={85} 
                      fontSize={11}
                      tick={{ fill: "#64748b" }}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "6px",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [`${value.toFixed(2)}%`, "Tasa"]}
                    />
                    <Bar dataKey="TASA_FRAUDE" radius={[0, 4, 4, 0]}>
                      {fraudByCategory.slice(0, 6).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <h2 className="text-base font-semibold text-slate-900">Alertas Recientes</h2>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">Últimas transacciones fraudulentas detectadas</p>
            </div>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">ID</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Cliente</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Monto</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Categoría</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Ciudad</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Tipo Fraude</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAlerts.map((alert) => (
                    <TableRow key={alert.TRANSACTION_ID} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-mono text-xs text-slate-600">{alert.TRANSACTION_ID?.slice(0, 8)}...</TableCell>
                      <TableCell className="text-sm font-medium text-slate-900">{alert.CLIENTE}</TableCell>
                      <TableCell className="text-sm font-semibold text-red-600">{formatCurrency(alert.MONTO)}</TableCell>
                      <TableCell className="text-sm text-slate-600">{alert.CATEGORIA}</TableCell>
                      <TableCell className="text-sm text-slate-600">{alert.CIUDAD}</TableCell>
                      <TableCell>{getFraudTypeBadge(alert.TIPO_FRAUDE)}</TableCell>
                      <TableCell>{getStatusBadge(alert.ESTADO)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
