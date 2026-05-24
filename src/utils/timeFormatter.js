const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

export function formatDuration(ms, { includeHours = false } = {}) {
    const safeMs = Number.isFinite(ms) ? Math.max(0, ms) : 0;
    const totalSeconds = Math.floor(safeMs / MS_PER_SECOND);
    const hours = Math.floor(totalSeconds / (SECONDS_PER_MINUTE * MINUTES_PER_HOUR));
    const minutes = includeHours
        ? Math.floor((totalSeconds % (SECONDS_PER_MINUTE * MINUTES_PER_HOUR)) / SECONDS_PER_MINUTE)
        : Math.floor(totalSeconds / SECONDS_PER_MINUTE);
    const seconds = totalSeconds % SECONDS_PER_MINUTE;
    const centiseconds = Math.floor((safeMs % MS_PER_SECOND) / 10);

    if (includeHours) {
        return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}.${pad2(centiseconds)}`;
    }

    return `${pad2(minutes)}:${pad2(seconds)}.${pad2(centiseconds)}`;
}

function pad2(value) {
    return value.toString().padStart(2, '0');
}
