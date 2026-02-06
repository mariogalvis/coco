"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  LayoutDashboard,
  BarChart3,
  AlertTriangle,
  Search,
  Brain,
  Zap,
  Settings,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

interface Alert {
  count: number;
  critical: number;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Análisis", href: "/analysis", icon: BarChart3 },
  { name: "Alertas", href: "/alerts", icon: AlertTriangle },
  { name: "Investigación", href: "/investigation", icon: Search },
  { name: "Intelligence", href: "/intelligence", icon: Brain },
  { name: "Predicción", href: "/predictions", icon: Zap },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [alerts, setAlerts] = useState<Alert>({ count: 0, critical: 0 });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch("/api/alerts?pending=true");
        const data = await res.json();
        setAlerts({
          count: data.length || 0,
          critical: data.filter((a: { TIPO_FRAUDE: string }) => 
            a.TIPO_FRAUDE === "identity_theft" || a.TIPO_FRAUDE === "account_takeover"
          ).length || 0,
        });
        setLastUpdate(new Date());
      } catch {
        // Silent fail
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen sidebar-gradient transition-all duration-300 flex flex-col",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      <div className={cn(
        "flex items-center gap-3 h-16 border-b border-white/10",
        collapsed ? "px-4 justify-center" : "px-5"
      )}>
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 backdrop-blur">
          <Shield className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="font-semibold text-white text-[15px]">FraudShield</h1>
            <p className="text-[11px] text-slate-400">Enterprise Security</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const showBadge = item.name === "Alertas" && alerts.count > 0;

          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-150 group relative",
                  isActive 
                    ? "bg-white/10 text-white" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-500 rounded-r" />
                )}
                <Icon className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-colors",
                  isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"
                )} />
                {!collapsed && (
                  <span className={cn(
                    "text-[13px] font-medium flex-1",
                    isActive ? "text-white" : ""
                  )}>
                    {item.name}
                  </span>
                )}
                {showBadge && (
                  <Badge
                    variant={alerts.critical > 0 ? "critical" : "warning"}
                    className={cn(
                      "h-5 min-w-5 px-1.5 text-[10px] font-semibold",
                      collapsed && "absolute -top-1 -right-1"
                    )}
                  >
                    {collapsed ? alerts.critical || alerts.count : alerts.count}
                  </Badge>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3 space-y-3">
        {!collapsed && (
          <div className="flex items-center gap-2 px-3 py-2 text-[11px] text-slate-500 animate-fade-in">
            <RefreshCw className="h-3 w-3" />
            <span>Actualizado: {lastUpdate.toLocaleTimeString()}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {!collapsed && (
            <button className="flex-1 flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-colors text-[13px] animate-fade-in">
              <Settings className="h-4 w-4" />
              <span>Configuración</span>
            </button>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex items-center justify-center h-8 w-8 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors",
              collapsed && "mx-auto"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
