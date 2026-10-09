export const site = {
  title: 'BCSD Blog',
  description:
    '한국기술교육대학교 IT 동아리 BCSD의 기술 블로그. 프로젝트 개발, 디자인, 기획 과정의 경험을 기록합니다.',
};
export const sections = [
  {
    directory: '@frontEnd',
    slug: 'front-end',
    label: 'FrontEnd',
    description: '웹 프론트엔드 개발과 프로젝트 회고',
  },
  {
    directory: '@backEnd',
    slug: 'back-end',
    label: 'BackEnd',
    description: '서버 개발, 아키텍처, 서비스 운영',
  },
  {
    directory: '@android',
    slug: 'android',
    label: 'Android',
    description: 'Android 앱 개발과 문제 해결',
  },
  {
    directory: '@ios',
    slug: 'ios',
    label: 'iOS',
    description: 'iOS 앱 개발과 프로젝트 경험',
  },
  {
    directory: '@game',
    slug: 'game',
    label: 'Game',
    description: '게임 개발과 제작 과정',
  },
  {
    directory: '@design',
    slug: 'design',
    label: 'Design',
    description: 'UI·UX 디자인과 사용자 경험',
  },
  {
    directory: '@productManager',
    slug: 'product-manager',
    label: 'PM',
    description: '서비스 기획과 제품 관리',
  },
  {
    directory: '@dataAnalyst',
    slug: 'data-analyst',
    label: 'DA',
    description: '데이터 분석과 활용',
  },
  {
    directory: '@security',
    slug: 'security',
    label: 'Security',
    description: '보안 기술과 학습 기록',
  },
  {
    directory: '@introduce',
    slug: 'introduce',
    label: 'BCSD 소개',
    description: 'Build Communities, Share Dreams',
  },
  {
    directory: '@guideline',
    slug: 'guideline',
    label: '작성 가이드',
    description: '블로그 글 작성과 업로드 안내',
  },
  {
    directory: 'docs',
    slug: 'docs',
    label: 'Documents',
    description: '블로그 문서와 템플릿',
  },
];
export const tracks = sections.slice(0, 9);
