import { UserRole } from "@prisma/client";
import { ValidationError } from "../../../core/errors/AppError";
import { OAuthService } from "../services/OAuthService";
import { OAuthAccountRepository } from "../repositories/OAuthAccountRepository";
import { AuthService } from "../services/AuthService";

jest.mock("../repositories/OAuthAccountRepository");
jest.mock("../services/AuthService");

describe("OAuthService", () => {
  let oauthService: OAuthService;
  let mockOAuthRepository: jest.Mocked<OAuthAccountRepository>;
  let mockAuthService: jest.Mocked<AuthService>;

  const profile = {
    provider: "google" as const,
    providerAccountId: "google-123",
    email: "oauth@example.com",
    name: "OAuth User",
  };

  const authResult = {
    user: {
      id: 1,
      username: "oauth",
      email: "oauth@example.com",
      phone: null,
      role: UserRole.USER,
      coinBalance: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    accessToken: {
      token: "access-token",
      expiresIn: "15m",
    },
    refreshToken: "refresh-token",
  };

  beforeEach(() => {
    mockOAuthRepository = {
      findByProvider: jest.fn(),
      link: jest.fn(),
      findUserByEmail: jest.fn(),
      createUserFromOAuth: jest.fn(),
      isUsernameTaken: jest.fn(),
    } as unknown as jest.Mocked<OAuthAccountRepository>;

    mockAuthService = {
      issueTokens: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    oauthService = new OAuthService(mockOAuthRepository, mockAuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should issue tokens for an existing linked OAuth account", async () => {
    mockOAuthRepository.findByProvider.mockResolvedValue({
      id: 10,
      provider: "google",
      providerAccountId: "google-123",
      userId: 1,
      createdAt: new Date(),
      user: authResult.user,
    } as any);
    mockAuthService.issueTokens.mockResolvedValue(authResult);

    const result = await oauthService.linkOrCreateUser(profile);

    expect(result).toBe(authResult);
    expect(mockAuthService.issueTokens).toHaveBeenCalledWith(authResult.user);
    expect(mockOAuthRepository.link).not.toHaveBeenCalled();
  });

  it("should link OAuth account to an existing user by email", async () => {
    mockOAuthRepository.findByProvider.mockResolvedValue(null);
    mockOAuthRepository.findUserByEmail.mockResolvedValue(authResult.user as any);
    mockAuthService.issueTokens.mockResolvedValue(authResult);

    const result = await oauthService.linkOrCreateUser(profile);

    expect(result).toBe(authResult);
    expect(mockOAuthRepository.link).toHaveBeenCalledWith(1, profile);
    expect(mockOAuthRepository.createUserFromOAuth).not.toHaveBeenCalled();
  });

  it("should create a new user when no account or email match exists", async () => {
    mockOAuthRepository.findByProvider.mockResolvedValue(null);
    mockOAuthRepository.findUserByEmail.mockResolvedValue(null);
    mockOAuthRepository.isUsernameTaken.mockResolvedValue(false);
    mockOAuthRepository.createUserFromOAuth.mockResolvedValue(authResult.user as any);
    mockAuthService.issueTokens.mockResolvedValue(authResult);

    const result = await oauthService.linkOrCreateUser(profile);

    expect(result).toBe(authResult);
    expect(mockOAuthRepository.createUserFromOAuth).toHaveBeenCalledWith(
      profile,
      "oauth",
    );
    expect(mockOAuthRepository.link).toHaveBeenCalledWith(1, profile);
  });

  it("should reject profiles without email", async () => {
    await expect(
      oauthService.linkOrCreateUser({
        ...profile,
        email: "",
      }),
    ).rejects.toThrow(ValidationError);
  });
});
