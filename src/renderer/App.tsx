import React, { useState, useEffect } from 'react'
import Live2DCanvas from './components/live2d/Live2DCanvas'
import ChatWindow from './components/chat/ChatWindow'
import ChatInput from './components/chat/ChatInput'

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
}

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isModelLoaded, setIsModelLoaded] = useState(false)

  // AI 응답 생성 함수
  const generateAIResponse = (userMessage: string): string => {
    const responses = [
      "안녕하세요! 무엇을 도와드릴까요? 😊",
      "흥미로운 질문이네요! 더 자세히 설명해드릴게요.",
      "그것에 대해 생각해보겠습니다... 🤔",
      "좋은 질문입니다! 제가 아는 한도에서 답변해드릴게요.",
      "음... 그건 정말 재미있는 주제네요!",
      "도움이 되었다니 기쁩니다! 😄",
      "더 궁금한 것이 있으시면 언제든 물어보세요!",
      "오늘 날씨는 어떤가요? ☀️",
      "재미있는 이야기를 해드릴까요?",
      "무엇이든 물어보세요. 친근한 AI가 답변해드릴게요! 🤖"
    ]
    
    // 사용자 메시지에 따른 맞춤 응답
    if (userMessage.includes('안녕') || userMessage.includes('hello')) {
      return "안녕하세요! 반갑습니다! 😊 오늘은 어떤 이야기를 나눠볼까요?"
    }
    if (userMessage.includes('날씨')) {
      return "날씨에 대해 물어보시는군요! 🌤️ 오늘은 정말 좋은 날씨네요. 산책하기 딱 좋을 것 같아요!"
    }
    if (userMessage.includes('재미') || userMessage.includes('이야기')) {
      return "재미있는 이야기를 해드릴까요? 🎭 한 번은 작은 토끼가 큰 산을 오르려고 했는데..."
    }
    if (userMessage.includes('고마워') || userMessage.includes('감사')) {
      return "천만에요! 도움이 되었다니 정말 기쁩니다! 😄 더 궁금한 것이 있으시면 언제든 말씀해주세요!"
    }
    
    // 랜덤 응답
    return responses[Math.floor(Math.random() * responses.length)]
  }

  // 메시지 전송 처리
  const handleSendMessage = (content: string) => {
    if (!content.trim()) return

    // 사용자 메시지 추가
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    // AI 응답 시뮬레이션 (1-3초 지연)
    const responseDelay = 1000 + Math.random() * 2000
    
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generateAIResponse(content),
        timestamp: new Date()
      }

      setIsTyping(false)
      setMessages(prev => [...prev, aiResponse])
    }, responseDelay)
  }

  // 대화 지우기
  const handleClearChat = () => {
    setMessages([])
  }

  // Live2D 모델 로드 완료 처리
  const handleModelLoaded = () => {
    setIsModelLoaded(true)
    console.log('Live2D 모델이 성공적으로 로드되었습니다!')
  }

  const handleModelError = (error: Error) => {
    console.error('Live2D 모델 로드 실패:', error)
  }

  return (
    <div className="h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col">
      {/* 헤더 */}
      <header className="bg-black bg-opacity-20 backdrop-blur-md border-b border-white border-opacity-10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L2D</span>
            </div>
            <h1 className="text-white text-xl font-bold">Live2D Chatbot</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {isModelLoaded && (
              <div className="flex items-center gap-2 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">연결됨</span>
              </div>
            )}
            <div className="text-white text-sm opacity-70">
              {new Date().toLocaleDateString('ko-KR')}
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 왼쪽: Live2D 캐릭터 (50%) */}
        <div className="w-1/2 p-4">
          <div className="h-full bg-black bg-opacity-20 backdrop-blur-md rounded-xl overflow-hidden border border-white border-opacity-10">
            <Live2DCanvas 
              modelPath="/models/your-model.model3.json"
              onModelLoaded={handleModelLoaded}
              onModelError={handleModelError}
            />
          </div>
        </div>

        {/* 오른쪽: 채팅 인터페이스 (50%) */}
        <div className="w-1/2 flex flex-col">
          {/* 채팅 윈도우 */}
          <div className="flex-1 p-4 pb-0">
            <ChatWindow 
              messages={messages}
              isTyping={isTyping}
              onClearChat={handleClearChat}
            />
          </div>

          {/* 채팅 입력창 */}
          <div className="p-4 pt-0">
            <ChatInput 
              onSendMessage={handleSendMessage}
              disabled={!isModelLoaded || isTyping}
              placeholder={isTyping ? "AI가 응답 중입니다..." : "메시지를 입력하세요..."}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App 