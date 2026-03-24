import { motion } from "framer-motion";
import { Search, Filter, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const members = [
  { name: "Alex Johnson", email: "alex@email.com", plan: "Premium", status: "Active", joined: "Jan 15, 2026" },
  { name: "Sarah Williams", email: "sarah@email.com", plan: "Basic", status: "Active", joined: "Feb 3, 2026" },
  { name: "Mike Chen", email: "mike@email.com", plan: "Premium", status: "Active", joined: "Feb 20, 2026" },
  { name: "Emma Davis", email: "emma@email.com", plan: "Basic", status: "Expired", joined: "Dec 10, 2025" },
  { name: "James Wilson", email: "james@email.com", plan: "Premium", status: "Active", joined: "Mar 1, 2026" },
];

export default function MembersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Members</h1>
          <p className="text-muted-foreground mt-1">Manage your gym members</p>
        </div>
        <Button className="gap-2"><UserPlus className="h-4 w-4" /> Add Member</Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search members..." className="pl-9 bg-card border-border" />
        </div>
        <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-glow rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 text-muted-foreground font-medium">Member</th>
              <th className="text-left p-4 text-muted-foreground font-medium hidden md:table-cell">Email</th>
              <th className="text-left p-4 text-muted-foreground font-medium">Plan</th>
              <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
              <th className="text-left p-4 text-muted-foreground font-medium hidden lg:table-cell">Joined</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.email} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                <td className="p-4 font-medium text-foreground">{m.name}</td>
                <td className="p-4 text-muted-foreground hidden md:table-cell">{m.email}</td>
                <td className="p-4"><span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">{m.plan}</span></td>
                <td className="p-4"><span className={`px-2 py-0.5 rounded-full text-xs ${m.status === "Active" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{m.status}</span></td>
                <td className="p-4 text-muted-foreground hidden lg:table-cell">{m.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
