/* =============================================================
   CONTENT — every string and list rendered by the app.
   Swap these values for your own; the components adapt.
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
    { icon: "book", title: "Rich Library", body: "Access books, videos, and study materials" },
    { icon: "sparkles", title: "AI Assistant", body: "Get personalized study recommendations" },
  ],
  ctaTitle: "Ready to Transform Your Medical Education?",
  ctaBody: "Join over 50,000 medical students already using Medly to learn smarter, not harder.",
  ctaButton: "Get Started for Free",
} as const;

/* ---------- Dashboard ---------- */
export const dashboard = {
  greeting: "Good Morning! 👋",
  greetingSub: "Ready to learn something new today?",
  stats: [
    { label: "Rank", value: "#42", delta: "+5 this week", tone: "primary" },
    { label: "Streak", value: "12 days", delta: "Keep it up!", tone: "accent" },
    { label: "Points", value: "2,450", delta: "+120 today", tone: "success" },
    { label: "Badges", value: "8", delta: "2 new!", tone: "warning" },
  ],
  featured: {
    kicker: "Weekly Challenge",
    title: "Cardiology Case Study",
    body: "Test your knowledge with 10 challenging cases from real clinical scenarios.",
    startsIn: "Starts in 2h 30m",
    joined: "342 joined",
    cta: "Join Challenge",
  },
  feedTitle: "Your Feed",
  feedFilters: ["All", "Medical News", "Study Tip", "Upcoming Event", "Sponsored"],
  feed: [
    {
      tag: "Medical News",
      time: "2 hours ago",
      title: "New Breakthrough in Alzheimer's Research Shows Promise",
      body: "Scientists at MIT have discovered a novel approach to targeting amyloid plaques, potentially revolutionizing treatment strategies for Alzheimer's disease.",
      author: "Dr. Sarah Chen",
      likes: 234,
      comments: 45,
    },
    {
      tag: "Study Tip",
      time: "4 hours ago",
      title: "Active Recall: The Most Effective Study Technique",
      body: "Stop passive reading! Studies show that actively testing yourself on material improves retention by up to 50% compared to re-reading notes.",
      author: "StudyHacks",
      likes: 567,
      comments: 89,
    },
    {
      tag: "Upcoming Event",
      time: "6 hours ago",
      title: "Virtual Anatomy Lab: Advanced Cardiac Structures",
      body: "Join our interactive 3D anatomy session focusing on the conduction system of the heart. Perfect for second-year students preparing for exams.",
      author: "Medly Events",
      likes: 189,
      comments: 34,
    },
    {
      tag: "Sponsored",
      time: "1 day ago",
      title: "Master USMLE Step 1 with AI-Powered Practice",
      body: "UWorld's adaptive learning platform now integrates AI tutoring. Get personalized study plans and instant feedback on your weak areas.",
      author: "UWorld",
      likes: 892,
      comments: 156,
    },
  ],
};

/* ---------- Library ---------- */
export const library = {
  title: "Library",
  subtitle: "Books, videos, and study materials at your fingertips",
  categories: [
    { icon: "book", label: "Books", count: "1,245 items" },
    { icon: "video", label: "Videos", count: "567 items" },
    { icon: "file", label: "PDFs", count: "892 items" },
  ],
  sectionTitle: "Popular Resources",
  resources: [
    { title: "Gray's Anatomy for Students", author: "Richard Drake", rating: 4.9, downloads: "45,200", premium: true, kind: "book" },
    { title: "Introduction to Clinical Medicine", author: "Dr. James Anderson", rating: 4.7, downloads: "23,100", premium: false, kind: "book" },
    { title: "Pathophysiology Study Guide", author: "Medical Education Team", rating: 4.8, downloads: "18,500", premium: true, kind: "file" },
    { title: "Harrison's Principles of Internal Medicine", author: "J. Larry Jameson", rating: 4.9, downloads: "67,800", premium: false, kind: "book" },
    { title: "ECG Interpretation Masterclass", author: "Dr. Sarah Williams", rating: 4.6, downloads: "12,400", premium: false, kind: "video" },
    { title: "Pharmacology Quick Reference", author: "PharmEd Solutions", rating: 4.5, downloads: "31,200", premium: true, kind: "file" },
    { title: "Robbins Basic Pathology", author: "Vinay Kumar", rating: 4.8, downloads: "54,300", premium: true, kind: "book" },
    { title: "Surgical Techniques Vol. 1", author: "Dr. Michael Chen", rating: 4.7, downloads: "8,900", premium: false, kind: "video" },
  ],
};

/* ---------- Community ---------- */
export const community = {
  title: "Communities",
  subtitle: "Join communities based on your specialty interests",
  createCta: "Create Community",
  filters: ["All", "My Communities", "Popular", "New", "Recommended"],
  groups: [
    { name: "Cardiology Club", body: "Dive deep into cardiovascular medicine, ECG interpretation, and heart failure management.", members: "12,450", posts: "89", joined: true },
    { name: "Neurology Network", body: "Explore the nervous system, stroke management, and neurological disorders.", members: "8,930", posts: "67", joined: false },
    { name: "Surgery Society", body: "Surgical techniques, case discussions, and operative procedures.", members: "15,200", posts: "124", joined: false },
    { name: "Pediatrics Pals", body: "Child health, development milestones, and pediatric emergencies.", members: "7,650", posts: "45", joined: false },
    { name: "Emergency Medicine", body: "Critical care, trauma management, and emergency protocols.", members: "11,200", posts: "156", joined: true },
    { name: "Radiology Residents", body: "Image interpretation, diagnostic techniques, and radiology cases.", members: "5,430", posts: "38", joined: false },
    { name: "Psychiatry Circle", body: "Mental health, psychopharmacology, and therapeutic techniques.", members: "6,780", posts: "52", joined: false },
    { name: "Internal Medicine", body: "Adult medicine, diagnostics, and chronic disease management.", members: "18,900", posts: "201", joined: true },
  ],
};

/* ---------- Challenges ---------- */
export const challenges = {
  title: "Challenges & Rankings",
  subtitle: "Compete, learn, and climb the leaderboard",
  stats: [
    { value: "12 days", label: "Current Streak" },
    { value: "2,450", label: "Weekly Points" },
    { value: "28", label: "Challenges Done" },
  ],
  sectionTitle: "Active Challenges",
  active: [
    { emoji: "📝", difficulty: "hard", points: 500, title: "Cardiology Grand Challenge", body: "Test your knowledge on cardiac physiology, ECG interpretation, and heart failure management.", joined: 1245, endsIn: "2d 14h" },
    { emoji: "🔬", difficulty: "medium", points: 350, title: "Mystery Case Study", body: "Diagnose a complex patient case with multiple symptoms. Work through the clinical reasoning.", joined: 892, endsIn: "1d 8h" },
    { emoji: "📝", difficulty: "easy", points: 150, title: "Anatomy Speed Quiz", body: "Quick-fire questions on human anatomy. Perfect for revision and testing your recall speed.", joined: 2341, endsIn: "5h 30m" },
    { emoji: "🏆", difficulty: "hard", points: 600, title: "Pharmacology Master", body: "Drug interactions, mechanisms, and clinical applications. Are you ready?", joined: 756, endsIn: "3d 0h" },
  ],
  leaderboardTitle: "Weekly Leaderboard",
  leaderboard: [
    { rank: 1, name: "Sarah Chen", school: "Harvard Medical School", points: "15,420", you: false },
    { rank: 2, name: "James Wilson", school: "Johns Hopkins", points: "14,890", you: false },
    { rank: 3, name: "Emily Davis", school: "Stanford Medicine", points: "14,350", you: false },
    { rank: 4, name: "Michael Brown", school: "Yale School of Medicine", points: "13,920", you: false },
    { rank: 5, name: "You", school: "Columbia Medical", points: "12,450", you: true },
  ],
};

/* ---------- Premium ---------- */
export const premium = {
  title: "Upgrade to Premium",
  subtitle: "Unlock your full potential with advanced features and exclusive content",
  benefits: [
    { icon: "users", title: "Unlimited Communities", body: "Create and join unlimited communities based on your interests" },
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

/* ---------- Profile ---------- */
export const profile = {
  name: "Alex Johnson",
  handle: "@alexjohnson",
  school: "Columbia University College of Physicians · Year 3",
  premium: true,
  avatar: "/avatar.jpg",
  stats: [
    { value: "#42", label: "Global Rank" },
    { value: "12,450", label: "Total Points" },
    { value: "18", label: "Badges Earned" },
    { value: "5", label: "Communities" },
  ],
  badgesTitle: "Badges",
  badges: [
    { emoji: "🏆", label: "Top 100" },
    { emoji: "🔥", label: "Streak Master" },
    { emoji: "📚", label: "Bookworm" },
    { emoji: "🎯", label: "Quiz Champion" },
    { emoji: "💡", label: "Contributor" },
  ],
  activityTitle: "Recent Activity",
  activity: [
    { text: "Completed Cardiology Quiz", time: "2 hours ago", points: "+120" },
    { text: "Joined Neurology Network", time: "5 hours ago", points: "+10" },
    { text: "Added notes to Gray's Anatomy", time: "1 day ago", points: "+5" },
    { text: "Weekly streak bonus", time: "2 days ago", points: "+50" },
  ],
};
