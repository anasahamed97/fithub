import { motion } from "framer-motion";
import { Plus, Wrench, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const equipment = [
  { name: "Treadmill Pro X500", category: "Cardio", status: "Operational", lastService: "Mar 10, 2026", quantity: 8 },
  { name: "Olympic Barbell Set", category: "Free Weights", status: "Operational", lastService: "Feb 28, 2026", quantity: 12 },
  { name: "Cable Crossover Machine", category: "Machines", status: "Maintenance", lastService: "Mar 18, 2026", quantity: 3 },
  { name: "Rowing Machine ERG", category: "Cardio", status: "Operational", lastService: "Mar 5, 2026", quantity: 6 },
  { name: "Leg Press 450", category: "Machines", status: "Operational", lastService: "Jan 22, 2026", quantity: 4 },
  { name: "Spin Bike Elite", category: "Cardio", status: "Maintenance", lastService: "Mar 20, 2026", quantity: 15 },
];

export default function EquipmentPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Equipment</h1>
          <p className="text-muted-foreground mt-1">Track and manage gym equipment</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Add Equipment</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipment.map((eq, i) => (
          <motion.div key={eq.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="stat-card rounded-xl p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display font-semibold text-foreground text-sm">{eq.name}</h3>
                <span className="text-xs text-muted-foreground">{eq.category}</span>
              </div>
              {eq.status === "Operational" ? (
                <CheckCircle className="h-4 w-4 text-success shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
              )}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className={`px-2 py-0.5 rounded-full ${eq.status === "Operational" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{eq.status}</span>
              <span className="text-muted-foreground">Qty: {eq.quantity}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wrench className="h-3 w-3" /> Last service: {eq.lastService}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
