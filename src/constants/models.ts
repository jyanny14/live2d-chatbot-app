// Ollama 모델 상수 정의
export const OLLAMA_MODELS = {
  // 기본 모델
  DEFAULT: 'qwen3:0.6b',
  
  // 사용 가능한 모델들
  QWEN: 'qwen3:0.6b',
  
  // Fallback 모델 목록 (우선순위 순서)
  FALLBACK_MODELS: [
    'qwen3:0.6b'
  ]
} as const;

// 모델 타입 정의
export type OllamaModelName = typeof OLLAMA_MODELS[keyof typeof OLLAMA_MODELS];

// 기본 모델 가져오기 (기존 코드와의 호환성을 위해)
export const DEFAULT_MODEL = OLLAMA_MODELS.DEFAULT; 