"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, RefreshCw, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HeaderProps {
  onRefresh?: () => void;
  title?: string;
  subtitle?: string;
}

interface Notification {
  id: string;
  type: "fraud" | "alert" | "system";
  message: string;
  time: Date;
  read: boolean;
}

export function Header({ onRefresh, title, subtitle }: HeaderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState("24h");

  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: "1",
        type: "fraud",
        message: "3 nuevas transacciones sospechosas detectadas",
        time: new Date(Date.now() - 5 * 60000),
        read: false,
      },
      {
        id: "2",
        type: "alert",
        message: "Tasa de fraude aumentó 15% en última hora",
        time: new Date(Date.now() - 30 * 60000),
        read: false,
      },
      {
        id: "3",
        type: "system",
        message: "Modelo ML actualizado exitosamente",
        time: new Date(Date.now() - 2 * 3600000),
        read: true,
      },
    ];
    setNotifications(mockNotifications);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    onRefresh?.();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const getNotificationDot = (type: Notification["type"]) => {
    switch (type) {
      case "fraud":
        return "bg-red-500";
      case "alert":
        return "bg-amber-500";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-8 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
      <div className="flex flex-col">
        {title && (
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        )}
        {subtitle && (
          <p className="text-sm text-slate-500">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px] h-9 text-sm bg-white border-slate-200">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">Última hora</SelectItem>
            <SelectItem value="24h">Últimas 24h</SelectItem>
            <SelectItem value="7d">Últimos 7 días</SelectItem>
            <SelectItem value="30d">Últimos 30 días</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={refreshing}
          className="h-9 w-9 border-slate-200"
        >
          <RefreshCw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        </Button>

        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowNotifications(!showNotifications)}
            className="h-9 w-9 border-slate-200 relative"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>

          {showNotifications && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 top-11 w-80 bg-white border border-slate-200 rounded-lg shadow-xl z-50 animate-slide-up overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-semibold text-sm text-slate-900">Notificaciones</h3>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllRead}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        <Check className="h-3 w-3" />
                        Marcar leídas
                      </button>
                    )}
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="p-1 hover:bg-slate-100 rounded ml-2"
                    >
                      <X className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer ${
                        !notification.read ? "bg-blue-50/30" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`h-2 w-2 rounded-full mt-1.5 ${getNotificationDot(notification.type)}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 leading-snug">{notification.message}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {notification.time.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
