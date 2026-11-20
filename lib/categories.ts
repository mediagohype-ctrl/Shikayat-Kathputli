import type { LucideIcon } from "lucide-react";
import { Trash2, Droplets, Zap, Waves, Bath, Construction, Home, Wrench, HelpCircle } from "lucide-react";

export const CATEGORY_KEYS = [
  "cleanliness",
  "water",
  "electricity",
  "sewer",
  "toilet",
  "road",
  "structure_repair",
  "pipeline_repair",
  "other",
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export const CATEGORIES: { key: CategoryKey; label: string; icon: LucideIcon }[] = [
  { key: "cleanliness", label: "सफाई की समस्या", icon: Trash2 },
  { key: "water", label: "पानी की समस्या", icon: Droplets },
  { key: "electricity", label: "बिजली की समस्या", icon: Zap },
  { key: "sewer", label: "सीवर / नाली की समस्या", icon: Waves },
  { key: "toilet", label: "शौचालय की समस्या", icon: Bath },
  { key: "road", label: "सड़क / रास्ते की समस्या", icon: Construction },
  { key: "structure_repair", label: "छत / दीवार / दरवाजे की मरम्मत", icon: Home },
  { key: "pipeline_repair", label: "पाइपलाइन या अन्य रिपेयर वर्क", icon: Wrench },
  { key: "other", label: "अन्य समस्या", icon: HelpCircle },
];

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c.label]),
);
