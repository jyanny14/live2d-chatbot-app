// 채팅 관련 타입
export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export interface ChatRequest {
  message: string;
  model?: string;
  stream?: boolean;
}

export interface ChatResponse {
  message: string;
  done: boolean;
}

// Ollama API 관련 타입
export interface OllamaChatRequest {
  model: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
    num_thread?: number;
    num_ctx?: number;
    stop?: string[];
  };
}

export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message?: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

// Generate API 관련 타입 (하위 호환성)
export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  system?: string;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
    max_tokens?: number;
    stop?: string[];
  };
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

// Live2D 관련 타입
export interface Live2DCanvasProps {
  modelPath?: string;
  onModelLoaded?: (model: any) => void;
  onModelError?: (error: Error) => void;
}

export interface Live2DCanvasHandle {
  triggerRandomMotion: () => void;
}

// 앱 설정 타입
export interface AppConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  enableStreaming: boolean;
  enableContentFilter: boolean;
  ageRating: 'E' | 'T' | 'M' | 'AO';
}

// 오류 타입
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// 서비스 상태 타입
export interface ServiceStatus {
  isRunning: boolean;
  isExternal: boolean;
  model: string;
  lastError?: AppError;
} 