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

  /**
   * 텍스트가 부적절한 내용을 포함하는지 확인
   */
  public static isInappropriate(text: string): boolean {
    const lowerText = text.toLowerCase();
    
    // 부적절한 단어 체크
    for (const word of this.INAPPROPRIATE_WORDS) {
      if (lowerText.includes(word.toLowerCase())) {
        return true;
      }
    }

    // 부적절한 패턴 체크
    for (const pattern of this.INAPPROPRIATE_PATTERNS) {
      if (pattern.test(text)) {
        return true;
      }
    }

    return false;
  }

  /**
   * AI 응답을 필터링하고 안전한 응답으로 대체
   */
  public static filterResponse(response: string): string {
    if (this.isInappropriate(response)) {
      return this.getRandomSafeResponse();
    }
    return response;
  }

  /**
   * 사용자 입력을 필터링
   */
  public static filterUserInput(input: string): { isAppropriate: boolean; filteredInput: string } {
    if (this.isInappropriate(input)) {
      return {
        isAppropriate: false,
        filteredInput: "부적절한 입력이 감지되었습니다."
      };
    }
    return {
      isAppropriate: true,
      filteredInput: input
    };
  }

  /**
   * 랜덤 안전 응답 반환
   */
  private static getRandomSafeResponse(): string {
    const randomIndex = Math.floor(Math.random() * this.SAFE_RESPONSES.length);
    const response = this.SAFE_RESPONSES[randomIndex];
    
    // TypeScript 안전성 보장
    if (response === undefined) {
      return "죄송합니다. 그런 내용에 대해서는 답변할 수 없습니다.";
    }
    
    return response;
  }

  /**
   * 연령 등급에 따른 필터링 강도 조정
   */
  public static setAgeRating(rating: 'E' | 'T' | 'M' | 'AO'): void {
    switch (rating) {
      case 'E': // Everyone (전체 이용가)
        // 가장 엄격한 필터링
        break;
      case 'T': // Teen (청소년 이용가)
        // 중간 수준 필터링
        break;
      case 'M': // Mature (성인 이용가)
        // 완화된 필터링
        break;
      case 'AO': // Adults Only (성인 전용)
        // 최소한의 필터링
        break;
    }
  }

  /**
   * 필터링 로그 기록 (Steam 심사용)
   */
  public static logFilteredContent(originalText: string, reason: string): void {
    console.log(`[CONTENT FILTER] Filtered: "${originalText}" - Reason: ${reason}`);
    // 실제 구현에서는 로그 파일에 기록
  }

  filterUserInput(input: string): string {
    // TODO: 부적절한 내용 필터링 로직 구현
    return input;
  }

  filterResponse(response: string): string {
    // TODO: 부적절한 응답 필터링 로직 구현
    return response;
  }
} 