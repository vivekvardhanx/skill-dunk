import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export function isAdminConfigured() {
  return Boolean(process.env.SKILL_DUNK_ADMIN_TOKEN && process.env.SKILL_DUNK_ADMIN_TOKEN.length >= 32);
}

export function isAuthorizedAdmin(request: NextRequest) {
  const expected = process.env.SKILL_DUNK_ADMIN_TOKEN;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || expected.length < 32 || !provided) return false;

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);
}
