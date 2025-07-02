import { AppError } from '../types';

// Steam 제출을 위한 콘텐츠 필터링 시스템
export class ContentFilter {
  private static readonly INAPPROPRIATE_WORDS = [
    // 한국어 부적절한 단어들
    '욕설', '비속어', '성적', '폭력', '혐오',
    // 영어 부적절한 단어들
    'fuck', 'shit', 'bitch', 'ass', 'damn', 'hell',
    'porn', 'sex', 'nude', 'naked', 'penis', 'vagina',
    'kill', 'murder', 'suicide', 'death', 'blood',
    'hate', 'racist', 'nazi', 'terrorist'
  ];

  private static readonly INAPPROPRIATE_PATTERNS = [
    /성적.*내용/gi,
    /폭력.*묘사/gi,
    /자살.*방법/gi,
    /약물.*사용/gi,
    /범죄.*방법/gi,
    /혐오.*표현/gi,
    /차별.*내용/gi
  ];

  private static readonly SAFE_RESPONSES = [
    "죄송합니다. 그런 내용에 대해서는 답변할 수 없습니다.",
    "부적절한 질문이므로 답변을 드릴 수 없습니다.",
    "다른 주제로 대화를 이어가시겠어요?",
    "그런 내용보다는 재미있는 이야기를 나눠보는 건 어떨까요?",
    "안전하고 건전한 대화를 나누어요!",
    "다른 질문이 있으시면 언제든 말씀해 주세요."
  ];

  private static ageRating: 'E' | 'T' | 'M' | 'AO' = 'E';

  /**
   * 텍스트가 부적절한 내용을 포함하는지 확인
   */
  public static isInappropriate(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    
    const lowerText = text.toLowerCase();
    
    // 부적절한 단어 체크
    for (const word of this.INAPPROPRIATE_WORDS) {
      if (lowerText.includes(word.toLowerCase())) {
        this.logFilteredContent(text, `부적절한 단어: ${word}`);
        return true;
      }
    }

    // 부적절한 패턴 체크
    for (const pattern of this.INAPPROPRIATE_PATTERNS) {
      if (pattern.test(text)) {
        this.logFilteredContent(text, `부적절한 패턴: ${pattern.source}`);
        return true;
      }
    }

    return false;
  }

  /**
   * AI 응답을 필터링하고 안전한 응답으로 대체
   */
  public static filterResponse(response: string): string {
    if (!response || typeof response !== 'string') {
      return this.getRandomSafeResponse();
    }

    // think 태그와 내부 추론 과정 제거
    let filteredResponse = response;
    
    // <think> 태그와 그 내용 제거
    filteredResponse = filteredResponse.replace(/<think>[\s\S]*?<\/think>/gi, '');
    
    // <reasoning> 태그와 그 내용 제거
    filteredResponse = filteredResponse.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
    
    // <thought> 태그와 그 내용 제거
    filteredResponse = filteredResponse.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
    
    // 내부 추론 과정을 나타내는 패턴들 제거
    filteredResponse = filteredResponse.replace(/Okay,.*?So,/gis, '');
    filteredResponse = filteredResponse.replace(/Let me.*?Yep,/gis, '');
    filteredResponse = filteredResponse.replace(/I need to.*?good./gis, '');
    
    // 빈 줄 정리
    filteredResponse = filteredResponse.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // 앞뒤 공백 제거
    filteredResponse = filteredResponse.trim();
    
    if (this.isInappropriate(filteredResponse)) {
      this.logFilteredContent(response, 'AI 응답 필터링');
      return this.getRandomSafeResponse();
    }
    
    return filteredResponse;
  }

  /**
   * 사용자 입력을 필터링
   */
  public static filterUserInput(input: string): { isAppropriate: boolean; filteredInput: string } {
    if (!input || typeof input !== 'string') {
      return {
        isAppropriate: false,
        filteredInput: "빈 입력이 감지되었습니다."
      };
    }

    if (this.isInappropriate(input)) {
      this.logFilteredContent(input, '사용자 입력 필터링');
      return {
        isAppropriate: false,
        filteredInput: "부적절한 입력이 감지되었습니다."
      };
    }
    
    return {
      isAppropriate: true,
      filteredInput: input.trim()
    };
  }

  /**
   * 랜덤 안전 응답 반환
   */
  private static getRandomSafeResponse(): string {
    const randomIndex = Math.floor(Math.random() * this.SAFE_RESPONSES.length);
    const response = this.SAFE_RESPONSES[randomIndex];
    
    return response || "죄송합니다. 그런 내용에 대해서는 답변할 수 없습니다.";
  }

  /**
   * 연령 등급 설정
   */
  public static setAgeRating(rating: 'E' | 'T' | 'M' | 'AO'): void {
    this.ageRating = rating;
    console.log(`[CONTENT FILTER] 연령 등급 설정: ${rating}`);
  }

  /**
   * 현재 연령 등급 반환
   */
  public static getAgeRating(): 'E' | 'T' | 'M' | 'AO' {
    return this.ageRating;
  }

  /**
   * 필터링 로그 기록 (Steam 심사용)
   */
  public static logFilteredContent(originalText: string, reason: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[CONTENT FILTER] ${timestamp} - ${reason}: "${originalText.substring(0, 100)}..."`);
    
    // TODO: 실제 구현에서는 로그 파일에 기록
    // this.writeToLogFile(timestamp, reason, originalText);
  }

  /**
   * 필터링 통계 반환
   */
  public static getFilterStats(): { totalFiltered: number; lastFiltered: string | null } {
    // TODO: 실제 필터링 통계 구현
    return {
      totalFiltered: 0,
      lastFiltered: null
    };
  }
} 