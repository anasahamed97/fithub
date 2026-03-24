import { Users, CalendarDays, Star, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { motion } from "framer-motion";

const upcomingSessions = [
  { time: "9:00 AM", client: "Alex Johnson", type: "Strength Training", duration: "60 min" },
  { time: "11:00 AM", client: "Group Class", type: "HIIT Blast", duration: "45 min" },
  { time: "2:00 PM", client: "Sarah Williams", type: "Cardio Assessment", duration: "30 min" },
];

export default function TrainerDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Trainer Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, David</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Clients" value="24" change="+3 this month" icon={Users} />
        <StatCard title="Sessions This Week" value="18" change="4 remaining" icon={CalendarDays} />
        <StatCard title="Avg Rating" value="4.9" change="Top 5% trainer" icon={Star} />
        <StatCard title="Client Retention" value="94%" change="+2% this quarter" icon={TrendingUp} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-glow rounded-xl p-6">
        <h2 className="font-display font-semibold text-lg text-foreground mb-4">Today's Sessions</h2>
        <div className="space-y-3">
          {upcomingSessions.map((s) => (
            <div key={s.time} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
              <span className="text-sm font-mono text-primary font-medium w-20 shrink-0">{s.time}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{s.client}</p>
                <p className="text-xs text-muted-foreground">{s.type} • {s.duration}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
