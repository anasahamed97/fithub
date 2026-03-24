import { motion } from "framer-motion";
import { Dumbbell, Plus, Clock, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

const workouts = [
  { name: "Full Body Blast", duration: "60 min", intensity: "High", exercises: 12 },
  { name: "Upper Body Strength", duration: "45 min", intensity: "Medium", exercises: 8 },
  { name: "HIIT Circuit", duration: "30 min", intensity: "Very High", exercises: 10 },
  { name: "Core & Abs", duration: "30 min", intensity: "Medium", exercises: 8 },
  { name: "Leg Day Supreme", duration: "50 min", intensity: "High", exercises: 10 },
  { name: "Recovery & Stretch", duration: "40 min", intensity: "Low", exercises: 12 },
];

const intensityColor: Record<string, string> = {
  Low: "bg-info/10 text-info",
  Medium: "bg-warning/10 text-warning",
  High: "bg-primary/10 text-primary",
  "Very High": "bg-destructive/10 text-destructive",
};

export default function WorkoutsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Workout Plans</h1>
          <p className="text-muted-foreground mt-1">Create and manage workout routines</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Create Workout</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workouts.map((w, i) => (
          <motion.div key={w.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="stat-card rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-primary" />
              <h3 className="font-display font-semibold text-foreground text-sm">{w.name}</h3>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {w.duration}</span>
              <span>{w.exercises} exercises</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full inline-block ${intensityColor[w.intensity]}`}>{w.intensity}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
