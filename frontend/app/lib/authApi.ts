import { request, STORAGE_KEY_USER } from "./client";
import { User, UserRole } from "./types";

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

// ── Auth & Users ─────────────────────────────────────────────────────────────

export async function loginUser(username: string, password?: string): Promise<User> {
  const user = await request<User>("/users/login", {
    method: "POST",
    body: JSON.stringify({ username, password: password || "" })
  });
  setCurrentUser(user);
  return user;
}

export async function getUsers(): Promise<User[]> {
  return request<User[]>("/users");
}

export async function getUser(id: string): Promise<User> {
  return request<User>(`/users/${id}`);
}

export async function addUser(data: Partial<User>): Promise<User> {
  return request<User>("/users", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  return request<User>(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export async function deleteUser(id: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/users/${id}`, {
    method: "DELETE"
  });
}
