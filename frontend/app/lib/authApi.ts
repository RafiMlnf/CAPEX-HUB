import { STORAGE_KEY_USER } from "./client";
import { User, UserRole } from "./types";
import { mockStorage } from "./mockStorage";

// ── Session Helpers ──────────────────────────────────────────────────────────

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY_USER);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  if (typeof window !== "undefined") {
    if (!user) {
      localStorage.removeItem(STORAGE_KEY_USER);
    } else {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    }
  }
}

export function getActiveRole(): UserRole {
  const u = getCurrentUser();
  if (u && u.role) {
    return u.role as UserRole;
  }
  return "Admin";
}

// ── Auth & Users (Client-side Mock Database) ─────────────────────────────────

export async function loginUser(username: string, password?: string): Promise<User> {
  const cleanUsername = username.trim().toLowerCase();
  const cleanPassword = (password || "").trim();

  const users = mockStorage.getUsers();
  const user = users.find(
    (u) =>
      (u.username || "").toLowerCase() === cleanUsername ||
      (u.npk || "").toLowerCase() === cleanUsername ||
      (u.email || "").toLowerCase() === cleanUsername
  );

  // Jika user ditemukan dan password benar (default password 'admin' atau apapun saat testing)
  if (user) {
    if (!cleanPassword || cleanPassword === "admin" || cleanPassword === user.username) {
      setCurrentUser(user);
      return user;
    }
  }

  // Khusus user 'admin' fallback otomatis
  if (cleanUsername === "admin") {
    const adminUser = users[0] || {
      id: 1,
      npk: "1001",
      name: "Administrator System",
      username: "admin",
      email: "admin@mtm.co.id",
      role: "Admin",
      department: "Management",
      department_id: 8,
      role_id: 1,
      status: "active",
      can_capex: true,
      can_bodr: true,
      can_price: true,
      can_admin: true,
      allowed_portals: ["capex", "bodr", "price", "admin"],
    };
    setCurrentUser(adminUser);
    return adminUser;
  }

  throw new Error("Invalid username or password");
}

export async function getUsers(): Promise<User[]> {
  return mockStorage.getUsers();
}

export async function getUser(id: string | number): Promise<User> {
  const users = mockStorage.getUsers();
  const found = users.find((u) => String(u.id) === String(id));
  if (!found) throw new Error("User not found");
  return found;
}

export async function addUser(data: Partial<User>): Promise<User> {
  const users = mockStorage.getUsers();
  const newId = users.length > 0 ? Math.max(...users.map((u) => Number(u.id) || 0)) + 1 : 1;
  const newUser: User = {
    id: newId,
    npk: data.npk || `NPK-${newId}`,
    name: data.name || "User Baru",
    username: data.username || `user${newId}`,
    email: data.email || `${data.username || `user${newId}`}@mtm.co.id`,
    role: data.role || "Staff",
    department: data.department || "Engineering",
    status: data.status || "active",
    can_capex: data.can_capex !== false,
    can_bodr: data.can_bodr !== false,
    can_price: data.can_price !== false,
    can_admin: data.can_admin === true,
    allowed_portals: data.allowed_portals || ["capex", "bodr"],
  };
  const updated = [...users, newUser];
  mockStorage.saveUsers(updated);
  return newUser;
}

export async function updateUser(id: string | number, data: Partial<User>): Promise<User> {
  const users = mockStorage.getUsers();
  const index = users.findIndex((u) => String(u.id) === String(id));
  if (index === -1) throw new Error("User not found");
  const updatedUser = { ...users[index], ...data };
  users[index] = updatedUser;
  mockStorage.saveUsers(users);
  return updatedUser;
}

export async function deleteUser(id: string | number): Promise<{ success: boolean }> {
  const users = mockStorage.getUsers();
  const filtered = users.filter((u) => String(u.id) !== String(id));
  mockStorage.saveUsers(filtered);
  return { success: true };
}
