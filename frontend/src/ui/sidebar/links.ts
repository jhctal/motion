import {
  ActivityIcon,
  AppleIcon,
  DumbbellIcon,
  LayoutDashboardIcon,
  RulerIcon,
  ScaleIcon,
  SportShoeIcon,
  WeightIcon,
} from "lucide-react";

export const navLinks = [
  { to: "/", label: "Home", icon: LayoutDashboardIcon, group: "Training" },
  {
    to: "/exercises",
    label: "Exercises",
    icon: DumbbellIcon,
    group: "Training",
  },
  { to: "/workouts", label: "Workouts", icon: WeightIcon, group: "Training" },
  { to: "/my-logs", label: "Logs", icon: SportShoeIcon, group: "Training" },
  { to: "/sleep", label: "Sleep", icon: ActivityIcon, group: "Health" },
  { to: "/nutrition", label: "Nutrition", icon: AppleIcon, group: "Health" },
  { to: "/weight", label: "Weight", icon: ScaleIcon, group: "Health" },
  {
    to: "/measurements",
    label: "Measurements",
    icon: RulerIcon,
    group: "Health",
  },
] as const;

export const navGroups = ["Training", "Health"] as const;
