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

/** True only on public pages, where a stale token must not trigger a redirect loop. */
function onPublicPage(): boolean {
  return (
    typeof window === "undefined" ||
    window.location.pathname === "/login" ||
    window.location.pathname === "/"
  );
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${BASE}${path}`, { ...init, headers });
  if (response.status === 401) {
    // The token is gone, expired, or was issued for a database that has since
    // been replaced (a rotated secret or a reset volume invalidates every
    // stored token at once). Staying on the page only produces more 401s, so
    // drop the token and send the user to the login screen.
    clearToken();
    if (!onPublicPage()) {
      window.location.assign("/login");
    }
    throw new ApiError(401, "Session expired — please sign in again");
  }
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
  avatar_url: string;
  points: number;
  is_premium: boolean;
  show_on_leaderboard: boolean;
}

export interface CourseSummary {
  id: number;
  slug: string;
  title: string;
  summary: string;
  track: string;
  level: string;
  duration_minutes: number;
  icon: string;
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
  /** Non-zero only on the first pass of a given quiz. */
  points_awarded: number;
  total_points: number;
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

/* ---------- feed ---------- */

export interface ArticleSummary {
  id: number;
  slug: string;
  tag: string;
  title: string;
  excerpt: string;
  author: string;
  author_role: string;
  read_minutes: number;
  cover: string;
  cover_alt: string;
  published_at: string;
  like_count: number;
  comment_count: number;
  liked: boolean;
  saved: boolean;
}

export interface Comment {
  id: number;
  author: string;
  author_role: string;
  body: string;
  created_at: string;
  mine: boolean;
}

export interface ArticleDetail extends ArticleSummary {
  body_md: string;
  comments: Comment[];
}

/* ---------- library & saved ---------- */

export type SavedType = "article" | "book" | "pdf" | "video";

export interface LibraryResource {
  id: number;
  slug: string;
  kind: "book" | "pdf" | "video";
  title: string;
  author: string;
  description: string;
  rating: number;
  downloads: string;
  duration: string;
  premium: boolean;
  url: string;
  video_url: string;
  pdf_url: string;
  cover_hue: number;
  cover: string;
  publisher: string;
  year: number | null;
  pages: number | null;
  level: string;
  topic: string;
  saved: boolean;
}

export interface SavedEntry {
  id: number;
  item_type: SavedType;
  item_key: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  meta: string;
  premium: boolean;
  cover_hue: number;
  cover: string;
  cover_alt: string;
  saved_at: string;
}

/* ---------- communities ---------- */

export interface CommunitySummary {
  id: number;
  slug: string;
  name: string;
  description: string;
  specialty: string;
  icon: string;
  cover: string;
  members: number;
  messages: number;
  joined: boolean;
  owned: boolean;
  created_at: string;
}

export interface CommunityDetail extends CommunitySummary {
  member_names: string[];
  can_post: boolean;
}

export interface CommunityMessage {
  id: number;
  author: string;
  author_role: string;
  body: string;
  created_at: string;
  mine: boolean;
}

export interface CommunityPermissions {
  can_create: boolean;
  is_premium: boolean;
  role: Role;
  reason: string;
}

/* ---------- challenges ---------- */

export interface ChallengeChoice {
  id: number;
  text: string;
}

export interface ChallengeQuestion {
  id: number;
  order: number;
  prompt: string;
  points: number;
  choices: ChallengeChoice[];
  image_seed: string | null;
  image_alt: string;
  image_modality: string;
  answered: boolean;
  correct: boolean | null;
  chosen_choice_id: number | null;
  correct_choice_id: number | null;
  explanation: string | null;
}

export interface ChallengeSummary {
  id: number;
  slug: string;
  title: string;
  description: string;
  topic: string;
  icon: string;
  cover: string;
  difficulty: "easy" | "medium" | "hard" | string;
  points: number;
  question_count: number;
  participants: number;
  ends_at: string | null;
  joined: boolean;
  answered_count: number;
  earned_points: number;
  completed: boolean;
}

export interface ChallengeDetail extends ChallengeSummary {
  questions: ChallengeQuestion[];
}

export interface AnswerResult {
  question_id: number;
  correct: boolean;
  correct_choice_id: number;
  explanation: string;
  points_awarded: number;
  already_answered: boolean;
  earned_points: number;
  answered_count: number;
  question_count: number;
  completed: boolean;
  total_points: number;
  rank: number;
  new_badges: string[];
}

/* ---------- profile ---------- */

export interface Profile {
  id: number;
  name: string;
  handle: string;
  email: string;
  role: Role;
  institution: string;
  year_of_study: number | null;
  avatar_url: string;
  is_premium: boolean;
  points: number;
  streak_days: number;
  longest_streak: number;
  rank: number;
  total_users: number;
  badge_count: number;
  community_count: number;
  saved_count: number;
  lessons_completed: number;
  challenges_completed: number;
  comments: number;
  joined_at: string;
}

export interface BadgeState {
  key: string;
  icon: string;
  label: string;
  hint: string;
  earned: boolean;
  earned_at: string | null;
}

export interface LeaderboardRow {
  rank: number;
  user_id: number;
  name: string;
  institution: string;
  points: number;
  avatar_url: string;
  you: boolean;
}

export interface ActivityRow {
  text: string;
  detail: string;
  points: number | null;
  at: string;
}

/* ---------- casebook ---------- */

export interface CaseImage {
  id: number;
  caption: string;
  view: string;
  render_seed: string;
  anonymization_status: "pending" | "auto_redacted" | "verified" | string;
  redacted_fields: string[];
  review_notes: string;
  verified_by_name: string | null;
  verified_at: string | null;
}

export interface CaseSummary {
  id: number;
  case_ref: string;
  title: string;
  modality: Modality;
  body_region: string;
  patient_age_band: string;
  patient_sex: string;
  clinical_context: string;
  difficulty: string;
  source: string;
  published: boolean;
  author_name: string;
  image_count: number;
  pending_verification: number;
  created_at: string;
  mine: boolean;
}

export interface CaseDetail extends CaseSummary {
  teaching_points: string;
  findings_summary: string;
  images: CaseImage[];
  residual_risks: string[];
}

export interface CasebookPermissions {
  can_author: boolean;
  role: Role;
  reason: string;
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

  /* settings */
  updateMe: (payload: {
    full_name?: string;
    institution?: string;
    year_of_study?: number;
    avatar_url?: string;
    show_on_leaderboard?: boolean;
  }) => request<Me>("/api/auth/me", { method: "PATCH", body: JSON.stringify(payload) }),
  changePassword: (current_password: string, new_password: string) =>
    request<void>("/api/auth/password", {
      method: "POST",
      body: JSON.stringify({ current_password, new_password }),
    }),
  clearAssistantHistory: () =>
    request<void>("/api/assistant/history", { method: "DELETE" }),

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

  /* feed — `q` searches the article body, not only the title */
  articles: (params: { q?: string; tag?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.tag && params.tag !== "All") query.set("tag", params.tag);
    const suffix = query.toString();
    return request<ArticleSummary[]>(`/api/feed/articles${suffix ? `?${suffix}` : ""}`);
  },
  article: (slug: string) => request<ArticleDetail>(`/api/feed/articles/${slug}`),
  addComment: (slug: string, body: string) =>
    request<Comment>(`/api/feed/articles/${slug}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),
  deleteComment: (id: number) =>
    request<void>(`/api/feed/comments/${id}`, { method: "DELETE" }),
  toggleLike: (slug: string) =>
    request<ArticleSummary>(`/api/feed/articles/${slug}/like`, { method: "POST" }),

  /* library + saved */
  resources: (params: { q?: string; kind?: string; level?: string; topic?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.kind) query.set("kind", params.kind);
    if (params.level) query.set("level", params.level);
    if (params.topic) query.set("topic", params.topic);
    const suffix = query.toString();
    return request<LibraryResource[]>(`/api/resources${suffix ? `?${suffix}` : ""}`);
  },
  saved: (itemType?: SavedType | "all") =>
    request<SavedEntry[]>(`/api/saved${itemType && itemType !== "all" ? `?item_type=${itemType}` : ""}`),
  save: (item_type: SavedType, item_key: string) =>
    request<SavedEntry>("/api/saved", {
      method: "POST",
      body: JSON.stringify({ item_type, item_key }),
    }),
  unsave: (item_type: SavedType, item_key: string) =>
    request<void>(
      `/api/saved?item_type=${encodeURIComponent(item_type)}&item_key=${encodeURIComponent(item_key)}`,
      { method: "DELETE" }
    ),
  savedCounts: () => request<Record<string, number>>("/api/saved/counts"),

  /* communities */
  communities: (params: { q?: string; filter?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.filter && params.filter !== "All") query.set("filter", params.filter);
    const suffix = query.toString();
    return request<CommunitySummary[]>(`/api/communities${suffix ? `?${suffix}` : ""}`);
  },
  myCommunities: () => request<CommunitySummary[]>("/api/communities/mine"),
  communityPermissions: () =>
    request<CommunityPermissions>("/api/communities/permissions"),
  community: (slug: string) => request<CommunityDetail>(`/api/communities/${slug}`),
  createCommunity: (payload: {
    name: string;
    description: string;
    specialty?: string;
    emoji?: string;
  }) =>
    request<CommunitySummary>("/api/communities", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  joinCommunity: (slug: string) =>
    request<CommunitySummary>(`/api/communities/${slug}/join`, { method: "POST" }),
  leaveCommunity: (slug: string) =>
    request<CommunitySummary>(`/api/communities/${slug}/leave`, { method: "POST" }),
  communityMessages: (slug: string) =>
    request<CommunityMessage[]>(`/api/communities/${slug}/messages`),
  postCommunityMessage: (slug: string, body: string) =>
    request<CommunityMessage>(`/api/communities/${slug}/messages`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),

  /* challenges */
  challenges: () => request<ChallengeSummary[]>("/api/challenges"),
  challenge: (slug: string) => request<ChallengeDetail>(`/api/challenges/${slug}`),
  joinChallenge: (slug: string) =>
    request<ChallengeDetail>(`/api/challenges/${slug}/join`, { method: "POST" }),
  answerChallenge: (slug: string, question_id: number, choice_id: number) =>
    request<AnswerResult>(`/api/challenges/${slug}/answer`, {
      method: "POST",
      body: JSON.stringify({ question_id, choice_id }),
    }),

  /* profile */
  profile: () => request<Profile>("/api/profile"),
  badges: () => request<BadgeState[]>("/api/profile/badges"),
  leaderboard: (limit = 25) =>
    request<LeaderboardRow[]>(`/api/profile/leaderboard?limit=${limit}`),
  activity: (limit = 12) => request<ActivityRow[]>(`/api/profile/activity?limit=${limit}`),
  activatePremium: () => request<Profile>("/api/profile/premium", { method: "POST" }),
  cancelPremium: () => request<Profile>("/api/profile/premium", { method: "DELETE" }),

  /* casebook — teacher-authored imaging case references */
  casebookPermissions: () => request<CasebookPermissions>("/api/casebook/permissions"),
  cases: () => request<CaseSummary[]>("/api/casebook/cases"),
  caseDetail: (id: number) => request<CaseDetail>(`/api/casebook/cases/${id}`),
  createCaseReference: (payload: {
    case_ref: string;
    title: string;
    modality: Modality;
    body_region?: string;
    patient_age_band?: string;
    patient_sex?: string;
    clinical_context?: string;
    teaching_points?: string;
    findings_summary?: string;
    difficulty?: string;
  }) =>
    request<CaseDetail>("/api/casebook/cases", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  addCaseImage: (
    caseId: number,
    payload: { caption: string; view: string; metadata: Record<string, string>; overlay_text: string }
  ) =>
    request<CaseImage>(`/api/casebook/cases/${caseId}/images`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  verifyCaseImage: (imageId: number) =>
    request<CaseImage>(`/api/casebook/images/${imageId}/verify`, { method: "POST" }),
  publishCase: (caseId: number) =>
    request<CaseDetail>(`/api/casebook/cases/${caseId}/publish`, { method: "POST" }),
  unpublishCase: (caseId: number) =>
    request<CaseDetail>(`/api/casebook/cases/${caseId}/unpublish`, { method: "POST" }),
};
