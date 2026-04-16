import { app } from './app.js';
import { startAppointmentExpirationJob } from './jobs/appointment-expiration.job.js';

const PORT = Number(process.env.PORT ?? 3001);

startAppointmentExpirationJob();

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
