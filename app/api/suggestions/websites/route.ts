import { isIP } from "node:net";
import { NextRequest, NextResponse } from "next/server";
import { websiteCategories, type WebsiteCategory } from "@/data/websites";
import { submitWebsiteSuggestion } from "@/lib/website-store";
import { readLimitedRequestBody, RequestBodyTooLargeError } from "@/lib/read-limited-request-body";

export const dynamic = "force-dynamic";

const maxBodyBytes = 8_000;
const rateLimit = new Map<string, number[]>();

function getClientKey(request: NextRequest) {
  return request.headers.get("x-real-ip")?.slice(0, 64) || "unknown";
}

function isRateLimited(key: string) {
  const now = Date.now();
  const recent = (rateLimit.get(key) ?? []).filter((timestamp) => now - timestamp < 60 * 60 * 1000);
  if (recent.length >= 3) {
    rateLimit.set(key, recent);
    return true;
  }
  recent.push(now);
  rateLimit.set(key, recent);
  if (rateLimit.size > 1_000) {
    for (const [entry, timestamps] of rateLimit) {
      if (timestamps.every((timestamp) => now - timestamp >= 60 * 60 * 1000)) rateLimit.delete(entry);
    }
  }
  return false;
}

function normalizedWebsiteUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase().replace(/\.$/, "");
    if (!["http:", "https:"].includes(url.protocol) || !host || url.username || url.password) return null;
    if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || host.startsWith("[") || isIP(host)) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBodyBytes) {
    return NextResponse.json({ error: "The submission is too large." }, { status: 413 });
  }
  if (isRateLimited(getClientKey(request))) {
    return NextResponse.json({ error: "Too many suggestions from this connection. Please try again later." }, { status: 429 });
  }

  let body: string;
  try {
    body = await readLimitedRequestBody(request, maxBodyBytes);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) return NextResponse.json({ error: "The submission is too large." }, { status: 413 });
    console.error("Unable to read website suggestion request", error);
    return NextResponse.json({ error: "Please submit valid form data." }, { status: 400 });
  }
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Please submit valid form data." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Please submit valid form data." }, { status: 400 });
  }

  const fields = payload as Record<string, unknown>;
  if (fields.company !== "") {
    return NextResponse.json({ error: "The submission could not be accepted." }, { status: 400 });
  }
  if (typeof fields.startedAt !== "number" || Date.now() - fields.startedAt < 3_000) {
    return NextResponse.json({ error: "Please take a moment to review your suggestion before submitting." }, { status: 400 });
  }

  const name = typeof fields.name === "string" ? fields.name.trim() : "";
  const description = typeof fields.description === "string" ? fields.description.trim() : "";
  const nickname = typeof fields.nickname === "string" ? fields.nickname.trim() : "";
  const url = normalizedWebsiteUrl(fields.url);
  const category = fields.category;
  const minutes = fields.minutes;

  if (!name || name.length > 80) return NextResponse.json({ error: "Enter a website name (80 characters or fewer)." }, { status: 400 });
  if (!description || description.length > 500) return NextResponse.json({ error: "Enter a description (500 characters or fewer)." }, { status: 400 });
  if (!url) return NextResponse.json({ error: "Enter a valid public website URL using HTTP or HTTPS." }, { status: 400 });
  if (typeof category !== "string" || !websiteCategories.includes(category as WebsiteCategory)) {
    return NextResponse.json({ error: "Choose a category from the list." }, { status: 400 });
  }
  if (typeof minutes !== "number" || !Number.isInteger(minutes) || minutes < 1 || minutes > 180) {
    return NextResponse.json({ error: "Choose an exploration time between 1 and 180 minutes." }, { status: 400 });
  }
  if (nickname.length > 40) return NextResponse.json({ error: "Nickname must be 40 characters or fewer." }, { status: 400 });

  try {
    await submitWebsiteSuggestion({
      name,
      url,
      description,
      category: category as WebsiteCategory,
      minutes,
      nickname,
    });
    return NextResponse.json({ message: "Your suggestion is awaiting review." }, { status: 201 });
  } catch (error) {
    console.error("Unable to persist website suggestion", error);
    return NextResponse.json({ error: "We could not save your suggestion. Please try again later." }, { status: 503 });
  }
}
