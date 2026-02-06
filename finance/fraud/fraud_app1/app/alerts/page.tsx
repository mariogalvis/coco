"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Eye,
  Search,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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

const ITEMS_PER_PAGE = 10;

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    investigating: 0,
    resolved: 0,
  });

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/alerts?limit=100");
      const data = await res.json();
      const alertsArray = Array.isArray(data) ? data : [];
      setAlerts(alertsArray);
      setFilteredAlerts(alertsArray);
      
      setStats({
        total: alertsArray.length,
        pending: alertsArray.filter((a: Alert) => a.ESTADO === "pending").length,
        investigating: alertsArray.filter((a: Alert) => a.ESTADO === "investigating").length,
        resolved: alertsArray.filter((a: Alert) => a.ESTADO === "resolved").length,
      });
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    let filtered = [...alerts];

    if (statusFilter !== "all") {
      filtered = filtered.filter((a) => a.ESTADO === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((a) => a.TIPO_FRAUDE === typeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.CLIENTE?.toLowerCase().includes(query) ||
          a.TRANSACTION_ID?.toLowerCase().includes(query) ||
          a.CIUDAD?.toLowerCase().includes(query)
      );
    }

    setFilteredAlerts(filtered);
    setCurrentPage(1);
  }, [alerts, statusFilter, typeFilter, searchQuery]);

  const totalPages = Math.ceil(filteredAlerts.length / ITEMS_PER_PAGE);
  const paginatedAlerts = filteredAlerts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "warning" | "danger" | "success" | "default"; icon: typeof Clock; label: string }> = {
      pending: { variant: "warning", icon: Clock, label: "Pendiente" },
      investigating: { variant: "danger", icon: Eye, label: "Investigando" },
      resolved: { variant: "success", icon: CheckCircle, label: "Resuelto" },
      closed: { variant: "default", icon: XCircle, label: "Cerrado" },
    };
    const { variant, icon: Icon, label } = config[status] || config.pending;
    return (
      <Badge variant={variant} className="flex items-center gap-1 text-[11px]">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getFraudTypeBadge = (type: string) => {
    const severity: Record<string, "critical" | "danger" | "warning"> = {
      identity_theft: "critical",
      account_takeover: "critical",
      card_stolen: "danger",
      card_not_present: "warning",
      synthetic_fraud: "danger",
    };
    return (
      <Badge variant={severity[type] || "warning"} className="text-[11px]">
        {type?.replace(/_/g, " ")}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const fraudTypes = [...new Set(alerts.map((a) => a.TIPO_FRAUDE).filter(Boolean))];

  const statCards = [
    { label: "Total Alertas", value: stats.total, icon: Bell, borderClass: "border-l-blue-500", iconClass: "text-blue-500" },
    { label: "Pendientes", value: stats.pending, icon: Clock, borderClass: "border-l-amber-500", iconClass: "text-amber-500" },
    { label: "En Investigación", value: stats.investigating, icon: Eye, borderClass: "border-l-red-500", iconClass: "text-red-500" },
    { label: "Resueltas", value: stats.resolved, icon: CheckCircle, borderClass: "border-l-emerald-500", iconClass: "text-emerald-500" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="pl-[260px] transition-all duration-300">
        <Header 
          title="Centro de Alertas" 
          subtitle="Gestión y monitoreo de alertas de fraude"
          onRefresh={fetchAlerts} 
        />

        <main className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className={`border-l-4 ${stat.borderClass} bg-white shadow-sm`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{stat.label}</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                      </div>
                      <div className={`p-2.5 rounded-lg bg-slate-50 ${stat.iconClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="bg-white shadow-sm border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <h2 className="text-base font-semibold text-slate-900">Alertas de Fraude</h2>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {filteredAlerts.length} alertas encontradas
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Buscar cliente, ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 text-sm bg-slate-50 border-slate-200"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36 h-9 text-sm bg-white border-slate-200">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendientes</SelectItem>
                      <SelectItem value="investigating">Investigando</SelectItem>
                      <SelectItem value="resolved">Resueltas</SelectItem>
                      <SelectItem value="closed">Cerradas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-44 h-9 text-sm bg-white border-slate-200">
                      <SelectValue placeholder="Tipo de Fraude" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      {fraudTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type?.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-blue-500"></div>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">ID Transacción</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Fecha</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Cliente</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Monto</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Categoría</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Ciudad</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Tipo Fraude</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Estado</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedAlerts.map((alert) => (
                        <TableRow
                          key={alert.TRANSACTION_ID}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <TableCell className="font-mono text-xs text-slate-600">
                            {alert.TRANSACTION_ID?.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {new Date(alert.FECHA).toLocaleDateString("es", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell className="text-sm font-medium text-slate-900">{alert.CLIENTE}</TableCell>
                          <TableCell className="text-sm font-semibold text-red-600">
                            {formatCurrency(alert.MONTO)}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">{alert.CATEGORIA}</TableCell>
                          <TableCell className="text-sm text-slate-600">{alert.CIUDAD}</TableCell>
                          <TableCell>{getFraudTypeBadge(alert.TIPO_FRAUDE)}</TableCell>
                          <TableCell>{getStatusBadge(alert.ESTADO)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                      <p className="text-sm text-slate-500">
                        Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredAlerts.length)} de {filteredAlerts.length}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="h-8 px-3 text-sm"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Anterior
                        </Button>
                        <div className="flex items-center gap-1 mx-2">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="h-8 w-8 p-0 text-sm"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="h-8 px-3 text-sm"
                        >
                          Siguiente
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
