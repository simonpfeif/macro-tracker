import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, UtensilsCrossed, Pizza, Settings } from "lucide-react";
import styles from "./BottomNav.module.css";

const tabs = [
  { to: "/", icon: Home, label: "Dashboard" },
  { to: "/calendar", icon: Calendar, label: "Calendar" },
  { to: "/log", icon: UtensilsCrossed, label: "Log" },
  { to: "/foods", icon: Pizza, label: "Foods" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className={styles.nav}>
      {tabs.map(({ to, icon: Icon, label }) => {
        const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);
        return (
          <Link key={to} to={to} className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}>
            <Icon size="1.25rem" />
            <span className={styles.tabLabel}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
