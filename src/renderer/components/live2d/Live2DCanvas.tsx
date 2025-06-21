import React, { useEffect, useRef, useState } from 'react'

interface Live2DCanvasProps {
  modelPath?: string
  onModelLoaded?: (model: any) => void
  onModelError?: (error: Error) => void
}

const Live2DCanvas: React.FC<Live2DCanvasProps> = ({ 
  modelPath = "/models/your-model.model3.json",
  onModelLoaded,
  onModelError 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setError('Canvas 2D 컨텍스트를 가져올 수 없습니다')
      setIsLoading(false)
      return
    }

    // 캔버스 크기 설정
    canvas.width = 400
    canvas.height = 600

    // 기본 배경 (투명)
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 마우스 상호작용
    let mouseX = canvas.width / 2
    let mouseY = canvas.height / 2
    let rotation = 0

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseX = event.clientX - rect.left
      mouseY = event.clientY - rect.top
      
      // 마우스 위치에 따른 회전 계산
      const centerX = canvas.width / 2
      rotation = (mouseX - centerX) / centerX * 0.1
    }

    const handleClick = () => {
      // 클릭 시 간단한 애니메이션
      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.scale(1.1, 1.1)
      ctx.translate(-canvas.width / 2, -canvas.height / 2)
      
      setTimeout(() => {
        ctx.restore()
      }, 100)
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('click', handleClick)

    // 애니메이션 루프
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Live2D 모델이 없을 때 기본 텍스트 표시
      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate(rotation)
      
      // 텍스트 스타일 설정
      ctx.fillStyle = 'white'
      ctx.font = '20px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // 그림자 효과
      ctx.shadowColor = 'black'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      
      // 텍스트 그리기
      ctx.fillText('Live2D Model', 0, -20)
      ctx.fillText('(모델 파일을 로드하세요)', 0, 10)
      
      ctx.restore()
      
      animationRef.current = requestAnimationFrame(animate)
    }

    // 애니메이션 시작
    animate()

    // Live2D 모델 로드 시도 (현재는 시뮬레이션)
    const loadModel = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // 실제 Live2D 모델 로드 로직은 여기에 구현
        // 현재는 시뮬레이션을 위해 지연
        await new Promise(resolve => setTimeout(resolve, 2000))

        // 모델 로드 성공 시뮬레이션
        setIsLoading(false)
        onModelLoaded?.({ type: 'simulated' })

      } catch (error) {
        console.error('Live2D 모델 로드 실패:', error)
        setError('모델을 로드할 수 없습니다')
        setIsLoading(false)
        onModelError?.(error as Error)
      }
    }

    loadModel()

    // 클린업
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('click', handleClick)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [modelPath, onModelLoaded, onModelError])

  return (
    <div className="live2d-canvas-container">
      <canvas 
        ref={canvasRef} 
        className="live2d-canvas"
        style={{ 
          width: 400, 
          height: 600, 
          background: 'transparent',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px'
        }} 
      />
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Live2D 모델 로딩 중...</p>
        </div>
      )}
      {error && (
        <div className="error-overlay">
          <p>{error}</p>
          <p className="error-hint">public/models/ 폴더에 모델 파일을 추가하세요</p>
        </div>
      )}
    </div>
  )
}

export default Live2DCanvas 