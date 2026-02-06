"use client";

import { useEffect, useState } from "react";

interface CityData {
  city: string;
  count: number;
  fraudRate: number;
}

interface ColombiaMapProps {
  data?: CityData[];
  onCityClick?: (city: string) => void;
}

const CITY_COORDINATES: Record<string, { x: number; y: number }> = {
  "Bogotá": { x: 170, y: 195 },
  "Medellín": { x: 135, y: 145 },
  "Cali": { x: 115, y: 235 },
  "Barranquilla": { x: 145, y: 55 },
  "Cartagena": { x: 120, y: 65 },
  "Bucaramanga": { x: 170, y: 130 },
  "Pereira": { x: 130, y: 195 },
  "Santa Marta": { x: 165, y: 50 },
  "Manizales": { x: 135, y: 185 },
  "Villavicencio": { x: 195, y: 210 },
  "Ibagué": { x: 145, y: 210 },
  "Pasto": { x: 115, y: 290 },
  "Cúcuta": { x: 185, y: 110 },
  "Montería": { x: 100, y: 105 },
  "Neiva": { x: 145, y: 240 },
};

export function ColombiaMap({ data = [], onCityClick }: ColombiaMapProps) {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [cityStats, setCityStats] = useState<Record<string, CityData>>({});

  useEffect(() => {
    const stats: Record<string, CityData> = {};
    data.forEach((d) => {
      stats[d.city] = d;
    });
    setCityStats(stats);
  }, [data]);

  const getCircleColor = (city: string) => {
    const stat = cityStats[city];
    if (!stat) return "#6b7280";
    const rate = stat.fraudRate;
    if (rate >= 5) return "#ef4444";
    if (rate >= 3) return "#f97316";
    return "#22c55e";
  };

  const getCircleSize = (city: string) => {
    const stat = cityStats[city];
    if (!stat) return 8;
    const count = stat.count;
    if (count > 8000) return 14;
    if (count > 6000) return 12;
    if (count > 4000) return 10;
    return 8;
  };

  return (
    <div className="relative w-full h-full">
      <svg viewBox="0 0 300 350" className="w-full h-full">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d="M120,30 L180,25 L200,50 L190,100 L210,130 L205,180 L220,200 L210,240 L180,280 L140,310 L100,300 L80,260 L90,220 L70,180 L80,140 L60,100 L90,60 L120,30 Z"
          fill="#fcd34d"
          fillOpacity="0.4"
          stroke="#f59e0b"
          strokeWidth="2"
        />

        <text x="20" y="30" fill="#9ca3af" fontSize="10" fontWeight="500">
          Mar Caribe
        </text>
        <text x="230" y="150" fill="#9ca3af" fontSize="10" fontWeight="500">
          Venezuela
        </text>
        <text x="230" y="250" fill="#9ca3af" fontSize="10" fontWeight="500">
          Brasil
        </text>
        <text x="50" y="320" fill="#9ca3af" fontSize="10" fontWeight="500">
          Ecuador
        </text>
        <text x="30" y="200" fill="#9ca3af" fontSize="10" fontWeight="500">
          Pacífico
        </text>

        {Object.entries(CITY_COORDINATES).map(([city, coords]) => {
          const stat = cityStats[city];
          const isHovered = hoveredCity === city;
          const color = getCircleColor(city);
          
          return (
            <g 
              key={city}
              onMouseEnter={() => setHoveredCity(city)}
              onMouseLeave={() => setHoveredCity(null)}
              onClick={() => onCityClick?.(city)}
              className="cursor-pointer"
            >
              <circle
                cx={coords.x}
                cy={coords.y}
                r={isHovered ? getCircleSize(city) + 4 : getCircleSize(city)}
                fill={color}
                opacity={isHovered ? 1 : 0.9}
                filter={isHovered ? "url(#glow)" : undefined}
                style={{ transition: "all 0.2s ease" }}
              />
              
              {isHovered && (
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r={getCircleSize(city) + 8}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  opacity="0.5"
                />
              )}
              
              <text
                x={coords.x}
                y={coords.y - getCircleSize(city) - 5}
                textAnchor="middle"
                fill="currentColor"
                fontSize="8"
                fontWeight="500"
                opacity={isHovered ? 1 : 0.7}
              >
                {city}
              </text>
              
              {isHovered && stat && (
                <g>
                  <rect
                    x={coords.x + 15}
                    y={coords.y - 30}
                    width="95"
                    height="50"
                    rx="4"
                    fill="white"
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                  <text x={coords.x + 22} y={coords.y - 15} fontSize="9" fontWeight="bold" fill="#1f2937">
                    {city}
                  </text>
                  <text x={coords.x + 22} y={coords.y} fontSize="8" fill="#6b7280">
                    Transacciones: {stat.count.toLocaleString()}
                  </text>
                  <text x={coords.x + 22} y={coords.y + 12} fontSize="8" fill="#6b7280">
                    Tasa fraude: {stat.fraudRate.toFixed(2)}%
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-gray-800/90 rounded-lg p-2 border text-xs">
        <p className="font-medium mb-1">Tasa de Fraude</p>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#22c55e" }} />
            <span>&lt;3%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f97316" }} />
            <span>3-5%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
            <span>&gt;5%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
