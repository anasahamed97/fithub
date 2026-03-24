import { motion } from "framer-motion";
import { Clock } from "lucide-react";

const weekSchedule = [
  { day: "Monday", sessions: [{ time: "9:00 AM", client: "Alex J.", type: "Strength" }, { time: "11:00 AM", client: "Group", type: "HIIT" }, { time: "2:00 PM", client: "Sarah W.", type: "Cardio" }] },
  { day: "Tuesday", sessions: [{ time: "10:00 AM", client: "Mike C.", type: "Endurance" }, { time: "4:00 PM", client: "Group", type: "Abs & Core" }] },
  { day: "Wednesday", sessions: [{ time: "9:00 AM", client: "James W.", type: "Strength" }, { time: "11:00 AM", client: "Emma D.", type: "Flexibility" }] },
  { day: "Thursday", sessions: [{ time: "9:00 AM", client: "Group", type: "HIIT" }, { time: "1:00 PM", client: "Alex J.", type: "Cardio" }, { time: "3:00 PM", client: "Sarah W.", type: "Assessment" }] },
  { day: "Friday", sessions: [{ time: "10:00 AM", client: "Mike C.", type: "Strength" }] },
];

export default function TrainerSchedulePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">My Schedule</h1>
        <p className="text-muted-foreground mt-1">Weekly session overview</p>
      </div>

      <div className="space-y-3">
        {weekSchedule.map((day, i) => (
          <motion.div key={day.day} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="stat-card rounded-xl p-5">
            <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {day.day}</h3>
            <div className="space-y-2">
              {day.sessions.map((s) => (
                <div key={s.time + s.client} className="flex items-center gap-4 text-sm">
                  <span className="font-mono text-primary w-20 shrink-0">{s.time}</span>
                  <span className="text-foreground">{s.client}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{s.type}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
