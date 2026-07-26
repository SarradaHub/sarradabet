import type { SeedRole } from "./seed";

let currentRole: SeedRole = "user";

export function setCurrentRole(role: SeedRole): void {
  currentRole = role;
}

export function getCurrentRole(): SeedRole {
  return currentRole;
}
