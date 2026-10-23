import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import type { WebsiteCategory, WebsiteListing } from "@/data/websites";
import { isApprovedWebsite } from "@/data/websites";

export type WebsiteSuggestion = {
  id: string;
  name: string;
  url: string;
  description: string;
  category: WebsiteCategory;
  minutes: number;
  nickname: string;
  status: "pending" | "approved" | "rejected" | "removed";
  submittedAt: string;
  reviewedAt: string | null;
};

type StoredWebsiteData = {
  suggestions: WebsiteSuggestion[];
  approvedWebsites: WebsiteListing[];
};

function dataDirectory() {
  return path.resolve(process.env.SKILL_DUNK_DATA_DIR || path.join(process.cwd(), ".skill-dunk-data"));
}

async function readStore(): Promise<StoredWebsiteData> {
  try {
    const content = await readFile(path.join(dataDirectory(), "websites.json"), "utf8");
    const data: unknown = JSON.parse(content);
    if (!data || typeof data !== "object" || !("suggestions" in data) || !("approvedWebsites" in data)
      || !Array.isArray(data.suggestions) || !Array.isArray(data.approvedWebsites)) {
      throw new Error("Invalid website store data");
    }
    return data as StoredWebsiteData;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return { suggestions: [], approvedWebsites: [] };
    }
    throw error;
  }
}

async function writeStore(data: StoredWebsiteData) {
  const directory = dataDirectory();
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const target = path.join(directory, "websites.json");
  const temporary = `${target}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(data, null, 2), { encoding: "utf8", mode: 0o600 });
  await rename(temporary, target);
}

let writeQueue = Promise.resolve();

async function withWriteLock<T>(operation: () => Promise<T>): Promise<T> {
  const previous = writeQueue;
  let release!: () => void;
  writeQueue = new Promise<void>((resolve) => { release = resolve; });
  await previous;
  try {
    return await operation();
  } finally {
    release();
  }
}

export function listPendingSuggestions() {
  return readStore().then((data) => data.suggestions.filter((record) => record.status === "pending"));
}

export function listApprovedSuggestions() {
  return readStore().then((data) => data.approvedWebsites.filter(isApprovedWebsite));
}

export async function submitWebsiteSuggestion(
  input: Omit<WebsiteSuggestion, "id" | "status" | "submittedAt" | "reviewedAt">,
) {
  return withWriteLock(async () => {
    const data = await readStore();
    const suggestion: WebsiteSuggestion = {
      ...input,
      id: randomUUID(),
      status: "pending",
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
    };
    data.suggestions.push(suggestion);
    await writeStore(data);
    return suggestion.id;
  });
}

export async function moderateWebsiteSuggestion(input: {
  id: string;
  action: "approve" | "reject";
  verified: boolean;
  name?: string;
  description?: string;
  category?: WebsiteCategory;
  minutes?: number;
}) {
  return withWriteLock(async () => {
    const data = await readStore();
    const index = data.suggestions.findIndex((item) => item.id === input.id && item.status === "pending");
    if (index < 0) return false;
    const suggestion = data.suggestions[index];
    const reviewedAt = new Date().toISOString();

    if (input.action === "reject") {
      data.suggestions[index] = { ...suggestion, status: "rejected", reviewedAt };
      await writeStore(data);
      return true;
    }
    if (!input.verified) return false;

    const approved: WebsiteListing = {
      id: `suggestion-${suggestion.id}`,
      name: input.name ?? suggestion.name,
      url: suggestion.url,
      description: input.description ?? suggestion.description,
      category: input.category ?? suggestion.category,
      tags: ["community suggestion"],
      minutes: input.minutes ?? suggestion.minutes,
      pricing: "unknown",
      verification: "verified",
      lastCheckedAt: reviewedAt.slice(0, 10),
      status: "approved",
    };
    if (!isApprovedWebsite(approved)) return false;
    data.approvedWebsites.push(approved);
    data.suggestions[index] = { ...suggestion, status: "approved", reviewedAt };
    await writeStore(data);
    return true;
  });
}

export async function removeApprovedSuggestion(id: string) {
  return withWriteLock(async () => {
    const data = await readStore();
    const updated = data.approvedWebsites.filter((listing) => listing.id !== `suggestion-${id}`);
    if (updated.length === data.approvedWebsites.length) return false;
    const suggestionIndex = data.suggestions.findIndex((item) => item.id === id && item.status === "approved");
    if (suggestionIndex >= 0) {
      data.suggestions[suggestionIndex] = { ...data.suggestions[suggestionIndex], status: "removed", reviewedAt: new Date().toISOString() };
    }
    data.approvedWebsites = updated;
    await writeStore(data);
    return true;
  });
}
