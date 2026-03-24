import { Activity, Flame, Clock, Target } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { motion } from "framer-motion";

const todaySchedule = [
  { time: "7:00 AM", activity: "Morning HIIT", trainer: "Carlos Ruiz", duration: "45 min" },
  { time: "12:00 PM", activity: "Yoga Flow", trainer: "Lisa Monroe", duration: "60 min" },
];

export default function CustomerDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Welcome back, <span className="text-gradient">Alex</span></h1>
        <p className="text-muted-foreground mt-1">Here's your fitness overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Workouts This Week" value="4" change="+1 from last week" icon={Activity} />
        <StatCard title="Calories Burned" value="2,430" change="+320 today" icon={Flame} />
        <StatCard title="Hours Trained" value="6.5h" change="On track" icon={Clock} />
        <StatCard title="Goals Completed" value="3/5" change="60% complete" icon={Target} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-glow rounded-xl p-6">
        <h2 className="font-display font-semibold text-lg text-foreground mb-4">Today's Schedule</h2>
        <div className="space-y-3">
          {todaySchedule.map((s) => (
            <div key={s.time} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
              <span className="text-sm font-mono text-primary font-medium w-20 shrink-0">{s.time}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{s.activity}</p>
                <p className="text-xs text-muted-foreground">with {s.trainer} • {s.duration}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
