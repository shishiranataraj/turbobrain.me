import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Penguin from "./Penguin";

export default function Layout() {
  const { pathname } = useLocation();

  return (
    <div className="layout">
      <Navbar />
      <main className="content">
        <Outlet />
      </main>
      <footer className="footer">
        <p>turbobrain.me — built with caffeine and curiosity</p>
      </footer>
      {pathname !== "/" && (
        <div className="penguin-float">
          <Penguin size={72} />
        </div>
      )}
    </div>
  );
}
