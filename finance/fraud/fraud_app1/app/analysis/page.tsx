"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import {
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  MapPin,
  Clock,
  Calendar,
} from "lucide-react";

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

interface FraudByGeography {
  CIUDAD: string;
  TOTAL_TX: number;
  FRAUDES: number;
  TASA_FRAUDE: number;
  MONTO_FRAUDE: number;
}

interface CompareData {
  PERIODO: string;
  TOTAL_TX: number;
  FRAUDES: number;
  TASA_FRAUDE: number;
  MONTO_TOTAL: number;
  MONTO_FRAUDE: number;
}

const COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(160, 60%, 45%)",
  "hsl(30, 80%, 55%)",
  "hsl(280, 65%, 60%)",
  "hsl(340, 75%, 55%)",
  "hsl(200, 70%, 50%)",
];

export default function AnalysisPage() {
  const [fraudByTime, setFraudByTime] = useState<FraudByTime[]>([]);
  const [fraudByCategory, setFraudByCategory] = useState<FraudByCategory[]>([]);
  const [fraudByGeography, setFraudByGeography] = useState<FraudByGeography[]>([]);
  const [compareData, setCompareData] = useState<CompareData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeView, setTimeView] = useState<"daily" | "hourly">("daily");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [timeRes, categoryRes, geoRes, compareRes] = await Promise.all([
        fetch("/api/fraud-by-time"),
        fetch("/api/fraud-by-category"),
        fetch("/api/fraud-by-geography"),
        fetch("/api/compare"),
      ]);

      const [timeData, categoryData, geoData, cmpData] = await Promise.all([
        timeRes.json(),
        categoryRes.json(),
        geoRes.json(),
        compareRes.json(),
      ]);

      setFraudByTime(Array.isArray(timeData) ? timeData : []);
      setFraudByCategory(Array.isArray(categoryData) ? categoryData : []);
      setFraudByGeography(Array.isArray(geoData) ? geoData : []);
      setCompareData(Array.isArray(cmpData) ? cmpData : []);
    } catch (error) {
      console.error("Error fetching analysis data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const radarData = fraudByCategory.slice(0, 6).map((cat) => ({
    category: cat.CATEGORIA,
    fraudRate: cat.TASA_FRAUDE,
    volume: Math.min(cat.TOTAL_TX / 100, 100),
    amount: Math.min(cat.MONTO_FRAUDE / 10000, 100),
  }));

  const scatterData = fraudByGeography.map((city) => ({
    x: city.TOTAL_TX,
    y: city.TASA_FRAUDE,
    z: city.MONTO_FRAUDE,
    name: city.CIUDAD,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64 transition-all duration-300">
        <Header title="Análisis de Fraudes" onRefresh={fetchData} showSearch={false} />

        <main className="p-6 space-y-6">
          <Tabs defaultValue="temporal" className="space-y-6">
            <TabsList className="grid w-full max-w-xl grid-cols-4">
              <TabsTrigger value="temporal">
                <Clock className="h-4 w-4 mr-2" />
                Temporal
              </TabsTrigger>
              <TabsTrigger value="category">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Categorías
              </TabsTrigger>
              <TabsTrigger value="geography">
                <MapPin className="h-4 w-4 mr-2" />
                Geográfico
              </TabsTrigger>
              <TabsTrigger value="compare">
                <Calendar className="h-4 w-4 mr-2" />
                Comparar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="temporal" className="space-y-6">
              <div className="flex items-center gap-4">
                <Select value={timeView} onValueChange={(v) => setTimeView(v as "daily" | "hourly")}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Vista Diaria</SelectItem>
                    <SelectItem value="hourly">Vista por Hora</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Evolución de Fraudes</CardTitle>
                    <CardDescription>Tendencia de tasa de fraude en el tiempo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={fraudByTime}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="FECHA"
                          tickFormatter={(v) => new Date(v).toLocaleDateString("es", { day: "2-digit", month: "short" })}
                          className="text-xs"
                        />
                        <YAxis className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="TASA_FRAUDE"
                          name="Tasa de Fraude (%)"
                          stroke="hsl(340, 75%, 55%)"
                          strokeWidth={2}
                          dot={{ fill: "hsl(340, 75%, 55%)" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Volumen de Transacciones vs Fraudes</CardTitle>
                    <CardDescription>Comparación de volumen total y fraudulento</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={fraudByTime.slice(-14)}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="FECHA"
                          tickFormatter={(v) => new Date(v).toLocaleDateString("es", { day: "2-digit" })}
                          className="text-xs"
                        />
                        <YAxis className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Bar dataKey="TOTAL_TX" name="Total TX" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="FRAUDES" name="Fraudes" fill="hsl(340, 75%, 55%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="category" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribución por Categoría</CardTitle>
                    <CardDescription>Proporción de fraudes por tipo de comercio</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={fraudByCategory.slice(0, 6)}
                          dataKey="FRAUDES"
                          nameKey="CATEGORIA"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={2}
                          label={({ CATEGORIA, percent }) => `${CATEGORIA} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {fraudByCategory.slice(0, 6).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Perfil de Riesgo por Categoría</CardTitle>
                    <CardDescription>Análisis multidimensional de riesgo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="category" className="text-xs" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar
                          name="Tasa Fraude"
                          dataKey="fraudRate"
                          stroke="hsl(340, 75%, 55%)"
                          fill="hsl(340, 75%, 55%)"
                          fillOpacity={0.5}
                        />
                        <Radar
                          name="Volumen"
                          dataKey="volume"
                          stroke="hsl(221, 83%, 53%)"
                          fill="hsl(221, 83%, 53%)"
                          fillOpacity={0.3}
                        />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Ranking de Categorías por Riesgo</CardTitle>
                    <CardDescription>Ordenado por tasa de fraude</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={fraudByCategory} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" className="text-xs" />
                        <YAxis dataKey="CATEGORIA" type="category" width={100} className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="TASA_FRAUDE" name="Tasa Fraude (%)" radius={[0, 4, 4, 0]}>
                          {fraudByCategory.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.TASA_FRAUDE > 8 ? "hsl(0, 84%, 60%)" : entry.TASA_FRAUDE > 6 ? "hsl(30, 80%, 55%)" : "hsl(160, 60%, 45%)"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="geography" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Mapa de Calor Geográfico
                  </CardTitle>
                  <CardDescription>
                    Distribución de fraudes por ciudad - Tamaño indica monto, color indica tasa
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        type="number"
                        dataKey="x"
                        name="Transacciones"
                        className="text-xs"
                        label={{ value: "Total Transacciones", position: "bottom" }}
                      />
                      <YAxis
                        type="number"
                        dataKey="y"
                        name="Tasa Fraude"
                        className="text-xs"
                        label={{ value: "Tasa de Fraude (%)", angle: -90, position: "left" }}
                      />
                      <ZAxis type="number" dataKey="z" range={[100, 1000]} name="Monto" />
                      <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === "Monto") return [`$${value.toLocaleString()}`, name];
                          if (name === "Tasa Fraude") return [`${value.toFixed(2)}%`, name];
                          return [value.toLocaleString(), name];
                        }}
                        labelFormatter={(_, payload) => payload[0]?.payload?.name || ""}
                      />
                      <Scatter data={scatterData} fill="hsl(340, 75%, 55%)">
                        {scatterData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.y > 10 ? "hsl(0, 84%, 60%)" : entry.y > 7 ? "hsl(30, 80%, 55%)" : "hsl(221, 83%, 53%)"}
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {fraudByGeography.slice(0, 8).map((city, index) => (
                  <Card key={city.CIUDAD} className={index < 3 ? "border-l-4 border-l-fraud-critical" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{city.CIUDAD}</span>
                        <Badge variant={city.TASA_FRAUDE > 10 ? "critical" : city.TASA_FRAUDE > 7 ? "danger" : "warning"}>
                          {city.TASA_FRAUDE.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>Fraudes:</span>
                          <span className="font-medium">{city.FRAUDES.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pérdidas:</span>
                          <span className="font-medium text-fraud-critical">
                            ${city.MONTO_FRAUDE.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="compare" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Comparación Temporal
                  </CardTitle>
                  <CardDescription>Compara métricas entre dos períodos diferentes</CardDescription>
                </CardHeader>
                <CardContent>
                  {compareData.length >= 2 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg">Período 1</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between p-3 bg-muted rounded-lg">
                            <span>Transacciones</span>
                            <span className="font-bold">{compareData[0]?.TOTAL_TX?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between p-3 bg-muted rounded-lg">
                            <span>Fraudes</span>
                            <span className="font-bold text-fraud-critical">{compareData[0]?.FRAUDES?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between p-3 bg-muted rounded-lg">
                            <span>Tasa Fraude</span>
                            <span className="font-bold">{compareData[0]?.TASA_FRAUDE}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center space-y-4">
                        <h4 className="font-semibold text-lg">Variación</h4>
                        {compareData.length >= 2 && (
                          <>
                            <div className="flex items-center gap-2">
                              {compareData[1].TASA_FRAUDE > compareData[0].TASA_FRAUDE ? (
                                <TrendingUp className="h-8 w-8 text-fraud-critical" />
                              ) : (
                                <TrendingDown className="h-8 w-8 text-fraud-low" />
                              )}
                              <span className="text-2xl font-bold">
                                {Math.abs(compareData[1].TASA_FRAUDE - compareData[0].TASA_FRAUDE).toFixed(2)}%
                              </span>
                            </div>
                            <Badge
                              variant={compareData[1].TASA_FRAUDE > compareData[0].TASA_FRAUDE ? "critical" : "success"}
                              className="text-lg px-4 py-1"
                            >
                              {compareData[1].TASA_FRAUDE > compareData[0].TASA_FRAUDE ? "Aumento" : "Reducción"}
                            </Badge>
                          </>
                        )}
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg">Período 2</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between p-3 bg-muted rounded-lg">
                            <span>Transacciones</span>
                            <span className="font-bold">{compareData[1]?.TOTAL_TX?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between p-3 bg-muted rounded-lg">
                            <span>Fraudes</span>
                            <span className="font-bold text-fraud-critical">{compareData[1]?.FRAUDES?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between p-3 bg-muted rounded-lg">
                            <span>Tasa Fraude</span>
                            <span className="font-bold">{compareData[1]?.TASA_FRAUDE}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
