import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";

const schedule = [
  { day: "Monday", sessions: [{ time: "7:00 AM", class: "HIIT Blast", trainer: "Carlos" }, { time: "6:00 PM", class: "Strength", trainer: "David" }] },
  { day: "Tuesday", sessions: [{ time: "12:00 PM", class: "Yoga Flow", trainer: "Lisa" }] },
  { day: "Wednesday", sessions: [{ time: "7:00 AM", class: "Cardio Burn", trainer: "Carlos" }] },
  { day: "Thursday", sessions: [{ time: "6:00 PM", class: "Full Body", trainer: "David" }] },
  { day: "Friday", sessions: [{ time: "7:00 AM", class: "HIIT Blast", trainer: "Carlos" }, { time: "5:00 PM", class: "Stretch & Recover", trainer: "Lisa" }] },
];

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">My Schedule</h1>
        <p className="text-muted-foreground mt-1">Your weekly workout plan</p>
      </div>

      <div className="space-y-3">
        {schedule.map((day, i) => (
          <motion.div key={day.day} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="stat-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="h-4 w-4 text-primary" />
              <h3 className="font-display font-semibold text-foreground">{day.day}</h3>
            </div>
            <div className="space-y-2">
              {day.sessions.map((s) => (
                <div key={s.time + s.class} className="flex items-center gap-4 text-sm">
                  <span className="font-mono text-primary w-20 shrink-0">{s.time}</span>
                  <span className="text-foreground">{s.class}</span>
                  <span className="text-muted-foreground text-xs">• {s.trainer}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
