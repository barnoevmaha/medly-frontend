import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";
import { getToken } from "@/lib/api";

export function AppLayout() {
  const location = useLocation();

  // Every route inside this layout calls the API, and the API is authenticated.
  // Without this check an unauthenticated visit renders a page full of 401
  // errors instead of a sign-in prompt.
  if (!getToken()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileNav />
      <main className="px-4 pb-24 pt-6 md:ml-64 md:px-8 md:pb-10">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>
      <AssistantWidget />
    </div>
  );
}
