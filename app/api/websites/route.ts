import { NextResponse } from "next/server";
import { websites } from "@/data/websites";
import { listApprovedSuggestions } from "@/lib/website-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const communityListings = await listApprovedSuggestions();
    return NextResponse.json([...websites, ...communityListings]);
  } catch (error) {
    console.error("Unable to load approved website suggestions", error);
    return NextResponse.json({ error: "The website collection is temporarily unavailable." }, { status: 503 });
  }
}
