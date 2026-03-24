import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

const clients = [
  { name: "Alex Johnson", goal: "Muscle Gain", sessions: 12, progress: "On Track", trend: "up" },
  { name: "Sarah Williams", goal: "Weight Loss", sessions: 8, progress: "Ahead", trend: "up" },
  { name: "Mike Chen", goal: "Endurance", sessions: 15, progress: "On Track", trend: "up" },
  { name: "Emma Davis", goal: "Flexibility", sessions: 6, progress: "Behind", trend: "down" },
  { name: "James Wilson", goal: "Strength", sessions: 10, progress: "On Track", trend: "up" },
];

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">My Clients</h1>
        <p className="text-muted-foreground mt-1">Manage and track your clients</p>
      </div>

      <div className="space-y-3">
        {clients.map((c, i) => (
          <motion.div key={c.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="stat-card rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {c.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <h3 className="font-medium text-foreground text-sm">{c.name}</h3>
                <p className="text-xs text-muted-foreground">Goal: {c.goal} • {c.sessions} sessions</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${c.progress === "Behind" ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>{c.progress}</span>
              {c.trend === "up" ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
