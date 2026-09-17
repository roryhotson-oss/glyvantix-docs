import { db } from "@/lib/db";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationPath = resolve(__dirname, "../supabase/migrations/keepalive_cron.sql");
const sql = readFileSync(migrationPath, "utf8");

async function main() {
  console.log("Applying Supabase pg_cron keep-alive migration…");
  await db.$executeRawUnsafe(sql);
  const jobs = (await db.$queryRaw<
    { jobid: number; jobname: string; schedule: string; command: string }[]
  >`SELECT jobid, jobname, schedule, command FROM cron.job WHERE jobname = 'glyvantix_keepalive'`);
  if (!jobs.length) {
    console.error("Keep-alive job was not registered. Is the pg_cron extension enabled in the Supabase dashboard?");
    process.exitCode = 1;
    return;
  }
  for (const job of jobs) {
    console.log(`Registered: ${job.jobname} | ${job.schedule} | ${job.command}`);
  }
  console.log("Done. Supabase Postgres will be kept warm by pg_cron.");
}

main()
  .catch((error) => {
    console.error("Failed to apply keep-alive migration:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
