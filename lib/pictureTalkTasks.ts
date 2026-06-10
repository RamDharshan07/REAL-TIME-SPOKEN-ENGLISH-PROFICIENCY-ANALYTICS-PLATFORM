export type PictureTalkTask = {
  id: string;
  title: string;
  /** Short coaching line — what to try to cover in 60s */
  prompt: string;
  src: string;
  alt: string;
  /** Extra vocabulary hints scored in coverage (lowercase) */
  cues: string[];
};

/**
 * Curated Unsplash scenes — stable CDN URLs (describe setting, people, action).
 */
export const PICTURE_TALK_TASKS: PictureTalkTask[] = [
  {
    id: "team-meeting",
    title: "Team collaboration",
    prompt:
      "Describe the setting, who is there, and what they might be working on.",
    src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    alt: "Colleagues gathered around a laptop in a bright office",
    cues: ["team", "laptop", "screen", "meeting", "office", "discuss", "plan", "project", "table", "work"],
  },
  {
    id: "city-street",
    title: "Busy street",
    prompt:
      "Describe the street, movement, buildings, and the overall mood of the scene.",
    src: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1200&q=80",
    alt: "A busy urban street with cars and tall buildings",
    cues: ["street", "traffic", "car", "building", "city", "urban", "crowd", "walk", "road", "skyline"],
  },
  {
    id: "mountain-lake",
    title: "Lake and peaks",
    prompt:
      "Describe the landscape, water, sky, and how the place might feel to visit.",
    src: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80",
    alt: "Calm lake reflecting mountains under a soft sky",
    cues: ["mountain", "lake", "water", "reflection", "calm", "peaceful", "nature", "sky", "peak", "shore"],
  },
  {
    id: "cafe",
    title: "Coffee bar",
    prompt:
      "Describe the space, light, objects on the counter, and what a customer might be doing.",
    src: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80",
    alt: "Espresso machine and cups in a warm coffee shop",
    cues: ["coffee", "cafe", "cup", "bar", "machine", "steam", "counter", "warm", "drink", "aroma"],
  },
  {
    id: "library",
    title: "Reading room",
    prompt:
      "Describe the shelves, lighting, and what kind of studying or reading might happen here.",
    src: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80",
    alt: "Library stacks with warm lamps and books",
    cues: ["book", "shelf", "read", "study", "library", "lamp", "quiet", "learn", "row", "page"],
  },
  {
    id: "beach",
    title: "Beach day",
    prompt:
      "Describe the sand, sea, sky, and any people or activities you imagine there.",
    src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    alt: "Palm trees and turquoise ocean under a clear sky",
    cues: ["beach", "ocean", "sand", "wave", "palm", "swim", "sun", "coast", "blue", "relax"],
  },
  {
    id: "market",
    title: "Outdoor market",
    prompt:
      "Describe the stalls, colors, food or goods, and the sense of a busy public place.",
    src: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80",
    alt: "Fresh produce and flowers at an outdoor farmers market",
    cues: ["market", "fruit", "vegetable", "stall", "fresh", "color", "vendor", "crowd", "food", "flower"],
  },
  {
    id: "rain-urban",
    title: "Rain in the city",
    prompt:
      "Describe the weather, reflections, umbrellas or people, and the atmosphere.",
    src: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1200&q=80",
    alt: "City street in rain with lights reflecting on wet pavement",
    cues: ["rain", "wet", "umbrella", "reflection", "puddle", "evening", "light", "grey", "storm", "glow"],
  },
];

export function pictureTalkTaskTitle(imageId: string): string {
  return PICTURE_TALK_TASKS.find((t) => t.id === imageId)?.title ?? imageId;
}

export const PICTURE_TALK_DURATION_SEC = 60;
