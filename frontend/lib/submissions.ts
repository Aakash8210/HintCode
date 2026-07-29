import { neon } from "@neondatabase/serverless";
import type { TestResult } from "@/lib/store";

export interface Submission {
  id: string;
  questionId: string | null;
  title: string;
  titleSlug: string;
  language: string;
  code: string;
  status: "accepted" | "wrong_answer";
  passedTests: number;
  totalTests: number;
  results: TestResult[];
  createdAt: string;
}

export interface SubmissionStats {
  totalSubmissions: number;
  acceptedSubmissions: number;
  solvedQuestions: number;
}

interface CreateSubmissionInput {
  userId: string;
  questionId?: string;
  title: string;
  titleSlug: string;
  language: string;
  code: string;
  results: TestResult[];
}

type SqlClient = ReturnType<typeof neon>;

let sqlClient: SqlClient | null = null;
let tableReady = false;

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }
  if (!sqlClient) {
    sqlClient = neon(process.env.DATABASE_URL);
  }
  return sqlClient;
}

async function ensureSubmissionsTable() {
  if (tableReady) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS hintcode_submissions (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      question_id TEXT,
      title TEXT NOT NULL,
      title_slug TEXT NOT NULL,
      language TEXT NOT NULL,
      code TEXT NOT NULL,
      status TEXT NOT NULL,
      passed_tests INTEGER NOT NULL,
      total_tests INTEGER NOT NULL,
      results JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS hintcode_submissions_user_created_idx
    ON hintcode_submissions (user_id, created_at DESC)
  `;
  tableReady = true;
}

function toSubmission(row: Record<string, any>): Submission {
  return {
    id: String(row.id),
    questionId: row.question_id ?? null,
    title: row.title,
    titleSlug: row.title_slug,
    language: row.language,
    code: row.code,
    status: row.status,
    passedTests: Number(row.passed_tests),
    totalTests: Number(row.total_tests),
    results: Array.isArray(row.results) ? row.results : JSON.parse(row.results || "[]"),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function createSubmission(input: CreateSubmissionInput) {
  await ensureSubmissionsTable();
  const sql = getSql();
  const passedTests = input.results.filter((result) => result.status === "pass").length;
  const totalTests = input.results.length;
  const status = passedTests === totalTests ? "accepted" : "wrong_answer";
  const rows = (await sql`
    INSERT INTO hintcode_submissions (
      user_id,
      question_id,
      title,
      title_slug,
      language,
      code,
      status,
      passed_tests,
      total_tests,
      results
    )
    VALUES (
      ${input.userId},
      ${input.questionId ?? null},
      ${input.title},
      ${input.titleSlug},
      ${input.language},
      ${input.code},
      ${status},
      ${passedTests},
      ${totalTests},
      CAST(${JSON.stringify(input.results)} AS jsonb)
    )
    RETURNING *
  `) as Record<string, any>[];

  return toSubmission(rows[0]);
}

export async function listSubmissions(userId: string) {
  await ensureSubmissionsTable();
  const sql = getSql();
  const rows = (await sql`
    SELECT *
    FROM hintcode_submissions
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 50
  `) as Record<string, any>[];
  const statsRows = (await sql`
    SELECT
      COUNT(*)::int AS total_submissions,
      COUNT(*) FILTER (WHERE status = 'accepted')::int AS accepted_submissions,
      COUNT(DISTINCT title_slug) FILTER (WHERE status = 'accepted')::int AS solved_questions
    FROM hintcode_submissions
    WHERE user_id = ${userId}
  `) as Record<string, any>[];
  const statsRow = statsRows[0] ?? {};
  const stats: SubmissionStats = {
    totalSubmissions: Number(statsRow.total_submissions ?? 0),
    acceptedSubmissions: Number(statsRow.accepted_submissions ?? 0),
    solvedQuestions: Number(statsRow.solved_questions ?? 0),
  };

  return {
    submissions: rows.map(toSubmission),
    stats,
  };
}
