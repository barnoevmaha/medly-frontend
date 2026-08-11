/* =============================================================
   CONTENT — marketing copy for the pages that have no data behind
   them: the public landing page and the Premium plans.

   Everything else the app renders — the feed, communities,
   challenges, the library, ranking, badges — now comes from the API,
   so it is not duplicated here. If a value can be earned, saved or
   changed by a user, it lives in the database, not in this file.
   ============================================================= */

/* ---------- Landing page ---------- */
export const home = {
  eyebrow: "The #1 Platform for Medical Students",
  headline: ["Learn Medicine.", "Together."],
  subhead:
    "Join thousands of medical students worldwide. Learn, compete, and grow with the most engaging medical education platform.",
  primaryCta: "Start Learning Free",
  secondaryCta: "Explore Demo",
  trustBadges: ["Verified Students Only", "200+ Universities", "4.9 Rating"],
  stats: [
    { value: "50K+", label: "Students" },
    { value: "200+", label: "Universities" },
    { value: "1M+", label: "Resources" },
    { value: "98%", label: "Satisfaction" },
  ],
  featuresTitle: "Everything You Need to Excel",
  featuresSubtitle:
    "From study materials to peer support, Medly provides the complete toolkit for medical education success.",
  features: [
    { icon: "users", title: "Join Communities", body: "Connect with students from your specialty worldwide" },
    { icon: "trophy", title: "Weekly Challenges", body: "Compete in quizzes and climb the leaderboard" },
    { icon: "book", title: "Saved Library", body: "Keep books, videos, PDFs and articles in one place" },
    { icon: "sparkles", title: "AI Assistant", body: "Get personalized study recommendations" },
  ],
  ctaTitle: "Ready to Transform Your Medical Education?",
  ctaBody: "Join over 50,000 medical students already using Medly to learn smarter, not harder.",
  ctaButton: "Get Started for Free",
} as const;

/* ---------- Premium ---------- */
export const premium = {
  title: "Upgrade to Premium",
  subtitle: "Unlock your full potential with advanced features and exclusive content",
  benefits: [
    { icon: "users", title: "Create Communities", body: "Start and run your own communities — the Premium-only feature" },
    { icon: "book", title: "Advanced Library", body: "Access premium books, videos, and exclusive study materials" },
    { icon: "brain", title: "AI Study Assistant", body: "Get personalized summaries, study plans, and recommendations" },
    { icon: "zap", title: "Exclusive Challenges", body: "Access premium-only challenges with bigger rewards" },
  ],
  plans: [
    { id: "monthly", name: "Monthly", blurb: "Perfect for trying out premium features", price: "$9.99", period: "/month", cta: "Choose Plan", popular: false },
    { id: "yearly", name: "Yearly", blurb: "Save 33% with annual billing", price: "$79.99", period: "/year", cta: "Get Started", popular: true },
  ],
  includedTitle: "Everything Included",
  included: [
    "Unlimited community access",
    "Create your own communities",
    "AI-powered study assistant",
    "Premium library content",
    "Exclusive challenges",
    "Advanced note-taking",
    "Priority support",
    "No ads",
  ],
};
