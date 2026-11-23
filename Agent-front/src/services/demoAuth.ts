export type DemoRole = 'doctor' | 'admin';

export interface DemoUser {
  username: string;
  employeeId: string;
  name: string;
  role: DemoRole;
}

interface DemoStaffRecord {
  id: string;
  name: string;
  status: string;
}

const SESSION_KEY = 'fjcu-demo-session';
const STAFF_KEY = 'fjcu-demo-staff';
const PASSWORD_KEY_PREFIX = 'fjcu-demo-password-';
export const DEMO_PASSWORD = 'demo123';

function getPasswordKey(username: string): string {
  return `${PASSWORD_KEY_PREFIX}${username.toLowerCase()}`;
}

function isDemoStaffActive(employeeId: string): boolean {
  const storedStaff = localStorage.getItem(STAFF_KEY);
  if (!storedStaff) return employeeId === 'D1001';

  const parsed: unknown = JSON.parse(storedStaff);
  if (!Array.isArray(parsed)) throw new Error('示範帳號資料格式錯誤');
  const staff = parsed as DemoStaffRecord[];
  return staff.some((member) => member.id === employeeId && member.status !== '停用');
}

export function readDemoSession(): DemoUser | null {
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;

  try {
    const parsed: unknown = JSON.parse(stored);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('username' in parsed) ||
      !('employeeId' in parsed) ||
      !('name' in parsed) ||
      !('role' in parsed) ||
      typeof parsed.username !== 'string' ||
      typeof parsed.employeeId !== 'string' ||
      typeof parsed.name !== 'string' ||
      (parsed.role !== 'doctor' && parsed.role !== 'admin')
    ) {
      throw new Error('示範登入狀態格式錯誤');
    }

    const user = parsed as DemoUser;
    if (user.role === 'doctor' && !isDemoStaffActive(user.employeeId)) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return user;
  } catch (error) {
    console.error('讀取登入狀態失敗:', error);
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function authenticateDemoUser(
  username: string,
  password: string,
): DemoUser | null {
  const normalizedUsername = username.trim();
  const storedPassword = sessionStorage.getItem(getPasswordKey(normalizedUsername));
  if (password !== (storedPassword ?? DEMO_PASSWORD)) return null;

  if (normalizedUsername.toLowerCase() === 'admin') {
    return {
      username: normalizedUsername,
      employeeId: 'ADMIN',
      name: '系統管理員',
      role: 'admin',
    };
  }

  if (!isDemoStaffActive(normalizedUsername)) return null;
  const storedStaff = localStorage.getItem(STAFF_KEY);
  const staff = storedStaff ? JSON.parse(storedStaff) as DemoStaffRecord[] : [];
  const name = staff.find((member) => member.id === normalizedUsername)?.name ?? '楊子孟';
  return {
    username: normalizedUsername,
    employeeId: normalizedUsername,
    name,
    role: 'doctor',
  };
}

export function saveDemoSession(user: DemoUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearDemoSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function changeDemoPassword(username: string, password: string): void {
  sessionStorage.setItem(getPasswordKey(username), password);
}

export function verifyDemoPassword(username: string, password: string): boolean {
  const storedPassword = sessionStorage.getItem(getPasswordKey(username));
  return password === (storedPassword ?? DEMO_PASSWORD);
}
