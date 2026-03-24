import { motion } from "framer-motion";
import { Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  { name: "Basic", price: "$49/mo", features: ["Gym access", "Locker room", "2 group classes/week"], current: false },
  { name: "Premium", price: "$99/mo", features: ["Unlimited gym access", "All group classes", "1 PT session/month", "Sauna access"], current: true },
  { name: "Elite", price: "$149/mo", features: ["Everything in Premium", "4 PT sessions/month", "Nutrition planning", "Priority booking"], current: false },
];

export default function PlanPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">My Plan</h1>
        <p className="text-muted-foreground mt-1">Manage your membership</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan, i) => (
          <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`rounded-xl p-6 space-y-4 ${plan.current ? "border-2 border-primary bg-primary/5" : "stat-card"}`}>
            <div className="flex items-center gap-2">
              {plan.current && <Crown className="h-4 w-4 text-primary" />}
              <h3 className="font-display font-bold text-foreground">{plan.name}</h3>
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{plan.price}</p>
            <ul className="space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-success shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Button variant={plan.current ? "default" : "outline"} className="w-full">
              {plan.current ? "Current Plan" : "Upgrade"}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
