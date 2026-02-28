import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, UtensilsCrossed, Pizza, Settings } from "lucide-react";
import styles from "./Header.module.css";
import logo from "/android-chrome-192x192.png";

const navTabs = [
  { to: "/", icon: Home, label: "Dashboard" },
  { to: "/calendar", icon: Calendar, label: "Calendar" },
  { to: "/log", icon: UtensilsCrossed, label: "Log" },
  { to: "/foods", icon: Pizza, label: "Foods" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

type HeaderProps = {
  title?: string;
  subtitle?: string;
  leftContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  currentPage?: string;
};

export default function Header({ title, subtitle, leftContent, centerContent }: HeaderProps) {
  const { pathname } = useLocation();

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        {/* Left Section */}
        <div className={styles.leftSection}>
          <Link to="/" className={styles.logoLink}>
            <img src={logo} alt="SnackStat" className={styles.logo} />
          </Link>
          {leftContent ? (
            leftContent
          ) : (
            <div className={styles.titleContainer}>
              {title && <h1 className={styles.pageTitle}>{title}</h1>}
              {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
            </div>
          )}
        </div>

        {/* Center Section */}
        {centerContent && (
          <div className={styles.centerSection}>{centerContent}</div>
        )}

        {/* Navigation */}
        <nav className={styles.nav}>
          {navTabs.map(({ to, icon: Icon, label }) => {
            const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
              >
                <Icon size="1.125rem" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
