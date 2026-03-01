# CLAUDE.md

이 파일은 Claude Code(claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 프로젝트 개요

한국어 "오늘의 명언" 웹 앱입니다. CSS와 JS가 모두 내장된 단일 파일(`index.html`) 정적 페이지로, 빌드 도구나 프레임워크, 패키지 매니저를 사용하지 않습니다.

## 개발 방법

빌드 단계 없음. `index.html`을 직접 열어 미리보기:

```bash
open index.html
```

또는 로컬 서버로 실행:

```bash
python3 -m http.server 8080
```

## 아키텍처

모든 코드는 `index.html` 한 파일에 존재합니다:

- **CSS** — `<head>`의 `<style>` 태그에 내장. 한국어 타이포그래피를 위해 Google Fonts(`Noto Serif KR`, `Noto Sans KR`)를 `<link>`로 불러옵니다.
- **JS** — `<body>` 하단의 인라인 `<script>`. 핵심 로직:
  - `showQuoteOfDay()` — `(연도×10000 + 월×100 + 일) % 명언수`를 시드로 사용해 하루 동안 같은 명언을 결정적으로 표시합니다.
  - `showRandom()` — 직전 명언(`lastIndex`)을 피해 무작위 명언을 선택합니다.
  - `display(q)` — 현재 명언을 opacity 0으로 페이드 아웃한 뒤 200ms 후 텍스트를 교체하고 다시 페이드 인합니다.
- **명언 데이터** — 스크립트 블록 상단의 하드코딩된 배열(현재 20개, 한국어 번역).

## 컨벤션

- 별도 파일 요청이 없는 한 모든 것을 `index.html` 한 파일에 유지합니다.
- CSS flexbox로 반응형 구현; 모바일 브레이크포인트는 `max-width: 560px`.
- `@media print` 블록에서 배경·그림자를 제거하고 새로고침 버튼을 숨겨 인쇄 시 깔끔하게 출력됩니다.
- 한국어 텍스트는 `word-break: keep-all`로 어절 중간 줄바꿈을 방지합니다.
