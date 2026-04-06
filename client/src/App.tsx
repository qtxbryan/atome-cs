import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { BotConfigProvider } from "@/context/BotConfigContext";
import { MistakesProvider } from "@/context/MistakesContext";
import PasswordGate from "@/components/manager/PasswordGate";
import TopNav from "@/components/ui/TopNav";
import CustomerChat from "@/pages/CustomerChat";
import ManagerDashboard from "@/pages/ManagerDashboard";
import type { ReactNode } from "react";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <PasswordGate />;
}

function AppRoutes() {
  return (
    <div className="flex flex-col h-screen">
      <TopNav />
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<CustomerChat />} />
          <Route
            path="/manager"
            element={
              <ProtectedRoute>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BotConfigProvider>
        <MistakesProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster position="top-right" richColors />
          </BrowserRouter>
        </MistakesProvider>
      </BotConfigProvider>
    </AuthProvider>
  );
}
