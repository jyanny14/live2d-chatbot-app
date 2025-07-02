import React, { useRef, useEffect } from 'react'
import Message from './Message'

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
}

interface ChatWindowProps {
  messages: ChatMessage[]
  isTyping?: boolean
  onClearChat?: () => void
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, 
  isTyping = false, 
  onClearChat 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 스크롤을 하단으로 자동 이동
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="text-white font-semibold">Live2D 챗봇</h3>
          <span className="text-xs text-gray-400">온라인</span>
        </div>
        
        {onClearChat && (
          <button
            onClick={onClearChat}
            className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200"
          >
            대화 지우기
          </button>
        )}
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          // 환영 메시지
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Live2D 챗봇에 오신 것을 환영합니다!</h3>
            <p className="text-sm mb-4">무엇이든 물어보세요. 친근한 AI가 답변해드릴게요.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1 bg-gray-700 rounded-full text-xs">안녕하세요</span>
              <span className="px-3 py-1 bg-gray-700 rounded-full text-xs">날씨는 어때요?</span>
              <span className="px-3 py-1 bg-gray-700 rounded-full text-xs">재미있는 이야기 해주세요</span>
            </div>
          </div>
        ) : (
          // 메시지 목록
          <>
            {messages.map((message, index) => {
              // 마지막 AI 메시지가 스트리밍 중인지 확인
              const isLastMessage = index === messages.length - 1;
              const isStreaming = isLastMessage && message.type === 'ai' && isTyping;
              
              return (
                <Message
                  key={message.id}
                  type={message.type}
                  content={message.content}
                  timestamp={message.timestamp}
                  isStreaming={isStreaming}
                />
              );
            })}
            
            {/* 타이핑 인디케이터 (빈 메시지일 때만) */}
            {isTyping && messages.length > 0 && messages[messages.length - 1].type === 'user' && (
              <Message
                type="ai"
                content=""
                timestamp={new Date()}
                isTyping={true}
              />
            )}
          </>
        )}
        
        {/* 스크롤 앵커 */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

export default ChatWindow 