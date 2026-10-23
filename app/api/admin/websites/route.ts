import { NextRequest, NextResponse } from "next/server";
import { isAdminConfigured, isAuthorizedAdmin } from "@/lib/admin-auth";
import { listApprovedSuggestions, listPendingSuggestions, moderateWebsiteSuggestion, removeApprovedSuggestion } from "@/lib/website-store";
import { websiteCategories, type WebsiteCategory } from "@/data/websites";
import { readLimitedRequestBody, RequestBodyTooLargeError } from "@/lib/read-limited-request-body";

export const dynamic = "force-dynamic";

function authError(request: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Admin moderation is not configured on this server." }, { status: 503 });
  }
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json({ error: "Administrator authorization is required." }, { status: 401 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const error = authError(request);
  if (error) return error;
  try {
    const [pending, approved] = await Promise.all([listPendingSuggestions(), listApprovedSuggestions()]);
    return NextResponse.json({ pending, approved: approved.filter((listing) => listing.id.startsWith("suggestion-")) });
  } catch (caught) {
    console.error("Unable to load website moderation data", caught);
    return NextResponse.json({ error: "Moderation data is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const error = authError(request);
  if (error) return error;

  let body: string;
  try {
    body = await readLimitedRequestBody(request, 4_000);
  } catch (caught) {
    if (caught instanceof RequestBodyTooLargeError) return NextResponse.json({ error: "The request is too large." }, { status: 413 });
    console.error("Unable to read website moderation request", caught);
    return NextResponse.json({ error: "The moderation request could not be read." }, { status: 400 });
  }
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Please submit valid moderation data." }, { status: 400 });
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Please submit valid moderation data." }, { status: 400 });
  }
  const fields = payload as Record<string, unknown>;
  if (typeof fields.id !== "string" || !/^[0-9a-f-]{36}$/i.test(fields.id)) {
    return NextResponse.json({ error: "Choose a valid suggestion." }, { status: 400 });
  }
  if (fields.action === "remove") {
    try {
      const removed = await removeApprovedSuggestion(fields.id);
      return removed
        ? NextResponse.json({ message: "The listing was removed." })
        : NextResponse.json({ error: "This approved listing was not found." }, { status: 404 });
    } catch (caught) {
      console.error("Unable to remove approved website suggestion", caught);
      return NextResponse.json({ error: "The listing could not be removed. Please retry." }, { status: 503 });
    }
  }
  if (fields.action !== "approve" && fields.action !== "reject") {
    return NextResponse.json({ error: "Choose approve or reject." }, { status: 400 });
  }

  const name = fields.name;
  const description = fields.description;
  const minutes = fields.minutes;
  const category = fields.category;
  if (fields.action === "approve") {
    if (typeof name !== "string" || !name.trim() || name.trim().length > 80) {
      return NextResponse.json({ error: "Enter a name no longer than 80 characters." }, { status: 400 });
    }
    if (typeof description !== "string" || !description.trim() || description.trim().length > 500) {
      return NextResponse.json({ error: "Enter a description no longer than 500 characters." }, { status: 400 });
    }
    if (typeof minutes !== "number" || !Number.isInteger(minutes) || minutes < 1 || minutes > 180) {
      return NextResponse.json({ error: "Choose an exploration time from 1 to 180 minutes." }, { status: 400 });
    }
    if (typeof category !== "string" || !websiteCategories.includes(category as WebsiteCategory)) {
      return NextResponse.json({ error: "Choose a valid category." }, { status: 400 });
    }
    if (fields.verificationConfirmed !== true) {
      return NextResponse.json({ error: "Confirm that you checked the destination and its details before approving." }, { status: 400 });
    }
  }

  try {
    const updated = await moderateWebsiteSuggestion({
      id: fields.id,
      action: fields.action,
      verified: fields.verificationConfirmed === true,
      ...(fields.action === "approve" ? {
        name: (name as string).trim(),
        description: (description as string).trim(),
        minutes: minutes as number,
        category: category as WebsiteCategory,
      } : {}),
    });
    return updated
      ? NextResponse.json({ message: fields.action === "approve" ? "Suggestion approved and published." : "Suggestion rejected." })
      : NextResponse.json({ error: "This suggestion is no longer pending or could not be approved." }, { status: 409 });
  } catch (caught) {
    console.error("Unable to save website moderation decision", caught);
    return NextResponse.json({ error: "The moderation decision could not be saved. Please retry." }, { status: 503 });
  }
}
