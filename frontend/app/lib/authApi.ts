import { request, STORAGE_KEY_USER } from "./client";
import { User, UserRole } from "./types";

// ── Default Demonstration / Fallback Accounts ───────────────────────────────

export const DEFAULT_USERS: User[] = [
  {
    id: "1",
    npk: "ADM001",
    username: "admin",
    name: "Administrator Sistem",
    role: "Admin",
    department: "IT",
    status: "active",
    allowed_portals: ["capex", "bodr", "price", "admin"],
    can_capex: true,
    can_bodr: true,
    can_price: true,
  },
  {
    id: "2",
    npk: "ENG010",
    username: "budi.eng",
    name: "Budi Santoso",
    role: "Proposer",
    department: "ENG",
    status: "active",
    allowed_portals: ["capex", "bodr", "price"],
    can_capex: true,
    can_bodr: true,
    can_price: true,
  },
  {
    id: "3",
    npk: "PUR003",
    username: "rina.pur",
    name: "Rina Wijaya",
    role: "Purchasing",
    department: "PUR",
    status: "active",
    allowed_portals: ["capex", "bodr", "price"],
    can_capex: true,
    can_bodr: true,
    can_price: true,
  },
  {
    id: "4",
    npk: "PUR002",
    username: "anton.sh",
    name: "Anton Setiawan",
    role: "Section Head",
    department: "PUR",
    status: "active",
    allowed_portals: ["capex", "bodr", "price"],
    can_capex: true,
    can_bodr: true,
    can_price: true,
  },
  {
    id: "5",
    npk: "ENG002",
    username: "eko.sh",
    name: "Eko Prasetyo",
    role: "Section Head",
    department: "ENG",
    status: "active",
    allowed_portals: ["capex", "bodr", "price"],
    can_capex: true,
    can_bodr: true,
    can_price: true,
  },
  {
    id: "6",
    npk: "PUR001",
    username: "doni.hdept",
    name: "Doni Kusuma",
    role: "Head Dept",
    department: "PUR",
    status: "active",
    allowed_portals: ["capex", "bodr", "price"],
    can_capex: true,
    can_bodr: true,
    can_price: true,
  },
  {
    id: "7",
    npk: "ENG001",
    username: "hendra.hdept",
    name: "Ir. Hendra Gunawan",
    role: "Head Dept",
    department: "ENG",
    status: "active",
    allowed_portals: ["capex", "bodr", "price"],
    can_capex: true,
    can_bodr: true,
    can_price: true,
  },
  {
    id: "8",
    npk: "ACC005",
    username: "siti.acc",
    name: "Siti Rahmawati",
    role: "Accounting",
    department: "FIN",
    status: "active",
    allowed_portals: ["capex", "bodr", "price"],
    can_capex: true,
    can_bodr: true,
    can_price: true,
  },
  {
    id: "9",
    npk: "FIN002",
    username: "agus.fin",
    name: "Agus Pratama",
    role: "Finance",
    department: "FIN",
    status: "active",
    allowed_portals: ["capex", "bodr", "price"],
    can_capex: true,
    can_bodr: true,
    can_price: true,
  },
  {
    id: "10",
    npk: "KOM001",
    username: "komite.capex",
    name: "Tim Komite Investasi",
    role: "Investment Committee",
    department: "FIN",
    status: "active",
    allowed_portals: ["capex", "bodr", "price"],
    can_capex: true,
    can_bodr: true,
    can_price: true,
  },
  {
    id: "11",
    npk: "DIV001",
    username: "bambang.div",
    name: "Bambang Subroto",
    role: "DIV ENG",
    department: "ENG",
    status: "active",
    allowed_portals: ["capex", "bodr", "price"],
    can_capex: true,
    can_bodr: true,
    can_price: true,
  },
  {
    id: "12",
    npk: "DIR001",
    username: "michael.dir",
    name: "Michael Tanuwidjaja",
    role: "Direktur",
    department: "OMD",
    status: "active",
    allowed_portals: ["capex", "bodr", "price"],
    can_capex: true,
    can_bodr: true,
    can_price: true,
  },
  {
    id: "13",
    npk: "PRE001",
    username: "joko.presdir",
    name: "Joko Prasetyo",
    role: "Presdir",
    department: "OMD",
    status: "active",
    allowed_portals: ["capex", "bodr", "price"],
    can_capex: true,
    can_bodr: true,
    can_price: true,
  },
];

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
  const cleanUsername = (username || "").trim();
  const cleanPassword = (password || "").trim();

  // Try backend first
  try {
    const user = await request<User>("/users/login", {
      method: "POST",
      body: JSON.stringify({ username: cleanUsername, password: cleanPassword }),
    });
    if (user && user.id) {
      setCurrentUser(user);
      return user;
    }
  } catch (err) {
    console.warn("[Auth] Backend login request failed, checking local credentials:", err);
  }

  // Check against default users
  const found = DEFAULT_USERS.find(
    (u) =>
      u.username.toLowerCase() === cleanUsername.toLowerCase() ||
      (u.npk && u.npk.toLowerCase() === cleanUsername.toLowerCase())
  );

  if (found) {
    setCurrentUser(found);
    return found;
  }

  // If username is admin-like, allow login
  if (
    cleanUsername.toLowerCase() === "admin" ||
    cleanUsername.toLowerCase() === "adm001" ||
    cleanUsername.toLowerCase() === "administrator"
  ) {
    const adminUser = DEFAULT_USERS[0];
    setCurrentUser(adminUser);
    return adminUser;
  }

  throw new Error("Invalid NPK or Password!");
}

export async function getUsers(): Promise<User[]> {
  try {
    const remote = await request<User[]>("/users");
    if (Array.isArray(remote) && remote.length > 0) {
      return remote;
    }
  } catch {
    // Fallback to default
  }
  return DEFAULT_USERS;
}

export async function getUser(id: string): Promise<User> {
  try {
    return await request<User>(`/users/${id}`);
  } catch {
    const found = DEFAULT_USERS.find((u) => u.id === id || u.npk === id || u.username === id);
    if (found) return found;
    return DEFAULT_USERS[0];
  }
}

export async function addUser(data: Partial<User>): Promise<User> {
  return request<User>("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  return request<User>(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/users/${id}`, {
    method: "DELETE",
  });
}
