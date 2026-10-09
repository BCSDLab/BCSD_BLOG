# BCSD Blog

한국기술교육대학교 IT 동아리 BCSD의 [기술 블로그](https://blog.bcsdlab.com)입니다. Astro로 빌드하고 GitHub Pages로 배포합니다.

## 개발

Node.js 22.12 이상을 사용합니다.

```sh
npm ci
npm run dev
```

```sh
npm run verify  # 테스트, 타입 검사, 빌드 및 링크 검증
npm run preview # 빌드 결과 확인
```

## 글 작성

- `@frontEnd/`, `@android/` 등 해당 분야 폴더에 MDX 파일을 추가합니다.
- 작성자 정보는 각 분야의 `authors.yml`에서 관리합니다.
- `draft: true`는 비공개 초안, `featured: true`는 홈 추천 글입니다.
- 이미지는 `static/img/`에 저장하고 `![설명](@images/경로.png)`로 작성합니다.
- 기존 글 주소를 바꾸면 댓글 연결에 영향을 줄 수 있습니다. URL 매핑은 `src/data/legacy-routes.json`에서 관리합니다.

[작성 가이드](https://blog.bcsdlab.com/guideline) · [글 템플릿](@guideline/template.mdx)

## 배포

`main`에 push하면 GitHub Actions가 검증 후 GitHub Pages에 배포합니다.
도메인 설정은 `astro.config.mjs`와 `static/CNAME`에서 관리합니다.
