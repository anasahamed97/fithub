import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Eye, EyeOff, Shield, UserCog, Users, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { toast } from "sonner";

const roles: { key: UserRole; label: string; icon: typeof Shield; desc: string }[] = [
  { key: "owner", label: "Owner", icon: Shield, desc: "Full gym management" },
  { key: "trainer", label: "Trainer", icon: UserCog, desc: "Clients & workouts" },
  { key: "member", label: "Member", icon: Users, desc: "Plans & progress" },
];

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>("owner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const success = await login(email, password, selectedRole);
      if (success) {
        toast.success(`Welcome back!`);
        const routes: Record<UserRole, string> = { owner: "/owner", trainer: "/trainer", member: "/customer" };
        navigate(routes[selectedRole]);
      }
    } catch {
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-primary/3 blur-[100px]" />
      </div>

      {/* Left branding panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[45%] relative items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-md"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Dumbbell className="h-6 w-6 text-primary" />
            </div>
            <span className="font-display font-bold text-3xl text-foreground tracking-tight">FitForge</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-foreground leading-tight mb-4">
            Manage your gym<br />
            <span className="text-gradient">like a pro.</span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            All-in-one platform for gym owners, trainers, and members. Track performance, manage schedules, and grow your fitness business.
          </p>

          {/* Feature pills */}
          <div className="mt-8 flex flex-wrap gap-2">
            {["Member Management", "Workout Plans", "Revenue Tracking", "Equipment Logs"].map((f) => (
              <span key={f} className="text-xs px-3 py-1.5 rounded-full border border-border bg-secondary/50 text-muted-foreground">
                {f}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <Dumbbell className="h-7 w-7 text-primary" />
            <span className="font-display font-bold text-2xl text-foreground">FitForge</span>
          </div>

          <div className="card-glow rounded-2xl p-8">
            <h2 className="text-2xl font-display font-bold text-foreground mb-1">Sign in</h2>
            <p className="text-sm text-muted-foreground mb-6">Choose your role and log in to continue</p>

            {/* Role selector */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {roles.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setSelectedRole(r.key)}
                  className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 text-center ${
                    selectedRole === r.key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary/30 text-muted-foreground hover:border-muted-foreground/30"
                  }`}
                >
                  <r.icon className="h-5 w-5" />
                  <span className="text-xs font-semibold">{r.label}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedRole}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="text-xs text-center text-muted-foreground mb-6 px-2 py-2 rounded-lg bg-secondary/40"
              >
                Signing in as <span className="text-foreground font-medium capitalize">{selectedRole}</span> — {roles.find((r) => r.key === selectedRole)?.desc}
              </motion.div>
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-muted-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary/50 border-border focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm text-muted-foreground">Password</Label>
                  <button type="button" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-secondary/50 border-border focus:border-primary pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full gap-2 h-11 text-sm font-semibold" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Sign in <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground mt-6">
              Don't have an account?{" "}
              <button type="button" className="text-primary hover:underline font-medium">
                Sign up
              </button>
            </p>
          </div>

          <p className="text-center text-[11px] text-muted-foreground/50 mt-4">
            Demo mode — any credentials will work
          </p>
        </motion.div>
      </div>
    </div>
  );
}
