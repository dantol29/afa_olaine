// Triggers both LFF cron jobs on the running local dev server, as the
// production cron does. Run through scripts/local/run.mjs for CRON_SECRET.
const JOBS = ["sync-fixtures", "sync-top-scorers"];

for (const job of JOBS) {
  const response = await fetch(`${process.env.SITE_URL}/api/cron/${job}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
  const result = await response.json();
  console.log(`${job}: HTTP ${response.status}`, JSON.stringify(result, null, 2));
  if (!response.ok) process.exitCode = 1;
}
