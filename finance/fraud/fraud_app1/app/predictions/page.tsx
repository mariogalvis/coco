"use client";

import { useState, useCallback, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Zap,
  AlertTriangle,
  CheckCircle,
  Shield,
  CreditCard,
  MapPin,
  Clock,
  Smartphone,
  Globe,
  TrendingUp,
  User,
} from "lucide-react";

interface PredictionResult {
  prediction: number;
  confidence: number;
  model: string;
  riskScore?: number;
}

interface SimulationParams {
  amount: number;
  hour: number;
  dayOfWeek: number;
  channel: string;
  txCount1h: number;
  txCount24h: number;
  amountRatio: number;
  customerRisk: number;
  merchantRisk: number;
  locationChanged: boolean;
  deviceChanged: boolean;
  isInternational: boolean;
}

const defaultParams: SimulationParams = {
  amount: 500,
  hour: 14,
  dayOfWeek: 2,
  channel: "online",
  txCount1h: 1,
  txCount24h: 3,
  amountRatio: 1.0,
  customerRisk: 25,
  merchantRisk: 1,
  locationChanged: false,
  deviceChanged: false,
  isInternational: false,
};

export default function PredictionsPage() {
  const [params, setParams] = useState<SimulationParams>(defaultParams);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoPredict, setAutoPredict] = useState(true);

  const predict = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: params.amount,
          hour_of_day: params.hour,
          day_of_week: params.dayOfWeek,
          is_weekend: params.dayOfWeek >= 5 ? 1 : 0,
          is_night: params.hour < 6 || params.hour > 22 ? 1 : 0,
          tx_count_1h: params.txCount1h,
          tx_count_24h: params.txCount24h,
          amount_vs_avg_ratio: params.amountRatio,
          customer_risk_score: params.customerRisk,
          merchant_risk_score: params.merchantRisk,
          location_changed: params.locationChanged ? 1 : 0,
          device_changed: params.deviceChanged ? 1 : 0,
          high_velocity_1h: params.txCount1h > 3 ? 1 : 0,
          is_international: params.isInternational ? 1 : 0,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error("Error making prediction:", error);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    if (autoPredict) {
      const timer = setTimeout(() => predict(), 300);
      return () => clearTimeout(timer);
    }
  }, [params, autoPredict, predict]);

  const updateParam = <K extends keyof SimulationParams>(key: K, value: SimulationParams[K]) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const riskFactors = [
    { condition: params.amount > 2000, label: "Monto alto", icon: CreditCard, weight: 30 },
    { condition: params.customerRisk > 70, label: "Cliente riesgoso", icon: User, weight: 25 },
    { condition: params.txCount1h > 3, label: "Alta velocidad", icon: TrendingUp, weight: 15 },
    { condition: params.amountRatio > 3, label: "Monto inusual", icon: TrendingUp, weight: 15 },
    { condition: params.locationChanged, label: "Cambio ubicación", icon: MapPin, weight: 10 },
    { condition: params.deviceChanged, label: "Cambio dispositivo", icon: Smartphone, weight: 10 },
    { condition: params.isInternational, label: "Internacional", icon: Globe, weight: 5 },
    { condition: params.hour < 6 || params.hour > 22, label: "Horario nocturno", icon: Clock, weight: 5 },
    { condition: params.merchantRisk === 3, label: "Comercio riesgoso", icon: AlertTriangle, weight: 10 },
  ].filter((f) => f.condition);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64 transition-all duration-300">
        <Header title="Predicción en Tiempo Real" showSearch={false} />

        <main className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Simulador de Transacciones
                  </CardTitle>
                  <CardDescription>
                    Ajusta los parámetros para ver la predicción del modelo ML en tiempo real
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Información de la Transacción
                      </h4>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Monto</span>
                          <span className="font-mono">{formatCurrency(params.amount)}</span>
                        </div>
                        <input
                          type="range"
                          min={5}
                          max={10000}
                          step={10}
                          value={params.amount}
                          onChange={(e) => updateParam("amount", Number(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Hora del día</span>
                          <span className="font-mono">{params.hour}:00</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={23}
                          value={params.hour}
                          onChange={(e) => updateParam("hour", Number(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Día de la semana</span>
                          <span className="font-mono">
                            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][params.dayOfWeek]}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={6}
                          value={params.dayOfWeek}
                          onChange={(e) => updateParam("dayOfWeek", Number(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm">Canal</label>
                        <Select value={params.channel} onValueChange={(v) => updateParam("channel", v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="online">Online</SelectItem>
                            <SelectItem value="POS">POS</SelectItem>
                            <SelectItem value="ATM">ATM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Patrones de Comportamiento
                      </h4>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>TX última hora</span>
                          <span className="font-mono">{params.txCount1h}</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={params.txCount1h}
                          onChange={(e) => updateParam("txCount1h", Number(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>TX últimas 24h</span>
                          <span className="font-mono">{params.txCount24h}</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={20}
                          value={params.txCount24h}
                          onChange={(e) => updateParam("txCount24h", Number(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Ratio vs promedio</span>
                          <span className="font-mono">{params.amountRatio.toFixed(1)}x</span>
                        </div>
                        <input
                          type="range"
                          min={0.1}
                          max={12}
                          step={0.1}
                          value={params.amountRatio}
                          onChange={(e) => updateParam("amountRatio", Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Indicadores de Riesgo
                      </h4>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Riesgo del cliente</span>
                          <span className="font-mono">{params.customerRisk}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={params.customerRisk}
                          onChange={(e) => updateParam("customerRisk", Number(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm">Riesgo del comercio</label>
                        <Select
                          value={params.merchantRisk.toString()}
                          onValueChange={(v) => updateParam("merchantRisk", Number(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Bajo</SelectItem>
                            <SelectItem value="2">Medio</SelectItem>
                            <SelectItem value="3">Alto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Flags de Seguridad
                      </h4>

                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={params.locationChanged}
                            onChange={(e) => updateParam("locationChanged", e.target.checked)}
                            className="w-4 h-4 rounded"
                          />
                          <span className="text-sm">Cambio de ubicación</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={params.deviceChanged}
                            onChange={(e) => updateParam("deviceChanged", e.target.checked)}
                            className="w-4 h-4 rounded"
                          />
                          <span className="text-sm">Cambio de dispositivo</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={params.isInternational}
                            onChange={(e) => updateParam("isInternational", e.target.checked)}
                            className="w-4 h-4 rounded"
                          />
                          <span className="text-sm">Transacción internacional</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {!autoPredict && (
                    <Button onClick={predict} disabled={loading} className="w-full">
                      {loading ? "Analizando..." : "Ejecutar Predicción"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card
                className={`border-t-4 ${
                  result?.prediction === 1 ? "border-t-fraud-critical" : "border-t-fraud-low"
                }`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {result?.prediction === 1 ? (
                      <>
                        <AlertTriangle className="h-5 w-5 text-fraud-critical" />
                        Fraude Detectado
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 text-fraud-low" />
                        Transacción Legítima
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                    </div>
                  ) : result ? (
                    <>
                      <div
                        className={`p-6 rounded-lg text-center ${
                          result.prediction === 1 ? "bg-fraud-critical/10" : "bg-fraud-low/10"
                        }`}
                      >
                        <p
                          className={`text-4xl font-bold ${
                            result.prediction === 1 ? "text-fraud-critical" : "text-fraud-low"
                          }`}
                        >
                          {result.prediction === 1 ? "FRAUDE" : "LEGÍTIMA"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Confianza: {(result.confidence * 100).toFixed(0)}%
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Nivel de confianza</span>
                          <span className="font-bold">{(result.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <Progress
                          value={result.confidence * 100}
                          className="h-2"
                          indicatorClassName={
                            result.prediction === 1 ? "bg-fraud-critical" : "bg-fraud-low"
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm">Modelo</span>
                        <Badge variant="outline">{result.model}</Badge>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Ajusta los parámetros para ver la predicción
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Factores de Riesgo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {riskFactors.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-fraud-low" />
                      Sin factores de riesgo detectados
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {riskFactors.map((factor) => (
                        <div
                          key={factor.label}
                          className="flex items-center justify-between p-2 bg-fraud-critical/5 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <factor.icon className="h-4 w-4 text-fraud-critical" />
                            <span className="text-sm">{factor.label}</span>
                          </div>
                          <Badge variant="danger">+{factor.weight}</Badge>
                        </div>
                      ))}
                      <div className="pt-2 border-t">
                        <div className="flex justify-between font-semibold">
                          <span>Score Total</span>
                          <span className="text-fraud-critical">
                            {riskFactors.reduce((sum, f) => sum + f.weight, 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resumen de Transacción</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monto</span>
                    <span className="font-bold">{formatCurrency(params.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hora</span>
                    <span className="font-mono">{params.hour}:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Canal</span>
                    <Badge variant="outline">{params.channel}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Riesgo Cliente</span>
                    <Badge
                      variant={
                        params.customerRisk >= 80
                          ? "critical"
                          : params.customerRisk >= 60
                          ? "danger"
                          : params.customerRisk >= 40
                          ? "warning"
                          : "success"
                      }
                    >
                      {params.customerRisk}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
