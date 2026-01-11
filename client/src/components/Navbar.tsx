import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Navbar() {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch(error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="w-full bg-white border-b shadow-sm px-6 py-3 flex justify-between items-center">
      {/* Logo / App name */}
      <h1 className="text-xl font-bold text-gray-800">SnackStat</h1>

      {/* Right side - sign out button */}
      <button
        onClick={handleSignOut}
        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
      >
        Sign Out
      </button>
    </nav>
  );
}