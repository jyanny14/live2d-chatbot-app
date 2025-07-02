# Live2D Chatbot App

Live2D 캐릭터와 대화할 수 있는 데스크톱 애플리케이션입니다.

## 주요 기능

- 🤖 **AI 챗봇**: DeepSeek R1 1.5B 모델을 사용한 자연스러운 대화
- 🎭 **Live2D 캐릭터**: 다양한 Live2D 모델 지원 (히요리, 케이, 심플)
- 💬 **실시간 채팅**: 스트리밍 응답과 타이핑 애니메이션
- 🎨 **아름다운 UI**: Tailwind CSS로 구현된 모던한 인터페이스
- 🔒 **콘텐츠 필터링**: 부적절한 콘텐츠 자동 필터링
- 🚀 **완전 내장**: Ollama와 AI 모델이 앱에 완전히 포함됨

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. Ollama 다운로드
```bash
npm run download-ollama
```

### 3. AI 모델 다운로드 (선택사항)
```bash
npm run download-model
```
> **참고**: 모델을 다운로드하지 않아도 앱 실행 시 자동으로 다운로드됩니다.

### 4. 개발 모드 실행
```bash
npm run dev
```

### 5. 배포용 빌드
```bash
npm run dist
```

## 완전 내장 모델 시스템

이 앱은 **완전 내장 방식**을 사용합니다:

### 🔧 내장 구성 요소
- **Ollama 서버**: 앱에 포함된 Ollama 바이너리
- **AI 모델**: DeepSeek R1 1.5B (앱에 완전히 내장됨, 1.56GB)
- **Live2D 모델**: 히요리, 케이, 심플 캐릭터

### 🚀 자동 설정
1. 앱 시작 시 Ollama 서버 자동 실행
2. 내장된 AI 모델을 Ollama 디렉토리로 자동 복사
3. 모델 복사 완료 후 즉시 사용 가능

### 💾 저장 위치
- **Ollama**: `%USERPROFILE%\.ollama\`
- **내장 모델**: `models/deepseek-r1-1.5b/` (앱에 포함)
- **실행 모델**: `%USERPROFILE%\.ollama\models\` (앱 실행 시 복사)

### 📦 모델 내장 방법
```bash
# 1. 모델 다운로드 (한 번만)
npm run download-model

# 2. 모델을 앱에 내장
npm run embed-model

# 3. 앱 실행 (내장된 모델 사용)
npm run dev
```

## 기술 스택

- **프론트엔드**: React + TypeScript + Tailwind CSS
- **백엔드**: Electron + Node.js
- **AI**: Ollama + DeepSeek R1 1.5B
- **그래픽**: Pixi.js + Live2D Cubism SDK
- **빌드**: Vite + Electron Builder

## 프로젝트 구조

```
live2d-chatbot-app/
├── src/
│   ├── main/           # Electron 메인 프로세스
│   ├── renderer/       # React 렌더러 프로세스
│   └── constants/      # 상수 정의
├── public/
│   └── models/         # Live2D 모델 파일
├── ollama/             # Ollama 바이너리
├── scripts/            # 설정 스크립트
└── dist/               # 빌드 출력
```

## 라이선스

MIT License

## 🚀 주요 기능

- **Live2D 캐릭터**: 다양한 Live2D 모델 지원
- **로컬 AI 챗봇**: Ollama + Gemma 2B 모델로 완전히 로컬에서 실행
- **실시간 대화**: 자연스러운 대화형 인터페이스
- **컨텍스트 인식**: 이전 대화 내용을 기억하는 지능형 챗봇
- **콘텐츠 필터링**: Steam 제출을 위한 안전한 대화 환경
- **크로스 플랫폼**: Windows, macOS, Linux 지원

## 📋 시스템 요구사항

- **OS**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **RAM**: 최소 8GB (Gemma 2B 모델 사용 시)
- **저장공간**: 최소 5GB (Ollama + 모델 포함)
- **GPU**: 선택사항 (CUDA 지원 GPU 권장)

## 🛠️ 설치 방법

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/live2d-chatbot-app.git
cd live2d-chatbot-app
```

### 2. 의존성 설치
```bash
npm install
```

### 3. Ollama 다운로드
```bash
npm run download-ollama
```

### 4. Gemma 2B 모델 설치
```bash
npm run setup-gemma
```

> ⚠️ **주의**: Gemma 2B 모델 다운로드는 인터넷 연결 상태에 따라 10-30분이 소요될 수 있습니다.

## 🎮 사용 방법

### 개발 모드 실행
```bash
npm run dev
```

### 프로덕션 빌드
```bash
npm run build
npm run dist
```

## 🤖 AI 챗봇 기능

### **지능형 대화**
- 자연스러운 한국어 대화 지원
- 이전 대화 컨텍스트 기억
- 다양한 주제에 대한 지식 제공

### **안전한 대화 환경**
- 부적절한 콘텐츠 자동 필터링
- Steam 제출 기준 준수
- 연령 등급별 콘텐츠 제어

### **실시간 응답**
- 빠른 응답 속도
- 타이핑 인디케이터
- 오류 처리 및 복구

### **대화 예시**
```
사용자: 안녕하세요!
AI: 안녕하세요! 반갑습니다! 😊 오늘은 어떤 이야기를 나눠볼까요?

사용자: 날씨에 대해 이야기해주세요
AI: 날씨에 대해 물어보시는군요! 🌤️ 오늘은 정말 좋은 날씨네요. 
    산책하기 딱 좋을 것 같아요! 

사용자: 재미있는 이야기를 해주세요
AI: 재미있는 이야기를 해드릴까요? 🎭 한 번은 작은 토끼가 큰 산을 
    오르려고 했는데...
```

## 📁 프로젝트 구조

```
live2d-chatbot-app/
├── src/
│   ├── main/                 # Electron 메인 프로세스
│   │   ├── index.ts         # 메인 윈도우 관리
│   │   ├── ollama-service.ts # Ollama 서비스 관리
│   │   ├── steam-integration.ts # Steam 통합
│   │   └── content-filter.ts # 콘텐츠 필터링
│   └── renderer/            # React 렌더러 프로세스
│       ├── components/      # React 컴포넌트
│       │   ├── chat/        # 채팅 관련 컴포넌트
│       │   └── live2d/      # Live2D 관련 컴포넌트
│       ├── utils/           # 유틸리티 함수
│       │   └── ollama-api.ts # Ollama API 통신
│       └── App.tsx          # 메인 앱 컴포넌트
├── scripts/                 # 빌드 및 설정 스크립트
│   ├── download-ollama.js   # Ollama 다운로드
│   └── setup-gemma.js       # Gemma 모델 설정
├── ollama/                  # Ollama 바이너리 (자동 생성)
├── public/models/           # Live2D 모델 파일
└── package.json
```

## 🔧 기술 스택

- **프론트엔드**: React 18 + TypeScript + Tailwind CSS
- **데스크톱**: Electron 28
- **AI 모델**: Ollama + Gemma 2B
- **Live2D**: PIXI.js + Live2D Cubism SDK
- **API 통신**: Axios + Fetch API
- **빌드 도구**: Vite + Electron Builder

## 🤖 AI 모델 정보

### Gemma 2B
- **모델 크기**: ~2GB
- **언어**: 다국어 지원 (한국어 포함)
- **성능**: 중간 수준의 대화 능력
- **하드웨어**: CPU만으로도 실행 가능
- **라이선스**: 상업적 사용 가능 ✅

### 다른 모델 사용하기
다른 Ollama 모델을 사용하려면:

1. 모델 설치:
```bash
# 예: Llama 2 7B 모델
./ollama/bin/ollama pull llama2:7b
```

2. 코드에서 모델명 변경:
```typescript
// src/renderer/utils/ollama-api.ts
const response = await OllamaAPI.generate({
  model: 'llama2:7b',  // 모델명 변경
  prompt: '안녕하세요!'
});
```

## 🎨 Live2D 모델 추가

새로운 Live2D 모델을 추가하려면:

1. 모델 파일을 `public/models/` 디렉토리에 추가
2. `src/renderer/constants/live2d.ts`에서 모델 경로 업데이트:
```typescript
export const LIVE2D_MODEL_PATH = '/models/your-model/runtime/your-model.model3.json'
```

## 🔒 보안 및 안전성

### **콘텐츠 필터링**
- 부적절한 단어 및 표현 차단
- 성적, 폭력, 혐오 콘텐츠 필터링
- Steam 제출 기준 준수

### **개인정보 보호**
- 모든 대화는 로컬에서 처리
- 외부 서버로 데이터 전송 없음
- 완전한 프라이버시 보장

## 🐛 문제 해결

### Ollama 서버 시작 실패
```bash
# Ollama 재설치
npm run download-ollama

# 포트 확인 (기본: 11434)
netstat -an | grep 11434
```

### 모델 다운로드 실패
```bash
# 인터넷 연결 확인
ping github.com

# 수동으로 모델 다운로드
./ollama/bin/ollama pull gemma2:2b
```

### 메모리 부족 오류
- 시스템 RAM을 16GB 이상으로 업그레이드
- 더 작은 모델 사용 (예: gemma2:2b-instruct)

### AI 응답이 느린 경우
- GPU 가속 활성화
- 더 빠른 모델 사용
- 시스템 성능 최적화

## 📝 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 지원

문제가 발생하거나 질문이 있으시면 [Issues](https://github.com/your-username/live2d-chatbot-app/issues) 페이지를 이용해 주세요.

---

**즐거운 Live2D 챗봇 경험을 즐기세요! 🎉** 