export const storageKey = "used-listing-drafts";

export function readListings() {
  return JSON.parse(localStorage.getItem(storageKey) ?? "[]");
}
