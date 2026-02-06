"use client";

import { useState, useCallback, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Brain,
  Send,
  Sparkles,
  MessageSquare,
  Code,
  Lightbulb,
  History,
  Trash2,
  MapPin,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ColombiaMap } from "@/components/dashboard/colombia-map";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  sql?: string;
  data?: Record<string, unknown>[];
  suggestions?: string[];
  timestamp: Date;
}

interface CityData {
  city: string;
  count: number;
  fraudRate: number;
}

const exampleQuestions = [
  "¿Cuántas transacciones hay en total?",
  "¿Cuál es la tasa de fraude?",
  "¿Cuáles son las categorías con más fraudes?",
  "¿Cuáles ciudades tienen mayor tasa de fraude?",
  "¿Cuál es el monto promedio de transacciones fraudulentas?",
  "¿Cuántos fraudes hay por tipo?",
];

export default function IntelligencePage() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapData, setMapData] = useState<CityData[]>([]);

  useEffect(() => {
    fetch("/api/map-data")
      .then((res) => res.json())
      .then((data) => setMapData(data.data || []))
      .catch(console.error);
  }, []);

  const handleCityClick = (city: string) => {
    askQuestion(`¿Cuál es la tasa de fraude en ${city}?`);
  };

  const askQuestion = useCallback(async (q: string) => {
    if (!q.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: q,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch("/api/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();

      const content = data.message?.content || [];
      let text = "";
      let sql = "";
      let suggestions: string[] = [];
      let tableData: Record<string, unknown>[] = [];

      for (const item of content) {
        if (item.type === "text") {
          text = item.text;
        } else if (item.type === "sql") {
          sql = item.statement;
          try {
            const sqlRes = await fetch("/api/execute-sql", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sql: item.statement }),
            });
            const sqlData = await sqlRes.json();
            tableData = sqlData.results || [];
          } catch {
            // SQL execution failed silently
          }
        } else if (item.type === "suggestions") {
          suggestions = item.suggestions || [];
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: text || "Aquí está el resultado de tu consulta:",
        sql,
        data: tableData,
        suggestions,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error asking question:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "Lo siento, hubo un error procesando tu pregunta. Por favor intenta de nuevo.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearHistory = () => {
    setMessages([]);
  };

  const renderData = (data: Record<string, unknown>[]) => {
    if (!data || data.length === 0) return null;

    const columns = Object.keys(data[0]);
    const isChartable = data.length > 1 && columns.length >= 2;

    const numericColumn = columns.find((col) => typeof data[0][col] === "number" && col !== columns[0]);

    return (
      <div className="space-y-4">
        {isChartable && numericColumn && (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey={columns[0]} className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey={numericColumn} fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col}>{col}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 10).map((row, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={col}>
                    {typeof row[col] === "number"
                      ? (row[col] as number).toLocaleString()
                      : String(row[col])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64 transition-all duration-300">
        <Header title="Snowflake Intelligence" showSearch={false} />

        <main className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <Card className="border-t-4 border-t-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    Asistente de Análisis de Fraudes
                  </CardTitle>
                  <CardDescription>
                    Haz preguntas en lenguaje natural sobre los datos de fraude
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <Input
                      placeholder="Escribe tu pregunta..."
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !loading && askQuestion(question)}
                      className="flex-1"
                    />
                    <Button onClick={() => askQuestion(question)} disabled={loading || !question.trim()}>
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {exampleQuestions.slice(0, 4).map((q) => (
                      <Button
                        key={q}
                        variant="outline"
                        size="sm"
                        onClick={() => askQuestion(q)}
                        disabled={loading}
                        className="text-xs"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        {q}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4 min-h-[400px]">
                {messages.length === 0 ? (
                  <Card className="flex items-center justify-center h-64">
                    <div className="text-center space-y-3">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                      <p className="text-muted-foreground">
                        Haz una pregunta para comenzar el análisis
                      </p>
                    </div>
                  </Card>
                ) : (
                  messages.map((msg) => (
                    <Card
                      key={msg.id}
                      className={msg.type === "user" ? "bg-primary/5 border-l-4 border-l-primary" : ""}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              msg.type === "user" ? "bg-primary text-white" : "bg-chart-4 text-white"
                            }`}
                          >
                            {msg.type === "user" ? (
                              <MessageSquare className="h-4 w-4" />
                            ) : (
                              <Brain className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1 space-y-3">
                            <p className="text-sm">{msg.content}</p>

                            {msg.sql && (
                              <div className="rounded-lg bg-muted p-3">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                  <Code className="h-3 w-3" />
                                  SQL Generado
                                </div>
                                <pre className="text-xs overflow-x-auto">{msg.sql}</pre>
                              </div>
                            )}

                            {msg.data && msg.data.length > 0 && renderData(msg.data)}

                            {msg.suggestions && msg.suggestions.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Lightbulb className="h-3 w-3" />
                                  Preguntas relacionadas
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {msg.suggestions.map((sug, i) => (
                                    <Badge
                                      key={i}
                                      variant="outline"
                                      className="cursor-pointer hover:bg-accent"
                                      onClick={() => askQuestion(sug)}
                                    >
                                      {sug}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            <p className="text-xs text-muted-foreground">
                              {msg.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}

                {loading && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                        <span className="text-muted-foreground">Analizando con Cortex Analyst...</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Historial
                    </span>
                    {messages.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearHistory}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {messages.filter((m) => m.type === "user").length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin preguntas recientes</p>
                  ) : (
                    <div className="space-y-2">
                      {messages
                        .filter((m) => m.type === "user")
                        .slice(-5)
                        .reverse()
                        .map((msg, i) => (
                          <Button
                            key={msg.id}
                            variant="ghost"
                            className="w-full justify-start text-xs h-auto py-2 px-3"
                            onClick={() => askQuestion(msg.content)}
                          >
                            <span className="truncate">{i + 1}. {msg.content}</span>
                          </Button>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Ejemplos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {exampleQuestions.map((q) => (
                      <Button
                        key={q}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs h-auto py-2"
                        onClick={() => askQuestion(q)}
                        disabled={loading}
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Mapa de Colombia
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Click en una ciudad para analizar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ColombiaMap data={mapData} onCityClick={handleCityClick} />
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
