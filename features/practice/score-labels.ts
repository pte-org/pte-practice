import { PEARSON_TRAIT_LABELS, SUB_SCORE_MAX_SEPARATOR } from "./constants";

/** "achieved / max" for a Pearson trait score whose maximum is known; the raw number otherwise (older results). */
export function formatSubScore(value: number, max: number | undefined): string {
  return max === undefined ? String(value) : `${value}${SUB_SCORE_MAX_SEPARATOR}${max}`;
}

/**
 * A Pearson trait key gets its rubric name ("DEVELOPMENT_STRUCTURE_COHERENCE" -> "Development, structure and
 * coherence"); any other key, including those of older results, is spelled out: "oralFluency" -> "Oral fluency".
 */
export function subScoreLabel(key: string): string {
  const pearsonLabel = PEARSON_TRAIT_LABELS[key];
  if (pearsonLabel !== undefined) {
    return pearsonLabel;
  }
  const words = key.replace(/[_-]+/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2").trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
