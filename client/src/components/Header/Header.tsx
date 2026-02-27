import { Link } from "react-router-dom";
import styles from "./Header.module.css";
import logo from "/android-chrome-192x192.png";

type HeaderProps = {
  title?: string;
  subtitle?: string;
  leftContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  currentPage?: string;
};

export default function Header({ title, subtitle, leftContent, centerContent }: HeaderProps) {
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
      </div>
    </header>
  );
}
