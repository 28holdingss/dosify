/** Client-side helpers matching server food tip prefix in analysis recommendations. */
export const FOOD_TIP_PREFIX = 'Food · ';

export function isFoodTimingTip(text: string): boolean {
  return text.startsWith(FOOD_TIP_PREFIX);
}

export function displayFoodTip(text: string): string {
  return text.startsWith(FOOD_TIP_PREFIX) ? text.slice(FOOD_TIP_PREFIX.length) : text;
}

export function splitRecommendations(recommendations: string[] | null | undefined): {
  foodTips: string[];
  other: string[];
} {
  const list = recommendations ?? [];
  return {
    foodTips: list.filter(isFoodTimingTip).map(displayFoodTip),
    other: list.filter((r) => !isFoodTimingTip(r)),
  };
}
