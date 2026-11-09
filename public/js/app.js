const examples = {
  console: {
    item: "닌텐도 스위치 OLED",
    condition: "본체 뒷면에 작은 긁힘이 있습니다. 원래 박스는 없습니다.",
    price: "22만 원",
    delivery: "직거래",
    details: "독과 충전기 포함"
  },
  chair: {
    item: "원목 식탁 의자 2개",
    condition: "사용한 지 2년 정도 됐고 다리에 생활 흠집이 있습니다.",
    price: "두 개 5만 원",
    delivery: "직접 수령",
    details: "두 개 함께 판매합니다."
  },
  book: {
    item: "파이썬 입문서",
    condition: "앞부분 20쪽 정도에 연필 밑줄이 있습니다.",
    price: "8천 원",
    delivery: "택배 가능",
    details: "책 한 권입니다."
  }
};

const form = document.querySelector("#listing-form");
const submit = form.querySelector("button");
const status = document.querySelector("#status");
const title = document.querySelector("#title");
const body = document.querySelector("#body");
const draft = document.querySelector("#draft");
const checklist = document.querySelector("#checklist");
const copyStatus = document.querySelector("#copy-status");
const exampleButtons = document.querySelectorAll("[data-example]");

function showStatus(message, error = false) {
  status.textContent = message;
  status.classList.toggle("error", error);
}

for (const button of exampleButtons) {
  button.addEventListener("click", () => {
    for (const [name, value] of Object.entries(examples[button.dataset.example])) {
      form.elements.namedItem(name).value = value;
    }
    showStatus("예시를 불러왔습니다. 생성 버튼을 눌러보세요.");
    document.querySelector("#item").focus();
    document.querySelector("#write").scrollIntoView();
  });
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
  for (const button of exampleButtons) button.disabled = true;
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
    for (const button of exampleButtons) button.disabled = false;
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
