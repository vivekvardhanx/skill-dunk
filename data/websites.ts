export const websiteCategories = [
  "Fun & Games",
  "Brain Games & Puzzles",
  "Education & Learning",
  "Interactive Science",
  "Psychology & Neuroscience",
  "Creative Experiments",
  "AI & Technology",
  "Explore the World",
  "Music & Sound",
  "Weird & Wonderful",
] as const;

export type WebsiteCategory = (typeof websiteCategories)[number];
export type WebsitePricing = "free" | "freemium" | "paid" | "unknown";
export type WebsiteVerification = "verified" | "pending";

export type WebsiteListing = {
  id: string;
  name: string;
  url: string;
  description: string;
  category: WebsiteCategory;
  tags: string[];
  minutes: number;
  pricing: WebsitePricing;
  verification: WebsiteVerification;
  lastCheckedAt: string | null;
  status: "approved" | "pending" | "rejected";
};

export const websites: WebsiteListing[] = [
  {
    id: "google-arts-culture",
    name: "Google Arts & Culture",
    url: "https://artsandculture.google.com/",
    description: "Browse artworks and cultural collections through interactive exhibits, visual searches, and playful experiments.",
    category: "Education & Learning",
    tags: ["art", "culture", "museums", "creative"],
    minutes: 10,
    pricing: "free",
    verification: "verified",
    lastCheckedAt: "2026-10-22",
    status: "approved",
  },
  {
    id: "nasa-eyes",
    name: "NASA Eyes",
    url: "https://eyes.nasa.gov/",
    description: "Explore NASA missions and the solar system through browser-based 3D visualizations built from NASA data.",
    category: "Interactive Science",
    tags: ["space", "astronomy", "NASA", "3D"],
    minutes: 15,
    pricing: "free",
    verification: "verified",
    lastCheckedAt: "2026-10-22",
    status: "approved",
  },
  {
    id: "radio-garden",
    name: "Radio Garden",
    url: "https://radio.garden/",
    description: "Explore live radio stations around the world by rotating a globe and choosing a place to listen.",
    category: "Explore the World",
    tags: ["radio", "music", "travel", "audio"],
    minutes: 10,
    pricing: "unknown",
    verification: "verified",
    lastCheckedAt: "2026-10-22",
    status: "approved",
  },
  {
    id: "window-swap",
    name: "WindowSwap",
    url: "https://www.window-swap.com/",
    description: "Open a window view from somewhere else in the world and take a quiet virtual break.",
    category: "Explore the World",
    tags: ["travel", "views", "relaxing"],
    minutes: 10,
    pricing: "unknown",
    verification: "verified",
    lastCheckedAt: "2026-10-22",
    status: "approved",
  },
  {
    id: "chrome-music-lab",
    name: "Chrome Music Lab",
    url: "https://musiclab.chromeexperiments.com/",
    description: "Try hands-on music experiments that make rhythm, melody, and sound easy to explore.",
    category: "Music & Sound",
    tags: ["music", "sound", "experiments", "creative"],
    minutes: 10,
    pricing: "free",
    verification: "verified",
    lastCheckedAt: "2026-10-22",
    status: "approved",
  },
  {
    id: "the-useless-web",
    name: "The Useless Web",
    url: "https://theuselessweb.com/",
    description: "Take a random detour to an unusual website from a playful one-click launcher.",
    category: "Weird & Wonderful",
    tags: ["random", "surprise", "oddities"],
    minutes: 5,
    pricing: "unknown",
    verification: "verified",
    lastCheckedAt: "2026-10-22",
    status: "approved",
  },
  {
    id: "quick-draw",
    name: "Quick, Draw!",
    url: "https://quickdraw.withgoogle.com/",
    description: "Draw a prompt before time runs out while a neural network tries to guess what you are sketching.",
    category: "Brain Games & Puzzles",
    tags: ["drawing", "AI", "game", "quick"],
    minutes: 5,
    pricing: "free",
    verification: "verified",
    lastCheckedAt: "2026-10-22",
    status: "approved",
  },
  {
    id: "teachable-machine",
    name: "Teachable Machine",
    url: "https://teachablemachine.withgoogle.com/",
    description: "Train a simple model to recognize examples from images, sounds, or poses using a browser-based tool.",
    category: "AI & Technology",
    tags: ["AI", "machine learning", "creative", "experiment"],
    minutes: 15,
    pricing: "free",
    verification: "verified",
    lastCheckedAt: "2026-10-22",
    status: "approved",
  },
  {
    id: "phet-interactive-simulations",
    name: "PhET Interactive Simulations",
    url: "https://phet.colorado.edu/",
    description: "Experiment with interactive simulations for science and mathematics from the University of Colorado Boulder.",
    category: "Interactive Science",
    tags: ["science", "math", "simulations", "learning"],
    minutes: 15,
    pricing: "free",
    verification: "verified",
    lastCheckedAt: "2026-10-22",
    status: "approved",
  },
  {
    id: "whats-a-brain",
    name: "What's a Brain?",
    url: "https://whatisabrain.com/",
    description: "Explore real connectomics data through interactive experiences that zoom from a brain to individual neurons and synapses.",
    category: "Psychology & Neuroscience",
    tags: ["brain", "neuroscience", "interactive", "education"],
    minutes: 15,
    pricing: "free",
    verification: "verified",
    lastCheckedAt: "2026-10-22",
    status: "approved",
  },
];

export function isApprovedWebsite(value: unknown): value is WebsiteListing {
  if (!value || typeof value !== "object") return false;
  const listing = value as Partial<WebsiteListing>;
  if (listing.status !== "approved" || listing.verification !== "verified") return false;
  if (typeof listing.url !== "string" || listing.url.length > 2048) return false;
  if (typeof listing.id !== "string" || !listing.id || typeof listing.name !== "string" || !listing.name.trim() || listing.name.length > 80) return false;
  if (typeof listing.description !== "string" || !listing.description.trim() || listing.description.length > 500) return false;
  if (!Array.isArray(listing.tags) || !listing.tags.every((tag) => typeof tag === "string" && tag.length <= 40)) return false;
  if (typeof listing.minutes !== "number" || !Number.isInteger(listing.minutes) || listing.minutes < 1 || listing.minutes > 180) return false;
  if (!["free", "freemium", "paid", "unknown"].includes(listing.pricing ?? "")) return false;
  if (!websiteCategories.includes(listing.category as WebsiteCategory)) return false;

  try {
    const url = new URL(listing.url);
    return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password;
  } catch {
    return false;
  }
}
