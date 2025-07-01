const OLLAMA_API_BASE = 'http://127.0.0.1:11434/api';

import { ContentFilter } from '../../main/content-filter';
import { OLLAMA_MODELS, DEFAULT_MODEL } from '../../constants/models';

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





export class OllamaAPI {
  private readonly apiUrl: string;
  private readonly defaultModel: string;
  private readonly fallbackModels: readonly string[];
  private readonly defaultOptions: OllamaGenerateRequest['options'];
  private filter = new ContentFilter();

  constructor(
    apiUrl: string = 'http://127.0.0.1:11434',
    defaultModel: string = OLLAMA_MODELS.DEFAULT
  ) {
    this.apiUrl = apiUrl;
    this.defaultModel = defaultModel;
    // Fallback 모델 목록 사용
    this.fallbackModels = OLLAMA_MODELS.FALLBACK_MODELS;
    this.defaultOptions = {
      temperature: 0.7,
      top_p: 0.9,
      num_predict: 200, // 토큰 수 줄임
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
      const filteredPrompt = this.filter.filterUserInput(prompt);
      
      const requestBody: OllamaGenerateRequest = {
        model: options?.model || OLLAMA_MODELS.DEFAULT,
        prompt: filteredPrompt,
        system: options?.system || '당신은 친근하고 도움이 되는 AI 어시스턴트입니다. 다음 규칙을 반드시 따라주세요:\n1. 항상 친절하고 정중하게 답변하세요\n2. 부적절하거나 성적인 내용은 절대 언급하지 마세요\n3. 폭력이나 혐오 표현을 사용하지 마세요\n4. 건전하고 교육적인 대화를 나누세요\n5. 한국어로 답변하세요',
        stream: false,
        options: {
          ...this.defaultOptions,
          ...options?.options
        }
      };

      console.log('📤 Generate 요청:', requestBody);
      console.log('📤 요청 본문 (JSON):', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${this.apiUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error('❌ HTTP 응답 오류:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        });
        
        // 응답 본문을 텍스트로 먼저 가져오기
        const responseText = await response.text();
        console.error('❌ 응답 본문:', responseText);
        
        let errorData: OllamaErrorResponse;
        try {
          errorData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('❌ JSON 파싱 실패:', parseError);
          errorData = { error: responseText || '알 수 없는 오류' };
        }
        
        console.error('❌ Ollama 에러 상세:', {
          status: response.status,
          error: errorData.error,
          fullResponse: responseText
        });
        
        throw new Error(`Ollama API 오류 (${response.status}): ${errorData.error}`);
      }

      const data: OllamaGenerateResponse = await response.json();
      console.log('📥 Generate 응답:', data);
      
      if (!data.done) {
        throw new Error('응답이 완료되지 않았습니다');
      }

      // AI 응답 필터링
      data.response = this.filter.filterResponse(data.response);
      
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
  ): Promise<OllamaGenerateResponse> {
    try {
      console.log('🔍 Chat 메서드 호출됨:', { messagesCount: messages.length, model: options?.model || this.defaultModel });
      // 마지막 user 메시지만 추출
      const lastUserMsg = messages.reverse().find(m => m.role === 'user')?.content || '';
      const filteredInput = this.filter.filterUserInput(lastUserMsg);
      const requestBody: OllamaGenerateRequest = {
        model: options?.model || this.defaultModel,
        prompt: filteredInput,
        system: '당신은 친근하고 도움이 되는 AI 어시스턴트입니다. 항상 친절하고 정중하게 한국어로 답변해주세요.',
        stream: false,
        options: {
          ...this.defaultOptions,
          ...options?.options
        }
      };
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
      data.response = this.filter.filterResponse(data.response);
      return data;
    } catch (error) {
      console.error('❌ Chat 실패:', error);
      throw error;
    }
  }

  /**
   * 간단한 채팅 (tinyllama:1.1b 모델 사용)
   */
  async simpleChat(
    userMessage: string,
    model: string = OLLAMA_MODELS.DEFAULT
  ): Promise<string> {
    try {
      const systemPrompt = '당신은 친근하고 도움이 되는 AI 어시스턴트입니다. 항상 친절하고 정중하게 한국어로 답변해주세요.';
      const response = await this.generate(userMessage, { 
        model: OLLAMA_MODELS.DEFAULT,
        system: systemPrompt
      });
      return response.response;
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
      const filteredPrompt = this.filter.filterUserInput(prompt);
      
      const requestBody: OllamaGenerateRequest = {
        model: options?.model || OLLAMA_MODELS.DEFAULT,
        prompt: filteredPrompt,
        system: options?.system || '당신은 친근하고 도움이 되는 AI 어시스턴트입니다. 항상 친절하고 정중하게 한국어로 답변해주세요.',
        stream: true,
        options: {
          ...this.defaultOptions,
          ...options?.options
        }
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
              const filteredChunk = this.filter.filterResponse(data.response);
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
      console.error('❌ GenerateStream 실패:', error);
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
   * 안전한 채팅 (tinyllama:1.1b 모델만 사용)
   */
  async safeChat(messages: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<string> {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) {
      throw new Error('사용자 메시지가 없습니다');
    }

    // tinyllama:1.1b 모델이 설치되어 있는지 확인
    const availableModels = await this.getModels();
    console.log('📋 사용 가능한 모델들:', availableModels);

    if (!availableModels.includes(OLLAMA_MODELS.DEFAULT)) {
      throw new Error(`${OLLAMA_MODELS.DEFAULT} 모델이 설치되지 않았습니다. 먼저 모델을 설치해주세요.`);
    }

    // 대화 컨텍스트를 고려한 system 프롬프트
    const systemPrompt = `당신은 친근하고 도움이 되는 AI 어시스턴트입니다. 

다음 규칙을 반드시 따라주세요:
1. 항상 친절하고 정중하게 답변하세요
2. 부적절하거나 성적인 내용은 절대 언급하지 마세요
3. 폭력이나 혐오 표현을 사용하지 마세요
4. 건전하고 교육적인 대화를 나누세요
5. 한국어로 답변하세요
6. 사용자의 질문에 대해 명확하고 도움이 되는 답변을 제공하세요
7. 필요시 유머러스하게 대답할 수 있지만 항상 적절한 수준을 유지하세요

이전 대화 내용을 참고하여 자연스럽게 대화를 이어가세요.`;

    try {
      console.log(`🤖 ${OLLAMA_MODELS.DEFAULT} 모델로 응답 생성 중...`);
      
      const result = await this.generate(lastUserMessage.content, { 
        model: OLLAMA_MODELS.DEFAULT,
        system: systemPrompt,
        options: {
          ...this.defaultOptions,
          num_predict: 150, // 적당한 응답 길이
          temperature: 0.7, // 적당한 창의성
        }
      });
      
      console.log(`✅ ${OLLAMA_MODELS.DEFAULT} 모델 성공!`);
      return result.response;
      
    } catch (error: any) {
      console.error(`❌ ${OLLAMA_MODELS.DEFAULT} 모델 실패:`, error.message);
      throw new Error(`${OLLAMA_MODELS.DEFAULT} 모델에서 오류가 발생했습니다: ${error.message}`);
    }
  }
} 