import {
  LayoutDashboard,
  Users,
  Dumbbell,
  UserCog,
  Package,
  CalendarDays,
  CreditCard,
  Activity,
  ClipboardList,
  UserCheck,
  Trophy,
  Wrench,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const ownerItems = [
  { title: "Dashboard", url: "/owner", icon: LayoutDashboard },
  { title: "Members", url: "/owner/members", icon: Users },
  { title: "Trainers", url: "/owner/trainers", icon: UserCog },
  { title: "Equipment", url: "/owner/equipment", icon: Package },
  { title: "Revenue", url: "/owner/revenue", icon: CreditCard },
];

const customerItems = [
  { title: "My Dashboard", url: "/customer", icon: Activity },
  { title: "My Plan", url: "/customer/plan", icon: ClipboardList },
  { title: "Schedule", url: "/customer/schedule", icon: CalendarDays },
  { title: "Progress", url: "/customer/progress", icon: Trophy },
];

const trainerItems = [
  { title: "Dashboard", url: "/trainer", icon: LayoutDashboard },
  { title: "My Clients", url: "/trainer/clients", icon: UserCheck },
  { title: "Schedule", url: "/trainer/schedule", icon: CalendarDays },
  { title: "Workouts", url: "/trainer/workouts", icon: Dumbbell },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  const renderGroup = (
    label: string,
    items: typeof ownerItems
  ) => (
    <SidebarGroup defaultOpen>
      <SidebarGroupLabel className="text-muted-foreground/60 uppercase tracking-widest text-[10px] font-semibold">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end
                  className="hover:bg-sidebar-accent transition-colors"
                  activeClassName="bg-sidebar-accent text-primary font-medium"
                >
                  <item.icon className="mr-2 h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-6 w-6 text-primary shrink-0" />
          {!collapsed && (
            <span className="font-display font-bold text-lg text-foreground tracking-tight">
              FitForge
            </span>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="py-2">
        {renderGroup("Owner", ownerItems)}
        {renderGroup("Customer", customerItems)}
        {renderGroup("Trainer", trainerItems)}
      </SidebarContent>
    </Sidebar>
  );
}
