import React, { useState, KeyboardEvent } from 'react'

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void> | void
  disabled?: boolean
  placeholder?: string
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "메시지를 입력하세요..." 
}) => {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    if (message.trim() && !disabled && !isSending) {
      setIsSending(true)
      try {
        await onSendMessage(message.trim())
        setMessage('')
      } catch (error) {
        console.error('메시지 전송 실패:', error)
      } finally {
        setIsSending(false)
      }
    }
  }

  const handleKeyPress = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      await handleSend()
    }
  }

  return (
    <div className="flex items-center gap-3 p-4 bg-gray-800 border-t border-gray-700">
      {/* 입력창 */}
      <div className="flex-1 relative">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled || isSending}
          className="w-full px-4 py-3 bg-gray-700 text-white placeholder-gray-400 rounded-2xl border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* 전송 버튼 */}
      <button
        onClick={handleSend}
        disabled={!message.trim() || disabled || isSending}
        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-all duration-200 flex items-center gap-2 group"
      >
        {isSending ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>전송 중...</span>
          </>
        ) : (
          <>
            <span>전송</span>
            <svg 
              className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
              />
            </svg>
          </>
        )}
      </button>
    </div>
  )
}

export default ChatInput 