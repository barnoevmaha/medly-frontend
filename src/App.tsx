import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Community from "@/pages/Community";
import Challenges from "@/pages/Challenges";
import Library from "@/pages/Library";
import Premium from "@/pages/Premium";
import Profile from "@/pages/Profile";
import Learn from "@/pages/Learn";
import Course from "@/pages/Course";
import Quiz from "@/pages/Quiz";
import Imaging from "@/pages/Imaging";
import Governance from "@/pages/Governance";
import Login from "@/pages/Login";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/community" element={<Community />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/library" element={<Library />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/:slug" element={<Course />} />
          <Route path="/quiz/:quizId" element={<Quiz />} />
          <Route path="/imaging" element={<Imaging />} />
          <Route path="/governance" element={<Governance />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
