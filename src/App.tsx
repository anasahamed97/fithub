import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "./components/DashboardLayout";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/owner" replace />} />
          <Route path="/owner" element={<DashboardLayout><OwnerDashboard /></DashboardLayout>} />
          <Route path="/owner/members" element={<DashboardLayout><MembersPage /></DashboardLayout>} />
          <Route path="/owner/trainers" element={<DashboardLayout><TrainersPage /></DashboardLayout>} />
          <Route path="/owner/equipment" element={<DashboardLayout><EquipmentPage /></DashboardLayout>} />
          <Route path="/owner/revenue" element={<DashboardLayout><RevenuePage /></DashboardLayout>} />
          <Route path="/customer" element={<DashboardLayout><CustomerDashboard /></DashboardLayout>} />
          <Route path="/customer/plan" element={<DashboardLayout><PlanPage /></DashboardLayout>} />
          <Route path="/customer/schedule" element={<DashboardLayout><SchedulePage /></DashboardLayout>} />
          <Route path="/customer/progress" element={<DashboardLayout><ProgressPage /></DashboardLayout>} />
          <Route path="/trainer" element={<DashboardLayout><TrainerDashboard /></DashboardLayout>} />
          <Route path="/trainer/clients" element={<DashboardLayout><ClientsPage /></DashboardLayout>} />
          <Route path="/trainer/schedule" element={<DashboardLayout><TrainerSchedulePage /></DashboardLayout>} />
          <Route path="/trainer/workouts" element={<DashboardLayout><WorkoutsPage /></DashboardLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
