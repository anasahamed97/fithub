import { motion } from "framer-motion";
import { Star, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

const trainers = [
  { name: "David Park", specialty: "Strength Training", clients: 24, rating: 4.9 },
  { name: "Lisa Monroe", specialty: "Yoga & Flexibility", clients: 18, rating: 4.8 },
  { name: "Carlos Ruiz", specialty: "HIIT & Cardio", clients: 22, rating: 4.7 },
  { name: "Nina Patel", specialty: "Nutrition & Wellness", clients: 15, rating: 4.9 },
];

export default function TrainersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Trainers</h1>
          <p className="text-muted-foreground mt-1">Manage your training staff</p>
        </div>
        <Button className="gap-2"><UserPlus className="h-4 w-4" /> Add Trainer</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trainers.map((t, i) => (
          <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="stat-card rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                {t.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-foreground">{t.name}</h3>
                <p className="text-sm text-muted-foreground">{t.specialty}</p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-xs text-muted-foreground">{t.clients} clients</span>
                  <span className="flex items-center gap-1 text-xs text-warning"><Star className="h-3 w-3 fill-current" /> {t.rating}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
