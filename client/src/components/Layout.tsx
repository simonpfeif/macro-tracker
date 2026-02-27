import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav/BottomNav";
import styles from "./Layout.module.css";

export default function Layout() {
  return (
    <div className={styles.page}>
      <Outlet />
      <BottomNav />
    </div>
  );
}
