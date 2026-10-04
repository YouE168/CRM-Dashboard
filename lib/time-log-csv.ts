// Shared CSV builder/downloader for time logs (admin + member views).

export interface TimeLogCsvRow {
  type: string;
  person: string;
  withOrBy: string;
  date: string | null;
  time: string | null;
  durationMinutes: number | null;
  topic: string;
}

const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;

export function downloadTimeLogCsv(rows: TimeLogCsvRow[], filenamePrefix = "time-log") {
  const header = ["Type", "Person", "With/By", "Date", "Time", "Duration (minutes)", "Topic/Note"];
  const lines = [
    header.map(esc).join(","),
    ...rows.map((r) =>
      [
        r.type,
        r.person,
        r.withOrBy,
        r.date || "",
        r.time || "",
        r.durationMinutes != null ? String(r.durationMinutes) : "",
        r.topic,
      ]
        .map((v) => esc(String(v)))
        .join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function formatTotalMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
