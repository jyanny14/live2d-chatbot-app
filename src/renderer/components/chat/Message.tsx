import React from 'react'

interface MessageProps {
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  isTyping?: boolean
  isStreaming?: boolean
}

const Message: React.FC<MessageProps> = ({ 
  type, 
  content, 
  timestamp, 
  isTyping = false,
  isStreaming = false 
}) => {
  const isUser = type === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* 아바타 */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-green-500 text-white'
        }`}>
          {isUser ? '👤' : '🤖'}
        </div>

        {/* 메시지 내용 */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-4 py-2 rounded-2xl max-w-full break-words ${
            isUser
              ? 'bg-blue-500 text-white rounded-br-md'
              : 'bg-gray-700 text-white rounded-bl-md'
          }`}>
            {isTyping && !content ? (
              // 타이핑 인디케이터 (빈 메시지일 때)
              <div className="flex items-center gap-1">
                <span className="text-sm">AI가 타이핑 중</span>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            ) : (
              // 실제 메시지 내용
              <div className="text-sm leading-relaxed">
                <p>{content}</p>
                {/* 스트리밍 중일 때 커서 표시 */}
                {isStreaming && (
                  <span className="inline-block w-0.5 h-4 bg-white ml-1 animate-pulse"></span>
                )}
              </div>
            )}
          </div>
          
          {/* 타임스탬프 */}
          <span className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {timestamp.toLocaleTimeString('ko-KR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
            {isStreaming && (
              <span className="ml-2 text-green-400">스트리밍 중...</span>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}

export default Message 