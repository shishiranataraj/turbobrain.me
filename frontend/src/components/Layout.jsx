import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="layout">
      <Navbar />
      <main className="content">
        <Outlet />
      </main>
      <footer className="footer">
        <p>turbobrain.me — built with caffeine and curiosity</p>
      </footer>
    </div>
  );
}
