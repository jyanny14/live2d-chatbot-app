// Ollama 모델 상수 정의
export const OLLAMA_MODELS = {
  // 기본 모델
  DEFAULT: 'DeepSeek-R1-Distill-Qwen-1.5B-Q6_K_L'
} as const;

// 모델 타입 정의
export type OllamaModelName = typeof OLLAMA_MODELS[keyof typeof OLLAMA_MODELS];

// 기본 모델 가져오기 (기존 코드와의 호환성을 위해)
export const DEFAULT_MODEL = OLLAMA_MODELS.DEFAULT; 