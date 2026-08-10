/* Thin typed client for the Medly API. */

/**
 * Resolution order, most specific first:
 *   1. window.__MEDLY_API_URL__ — written at container start, so one built
 *      image can point at any backend without a rebuild.
 *   2. VITE_API_URL — baked in at build time, for local `npm run dev`.
 *   3. localhost:8000 — the default the README tells you to run.
 */
const BASE =
  (typeof window !== "undefined" && window.__MEDLY_API_URL__) ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

const TOKEN_KEY = "medly.token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.detail ?? detail;
    } catch {
      /* response had no JSON body */
    }
    throw new ApiError(response.status, String(detail));
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

/* ---------- types ---------- */

export type Role = "student" | "instructor" | "admin";
export type RiskLevel = "none" | "low" | "medium" | "high";

export interface Me {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  institution?: string | null;
  year_of_study?: number | null;
  certified: boolean;
  competency_score: number;
}

export interface CourseSummary {
  id: number;
  slug: string;
  title: string;
  summary: string;
  track: string;
  level: string;
  duration_minutes: number;
  emoji: string;
  is_certification: boolean;
  lesson_count: number;
  enrolled: boolean;
  progress_pct: number;
}

export interface LessonSummary {
  id: number;
  order: number;
  title: string;
  kind: "reading" | "video" | "interactive" | "case";
  duration_minutes: number;
  key_point?: string | null;
  status: "not_started" | "in_progress" | "completed";
}

export interface CourseDetail extends CourseSummary {
  lessons: LessonSummary[];
}

export interface LessonDetail extends LessonSummary {
  body_md: string;
  course_id: number;
}

export interface ChatResponse {
  session_id: string;
  reply: string;
  blocked: boolean;
  block_reason?: string | null;
  risk_level: RiskLevel;
  disclaimer: string;
  provider: string;
  audit_event_id?: number | null;
}

export interface AuditEvent {
  id: number;
  created_at: string;
  user_id?: number | null;
  user_name?: string | null;
  event_type: string;
  risk_level: RiskLevel;
  ai_model?: string | null;
  ai_output_summary?: string | null;
  confidence?: number | null;
  human_decision?: string | null;
  overridden?: boolean | null;
  blocked: boolean;
  block_reason?: string | null;
  requires_review: boolean;
  disclaimer_shown: boolean;
}

export interface GovernanceSummary {
  total_ai_interactions: number;
  blocked_count: number;
  block_rate: number;
  override_count: number;
  review_count: number;
  override_rate: number;
  low_confidence_count: number;
  disclaimer_coverage: number;
  by_event_type: Record<string, number>;
  by_risk_level: Record<string, number>;
  certified_users: number;
  total_users: number;
  confidence_threshold: number;
  pending_review: number;
}

export interface StandardRule {
  id: string;
  title: string;
  rule: string;
  enforced_by: string;
}

export interface SafetyStandard {
  version: string;
  confidence_threshold: number;
  certification_pass_score: number;
  disclaimer: string;
  rules: StandardRule[];
}

export interface TimeseriesPoint {
  date: string;
  interactions: number;
  blocked: number;
  overrides: number;
}

/* ---------- assessment ---------- */

export interface QuizChoice {
  id: number;
  text: string;
}

export interface QuizQuestion {
  id: number;
  order: number;
  prompt: string;
  /** "single" = one correct choice, "multi" = several. */
  kind: string;
  points: number;
  choices: QuizChoice[];
}

export interface Quiz {
  id: number;
  course_id: number;
  title: string;
  description: string;
  passing_score: number;
  is_certification: boolean;
  questions: QuizQuestion[];
}

export interface QuestionResult {
  question_id: number;
  correct: boolean;
  correct_choice_ids: number[];
  given_choice_ids: number[];
  explanation: string;
}

export interface QuizResult {
  attempt_id: number;
  score: number;
  passed: boolean;
  passing_score: number;
  band: string;
  certified: boolean;
  /** True only on the attempt that flipped the account to certified. */
  certification_unlocked: boolean;
  results: QuestionResult[];
}

export interface Attempt {
  id: number;
  quiz_id: number;
  quiz_title?: string | null;
  score: number;
  passed: boolean;
  submitted_at: string;
}

/* ---------- imaging analysis ---------- */

export type Modality = "xray" | "ct";
export type AnalysisStatus = "pending" | "complete" | "needs_review" | "failed";

export interface Finding {
  label: string;
  confidence: number;
  /** Normalised [x, y, w, h] in 0..1 — overlay at any render size. */
  bbox: [number, number, number, number] | number[];
  description: string;
}

export interface AnalysisJob {
  id: number;
  case_ref: string;
  modality: Modality;
  status: AnalysisStatus;
  student_finding?: string | null;
  findings: Finding[];
  model_name: string;
  model_version: string;
  mean_confidence: number;
  uncertainty_flag: boolean;
  requires_review: boolean;
  final_decision?: string | null;
  agreed_with_ai?: boolean | null;
  disclaimer: string;
  known_limitations: string[];
  created_at: string;
}

/* ---------- endpoints ---------- */

export const api = {
  health: () => request<{ status: string }>("/api/health"),

  login: async (email: string, password: string) => {
    const body = new URLSearchParams({ username: email, password });
    const response = await fetch(`${BASE}/api/auth/login`, { method: "POST", body });
    if (!response.ok) throw new ApiError(response.status, "Incorrect email or password");
    const data = (await response.json()) as { access_token: string };
    setToken(data.access_token);
    return data;
  },

  register: async (payload: {
    email: string;
    password: string;
    full_name: string;
    institution?: string;
    year_of_study?: number;
  }) => {
    const data = await request<{ access_token: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setToken(data.access_token);
    return data;
  },

  me: () => request<Me>("/api/auth/me"),

  courses: () => request<CourseSummary[]>("/api/courses"),
  course: (slug: string) => request<CourseDetail>(`/api/courses/${slug}`),
  enroll: (slug: string) =>
    request<CourseSummary>(`/api/courses/${slug}/enroll`, { method: "POST" }),
  lesson: (id: number) => request<LessonDetail>(`/api/courses/lessons/${id}`),
  completeLesson: (id: number) =>
    request<LessonSummary>(`/api/courses/lessons/${id}/complete`, { method: "POST" }),

  chat: (message: string, sessionId?: string) =>
    request<ChatResponse>("/api/assistant/chat", {
      method: "POST",
      body: JSON.stringify({ message, session_id: sessionId }),
    }),
  suggestions: () => request<string[]>("/api/assistant/suggestions"),

  audit: (params: Record<string, string | number | boolean> = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString();
    return request<AuditEvent[]>(`/api/governance/audit${query ? `?${query}` : ""}`);
  },
  summary: () => request<GovernanceSummary>("/api/governance/summary"),
  standard: () => request<SafetyStandard>("/api/governance/standard"),
  timeseries: (days = 14) =>
    request<TimeseriesPoint[]>(`/api/governance/timeseries?days=${days}`),
  reviewEvent: (id: number) =>
    request<AuditEvent>(`/api/governance/audit/${id}/review`, { method: "POST" }),

  /* assessment */
  quizzesForCourse: (slug: string) => request<Quiz[]>(`/api/quizzes/course/${slug}`),
  quiz: (id: number) => request<Quiz>(`/api/quizzes/${id}`),
  submitQuiz: (id: number, answers: Record<number, number[]>) =>
    request<QuizResult>(`/api/quizzes/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
  myAttempts: () => request<Attempt[]>("/api/quizzes/attempts/me"),

  /* imaging — the four steps must be called in this order; the server enforces it */
  createCase: (case_ref: string, modality: Modality = "xray") =>
    request<AnalysisJob>("/api/analysis/cases", {
      method: "POST",
      body: JSON.stringify({ case_ref, modality }),
    }),
  myCases: () => request<AnalysisJob[]>("/api/analysis/cases"),
  submitReading: (jobId: number, finding: string) =>
    request<AnalysisJob>(`/api/analysis/${jobId}/my-reading`, {
      method: "POST",
      body: JSON.stringify({ finding }),
    }),
  analyze: (jobId: number) =>
    request<AnalysisJob>(`/api/analysis/${jobId}/analyze`, { method: "POST" }),
  decide: (jobId: number, final_decision: string, agreed_with_ai: boolean) =>
    request<AnalysisJob>(`/api/analysis/${jobId}/decide`, {
      method: "POST",
      body: JSON.stringify({ final_decision, agreed_with_ai }),
    }),
};
