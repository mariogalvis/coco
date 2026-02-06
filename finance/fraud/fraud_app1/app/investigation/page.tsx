"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
} from "recharts";
import {
  Search,
  User,
  Mail,
  MapPin,
  AlertTriangle,
  Shield,
  CreditCard,
  Activity,
} from "lucide-react";

interface Customer {
  CUSTOMER_ID: string;
  NAME: string;
  EMAIL: string;
  CITY: string;
  COUNTRY: string;
  RISK_SCORE: number;
}

interface Transaction {
  TRANSACTION_ID: string;
  FECHA: string;
  MONTO: number;
  CATEGORIA: string;
  CIUDAD: string;
  CANAL: string;
  ESTADO: string;
}

export default function InvestigationPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const searchCustomers = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setSearchPerformed(true);
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setCustomers(data.customers || []);
      setSelectedCustomer(null);
      setTransactions([]);
    } catch (error) {
      console.error("Error searching customers:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  const selectCustomer = useCallback(async (customer: Customer) => {
    setSelectedCustomer(customer);
    setLoading(true);
    try {
      const res = await fetch(`/api/customers?id=${customer.CUSTOMER_ID}`);
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error("Error fetching customer transactions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getRiskBadge = (score: number) => {
    if (score >= 80) return <Badge variant="critical">Crítico ({score})</Badge>;
    if (score >= 60) return <Badge variant="danger">Alto ({score})</Badge>;
    if (score >= 40) return <Badge variant="warning">Medio ({score})</Badge>;
    return <Badge variant="success">Bajo ({score})</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const transactionStats = transactions.length > 0 ? {
    total: transactions.length,
    frauds: transactions.filter(t => t.ESTADO === "Fraude").length,
    totalAmount: transactions.reduce((sum, t) => sum + t.MONTO, 0),
    avgAmount: transactions.reduce((sum, t) => sum + t.MONTO, 0) / transactions.length,
  } : null;

  const chartData = transactions.map(t => ({
    fecha: new Date(t.FECHA).toLocaleDateString("es", { day: "2-digit", month: "short" }),
    monto: t.MONTO,
    esFraude: t.ESTADO === "Fraude",
  }));

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64 transition-all duration-300">
        <Header title="Panel de Investigación" showSearch={false} />

        <main className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Buscar Cliente
              </CardTitle>
              <CardDescription>
                Busca por nombre o email para investigar su historial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nombre del cliente o email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchCustomers()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={searchCustomers} disabled={loading}>
                  {loading ? "Buscando..." : "Buscar"}
                </Button>
              </div>

              {searchPerformed && customers.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Resultados ({customers.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customers.map((customer) => (
                      <Card
                        key={customer.CUSTOMER_ID}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedCustomer?.CUSTOMER_ID === customer.CUSTOMER_ID
                            ? "ring-2 ring-primary"
                            : ""
                        }`}
                        onClick={() => selectCustomer(customer)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-semibold">{customer.NAME}</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {customer.EMAIL}
                                </p>
                              </div>
                            </div>
                            {getRiskBadge(customer.RISK_SCORE)}
                          </div>
                          <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {customer.CITY}, {customer.COUNTRY}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {searchPerformed && customers.length === 0 && !loading && (
                <div className="mt-6 text-center py-8 text-muted-foreground">
                  No se encontraron clientes con ese criterio de búsqueda
                </div>
              )}
            </CardContent>
          </Card>

          {selectedCustomer && (
            <>
              <Card className="border-t-4 border-t-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Perfil del Cliente: {selectedCustomer.NAME}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedCustomer.EMAIL}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Ubicación</p>
                      <p className="font-medium">{selectedCustomer.CITY}, {selectedCustomer.COUNTRY}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Score de Riesgo</p>
                      {getRiskBadge(selectedCustomer.RISK_SCORE)}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">ID Cliente</p>
                      <p className="font-mono text-sm">{selectedCustomer.CUSTOMER_ID.slice(0, 8)}...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {transactionStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-8 w-8 text-primary opacity-50" />
                        <div>
                          <p className="text-sm text-muted-foreground">Total Transacciones</p>
                          <p className="text-2xl font-bold">{transactionStats.total}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-8 w-8 text-fraud-critical opacity-50" />
                        <div>
                          <p className="text-sm text-muted-foreground">Fraudes</p>
                          <p className="text-2xl font-bold text-fraud-critical">
                            {transactionStats.frauds}
                            <span className="text-sm font-normal text-muted-foreground ml-1">
                              ({((transactionStats.frauds / transactionStats.total) * 100).toFixed(1)}%)
                            </span>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Activity className="h-8 w-8 text-chart-2 opacity-50" />
                        <div>
                          <p className="text-sm text-muted-foreground">Monto Total</p>
                          <p className="text-2xl font-bold">{formatCurrency(transactionStats.totalAmount)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Activity className="h-8 w-8 text-chart-3 opacity-50" />
                        <div>
                          <p className="text-sm text-muted-foreground">Promedio TX</p>
                          <p className="text-2xl font-bold">{formatCurrency(transactionStats.avgAmount)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Patrón de Gasto</CardTitle>
                    <CardDescription>Montos de transacciones en el tiempo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="fecha" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Scatter data={chartData} dataKey="monto">
                          {chartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.esFraude ? "hsl(0, 84%, 60%)" : "hsl(221, 83%, 53%)"}
                            />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Historial de Transacciones</CardTitle>
                    <CardDescription>Últimas {transactions.length} transacciones</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[300px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead>Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.slice(0, 20).map((tx) => (
                            <TableRow
                              key={tx.TRANSACTION_ID}
                              className={tx.ESTADO === "Fraude" ? "bg-destructive/5" : ""}
                            >
                              <TableCell className="text-sm">
                                {new Date(tx.FECHA).toLocaleDateString("es", {
                                  day: "2-digit",
                                  month: "short",
                                })}
                              </TableCell>
                              <TableCell className={tx.ESTADO === "Fraude" ? "font-bold text-fraud-critical" : ""}>
                                {formatCurrency(tx.MONTO)}
                              </TableCell>
                              <TableCell className="text-sm">{tx.CATEGORIA}</TableCell>
                              <TableCell>
                                <Badge variant={tx.ESTADO === "Fraude" ? "critical" : "success"}>
                                  {tx.ESTADO}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
