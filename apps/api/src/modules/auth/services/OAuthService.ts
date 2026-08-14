import { ValidationError } from "../../../core/errors/AppError";
import type { OAuthProfile } from "../oauth/OAuthProviderStrategy";
import { OAuthAccountRepository } from "../repositories/OAuthAccountRepository";
import { AuthService, AuthResult } from "./AuthService";

function sanitizeUsernameBase(email: string): string {
  const localPart = email.split("@")[0] ?? "user";
  const sanitized = localPart.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 40);

  return sanitized.length > 0 ? sanitized : "user";
}

export class OAuthService {
  constructor(
    private readonly oauthRepository = new OAuthAccountRepository(),
    private readonly authService = new AuthService(),
  ) {}

  async linkOrCreateUser(profile: OAuthProfile): Promise<AuthResult> {
    if (!profile.email) {
      throw new ValidationError("OAuth provider did not return an email address");
    }

    const existingAccount = await this.oauthRepository.findByProvider(profile);
    if (existingAccount) {
      return this.authService.issueTokens(existingAccount.user);
    }

    const userByEmail = await this.oauthRepository.findUserByEmail(profile.email);
    if (userByEmail) {
      await this.oauthRepository.link(userByEmail.id, profile);
      return this.authService.issueTokens(userByEmail);
    }

    const username = await this.generateUniqueUsername(profile.email);
    const user = await this.oauthRepository.createUserFromOAuth(profile, username);
    await this.oauthRepository.link(user.id, profile);

    return this.authService.issueTokens(user);
  }

  private async generateUniqueUsername(email: string): Promise<string> {
    const base = sanitizeUsernameBase(email);
    let candidate = base;
    let suffix = 0;

    while (await this.oauthRepository.isUsernameTaken(candidate)) {
      suffix += 1;
      candidate = `${base.slice(0, Math.max(1, 45 - String(suffix).length))}_${suffix}`;
    }

    return candidate;
  }
}
