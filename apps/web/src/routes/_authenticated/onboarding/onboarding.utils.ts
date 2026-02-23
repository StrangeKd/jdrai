export const WELCOME_SEEN_STORAGE_KEY = "jdrai:onboarding:welcomeSeenByUserId:v1";

function safeGetLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readWelcomeSeenMap(storage: Storage): Record<string, true> {
  const raw = storage.getItem(WELCOME_SEEN_STORAGE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, true>;
  } catch {
    return {};
  }
}

function writeWelcomeSeenMap(storage: Storage, map: Record<string, true>) {
  storage.setItem(WELCOME_SEEN_STORAGE_KEY, JSON.stringify(map));
}

export function hasSeenWelcome(userId: string | null | undefined): boolean {
  if (!userId) return false;
  const storage = safeGetLocalStorage();
  if (!storage) return false;
  const map = readWelcomeSeenMap(storage);
  return map[userId] === true;
}

export function markWelcomeSeen(userId: string | null | undefined) {
  if (!userId) return;
  const storage = safeGetLocalStorage();
  if (!storage) return;

  const map = readWelcomeSeenMap(storage);
  if (map[userId] === true) return;

  map[userId] = true;
  writeWelcomeSeenMap(storage, map);
}

export function getNoUsernameOnboardingTarget(
  userId: string | null | undefined,
): "/onboarding/welcome" | "/onboarding/profile-setup" {
  return hasSeenWelcome(userId) ? "/onboarding/profile-setup" : "/onboarding/welcome";
}

