import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }

  return new TextEncoder().encode(secret);
}

export async function getAuthenticatedUserId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get("aviator_session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return typeof payload.id === "string" ? payload.id : null;
  } catch {
    return null;
  }
}

export function getAdminUserIds(): string[] {
  return (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function isAdminUserId(userId: string): boolean {
  return getAdminUserIds().includes(userId);
}
