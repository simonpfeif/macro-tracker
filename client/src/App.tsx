import './App.css';
import { useEffect, useState } from "react";
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from "firebase/auth";
import { auth } from "./lib/firebase";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";


function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return user ? <Dashboard /> : <Login />;
}

export default App
