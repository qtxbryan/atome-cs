import { Link, useLocation } from "react-router-dom";
import AtomeBrand from "@/assets/Atome_Brand.svg";

export default function TopNav() {
  const { pathname } = useLocation();

  return (
    <nav className="flex items-center justify-between px-4 py-2.5 bg-black border-b border-zinc-900">
      <img src={AtomeBrand} alt="Atome" className="h-5 w-auto" />

      <div className="flex items-center gap-1">
        <Link
          to="/"
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            pathname === "/"
              ? "text-white bg-zinc-800"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Customer Chat
        </Link>
        <Link
          to="/manager"
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            pathname.startsWith("/manager")
              ? "text-white bg-zinc-800"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Manager
        </Link>
      </div>
    </nav>
  );
}
