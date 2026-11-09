import {readListings, storageKey} from "./listing-storage.js";

const savedListings = document.querySelector("#saved-listings");
const listingsStatus = document.querySelector("#listings-status");
const marketView = document.querySelector("#market-view");
const savedView = document.querySelector("#saved-view");
const marketLink = document.querySelector("#market-link");
const savedLink = document.querySelector("#saved-link");
const search = document.querySelector("#product-search");
const filters = document.querySelectorAll("[data-category]");
const productGrid = document.querySelector("#product-grid");
const productTemplate = document.querySelector("#registered-product");
const productCount = document.querySelector("#product-count");
const noProducts = document.querySelector("#no-products");
let category = "";

function showView() {
  const showSaved = location.hash === "#saved";
  marketView.hidden = showSaved;
  savedView.hidden = !showSaved;
  const currentLink = showSaved ? savedLink : marketLink;
  const otherLink = showSaved ? marketLink : savedLink;
  currentLink.setAttribute("aria-current", "page");
  otherLink.removeAttribute("aria-current");
}

function filterProducts() {
  const query = search.value.trim().toLowerCase();
  let visible = 0;
  for (const product of productGrid.querySelectorAll("[data-product]")) {
    const keywords = product.dataset.product.toLowerCase();
    product.hidden = !keywords.includes(category) || !keywords.includes(query);
    if (!product.hidden) visible++;
  }
  productCount.textContent = `${visible}개`;
  noProducts.hidden = visible > 0;
}

for (const filter of filters) {
  filter.addEventListener("click", () => {
    category = filter.dataset.category;
    for (const button of filters) button.setAttribute("aria-pressed", String(button === filter));
    filterProducts();
  });
}
search.addEventListener("input", filterProducts);
window.addEventListener("hashchange", showView);
showView();

function refreshListings() {
  for (const card of productGrid.querySelectorAll(".registered-product")) card.remove();
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
    productGrid.prepend(...listings.map((listing) => {
      const card = productTemplate.content.firstElementChild.cloneNode(true);
      if (typeof listing.photoUrl === "string" && listing.photoUrl.startsWith("data:image/jpeg;base64,")) {
        const image = card.querySelector("img");
        const placeholder = card.querySelector("svg");
        image.addEventListener("error", () => {
          image.hidden = true;
          placeholder.removeAttribute("hidden");
        }, {once: true});
        image.src = listing.photoUrl;
        image.hidden = false;
        placeholder.setAttribute("hidden", "");
      }
      card.dataset.product = listing.title;
      card.querySelector(".product-name").textContent = listing.title;
      card.querySelector("strong").textContent = listing.price || "가격 미입력";
      card.querySelector("small").textContent = listing.delivery || "내 등록 상품";
      card.querySelector("p").textContent = listing.body;
      return card;
    }));
    listingsStatus.textContent = "저장한 판매글이 아직 없어요.";
    listingsStatus.hidden = listings.length > 0;
  } catch {
    savedListings.replaceChildren();
    listingsStatus.hidden = false;
    listingsStatus.textContent = "이 브라우저에서 저장한 판매글을 불러오지 못했어요.";
  }
  filterProducts();
}

window.addEventListener("pageshow", refreshListings);
window.addEventListener("storage", (event) => {
  if (event.key === storageKey || event.key === null) refreshListings();
});
