import { Link } from "react-router-dom";
import { Home, Calendar, UtensilsCrossed, Settings, Pizza } from "lucide-react";
import styles from "./Header.module.css";
import logo from "/android-chrome-192x192.png";

type PageType = "dashboard" | "calendar" | "log" | "foods" | "goals" | "settings";

type HeaderProps = {
  title?: string;
  subtitle?: string;
  leftContent?: React.ReactNode;
  currentPage: PageType;
};

const navConfig: Record<string, { to: string; icon: typeof Home; label: string }> = {
  dashboard: { to: "/", icon: Home, label: "Dashboard" },
  calendar: { to: "/calendar", icon: Calendar, label: "Calendar" },
  log: { to: "/log", icon: UtensilsCrossed, label: "Log" },
  foods: { to: "/foods", icon: Pizza, label: "Foods" },
  settings: { to: "/settings", icon: Settings, label: "Settings" },
};

export default function Header({ title, subtitle, leftContent, currentPage: _currentPage }: HeaderProps) {
  const iconsToShow = Object.keys(navConfig);

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

        {/* Right Section - Navigation Icons */}
        <nav className={styles.navIcons}>
          {iconsToShow.map((key) => {
            const nav = navConfig[key];
            if (!nav) return null;
            const IconComponent = nav.icon;
            return (
              <Link
                key={key}
                to={nav.to}
                className={styles.navIcon}
                title={nav.label}
              >
                <IconComponent className={styles.icon} />
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
