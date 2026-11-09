import {readListings, storageKey} from "./listing-storage.js";

const savedListings = document.querySelector("#saved-listings");
const status = document.querySelector("#listings-status");

function refreshListings() {
  try {
    const listings = readListings();
    savedListings.replaceChildren(...listings.map((listing) => {
      const entry = document.createElement("details");
      entry.className = "saved-listing";
      const heading = document.createElement("summary");
      heading.textContent = listing.title;
      const content = document.createElement("p");
      content.textContent = listing.body;
      entry.append(heading, content);
      return entry;
    }));
    status.textContent = "저장한 판매글이 아직 없어요.";
    status.hidden = listings.length > 0;
  } catch {
    savedListings.replaceChildren();
    status.hidden = false;
    status.textContent = "이 브라우저에서 저장한 판매글을 불러오지 못했어요.";
  }
}

window.addEventListener("pageshow", refreshListings);
window.addEventListener("storage", (event) => {
  if (event.key === storageKey || event.key === null) refreshListings();
});
