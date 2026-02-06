# FraudShield - Sistema de Detección de Fraudes

Aplicación React/Next.js profesional para el equipo de fraudes con conexión a Snowflake.

## Características

### Dashboard Principal
- KPIs ejecutivos en tiempo real
- Rendimiento del modelo ML (Precisión, Recall, F1, Exactitud)
- Tendencia de fraudes
- Alertas recientes

### Análisis
- Análisis temporal de fraudes
- Distribución por categoría de comercio
- Mapa de calor geográfico
- Comparación entre períodos

### Alertas
- Centro de alertas en tiempo real
- Filtros por estado y tipo de fraude
- Búsqueda de transacciones

### Investigación
- Búsqueda de clientes
- Historial de transacciones
- Análisis de patrones de gasto

### Snowflake Intelligence
- Chat con Cortex Analyst
- Preguntas en lenguaje natural
- Visualización automática de resultados

### Predicción en Tiempo Real
- Simulador de transacciones
- Predicción con modelo XGBoost
- Factores de riesgo interactivos

## Requisitos

- Node.js 20.x o superior
- npm o yarn
- Cuenta de Snowflake con acceso a `MG_COCO.FRAUD_DETECTION`

## Instalación

```bash
cd fraud-detection-react
npm install
```

## Configuración

Crea un archivo `.env.local`:

```env
SNOWFLAKE_ACCOUNT=SFSENORTHAMERICA-LATAM_DEMO10
SNOWFLAKE_USER=tu_usuario
SNOWFLAKE_WAREHOUSE=VW_COCO
SNOWFLAKE_DATABASE=MG_COCO
SNOWFLAKE_SCHEMA=FRAUD_DETECTION
```

## Ejecución Local

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

En la primera llamada a la API, se abrirá el navegador para autenticación SSO.

## Build de Producción

```bash
npm run build
npm start
```

## Deploy a SPCS

Para desplegar a Snowpark Container Services, usa el skill `deploy-to-spcs`:

```bash
# Build de imagen Docker
docker build -t fraud-detection-react .

# Seguir el skill deploy-to-spcs para push y deploy
```

## Estructura del Proyecto

```
fraud-detection-react/
├── app/
│   ├── page.tsx              # Dashboard principal
│   ├── analysis/             # Página de análisis
│   ├── alerts/               # Centro de alertas
│   ├── investigation/        # Panel de investigación
│   ├── intelligence/         # Snowflake Intelligence
│   ├── predictions/          # Predicción en tiempo real
│   └── api/                  # API routes
├── components/
│   ├── ui/                   # Componentes shadcn/ui
│   └── dashboard/            # Componentes del dashboard
├── lib/
│   ├── snowflake.ts          # Conexión a Snowflake
│   └── utils.ts              # Utilidades
└── Dockerfile                # Para SPCS
```

## Tecnologías

- **Framework**: Next.js 15 con App Router
- **UI**: shadcn/ui + Tailwind CSS
- **Gráficos**: Recharts
- **Base de datos**: Snowflake
- **ML**: XGBoost (modelo registrado en Snowflake)
- **NLP**: Cortex Analyst

## Tablas de Snowflake Utilizadas

- `TRANSACTIONS` - Transacciones financieras
- `CUSTOMERS` - Información de clientes
- `MERCHANTS` - Información de comercios
- `FRAUD_LABELS` - Etiquetas de fraude
- `SCORED_TRANSACTIONS` - Predicciones del modelo ML
