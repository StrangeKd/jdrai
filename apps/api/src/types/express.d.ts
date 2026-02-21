import type { UserDTO } from "@jdrai/shared";

declare global {
  namespace Express {
    interface Request {
      user?: UserDTO;
    }
  }
}
