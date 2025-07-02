import { ContentFilter } from '../../main/content-filter';
import { OLLAMA_MODELS, DEFAULT_MODEL } from '../../constants/models';
import { OllamaChatRequest, OllamaChatResponse, OllamaGenerateRequest, OllamaGenerateResponse } from '../../types';
import { generateUniqueId, truncateText, safeJsonParse } from '../../utils/common';

const OLLAMA_API_BASE = 'http://127.0.0.1:11434/api';

// 새로운 Chat API 인터페이스들
export interface OllamaChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OllamaErrorResponse {
  error: string;
}

export class OllamaAPI {
  private readonly apiUrl: string;
  private readonly defaultModel: string;
  private readonly defaultOptions: OllamaChatRequest['options'];
  // ContentFilter는 정적 메서드만 사용하므로 인스턴스 불필요
  private conversationHistory: OllamaChatMessage[] = [];
  private readonly maxHistoryLength = 20;

  constructor(
    apiUrl: string = 'http://127.0.0.1:11434',
    defaultModel: string = OLLAMA_MODELS.DEFAULT
  ) {
    this.apiUrl = apiUrl;
    this.defaultModel = defaultModel;
    this.defaultOptions = {
      temperature: 0.7,
      top_p: 0.9,
      num_predict: 200,
      num_thread: 4,
      num_ctx: 2048,
      stop: ['\n\n', '사용자:', 'User:']
    };
    
    // 빈 대화 히스토리로 초기화 (시스템 프롬프트는 Modelfile에서 처리)
    this.conversationHistory = [];
  }

  /**
   * 대화 히스토리 관리
   */
  private addMessage(role: 'user' | 'assistant', content: string): void {
    this.conversationHistory.push({ role, content });
    
    // 메모리 관리를 위한 히스토리 길이 제한 (시스템 메시지 제외)
    const nonSystemMessages = this.conversationHistory.filter(msg => msg.role !== 'system');
    
    if (nonSystemMessages.length > this.maxHistoryLength) {
      const systemMessages = this.conversationHistory.filter(msg => msg.role === 'system');
      const recentMessages = nonSystemMessages.slice(-this.maxHistoryLength);
      this.conversationHistory = [...systemMessages, ...recentMessages];
    }
  }

  /**
   * 대화 히스토리 초기화
   */
  clearHistory(): void {
    this.conversationHistory = [];
    console.log('🗑️ 대화 히스토리 초기화됨');
  }

  /**
   * 현재 대화 히스토리 가져오기
   */
  getHistory(): OllamaChatMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * 대화 히스토리 디버그 출력
   */
  debugHistory(): void {
    console.log('🔍 현재 대화 히스토리:');
    this.conversationHistory.forEach((msg, index) => {
      console.log(`[${index}] ${msg.role}: ${truncateText(msg.content, 150)}`);
    });
  }

  /**
   * Chat API를 사용한 대화 (스트리밍)
   */
  async chatStream(
    userMessage: string,
    onChunk: (chunk: string) => void,
    options?: Partial<OllamaChatRequest>
  ): Promise<string> {
    try {
      // 사용자 입력 필터링
      const filterResult = ContentFilter.filterUserInput(userMessage);
      const filteredMessage = filterResult.filteredInput;
      
      // 사용자 메시지 추가
      this.addMessage('user', filteredMessage);

      const requestBody: OllamaChatRequest = {
        model: options?.model || this.defaultModel,
        messages: this.conversationHistory,
        stream: true,
        options: {
          ...this.defaultOptions,
          ...options?.options
        }
      };

      console.log('📤 Chat 스트리밍 요청:', {
        model: requestBody.model,
        messageCount: requestBody.messages.length,
        stream: requestBody.stream
      });

      // 실제 전송되는 메시지 내용 확인
      console.log('📋 전송되는 메시지들:', requestBody.messages.map((msg, index) => ({
        index,
        role: msg.role,
        content: truncateText(msg.content, 100)
      })));

      const response = await fetch(`${this.apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorData = safeJsonParse<OllamaErrorResponse>(errorText, { error: 'Unknown error' });
        throw new Error(`Ollama API 오류: ${errorData.error}`);
      }

      if (!response.body) {
        throw new Error('응답 본문이 없습니다.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const data: OllamaChatResponse = JSON.parse(line);
              
              if (data.message?.content) {
                const content = data.message.content;
                fullResponse += content;
                onChunk(content);
              }
              
              if (data.done) {
                break;
              }
            } catch (parseError) {
              console.warn('JSON 파싱 오류:', parseError, 'Line:', line);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // AI 응답 필터링
      const filteredResponse = ContentFilter.filterResponse(fullResponse);
      
      // 어시스턴트 메시지 추가
      this.addMessage('assistant', filteredResponse);
      
      console.log('📥 Chat 스트리밍 완료:', {
        responseLength: filteredResponse.length,
        totalMessages: this.conversationHistory.length
      });

      return filteredResponse;
    } catch (error) {
      console.error('❌ Chat 스트리밍 실패:', error);
      throw error;
    }
  }

  /**
   * Chat API를 사용한 대화 (비스트리밍)
   */
  async chat(
    userMessage: string,
    options?: Partial<OllamaChatRequest>
  ): Promise<string> {
    try {
      // 사용자 입력 필터링
      const filterResult = ContentFilter.filterUserInput(userMessage);
      const filteredMessage = filterResult.filteredInput;
      
      // 사용자 메시지 추가
      this.addMessage('user', filteredMessage);

      const requestBody: OllamaChatRequest = {
        model: options?.model || this.defaultModel,
        messages: this.conversationHistory,
        stream: false,
        options: {
          ...this.defaultOptions,
          ...options?.options
        }
      };

      console.log('📤 Chat 요청:', {
        model: requestBody.model,
        messageCount: requestBody.messages.length
      });

      const response = await fetch(`${this.apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorData = safeJsonParse<OllamaErrorResponse>(errorText, { error: 'Unknown error' });
        throw new Error(`Ollama API 오류: ${errorData.error}`);
      }

      const data: OllamaChatResponse = await response.json();
      
      if (!data.message?.content) {
        throw new Error('응답에 메시지 내용이 없습니다.');
      }

      // AI 응답 필터링
      const filteredResponse = ContentFilter.filterResponse(data.message.content);
      
      // 어시스턴트 메시지 추가
      this.addMessage('assistant', filteredResponse);
      
      console.log('📥 Chat 완료:', {
        responseLength: filteredResponse.length,
        totalMessages: this.conversationHistory.length
      });

      return filteredResponse;
    } catch (error) {
      console.error('❌ Chat 실패:', error);
      throw error;
    }
  }

  /**
   * Generate API를 사용한 응답 생성 (하위 호환성)
   */
  async generate(
    prompt: string,
    options?: Partial<OllamaGenerateRequest>
  ): Promise<OllamaGenerateResponse> {
    try {
      const requestBody: OllamaGenerateRequest = {
        model: options?.model || this.defaultModel,
        prompt,
        stream: false,
        system: options?.system,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 200,
          ...options?.options
        }
      };

      console.log('📤 Generate 요청:', {
        model: requestBody.model,
        promptLength: prompt.length
      });

      const response = await fetch(`${this.apiUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorData = safeJsonParse<OllamaErrorResponse>(errorText, { error: 'Unknown error' });
        throw new Error(`Ollama API 오류: ${errorData.error}`);
      }

      const data: OllamaGenerateResponse = await response.json();
      
      console.log('📥 Generate 완료:', {
        responseLength: data.response.length
      });

      return data;
    } catch (error) {
      console.error('❌ Generate 실패:', error);
      throw error;
    }
  }

  /**
   * 서버 상태 확인
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ 서버 상태 확인 실패:', error);
      return false;
    }
  }

  /**
   * 설치된 모델 목록 조회
   */
  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.apiUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`모델 목록 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      return data.models?.map((model: any) => model.name) || [];
    } catch (error) {
      console.error('❌ 모델 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 모델 설치 여부 확인
   */
  async isModelInstalled(modelName: string): Promise<boolean> {
    try {
      const models = await this.getModels();
      return models.includes(modelName);
    } catch (error) {
      console.error('❌ 모델 설치 확인 실패:', error);
      return false;
    }
  }

  /**
   * 정적 메서드: 서버 실행 여부 확인
   */
  static async isServerRunning(): Promise<boolean> {
    try {
      const response = await fetch(`${OLLAMA_API_BASE}/tags`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Steam 통계 업데이트 (향후 구현)
   */
  static async updateSteamStats(conversationCount: number, totalMessages: number): Promise<void> {
    // TODO: Steam 통계 업데이트 구현
    console.log('📊 Steam 통계 업데이트:', { conversationCount, totalMessages });
  }
} 