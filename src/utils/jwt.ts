import jwt, {
  SignOptions,
  VerifyOptions,
  JwtPayload as JwtPayloadType,
} from "jsonwebtoken";
import { config } from "@/config/env";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

const getSignOptions = (expiresIn: string | number): SignOptions => ({
  expiresIn: expiresIn as any,
  issuer: "screening-api",
  audience: "screening-app",
});

const getVerifyOptions = (): VerifyOptions => ({
  issuer: "screening-api",
  audience: "screening-app",
});

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(
    payload,
    config.jwt.secret as jwt.Secret,
    getSignOptions(config.jwt.expiresIn),
  );
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(
    payload,
    config.jwt.refreshSecret as jwt.Secret,
    getSignOptions(config.jwt.refreshExpiresIn),
  );
};

export const generateTokens = (payload: JwtPayload): TokenResponse => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    expiresIn: config.jwt.expiresIn,
  };
};

export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(
      token,
      config.jwt.secret as jwt.Secret,
      getVerifyOptions(),
    ) as JwtPayloadType;

    return decoded as unknown as JwtPayload;
  } catch (error) {
    throw new Error("Invalid or expired access token");
  }
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(
      token,
      config.jwt.refreshSecret as jwt.Secret,
      getVerifyOptions(),
    ) as JwtPayloadType;

    return decoded as unknown as JwtPayload;
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
};

export const extractTokenFromHeader = (
  authHeader: string | undefined,
): string | null => {
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return null;
  }
  return authHeader.slice(7).trim();
};

export const decodeToken = (token: string): any => {
  return jwt.decode(token);
};
