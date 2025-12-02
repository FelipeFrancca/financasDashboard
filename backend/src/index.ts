import express, { type Application } from "express";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import path from "path";

// Rotas (Novo Padrão em Português)
import transacoesRotas from "./routes/transacoesRotas";
import authRoutes from "./routes/autenticacaoRotas";
import paineisRotas from "./routes/paineisRotas";
import contasRotas from "./routes/contasRotas";
import transferenciasRotas from "./routes/transferenciasRotas";
import orcamentosRotas from "./routes/orcamentosRotas";
import categoriasRotas from "./routes/categoriasRotas";
import metasRotas from "./routes/metasRotas";
import alertasRotas from "./routes/alertasRotas";
import recorrenciaRotas from "./routes/recorrenciaRotas";
import notificationPreferencesRotas from "./routes/notificationPreferencesRotas";

// Middlewares e Utils
import { logger } from "./utils/logger";
import {
  errorHandler,
  notFoundHandler,
  setupGlobalErrorHandlers
} from "./middleware/errorHandler";
import { requestLogger, slowRequestLogger } from "./middleware/requestLogger";
import { generalLimiter } from "./middleware/rateLimiter";
import { openApiConfig } from "./config/openapi";
import { auditMiddleware } from "./middleware/audit";

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Setup de handlers globais
setupGlobalErrorHandlers();

// Swagger configuration
const swaggerOptions = {
  definition: openApiConfig,
  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middlewares básicos
app.use(helmet({
  contentSecurityPolicy: false, // Desabilita CSP em produção para evitar conflitos com SPA
  crossOriginEmbedderPolicy: false,
}));

// CORS Configuration - Suporta múltiplas origens
const corsOrigin = process.env.CORS_ORIGIN || process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173';

// Se CORS_ORIGIN for *, permite todas as origens
if (corsOrigin === '*') {
  app.use(cors({
    origin: true,
    credentials: true,
  }));
} else {
  const allowedOrigins = corsOrigin.split(',').map(origin => origin.trim());

  app.use(cors({
    origin: (origin, callback) => {
      // Permite requisições sem origin (como mobile apps, curl, postman, ou requisições do mesmo domínio)
      if (!origin) return callback(null, true);

      // Verifica se a origem está na lista de permitidas
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`, 'CORS');
        callback(null, false); // Changed from error to false to avoid crash
      }
    },
    credentials: true,
  }));
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(passport.initialize());

// Logging e Monitoramento
app.use(requestLogger);
app.use(slowRequestLogger(1000));

// Auditoria Global (intercepta POST/PUT/DELETE)
app.use('/api', auditMiddleware('General'));

// Rate limiting
app.use('/api/', generalLimiter);

// Documentação API
app.get("/api-docs/json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: `.swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 50px 0; }
    .swagger-ui .scheme-container { background: #fafafa; padding: 20px; }`,
  customSiteTitle: "Finanças Dashboard API",
  customfavIcon: "/favicon.ico",
  swaggerOptions: {
    persistAuthorization: true,
    filter: true,
    displayRequestDuration: true,
  },
}));

// Definição das Rotas
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transacoesRotas);
app.use("/api/dashboards", paineisRotas);
app.use("/api/accounts", contasRotas);
app.use("/api/transfers", transferenciasRotas);
app.use("/api/budgets", orcamentosRotas);
app.use("/api/categories", categoriasRotas);
app.use("/api/goals", metasRotas);
app.use("/api/alerts", alertasRotas);
app.use("/api/recurrences", recorrenciaRotas);
app.use("/api/notification-preferences", notificationPreferencesRotas);

// Health check
app.get("/health", async (_req, res) => {
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();

    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      },
      database: "connected",
      version: "1.0.0",
    });
  } catch (error) {
    logger.error("Health check failed", error as Error, "HealthCheck");
    res.status(503).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: "Service unavailable",
    });
  }
});

// Static files (Production)
const isProduction = process.env.NODE_ENV === "production";
if (isProduction) {
  const publicPath = path.join(__dirname, "..", "public");

  // Serve arquivos estáticos com cache
  app.use(express.static(publicPath, {
    maxAge: '1y',
    etag: true,
  }));

  // Catch-all apenas para rotas não-API (SPA fallback)
  app.get("*", (req, res, next) => {
    // Se for uma rota de API, passa para o próximo handler
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(publicPath, "index.html"));
  });
}

// Error Handling
if (!isProduction) {
  app.use(notFoundHandler);
}
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`, 'Server');
  logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`, 'Server');
  logger.info(`🏥 Health check: http://localhost:${PORT}/health`, 'Server');
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`, 'Server');
});

export default app;
