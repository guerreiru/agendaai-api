import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { errorHandler } from "./middlewares/errorHandler";
import { cookieMiddleware } from "./middlewares/cookie.middleware";
import { AppError } from "./utils/app-error";
import { authRouter } from "./routes/auth.routes";
import { userRouter } from "./routes/user.routes";
import { companyRouter } from "./routes/company.routes";
import { serviceRouter } from "./routes/service.routes";
import { professionalServiceRouter } from "./routes/professional-service.routes";
import { availabilityRouter } from "./routes/availability.routes";
import { appointmentRouter } from "./routes/appointment.routes";
import { scheduleExceptionRouter } from "./routes/schedule-exception.routes";
import { slotRouter } from "./routes/slot.routes";

const app: express.Express = express();
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
const jsonBodyLimit = process.env.JSON_BODY_LIMIT ?? "100kb";

const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT_MAX ?? 300),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX ?? 20),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many authentication attempts. Please try again later.",
  },
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === frontendOrigin) {
        callback(null, true);
        return;
      }

      callback(new AppError("CORS origin not allowed.", 403));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(helmet());
app.use(globalRateLimiter);
app.use(express.json({ limit: jsonBodyLimit }));
app.use(cookieMiddleware);
app.use("/auth/login", authRateLimiter);
app.use("/auth/refresh", authRateLimiter);
app.use(authRouter);
app.use(userRouter);
app.use(companyRouter);
app.use(serviceRouter);
app.use(professionalServiceRouter);
app.use(availabilityRouter);
app.use(appointmentRouter);
app.use(scheduleExceptionRouter);
app.use(slotRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

app.use(errorHandler);

export { app };
