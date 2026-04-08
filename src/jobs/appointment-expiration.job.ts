import { expirePastAppointments } from "../repositories/appointment.repository.js";

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;
const MIN_INTERVAL_MS = 60 * 1000;

let timer: NodeJS.Timeout | null = null;
let isRunning = false;

function getIntervalMs(): number {
	const rawValue = process.env.APPOINTMENT_EXPIRATION_INTERVAL_MS;
	const parsed = Number(rawValue);

	if (!rawValue || Number.isNaN(parsed)) {
		return DEFAULT_INTERVAL_MS;
	}

	return Math.max(parsed, MIN_INTERVAL_MS);
}

export async function runAppointmentExpirationCycle() {
	if (isRunning) {
		return;
	}

	isRunning = true;
	try {
		const updatedCount = await expirePastAppointments();
		if (updatedCount > 0) {
		}
	} catch (error) {
		console.error("[appointment-expiration] Failed to run cycle.", error);
	} finally {
		isRunning = false;
	}
}

export function startAppointmentExpirationJob() {
	if (process.env.NODE_ENV === "test") {
		return;
	}

	if (timer) {
		return;
	}

	void runAppointmentExpirationCycle();

	const intervalMs = getIntervalMs();
	timer = setInterval(() => {
		void runAppointmentExpirationCycle();
	}, intervalMs);
}

export function stopAppointmentExpirationJob() {
	if (!timer) {
		return;
	}

	clearInterval(timer);
	timer = null;
}
