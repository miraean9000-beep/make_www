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
const productView = document.querySelector("#product-view");
const productDetail = document.querySelector("#product-detail");
const productUnavailable = document.querySelector("#product-unavailable");
const productParam = new URLSearchParams(location.search).get("product");
const purchaseDialog = document.querySelector("#purchase-dialog");
const purchaseReview = document.querySelector("#purchase-review");
const purchaseResult = document.querySelector("#purchase-result");
let category = "";

function showView() {
  const showSaved = productParam === null && location.hash === "#saved";
  productView.hidden = productParam === null;
  marketView.hidden = showSaved || !productView.hidden;
  savedView.hidden = !showSaved;
  const currentLink = showSaved ? savedLink : marketLink;
  const otherLink = showSaved ? marketLink : savedLink;
  currentLink.setAttribute("aria-current", "page");
  otherLink.removeAttribute("aria-current");
}

function showProduct() {
  if (productParam === null) return;
  const productUrl = `?product=${encodeURIComponent(productParam)}`;
  const link = Array.from(productGrid.querySelectorAll(".product-card-link"))
    .find((link) => link.getAttribute("href") === productUrl);
  productDetail.hidden = !link;
  productUnavailable.hidden = Boolean(link);
  if (!link) return;

  const name = link.querySelector(".product-name").textContent;
  const price = link.querySelector("strong").textContent;
  document.title = `${name} — 뚝딱마켓`;
  const image = link.querySelector(".product-image").cloneNode(true);
  image.querySelector("img:not([hidden])")?.addEventListener("error", (event) => {
    event.target.hidden = true;
    image.querySelector("svg").removeAttribute("hidden");
  }, {once: true});
  document.querySelector("#detail-image").replaceChildren(image);
  document.querySelector("#detail-title").textContent = name;
  document.querySelector("#detail-price").textContent = price;
  document.querySelector("#detail-trade").textContent = link.querySelector("small").textContent;
  document.querySelector("#detail-description").textContent = link.parentElement.querySelector(".product-description").textContent;
  document.querySelector("#purchase-summary").textContent = `${name} · ${price}`;
}

document.querySelector("#buy").addEventListener("click", () => {
  purchaseReview.hidden = false;
  purchaseResult.hidden = true;
  purchaseDialog.showModal();
});

document.querySelector("#request-purchase").addEventListener("click", () => {
  purchaseResult.hidden = false;
  purchaseReview.hidden = true;
  purchaseResult.querySelector("button").focus();
});

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
      card.querySelector("a").href = `?product=${encodeURIComponent(`listing-${listing.id}`)}`;
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
  showProduct();
}

window.addEventListener("pageshow", refreshListings);
window.addEventListener("storage", (event) => {
  if (event.key === storageKey || event.key === null) refreshListings();
});
