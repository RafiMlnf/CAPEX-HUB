"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  CapexProposal,
  UserRole,
  User,
  api,
  ApiRolePermission,
  getProposals,
  addProposal as apiAddProposal,
  updateProposal as apiUpdateProposal,
  getCurrentUser,
  setCurrentUser as dbSetCurrentUser,
  loginUser as apiLogin,
  getActiveRole,
} from "../lib/api";

interface CapexContextType {
  proposals: CapexProposal[];
  loadingProposals: boolean;
  activeRole: UserRole;
  userPermissions: string[];
  hasPermission: (permCode: string) => boolean;
  hasRole: (...roleCodes: string[]) => boolean;
  createProposal: (proposal: {
    name: string;
    description: string;
    department: string;
    pic: string;
    estimatedCost: number;
    purpose?: string;
    investmentType?: string;
    startDate?: string;
    endDate?: string;
    attachmentName?: string;
    gateStatus?: string;
  }) => Promise<void>;
  editProposal: (id: string, data: Partial<CapexProposal>) => Promise<void>;
  refreshProposals: () => Promise<void>;
  currentUser: User | null;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => void;
  updateUserPhoto: (photoUrl: string) => void;
  mounted: boolean;
}

const CapexContext = createContext<CapexContextType | undefined>(undefined);

export function CapexProvider({ children }: { children: React.ReactNode }) {
  const [proposals, setProposals] = useState<CapexProposal[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(true);
  const [activeRole, setActiveRole] = useState<UserRole>("Admin");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  const refreshPermissions = useCallback(async (user: User | null) => {
    if (!user) {
      setUserPermissions([]);
      return;
    }
    const roleName = (user.role || "").toLowerCase().trim();
    const uname = (user.username || "").toLowerCase().trim();
    if (
      roleName === "admin" ||
      uname === "admin" ||
      roleName === "administrator" ||
      roleName === "superadmin" ||
      (user as any).is_admin === true
    ) {
      setUserPermissions([
        "ALL_ACCESS",
        "perm_view_dashboard",
        "perm_create_capex",
        "perm_review_capex",
        "perm_committee_review",
        "perm_closing_capex",
        "perm_create_bodr",
        "perm_approve_bodr",
        "perm_create_price",
        "perm_approve_price",
        "perm_export_data",
        "perm_access_portal",
        "perm_manage_users",
        "perm_manage_settings",
        "perm_manage_config",
      ]);
      return;
    }

    try {
      const rps: ApiRolePermission[] = await api.getRolePermissions();
      const userRoleId = (user as any).role_id?.toString();
      const match = rps.find(
        (rp: ApiRolePermission) =>
          (userRoleId && rp.role_id?.toString() === userRoleId) ||
          (rp.kode_role && rp.kode_role.toLowerCase().trim() === roleName) ||
          (rp.nama_role && rp.nama_role.toLowerCase().trim() === roleName)
      );
      if (match && Array.isArray(match.permissions)) {
        setUserPermissions(match.permissions);
      } else {
        setUserPermissions([]);
      }
    } catch {
      setUserPermissions([]);
    }
  }, []);

  const refreshProposals = useCallback(async () => {
    setLoadingProposals(true);
    try {
      // Silent automatic real-time sync with BODR in background
      api.syncFromBodr().catch(() => {});
      const data = await getProposals();
      if (Array.isArray(data)) {
        setProposals(data);
      }
    } catch (err) {
      console.error("Failed to load proposals:", err);
    } finally {
      setLoadingProposals(false);
    }
  }, []);

  useEffect(() => {
    const user = getCurrentUser();
    setActiveRole(getActiveRole());
    setCurrentUser(user);
    setMounted(true);

    document.documentElement.classList.remove("dark");

    refreshPermissions(user);
    refreshProposals();
  }, [refreshPermissions, refreshProposals]);

  const hasPermission = useCallback(
    (permCode: string): boolean => {
      if (!currentUser) return false;
      const role = (currentUser.role || "").toLowerCase().trim();
      const uname = (currentUser.username || "").toLowerCase().trim();
      if (
        role === "admin" ||
        uname === "admin" ||
        role === "administrator" ||
        role === "superadmin" ||
        (currentUser as any).is_admin === true
      ) {
        return true;
      }
      if (userPermissions.includes("ALL_ACCESS")) return true;
      return userPermissions.includes(permCode);
    },
    [currentUser, userPermissions]
  );

  const hasRole = useCallback(
    (...roleCodes: string[]): boolean => {
      if (!currentUser) return false;
      const role = (currentUser.role || "").toLowerCase().trim();
      const uname = (currentUser.username || "").toLowerCase().trim();
      if (
        role === "admin" ||
        uname === "admin" ||
        role === "administrator" ||
        role === "superadmin" ||
        (currentUser as any).is_admin === true
      ) {
        return true;
      }
      return roleCodes.some((rc) => role === rc.toLowerCase().trim() || role.includes(rc.toLowerCase().trim()));
    },
    [currentUser]
  );

  const login = async (username: string, password: string): Promise<User | null> => {
    try {
      const user = await apiLogin(username, password);
      setCurrentUser(user);
      setActiveRole(user.role as UserRole);
      dbSetCurrentUser(user);
      await refreshPermissions(user);
      return user;
    } catch {
      return null;
    }
  };

  const logout = () => {
    dbSetCurrentUser(null);
    setCurrentUser(null);
    setUserPermissions([]);
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const updateUserPhoto = (photoUrl: string) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, photo_url: photoUrl };
      setCurrentUser(updatedUser);
      dbSetCurrentUser(updatedUser);
    }
  };

  const createProposal = async (proposal: {
    name: string;
    description: string;
    department: string;
    pic: string;
    estimatedCost: number;
    purpose?: string;
    investmentType?: string;
    startDate?: string;
    endDate?: string;
    attachmentName?: string;
    gateStatus?: string;
  }) => {
    await apiAddProposal(proposal);
    await refreshProposals();
  };

  const editProposal = async (id: string, data: Partial<CapexProposal>) => {
    // Optimistic UI update
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
    );
    try {
      await apiUpdateProposal(id, data);
      await refreshProposals();
    } catch (err) {
      console.error("Gagal memperbarui proposal di server:", err);
      await refreshProposals(); // Rollback
      throw err;
    }
  };

  return (
    <CapexContext.Provider
      value={{
        proposals,
        loadingProposals,
        activeRole,
        userPermissions,
        hasPermission,
        hasRole,
        createProposal,
        editProposal,
        refreshProposals,
        currentUser,
        login,
        logout,
        updateUserPhoto,
        mounted,
      }}
    >
      {children}
    </CapexContext.Provider>
  );
}

export function useCapex() {
  const context = useContext(CapexContext);
  if (!context) {
    throw new Error("useCapex must be used within a CapexProvider");
  }
  return context;
}
