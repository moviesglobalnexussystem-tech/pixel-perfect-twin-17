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
import { addUser, getUserByPhone, getUsers, type SharedLink } from "@/lib/firebaseServices";
import type { AgentItem } from "@/data/adminData";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone: string) => Promise<void>;
  loginWithGoogle: () => Promise<{ isNewUser: boolean }>;
  logout: () => Promise<void>;
  // Agent context
  agentData: AgentItem | null;
  setAgentData: (data: AgentItem | null) => void;
  // Google phone prompt
  needsPhoneSetup: boolean;
  setNeedsPhoneSetup: (v: boolean) => void;
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
  const [needsPhoneSetup, setNeedsPhoneSetup] = useState(false);

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
    await addUser({
      name,
      phone,
      email,
      status: "active",
      subscription: null,
      subscriptionExpiry: null,
      lastActive: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString().split("T")[0],
      uid: cred.user.uid,
    } as any);
  };

  const loginWithGoogle = async (): Promise<{ isNewUser: boolean }> => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Check if this Google user already has a Firestore user record
    const allUsers = await getUsers();
    const existingUser = allUsers.find(
      u => u.email === result.user.email || (u as any).uid === result.user.uid
    );

    if (!existingUser) {
      // New Google user - needs phone setup
      setNeedsPhoneSetup(true);
      return { isNewUser: true };
    }

    // Update lastActive
    return { isNewUser: false };
  };

  const logout = async () => {
    await signOut(auth);
    setAgentData(null);
    setNeedsPhoneSetup(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, agentData, setAgentData, needsPhoneSetup, setNeedsPhoneSetup }}>
      {children}
    </AuthContext.Provider>
  );
};
