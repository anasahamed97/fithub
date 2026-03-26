import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import MembersPage from "./pages/owner/MembersPage";
import TrainersPage from "./pages/owner/TrainersPage";
import EquipmentPage from "./pages/owner/EquipmentPage";
import RevenuePage from "./pages/owner/RevenuePage";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import PlanPage from "./pages/customer/PlanPage";
import SchedulePage from "./pages/customer/SchedulePage";
import ProgressPage from "./pages/customer/ProgressPage";
import TrainerDashboard from "./pages/trainer/TrainerDashboard";
import ClientsPage from "./pages/trainer/ClientsPage";
import TrainerSchedulePage from "./pages/trainer/TrainerSchedulePage";
import WorkoutsPage from "./pages/trainer/WorkoutsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const OwnerRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute allowedRoles={["owner"]}>
    <DashboardLayout>{children}</DashboardLayout>
  </ProtectedRoute>
);

const TrainerRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute allowedRoles={["trainer"]}>
    <DashboardLayout>{children}</DashboardLayout>
  </ProtectedRoute>
);

const MemberRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute allowedRoles={["member"]}>
    <DashboardLayout>{children}</DashboardLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Owner routes */}
            <Route path="/owner" element={<OwnerRoute><OwnerDashboard /></OwnerRoute>} />
            <Route path="/owner/members" element={<OwnerRoute><MembersPage /></OwnerRoute>} />
            <Route path="/owner/trainers" element={<OwnerRoute><TrainersPage /></OwnerRoute>} />
            <Route path="/owner/equipment" element={<OwnerRoute><EquipmentPage /></OwnerRoute>} />
            <Route path="/owner/revenue" element={<OwnerRoute><RevenuePage /></OwnerRoute>} />

            {/* Member routes */}
            <Route path="/customer" element={<MemberRoute><CustomerDashboard /></MemberRoute>} />
            <Route path="/customer/plan" element={<MemberRoute><PlanPage /></MemberRoute>} />
            <Route path="/customer/schedule" element={<MemberRoute><SchedulePage /></MemberRoute>} />
            <Route path="/customer/progress" element={<MemberRoute><ProgressPage /></MemberRoute>} />

            {/* Trainer routes */}
            <Route path="/trainer" element={<TrainerRoute><TrainerDashboard /></TrainerRoute>} />
            <Route path="/trainer/clients" element={<TrainerRoute><ClientsPage /></TrainerRoute>} />
            <Route path="/trainer/schedule" element={<TrainerRoute><TrainerSchedulePage /></TrainerRoute>} />
            <Route path="/trainer/workouts" element={<TrainerRoute><WorkoutsPage /></TrainerRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
