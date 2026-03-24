import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Users, ArrowUpRight } from "lucide-react";
import { StatCard } from "@/components/StatCard";

const transactions = [
  { member: "Alex Johnson", amount: "$99.00", type: "Premium Plan", date: "Mar 22, 2026" },
  { member: "Sarah Williams", amount: "$49.00", type: "Basic Plan", date: "Mar 21, 2026" },
  { member: "Mike Chen", amount: "$99.00", type: "Premium Plan", date: "Mar 20, 2026" },
  { member: "James Wilson", amount: "$149.00", type: "Personal Training", date: "Mar 19, 2026" },
];

export default function RevenuePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Revenue</h1>
        <p className="text-muted-foreground mt-1">Financial overview and transactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="This Month" value="$48,320" change="+8%" icon={DollarSign} />
        <StatCard title="Avg per Member" value="$78.50" change="+5%" icon={TrendingUp} />
        <StatCard title="New Signups" value="34" change="+12 this week" icon={Users} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-glow rounded-xl p-6">
        <h2 className="font-display font-semibold text-lg text-foreground mb-4">Recent Transactions</h2>
        <div className="space-y-3">
          {transactions.map((t) => (
            <div key={t.member + t.date} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{t.member}</p>
                <p className="text-xs text-muted-foreground">{t.type} • {t.date}</p>
              </div>
              <span className="text-sm font-semibold text-success flex items-center gap-1">{t.amount} <ArrowUpRight className="h-3 w-3" /></span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
