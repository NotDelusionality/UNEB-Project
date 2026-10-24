import {
  CircleDot,
  Construction,
  Droplets,
  GraduationCap,
  HeartPulse,
  Leaf,
  Shield,
  Trash2,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const APP_NAME = "Light Academy · Community Desk";
export const SCHOOL_NAME = "Light Academy Secondary School";
export const CASE_PREFIX = "LA-";

export const ROLES = ["member", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const REPORT_CATEGORIES = [
  "infrastructure",
  "sanitation",
  "security",
  "water_supply",
  "electricity",
  "environment",
  "health",
  "education",
  "other",
] as const;
export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const CATEGORY_META: Record<
  ReportCategory,
  { label: string; icon: LucideIcon }
> = {
  infrastructure: { label: "Infrastructure", icon: Construction },
  sanitation: { label: "Sanitation", icon: Trash2 },
  security: { label: "Security", icon: Shield },
  water_supply: { label: "Water supply", icon: Droplets },
  electricity: { label: "Electricity", icon: Zap },
  environment: { label: "Environment", icon: Leaf },
  health: { label: "Health", icon: HeartPulse },
  education: { label: "Education", icon: GraduationCap },
  other: { label: "Other", icon: CircleDot },
};

export const REPORT_STATUSES = [
  "pending",
  "under_review",
  "in_progress",
  "resolved",
  "closed",
] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

/** Statuses counted as "open" on dashboards. */
export const OPEN_STATUSES = [
  "pending",
  "under_review",
  "in_progress",
] as const satisfies readonly ReportStatus[];

/**
 * The five semantic hues survive the warm retheme; only the tints are
 * nudged warm so they sit on the cream canvas, and "closed" is rebuilt
 * from the palette's warm greys. Badge text is darkened where the hue
 * alone would miss AA on its tint (pending). All pairings verified ≥4.5:1.
 */
export const STATUS_META: Record<
  ReportStatus,
  { label: string; hex: string; tint: string; badgeClass: string }
> = {
  pending: {
    label: "Pending",
    hex: "#B45309",
    tint: "#F8EFDC",
    badgeClass: "border-[#B45309]/30 bg-[#F8EFDC] text-[#92400E]",
  },
  under_review: {
    label: "Under review",
    hex: "#0369A1",
    tint: "#E9F1F4",
    badgeClass: "border-[#0369A1]/25 bg-[#E9F1F4] text-[#0369A1]",
  },
  in_progress: {
    label: "In progress",
    hex: "#4338CA",
    tint: "#ECEDF8",
    badgeClass: "border-[#4338CA]/25 bg-[#ECEDF8] text-[#4338CA]",
  },
  resolved: {
    label: "Resolved",
    hex: "#047857",
    tint: "#E9F2EA",
    badgeClass: "border-[#047857]/25 bg-[#E9F2EA] text-[#047857]",
  },
  closed: {
    label: "Closed",
    hex: "#57534E",
    tint: "#EAE6DE",
    badgeClass: "border-[#57534E]/30 bg-[#EAE6DE] text-[#57534E]",
  },
};

/**
 * Warm rust ramp for categorical charts (§12.5). Sequential dark→light:
 * identity is carried by axis labels, so the ramp only has to stay
 * distinct and ≥3:1 against the card surface, which every step does.
 */
export const CHART_RAMP = [
  "#431407",
  "#591D0B",
  "#6F260E",
  "#853012",
  "#9B3915",
  "#B04019",
  "#C4451F",
  "#CE5731",
  "#D76A44",
] as const;
