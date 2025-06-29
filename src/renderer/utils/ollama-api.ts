const OLLAMA_API_BASE = 'http://127.0.0.1:11434/api';

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

export interface OllamaChatRequest {
  model: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
  };
}

export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: 'assistant';
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

export interface OllamaErrorResponse {
  error: string;
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
}

// Steam 제출을 위한 안전한 프롬프트 템플릿
const SAFE_PROMPT_TEMPLATE = `
당신은 친근하고 도움이 되는 AI 어시스턴트입니다. 다음 규칙을 반드시 따라주세요:

1. 항상 친절하고 정중하게 답변하세요
2. 부적절하거나 성적인 내용은 절대 언급하지 마세요
3. 폭력이나 혐오 표현을 사용하지 마세요
4. 건전하고 교육적인 대화를 나누세요
5. 한국어로 답변하세요

사용자 질문: {prompt}
`;

export const OLLAMA_DEFAULT_MODEL = 'gemma:2b';

export class OllamaAPI {
  private readonly apiUrl: string;
  private readonly defaultModel: string;
  private readonly fallbackModels: string[];
  private readonly defaultOptions: OllamaGenerateRequest['options'];

  constructor(
    apiUrl: string = 'http://127.0.0.1:11434',
    defaultModel: string = 'tinyllama:1.1b'
  ) {
    this.apiUrl = apiUrl;
    this.defaultModel = defaultModel;
    // Windows에서 더 안정적으로 작동하는 모델들
    this.fallbackModels = [
      'tinyllama:1.1b',
      'llama2:7b',
      'llama2:7b-chat',
      'gemma:2b',
      'mistral:7b',
      'qwen2:0.5b'
    ];
    this.defaultOptions = {
      temperature: 0.7,
      top_p: 0.9,
      num_predict: 500,
      stop: ['\n\n', '사용자:', 'User:']
    };
  }

  /**
   * 단일 프롬프트로 텍스트 생성
   */
  async generate(
    prompt: string,
    options?: Partial<OllamaGenerateRequest>
  ): Promise<OllamaGenerateResponse> {
    try {
      // 사용자 입력 필터링
      const { ContentFilter } = await import('../../main/content-filter');
      const inputCheck = ContentFilter.filterUserInput(prompt);
      
      if (!inputCheck.isAppropriate) {
        throw new Error('부적절한 입력이 감지되었습니다.');
      }

      // 안전한 프롬프트로 변환
      const safePrompt = SAFE_PROMPT_TEMPLATE.replace('{prompt}', inputCheck.filteredInput);
      
      const requestBody: OllamaGenerateRequest = {
        model: options?.model || this.defaultModel,
        prompt: safePrompt,
        stream: false,
        options: {
          ...this.defaultOptions,
          ...options?.options
        },
        ...options
      };

      console.log('📤 Generate 요청:', requestBody);

      const response = await fetch(`${this.apiUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData: OllamaErrorResponse = await response.json().catch(() => ({ error: '알 수 없는 오류' }));
        throw new Error(`Ollama API 오류 (${response.status}): ${errorData.error}`);
      }

      const data: OllamaGenerateResponse = await response.json();
      console.log('📥 Generate 응답:', data);
      
      if (!data.done) {
        throw new Error('응답이 완료되지 않았습니다');
      }

      // AI 응답 필터링
      data.response = ContentFilter.filterResponse(data.response);
      
      return data;
    } catch (error) {
      console.error('❌ Generate 실패:', error);
      throw error;
    }
  }

  /**
   * 시스템 프롬프트와 함께 텍스트 생성
   */
  async generateWithSystem(
    prompt: string,
    systemPrompt: string,
    options?: Partial<OllamaGenerateRequest>
  ): Promise<OllamaGenerateResponse> {
    return this.generate(prompt, {
      ...options,
      system: systemPrompt
    });
  }

  /**
   * 채팅 API를 사용한 대화
   */
  async chat(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options?: Partial<OllamaChatRequest>
  ): Promise<OllamaChatResponse> {
    try {
      console.log('🔍 Chat 메서드 호출됨:', { messagesCount: messages.length, model: options?.model || this.defaultModel });
      
      // 메시지 필터링
      const { ContentFilter } = await import('../../main/content-filter');
      
      const filteredMessages = messages.map(msg => {
        if (msg.role === 'user') {
          const inputCheck = ContentFilter.filterUserInput(msg.content);
          if (!inputCheck.isAppropriate) {
            throw new Error('부적절한 입력이 감지되었습니다.');
          }
          return { ...msg, content: inputCheck.filteredInput };
        }
        return { ...msg, content: ContentFilter.filterResponse(msg.content) };
      });

      const requestBody: OllamaChatRequest = {
        model: options?.model || this.defaultModel,
        messages: filteredMessages,
        stream: false,
        options: {
          ...this.defaultOptions,
          ...options?.options
        },
        ...options
      };

      console.log('📤 Chat 요청:', requestBody);

      const response = await fetch(`${this.apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData: OllamaErrorResponse = await response.json().catch(() => ({ error: '알 수 없는 오류' }));
        throw new Error(`Ollama Chat API 오류 (${response.status}): ${errorData.error}`);
      }

      const data: OllamaChatResponse = await response.json();
      console.log('📥 Chat 응답:', data);
      
      if (!data.done) {
        throw new Error('응답이 완료되지 않았습니다');
      }

      // AI 응답 필터링
      data.message.content = ContentFilter.filterResponse(data.message.content);
      
      return data;
    } catch (error) {
      console.error('❌ Chat 실패:', error);
      throw error;
    }
  }

  /**
   * 간단한 채팅 (사용자 메시지만 받아서 처리)
   */
  async simpleChat(
    userMessage: string,
    model: string = this.defaultModel
  ): Promise<string> {
    try {
      const response = await this.chat([
        { role: 'user', content: userMessage }
      ], { model });
      
      return response.message.content;
    } catch (error) {
      console.error('❌ Simple Chat 실패:', error);
      throw error;
    }
  }

  /**
   * 스트리밍 응답 (실시간 텍스트 생성)
   */
  async generateStream(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: Partial<OllamaGenerateRequest>
  ): Promise<void> {
    try {
      // 사용자 입력 필터링
      const { ContentFilter } = await import('../../main/content-filter');
      const inputCheck = ContentFilter.filterUserInput(prompt);
      
      if (!inputCheck.isAppropriate) {
        throw new Error('부적절한 입력이 감지되었습니다.');
      }

      // 안전한 프롬프트로 변환
      const safePrompt = SAFE_PROMPT_TEMPLATE.replace('{prompt}', inputCheck.filteredInput);
      
      const requestBody: OllamaGenerateRequest = {
        model: options?.model || this.defaultModel,
        prompt: safePrompt,
        stream: true,
        options: {
          ...this.defaultOptions,
          ...options?.options
        },
        ...options
      };

      const response = await fetch(`${this.apiUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP 오류: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('스트림 리더를 생성할 수 없습니다');
      }

      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data: Partial<OllamaGenerateResponse> = JSON.parse(line);
            if (data.response) {
              const filteredChunk = ContentFilter.filterResponse(data.response);
              onChunk(filteredChunk);
            }
            if (data.done) {
              return;
            }
          } catch (parseError) {
            console.warn('JSON 파싱 오류:', parseError);
          }
        }
      }
    } catch (error) {
      console.error('❌ Stream 실패:', error);
      throw error;
    }
  }

  /**
   * 여러 프롬프트를 배치로 처리
   */
  async generateBatch(
    prompts: string[],
    options?: Partial<OllamaGenerateRequest>
  ): Promise<OllamaGenerateResponse[]> {
    const promises = prompts.map(prompt => 
      this.generate(prompt, options)
    );
    
    return Promise.all(promises);
  }

  /**
   * 서버 상태 확인
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/tags`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 설치된 모델 목록 가져오기
   */
  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.apiUrl}/api/tags`);
      const data = await response.json();
      return data.models?.map((model: any) => model.name) || [];
    } catch {
      return [];
    }
  }

  /**
   * 모델 목록 조회 (상세 정보 포함)
   */
  async listModels(): Promise<OllamaModel[]> {
    try {
      console.log('🔍 모델 목록 조회 중...');
      
      const response = await fetch(`${this.apiUrl}/tags`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 /api/tags 응답:', data);
      
      return data.models || [];
    } catch (error) {
      console.error('모델 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 모델이 설치되어 있는지 확인
   */
  async isModelInstalled(modelName: string): Promise<boolean> {
    try {
      const models = await this.getModels();
      return models.includes(modelName);
    } catch {
      return false;
    }
  }

  /**
   * 모델 설치
   */
  async installModel(modelName: string): Promise<void> {
    try {
      console.log(`📥 ${modelName} 모델을 설치합니다...`);
      
      const response = await fetch(`${this.apiUrl}/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: modelName }),
      });

      if (!response.ok) {
        throw new Error(`모델 설치 실패: ${response.status}`);
      }

      console.log(`✅ ${modelName} 모델 설치 완료`);
    } catch (error) {
      console.error(`❌ 모델 설치 실패:`, error);
      throw error;
    }
  }

  /**
   * 서버가 실행 중인지 확인
   */
  static async isServerRunning(): Promise<boolean> {
    try {
      const response = await fetch(`${OLLAMA_API_BASE}/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Steam 통계 업데이트 (기존 메서드 유지)
   */
  static async updateSteamStats(conversationCount: number, totalMessages: number): Promise<void> {
    try {
      const { SteamIntegration } = await import('../../main/steam-integration');
      const steamIntegration = new SteamIntegration();
      if (steamIntegration.isSteamInitialized()) {
        steamIntegration.updateStat('conversation_count', conversationCount);
        steamIntegration.updateStat('total_messages', totalMessages);
      }
    } catch (error) {
      console.error('Steam 통계 업데이트 실패:', error);
    }
  }

  /**
   * 사용 가능한 모델 찾기 (대체 모델 포함)
   */
  async findAvailableModel(): Promise<string> {
    try {
      // 먼저 기본 모델 확인
      const models = await this.getModels();
      if (models.includes(this.defaultModel)) {
        return this.defaultModel;
      }

      // 대체 모델들 확인
      for (const model of this.fallbackModels) {
        if (models.includes(model)) {
          console.log(`✅ 사용 가능한 모델 발견: ${model}`);
          return model;
        }
      }

      // 설치된 첫 번째 모델 사용
      if (models.length > 0) {
        console.log(`⚠️ 기본 모델을 찾을 수 없어 첫 번째 모델 사용: ${models[0]}`);
        return models[0];
      }

      throw new Error('사용 가능한 모델이 없습니다');
    } catch (error) {
      console.error('❌ 모델 확인 실패:', error);
      throw error;
    }
  }

  /**
   * 안전한 채팅 (모델 실패 시 대체 모델 시도)
   */
  async safeChat(messages: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<string> {
    const availableModel = await this.findAvailableModel();
    
    try {
      // 마지막 사용자 메시지를 프롬프트로 사용
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      if (!lastUserMessage) {
        throw new Error('사용자 메시지가 없습니다');
      }
      
      const result = await this.generate(lastUserMessage.content, { model: availableModel });
      return result.response;
    } catch (error) {
      console.error(`❌ 모델 ${availableModel} 실패:`, error);
      
      // 다른 모델들 시도
      const models = await this.getModels();
      for (const model of models) {
        if (model !== availableModel) {
          try {
            console.log(`🔄 다른 모델 시도: ${model}`);
            const lastUserMessage = messages.filter(m => m.role === 'user').pop();
            if (lastUserMessage) {
              const result = await this.generate(lastUserMessage.content, { model });
              return result.response;
            }
          } catch (retryError) {
            console.error(`❌ 모델 ${model} 실패:`, retryError);
          }
        }
      }
      
      throw new Error('모든 모델에서 실패했습니다');
    }
  }
} 