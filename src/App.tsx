import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { SessionProvider } from "@/lib/session";
import { ToastProvider } from "@/components/ui/toast";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Article from "@/pages/Article";
import Community from "@/pages/Community";
import CommunityRoom from "@/pages/CommunityRoom";
import Challenges from "@/pages/Challenges";
import ChallengeRun from "@/pages/ChallengeRun";
import Saved from "@/pages/Saved";
import Leaderboard from "@/pages/Leaderboard";
import Premium from "@/pages/Premium";
import Profile from "@/pages/Profile";
import Learn from "@/pages/Learn";
import Course from "@/pages/Course";
import Quiz from "@/pages/Quiz";
import Imaging from "@/pages/Imaging";
import Casebook from "@/pages/Casebook";
import CaseReference from "@/pages/CaseReference";
import Governance from "@/pages/Governance";
import Login from "@/pages/Login";

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/feed/:slug" element={<Article />} />
              <Route path="/community" element={<Community />} />
              <Route path="/community/:slug" element={<CommunityRoom />} />
              <Route path="/challenges" element={<Challenges />} />
              <Route path="/challenges/:slug" element={<ChallengeRun />} />
              <Route path="/saved" element={<Saved />} />
              {/* Library became Saved. The old path still resolves so shared
                  links and muscle memory do not 404. */}
              <Route path="/library" element={<Navigate to="/saved" replace />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/premium" element={<Premium />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/learn/:slug" element={<Course />} />
              <Route path="/quiz/:quizId" element={<Quiz />} />
              <Route path="/imaging" element={<Imaging />} />
              <Route path="/imaging/cases" element={<Casebook />} />
              <Route path="/imaging/cases/:id" element={<CaseReference />} />
              <Route path="/governance" element={<Governance />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </SessionProvider>
    </BrowserRouter>
  );
}
