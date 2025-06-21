import React, { useState } from 'react'
import Live2DCanvas from './components/live2d/Live2DCanvas'
import './App.css'

function App() {
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{type: 'user' | 'bot', text: string}>>([])
  const [isModelLoaded, setIsModelLoaded] = useState(false)

  const handleSendMessage = () => {
    if (!message.trim()) return
    
    // 사용자 메시지 추가
    setChatHistory(prev => [...prev, { type: 'user', text: message }])
    
    // 봇 응답 시뮬레이션 (실제로는 API 호출)
    setTimeout(() => {
      const responses = [
        `"${message}"에 대한 답변입니다!`,
        "흥미로운 질문이네요!",
        "그것에 대해 더 자세히 설명해드릴게요.",
        "좋은 질문입니다!",
        "음... 생각해보겠습니다."
      ]
      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      setChatHistory(prev => [...prev, { type: 'bot', text: randomResponse }])
    }, 1000)
    
    setMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  const handleModelLoaded = () => {
    setIsModelLoaded(true)
    console.log('Live2D 모델이 성공적으로 로드되었습니다!')
  }

  const handleModelError = (error: Error) => {
    console.error('Live2D 모델 로드 실패:', error)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Live2D Chatbot</h1>
        {isModelLoaded && <span className="status-indicator">● 연결됨</span>}
      </header>
      
      <div className="app-content">
        <div className="live2d-container">
          <Live2DCanvas 
            modelPath="/models/your-model.model3.json"
            onModelLoaded={handleModelLoaded}
            onModelError={handleModelError}
          />
        </div>
        
        <div className="chat-container">
          <div className="chat-header">
            <h3>채팅</h3>
            <button 
              className="clear-button"
              onClick={() => setChatHistory([])}
            >
              대화 지우기
            </button>
          </div>
          
          <div className="chat-history">
            {chatHistory.length === 0 && (
              <div className="welcome-message">
                <p>안녕하세요! 무엇이든 물어보세요.</p>
                <p>Live2D 캐릭터와 대화를 시작해보세요!</p>
              </div>
            )}
            {chatHistory.map((chat, idx) => (
              <div key={idx} className={`chat-message ${chat.type}`}>
                <div className="message-avatar">
                  {chat.type === 'user' ? '👤' : '🤖'}
                </div>
                <div className="message-content">
                  <span className="message-text">{chat.text}</span>
                  <span className="message-time">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="chat-input">
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              className="message-input"
              disabled={!isModelLoaded}
            />
            <button 
              onClick={handleSendMessage} 
              className="send-button"
              disabled={!message.trim() || !isModelLoaded}
            >
              전송
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App 