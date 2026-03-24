import { motion } from "framer-motion";
import { Trophy, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const goals = [
  { name: "Weight Loss", target: "Lose 10 lbs", progress: 70 },
  { name: "Strength", target: "Bench 200 lbs", progress: 85 },
  { name: "Cardio", target: "Run 5K under 25 min", progress: 55 },
  { name: "Flexibility", target: "Touch toes", progress: 90 },
];

export default function ProgressPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">My Progress</h1>
        <p className="text-muted-foreground mt-1">Track your fitness goals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((g, i) => (
          <motion.div key={g.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="stat-card rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <h3 className="font-display font-semibold text-foreground">{g.name}</h3>
              </div>
              <span className="text-sm font-bold text-primary">{g.progress}%</span>
            </div>
            <p className="text-sm text-muted-foreground">{g.target}</p>
            <Progress value={g.progress} className="h-2" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
