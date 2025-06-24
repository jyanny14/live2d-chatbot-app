import React from 'react'
import './App.css'
import Live2DCanvas from './components/live2d/Live2DCanvas'
import ChatWindow from './components/chat/ChatWindow'
import ChatInput from './components/chat/ChatInput'
import { LIVE2D_MODEL_PATH } from './constants/live2d'

// ChatMessage 타입: id, type('user'|'ai'), content, timestamp
interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
}

const App: React.FC = () => {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    { id: 'welcome', type: 'ai', content: '안녕하세요! 무엇을 도와드릴까요?', timestamp: new Date() }
  ])
  const [isTyping, setIsTyping] = React.useState(false)
  const [isModelLoaded, setIsModelLoaded] = React.useState(false)

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
  const handleSend = (text: string) => {
    if (!text.trim()) return
    setMessages(prev => [...prev, { id: Date.now().toString(), type: 'user', content: text, timestamp: new Date() }])
    setIsTyping(true)
    // AI 응답 시뮬레이션 (실제 API 연동 필요)
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generateAIResponse(text),
        timestamp: new Date()
      }
      setIsTyping(false)
      setMessages(prev => [...prev, aiResponse])
    }, 1200)
  }

  // 대화 지우기
  const handleClear = () => {
    setMessages([{ id: 'welcome', type: 'ai', content: '안녕하세요! 무엇을 도와드릴까요?', timestamp: new Date() }])
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
    <div className="app-root flex flex-row h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="live2d-panel flex-1 flex items-center justify-center p-4">
        <Live2DCanvas 
          modelPath={LIVE2D_MODEL_PATH}
          onModelLoaded={handleModelLoaded}
          onModelError={handleModelError}
        />
      </div>
      <div className="chat-panel w-[420px] flex flex-col h-full bg-white/10 backdrop-blur-md border-l border-white/10 shadow-xl">
        <ChatWindow messages={messages} isTyping={isTyping} onClearChat={handleClear} />
        <ChatInput onSendMessage={handleSend} />
      </div>
    </div>
  )
}

export default App 