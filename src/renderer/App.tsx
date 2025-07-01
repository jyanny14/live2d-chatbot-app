import React, { useRef } from 'react'
import './App.css'
import Live2DCanvas, { Live2DCanvasHandle } from './components/live2d/Live2DCanvas'
import ChatWindow from './components/chat/ChatWindow'
import ChatInput from './components/chat/ChatInput'
import { LIVE2D_MODEL_PATH } from './constants/live2d'
import { OllamaAPI } from './utils/ollama-api'

// ChatMessage 타입: id, type('user'|'ai'), content, timestamp
interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
}

const App: React.FC = () => {
  // 고유한 ID 생성 함수
  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const [messages, setMessages] = React.useState<ChatMessage[]>([
    { id: 'welcome', type: 'ai', content: '안녕하세요! 무엇을 도와드릴까요?', timestamp: new Date() }
  ])
  const [isTyping, setIsTyping] = React.useState(false)
  const [isModelLoaded, setIsModelLoaded] = React.useState(false)
  const [isOllamaConnected, setIsOllamaConnected] = React.useState(false)
  const live2dRef = useRef<Live2DCanvasHandle>(null)
  
  // OllamaAPI 인스턴스 생성
  const ollamaAPI = React.useMemo(() => new OllamaAPI(), [])

  // Ollama 연결 상태 확인
  React.useEffect(() => {
    const checkOllamaConnection = async () => {
      try {
        const isRunning = await ollamaAPI.healthCheck()
        setIsOllamaConnected(isRunning)
        if (isRunning) {
          console.log('✅ Ollama 서버에 연결되었습니다.')
        } else {
          console.log('⚠️ Ollama 서버가 실행되지 않았습니다.')
        }
      } catch (error) {
        console.error('❌ Ollama 연결 확인 실패:', error)
        setIsOllamaConnected(false)
      }
    }

    checkOllamaConnection()
    // 주기적으로 연결 상태 확인
    const interval = setInterval(checkOllamaConnection, 10000)
    return () => clearInterval(interval)
  }, [ollamaAPI])

  // LLM을 사용한 AI 응답 생성
  const generateAIResponse = async (userMessage: string) => {
    try {
      setIsTyping(true)
      console.log('🤖 AI 응답 생성 시작:', userMessage)

      // AI 응답 생성
      const aiResponse = await ollamaAPI.safeChat([
        { role: 'user', content: userMessage }
      ])

      console.log('🤖 AI 응답 생성 완료:', aiResponse)

      // AI 응답 추가
      const aiMsg: ChatMessage = {
        id: generateUniqueId(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMsg])

      // Steam 통계 업데이트
      await OllamaAPI.updateSteamStats(messages.length + 2, messages.length + 2)

    } catch (error) {
      console.error('❌ AI 응답 생성 실패:', error)
      
      // 에러 메시지 추가
      const errorMsg: ChatMessage = {
        id: generateUniqueId(),
        type: 'ai',
        content: '죄송합니다. 응답을 생성하는 중에 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsTyping(false)
    }
  }

  // 메시지 전송 처리
  const handleSend = async (text: string) => {
    console.log('📤 handleSend 호출됨:', { text, textLength: text.length });
    
    if (!text.trim()) {
      console.log('⚠️ 빈 메시지 무시됨');
      return
    }

    // 사용자 메시지 추가
    const userMessage: ChatMessage = {
      id: generateUniqueId(),
      type: 'user',
      content: text,
      timestamp: new Date()
    }
    
    console.log('👤 사용자 메시지 생성:', userMessage);
    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    // Live2D 캐릭터 랜덤 모션 트리거
    live2dRef.current?.triggerRandomMotion()

    try {
      console.log('🤖 AI 응답 생성 시작...');
      // AI 응답 생성
      await generateAIResponse(text)

    } catch (error) {
      console.error('❌ 메시지 처리 실패:', error)
      setIsTyping(false)
      
      // 오류 메시지 추가
      const errorMessage: ChatMessage = {
        id: generateUniqueId(),
        type: 'ai',
        content: "죄송합니다. 응답을 생성하는 중에 오류가 발생했습니다.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }
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
          ref={live2dRef}
          modelPath={LIVE2D_MODEL_PATH}
          onModelLoaded={handleModelLoaded}
          onModelError={handleModelError}
        />
      </div>
      <div className="chat-panel w-[420px] flex flex-col h-full bg-white/10 backdrop-blur-md border-l border-white/10 shadow-xl">
        {/* Ollama 연결 상태 표시 */}
        <div className={`px-4 py-2 text-xs text-center ${
          isOllamaConnected 
            ? 'bg-green-500/20 text-green-300' 
            : 'bg-red-500/20 text-red-300'
        }`}>
          {isOllamaConnected ? '🤖 AI 연결됨' : '⚠️ AI 연결 안됨'}
        </div>
        
        <ChatWindow 
          messages={messages} 
          isTyping={isTyping} 
          onClearChat={handleClear} 
        />
        <ChatInput 
          onSendMessage={handleSend} 
          disabled={!isOllamaConnected}
          placeholder={isOllamaConnected ? "메시지를 입력하세요..." : "AI 서버 연결 대기 중..."}
        />
      </div>
    </div>
  )
}

export default App 