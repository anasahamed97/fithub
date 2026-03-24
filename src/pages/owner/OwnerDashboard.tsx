import { Users, CreditCard, Dumbbell, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { motion } from "framer-motion";

const recentMembers = [
  { name: "Alex Johnson", plan: "Premium", joined: "2 days ago" },
  { name: "Sarah Williams", plan: "Basic", joined: "3 days ago" },
  { name: "Mike Chen", plan: "Premium", joined: "5 days ago" },
  { name: "Emma Davis", plan: "Basic", joined: "1 week ago" },
];

export default function OwnerDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Owner Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your gym performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Members" value="1,247" change="+12% from last month" icon={Users} />
        <StatCard title="Monthly Revenue" value="$48,320" change="+8% from last month" icon={CreditCard} />
        <StatCard title="Active Trainers" value="18" change="+2 this month" icon={Dumbbell} />
        <StatCard title="Growth Rate" value="15.3%" change="+3.2% from last month" icon={TrendingUp} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-glow rounded-xl p-6">
        <h2 className="font-display font-semibold text-lg text-foreground mb-4">Recent Members</h2>
        <div className="space-y-3">
          {recentMembers.map((member) => (
            <div key={member.name} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                  {member.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.joined}</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">{member.plan}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
