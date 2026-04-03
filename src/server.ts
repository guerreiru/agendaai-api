import { app } from "./app";
import { startAppointmentExpirationJob } from "./jobs/appointment-expiration.job";

const PORT = Number(process.env.PORT ?? 3001);

startAppointmentExpirationJob();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
