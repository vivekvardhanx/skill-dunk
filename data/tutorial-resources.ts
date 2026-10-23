export type TutorialDifficulty = "Beginner" | "Intermediate" | "Advanced";

type TutorialResourceBase = {
  resourceId: string;
  skillSlug: string;
  title: string;
  channelName?: string;
  canonicalUrl: string;
  difficulty: TutorialDifficulty;
  durationSeconds?: number;
  language?: string;
  learningOutcome: string;
  verificationStatus?: "verified" | "unverified";
};

export type VideoTutorialResource = TutorialResourceBase & {
  type: "video";
  videoId: string;
  playlistId?: never;
};

export type PlaylistTutorialResource = TutorialResourceBase & {
  type: "playlist";
  playlistId: string;
  videoId?: never;
};

export type TutorialResource = VideoTutorialResource | PlaylistTutorialResource;

export const tutorialResources: TutorialResource[] = [
  {
    resourceId: "yt-video-coin-roll-52kards",
    skillSlug: "coin-roll",
    type: "video",
    title: "Coin Trick: How to Roll a Coin Across Your Knuckles [HD]",
    channelName: "52Kards",
    canonicalUrl: "https://www.youtube.com/watch?v=wbokdZh7_Gg",
    videoId: "wbokdZh7_Gg",
    difficulty: "Beginner",
    durationSeconds: 323,
    learningOutcome: "Follow a visual walkthrough of the coin roll across the knuckles.",
    verificationStatus: "unverified",
  },
  {
    resourceId: "yt-video-charlier-school-of-cardistry",
    skillSlug: "charlier-cut",
    type: "video",
    title: "Cardistry for Beginners: One-handed Cuts - Charlier Cut Tutorial",
    channelName: "School Of Cardistry",
    canonicalUrl: "https://www.youtube.com/watch?v=YdBdW0OlLpQ",
    videoId: "YdBdW0OlLpQ",
    difficulty: "Beginner",
    durationSeconds: 85,
    learningOutcome: "Follow a beginner demonstration of the one-handed Charlier cut.",
    verificationStatus: "unverified",
  },
  {
    resourceId: "yt-video-three-ball-circus-made-simple",
    skillSlug: "three-ball-juggling",
    type: "video",
    title: "Learn to juggle 3 balls! (Beginners tutorial)",
    channelName: "Circus Made Simple",
    canonicalUrl: "https://www.youtube.com/watch?v=dRRLJdOJxpQ",
    videoId: "dRRLJdOJxpQ",
    difficulty: "Beginner",
    durationSeconds: 429,
    learningOutcome: "Watch a beginner progression toward a three-ball juggling pattern.",
    verificationStatus: "unverified",
  },
  {
    resourceId: "yt-video-beatbox-btk-binibining-beats",
    skillSlug: "beatboxing-basics",
    type: "video",
    title: "How to - Basic Beatbox Tutorial - B T K - Binibining Beats",
    channelName: "Binibining Beats",
    canonicalUrl: "https://www.youtube.com/watch?v=Bfmv3kTmYR8",
    videoId: "Bfmv3kTmYR8",
    difficulty: "Beginner",
    durationSeconds: 432,
    learningOutcome: "Learn the B, T, and K sounds as a starting beatbox pattern.",
    verificationStatus: "unverified",
  },
  {
    resourceId: "yt-video-morse-alphabet-castlesaga",
    skillSlug: "morse-code",
    type: "video",
    title: "2. NEVER FORGET AGAIN! Morse Code Alphabet Exercise (with Sound and mnemonics)",
    channelName: "Castlesaga",
    canonicalUrl: "https://www.youtube.com/watch?v=7kNITQOhmzk",
    videoId: "7kNITQOhmzk",
    difficulty: "Beginner",
    durationSeconds: 287,
    learningOutcome: "Practise recognizing Morse code letters with sound and mnemonic cues.",
    verificationStatus: "unverified",
  },
  {
    resourceId: "yt-video-origami-crane-easy-paper-origami",
    skillSlug: "origami-crane",
    type: "video",
    title: "How To Make a Paper Crane - Origami Crane Easy - Step by Step Tutorial",
    channelName: "Easy Paper Origami",
    canonicalUrl: "https://www.youtube.com/watch?v=GC_Szxdqh2Y",
    videoId: "GC_Szxdqh2Y",
    difficulty: "Beginner",
    durationSeconds: 401,
    learningOutcome: "Follow the folds for a traditional paper crane from a square sheet.",
    verificationStatus: "unverified",
  },
];

const videoIdPattern = /^[A-Za-z0-9_-]{11}$/;
const playlistIdPattern = /^[A-Za-z0-9_-]{10,128}$/;

export function isValidTutorialResource(resource: TutorialResource): boolean {
  try {
    const url = new URL(resource.canonicalUrl);
    if (url.protocol !== "https:" || !["youtube.com", "www.youtube.com"].includes(url.hostname)) return false;

    if (resource.type === "video") {
      return videoIdPattern.test(resource.videoId)
        && url.pathname === "/watch"
        && url.searchParams.get("v") === resource.videoId;
    }

    return playlistIdPattern.test(resource.playlistId)
      && url.pathname === "/playlist"
      && url.searchParams.get("list") === resource.playlistId;
  } catch {
    return false;
  }
}

export function getYouTubeEmbedUrl(resource: TutorialResource): string | null {
  if (!isValidTutorialResource(resource)) return null;

  const parameters = new URLSearchParams({ controls: "1", autoplay: "0", playsinline: "1", rel: "0" });
  if (resource.type === "video") {
    return `https://www.youtube-nocookie.com/embed/${resource.videoId}?${parameters}`;
  }
  parameters.set("list", resource.playlistId);
  return `https://www.youtube-nocookie.com/embed/videoseries?${parameters}`;
}

export function getYouTubeThumbnailUrl(resource: VideoTutorialResource): string | null {
  if (!isValidTutorialResource(resource)) return null;
  return `https://i.ytimg.com/vi/${resource.videoId}/hqdefault.jpg`;
}

export function getTutorialResources(skillSlug: string): TutorialResource[] {
  return tutorialResources.filter((resource) => resource.skillSlug === skillSlug && isValidTutorialResource(resource));
}