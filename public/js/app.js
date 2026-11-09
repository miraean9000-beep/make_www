import {readListings, storageKey} from "./listing-storage.js";

if (!location.hash || location.hash === "#listings") location.replace("/listings.html");

const form = document.querySelector("#listing-form");
const submit = form.querySelector("button");
const status = document.querySelector("#status");
const title = document.querySelector("#title");
const body = document.querySelector("#body");
const draft = document.querySelector("#draft");
const checklist = document.querySelector("#checklist");
const copyStatus = document.querySelector("#copy-status");
const save = document.querySelector("#save");
const photo = document.querySelector("#photo");
let draftProduct = {};

async function preparePhoto(file) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
    throw new Error("10MB 이하의 JPG, PNG, WebP 사진을 선택해 주세요.");
  }

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 800 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  } finally {
    bitmap.close();
  }
}

function showStatus(message, error = false) {
  status.textContent = message;
  status.classList.toggle("error", error);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = Object.fromEntries(
    Array.from(new FormData(form), ([name, value]) => [name, value.trim()])
  );
  const missing = ["item", "condition"].find((name) => !values[name]);
  if (missing) {
    showStatus("물건 이름과 사용 상태를 입력해 주세요.", true);
    form.elements.namedItem(missing).focus();
    return;
  }

  submit.disabled = true;
  save.disabled = true;
  showStatus("AI가 판매글을 작성하는 중입니다.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 29000);
  try {
    const response = await fetch("/api/listing", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(values),
      signal: controller.signal
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result) {
      throw new Error(result?.error || "판매글을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
    title.value = result.title;
    body.value = result.body;
    draftProduct = {price: values.price, delivery: values.delivery};
    checklist.replaceChildren(...result.checklist.map((line) => {
      const item = document.createElement("li");
      item.textContent = line;
      return item;
    }));
    document.querySelector("#checks").hidden = !result.checklist.length;
    document.querySelector("#empty").hidden = true;
    draft.hidden = false;
    copyStatus.textContent = "";
    showStatus("판매글을 만들었습니다.");
    title.focus({preventScroll: true});
    document.querySelector("#result").scrollIntoView({block: "nearest"});
  } catch (error) {
    showStatus(controller.signal.aborted
      ? "AI 응답이 늦어지고 있습니다. 잠시 후 다시 시도해 주세요."
      : error instanceof TypeError
        ? "서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요."
        : error.message, true);
  } finally {
    clearTimeout(timer);
    submit.disabled = false;
    save.disabled = false;
  }
});

document.querySelector("#copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(title.value.trim() + "\n\n" + body.value.trim());
    copyStatus.textContent = "제목과 본문을 복사했습니다.";
  } catch {
    copyStatus.textContent = "자동 복사에 실패했습니다. 제목과 본문을 직접 선택해 복사해 주세요.";
  }
});

save.addEventListener("click", async () => {
  const listingTitle = title.value.trim();
  const listingBody = body.value.trim();
  if (!listingTitle || !listingBody) {
    copyStatus.textContent = "제목과 본문을 모두 입력한 뒤 저장해 주세요.";
    (listingTitle ? body : title).focus();
    return;
  }

  save.disabled = true;
  submit.disabled = true;
  photo.disabled = true;
  try {
    const file = photo.files[0];
    let photoUrl = "";
    if (file) {
      try {
        photoUrl = await preparePhoto(file);
      } catch (error) {
        copyStatus.textContent = error instanceof DOMException
          ? "사진을 열지 못했어요. 다른 사진을 선택해 주세요."
          : error.message;
        return;
      }
    }
    const listing = {id: crypto.randomUUID(), title: listingTitle, body: listingBody, ...draftProduct, photoUrl};
    const listings = [listing, ...readListings()];
    localStorage.setItem(storageKey, JSON.stringify(listings));
  } catch {
    copyStatus.textContent = "이 브라우저에 판매글을 저장하지 못했어요.";
    return;
  } finally {
    save.disabled = false;
    submit.disabled = false;
    photo.disabled = false;
  }

  window.alert("저장되었습니다");
  form.reset();
  draftProduct = {};
  title.value = "";
  body.value = "";
  checklist.replaceChildren();
  draft.hidden = true;
  document.querySelector("#empty").hidden = false;
  copyStatus.textContent = "";
  showStatus("");
  form.elements.namedItem("item").focus();
});
