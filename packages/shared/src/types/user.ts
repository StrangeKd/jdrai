export interface UserDTO {
  id: string;
  email: string;
  emailVerified: boolean;
  username: string | null; // null until onboarding E6
  role: "user" | "admin";
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface UserCreateInput {
  email: string;
  password: string;
  // No username — collected at onboarding E6
}

export interface UserLoginInput {
  email: string;
  password: string;
}
