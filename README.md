# 중고글 뚝딱

중고 물건의 이름과 사용 상태를 입력하면 AI가 판매글 제목과 본문을 작성합니다. 희망 가격, 거래 방법, 구성품도 반영할 수 있습니다. 초안을 수정한 뒤 복사하고, 체크리스트에서 빠진 정보를 확인할 수 있습니다.

## 실행

Python 3.12 이상을 사용합니다.

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
.\.venv\Scripts\python.exe dev.py
```

`.env`에 Copa에서 발급한 `COPA_API_KEY`를 입력한 뒤 [로컬 서비스](http://127.0.0.1:8765)를 엽니다. `COPA_MODEL`의 기본값은 `claude-haiku-4`입니다. 키는 Python 서버만 읽으며 Git에는 빈 값이 있는 `.env.example`을 올립니다.

## 구조

- `public/index.html`에 홈, 판매글 만들기, 예시 메뉴와 폼을 둡니다.
- `public/css/style.css`는 화면 너비에 따라 작성 폼과 결과 패널을 가로 또는 세로로 배치합니다.
- `public/js/app.js`는 입력을 JSON으로 바꾸고 `fetch('/api/listing')`으로 보냅니다. 응답을 편집 필드에 표시하고 복사를 처리합니다.
- `api/listing.py`는 Vercel의 Python 함수입니다. 입력을 검증하고 Copa의 Claude Messages API에 요청한 뒤 제목, 본문, 체크리스트를 JSON으로 반환합니다.
- `dev.py`는 동일한 API 핸들러와 정적 파일을 로컬에서 실행합니다.

## Vercel 배포

배포 URL은 첫 배포가 완료되면 여기에 기록합니다.

1. Vercel에서 이 GitHub 저장소를 새 프로젝트로 가져옵니다. 루트 디렉터리는 저장소 루트입니다.
2. 프로젝트의 Environment Variables에 `COPA_API_KEY`를 추가합니다. 다른 모델을 쓰는 경우 `COPA_MODEL`도 설정합니다.
3. Deploy를 실행합니다. `vercel.json`이 정적 파일 디렉터리와 Python 함수 실행 시간을 지정합니다.
4. 배포 URL에서 메뉴 이동과 예시 입력을 확인한 뒤 실제 판매글을 생성합니다. 설정을 고쳤다면 재배포하고 같은 입력으로 다시 확인합니다.

[Vercel Python 함수 문서](https://vercel.com/docs/functions/runtimes/python) · [GitHub 연동 배포 문서](https://vercel.com/docs/git)

## 제출 자료

[서비스 기획서](docs/plan.md) · [AI 코딩 도구 사용 기록](docs/ai-worklog.md)

[데스크톱 화면](docs/screenshots/desktop.png) · [모바일 화면](docs/screenshots/mobile.png) · [실제 AI 생성 결과](docs/screenshots/ai-result.png)
