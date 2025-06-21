# Live2D Chatbot Desktop App

Live2D 캐릭터와 대화할 수 있는 데스크탑 애플리케이션입니다.

## 기술 스택

- **Electron**: 데스크탑 애플리케이션 프레임워크
- **React**: UI 라이브러리
- **TypeScript**: 타입 안전성
- **PIXI.js**: 2D 렌더링 엔진
- **pixi-live2d-display**: Live2D 모델 표시
- **Vite**: 빌드 도구

## 주요 기능

- **Windows 투명 윈도우**: 투명한 배경과 블러 효과
- **DPI 스케일링 호환**: 고해상도 디스플레이 지원
- **GPU 가속 최적화**: WebGL 성능 최적화
- **Live2D 렌더링**: pixi-live2d-display로 부드러운 애니메이션
- **실시간 채팅**: 사용자와 봇 간의 대화 인터페이스

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 모드 실행

```bash
npm run dev
```

이 명령어는 다음을 순차적으로 실행합니다:
1. Electron 메인 프로세스 TypeScript 컴파일
2. Vite 개발 서버 시작
3. Electron 앱 실행

### 3. 빌드

```bash
# 전체 빌드 (Electron + React)
npm run build

# Electron 메인 프로세스만 빌드
npm run build:electron

# Windows 실행 파일 생성
npm run dist
```

## 프로젝트 구조

```
live2d-chatbot-app/
├── src/
│   ├── main/           # Electron 메인 프로세스 (TypeScript)
│   │   ├── index.ts    # 메인 윈도우 생성
│   │   └── utils.ts    # 유틸리티 함수
│   └── renderer/       # React 렌더러 프로세스
│       ├── components/
│       │   └── live2d/
│       │       └── Live2DCanvas.tsx  # Live2D 렌더링 컴포넌트
│       ├── App.tsx     # 메인 React 앱
│       ├── main.tsx    # React 진입점
│       ├── App.css     # 앱 스타일
│       └── index.css   # 전역 스타일
├── dist/               # 컴파일된 JavaScript 파일
│   └── main/          # Electron 메인 프로세스
├── public/
│   └── models/        # Live2D 모델 파일
├── index.html         # 메인 HTML 파일
├── package.json
├── tsconfig.json      # React/Vite용 TypeScript 설정
├── tsconfig.electron.json  # Electron용 TypeScript 설정
├── vite.config.ts
└── README.md
```

## Live2D 모델 추가하기

1. Live2D 모델 파일을 `public/models/` 디렉토리에 추가
2. `src/renderer/App.tsx`에서 모델 경로 수정:

```typescript
<Live2DCanvas modelPath="/models/your-model.model3.json" />
```

## Windows 최적화 설정

### 투명 윈도우
- `transparent: true`
- `backgroundColor: '#00000000'`
- `frame: false`

### DPI 스케일링
- `high-dpi-support: 1`
- `force-device-scale-factor: 1`
- `zoomFactor: 1.0`

### GPU 가속
- `enable-gpu`
- `backgroundThrottling: false`
- `powerPreference: 'high-performance'`

## 개발 환경

- Node.js 18+
- npm 9+
- Windows 10/11

## 문제 해결

### TypeScript 컴파일 에러
- `npm run build:electron`으로 Electron 메인 프로세스 먼저 빌드
- `dist/main/` 디렉토리에 컴파일된 JavaScript 파일 확인

### Live2D 모델 로드 실패
- 모델 파일 경로 확인
- CORS 설정 확인 (개발 모드)
- 브라우저 콘솔에서 에러 메시지 확인

## 라이선스

MIT License 