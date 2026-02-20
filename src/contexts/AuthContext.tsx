import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  type User
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { addUser, getUserByPhone, type SharedLink } from "@/lib/firebaseServices";
import type { AgentItem } from "@/data/adminData";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  // Agent context
  agentData: AgentItem | null;
  setAgentData: (data: AgentItem | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [agentData, setAgentData] = useState<AgentItem | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, name: string, phone: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    // Create user record in Firestore
    await addUser({
      name,
      phone,
      email,
      status: "active",
      subscription: null,
      subscriptionExpiry: null,
      lastActive: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString().split("T")[0],
    } as any);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
    setAgentData(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, agentData, setAgentData }}>
      {children}
    </AuthContext.Provider>
  );
};
