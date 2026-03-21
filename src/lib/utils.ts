import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getVibeLabel(score: number): {
  label: string;
  labelTagalog: string;
  color: string;
} {
  if (score <= 20) {
    return {
      label: "SUPER LEGIT",
      labelTagalog: "CHILL NA CHILL!",
      color: "text-vibe-safe",
    };
  } else if (score <= 40) {
    return {
      label: "MOSTLY SAFE",
      labelTagalog: "OKAY LANG 'TO",
      color: "text-green-400",
    };
  } else if (score <= 60) {
    return {
      label: "NEEDS CHECKING",
      labelTagalog: "HMMMM... VERIFY MO MUNA",
      color: "text-vibe-caution",
    };
  } else if (score <= 80) {
    return {
      label: "SUSPICIOUS",
      labelTagalog: "MEDYO SUS 'TO!",
      color: "text-orange-400",
    };
  } else {
    return {
      label: "FAKE/SCAM ALERT",
      labelTagalog: "SUS NA SUS! INGAT!",
      color: "text-vibe-danger",
    };
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function generateShareText(score: number, label: string): string {
  const statusPre = score <= 40 ? "[SAFE]" : score <= 60 ? "[VERIFY]" : "[SCAM ALERT]";
  return `${statusPre} VibeCheck PH says: "${label}" (Score: ${score}/100)\n\nPaste mo rin sa VibeCheck PH!\n#VibeCheckPH #DigitalLiteracyPH`;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
