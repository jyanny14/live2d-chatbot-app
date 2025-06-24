import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'
import * as PIXI from 'pixi.js'
import { Live2DModel } from 'pixi-live2d-display'
import { LIVE2D_MODEL_PATH } from '../../constants/live2d'

interface Live2DCanvasProps {
  modelPath?: string
  onModelLoaded?: (model: any) => void
  onModelError?: (error: Error) => void
}

export interface Live2DCanvasHandle {
  triggerRandomMotion: () => void
}

const Live2DCanvas = forwardRef<Live2DCanvasHandle, Live2DCanvasProps>(({ 
  modelPath = LIVE2D_MODEL_PATH,
  onModelLoaded,
  onModelError 
}, ref) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const modelRef = useRef<Live2DModel | null>(null)

  // 랜덤 모션 트리거 함수
  const triggerRandomMotion = () => {
    const model = modelRef.current
    if (!model) return
    // 모션 그룹 추출 (타입 우회)
    const motionsObj = (model as any).internalModel?.motions || {}
    const groups = Object.keys(motionsObj)
    if (groups.length === 0) return
    // 랜덤 그룹, 랜덤 모션 선택
    const group = groups[Math.floor(Math.random() * groups.length)]
    const motions = motionsObj[group]
    if (!motions || motions.length === 0) return
    const idx = Math.floor(Math.random() * motions.length)
    // 모션 실행
    model.motion(group, idx)
  }

  useImperativeHandle(ref, () => ({
    triggerRandomMotion
  }))

  useEffect(() => {
    if (!canvasRef.current) return

    // Live2DModel Ticker 등록 (중복 방지)
    if (!(window as any).__live2dTickerRegistered) {
      Live2DModel.registerTicker(PIXI.Ticker.shared.constructor as typeof PIXI.Ticker)
      ;(window as any).__live2dTickerRegistered = true
    }

    let app: PIXI.Application | null = null
    let model: Live2DModel | null = null
    let isUnmounted = false

    const initializePIXI = async () => {
      try {
        app = new PIXI.Application({
          width: 400,
          height: 600,
          backgroundAlpha: 0,
          antialias: true,
          autoDensity: true,
          resolution: window.devicePixelRatio || 1,
          powerPreference: 'high-performance',
        })
        appRef.current = app
        if (canvasRef.current && app.view) {
          canvasRef.current.appendChild(app.view as HTMLCanvasElement)
        }

        setIsLoading(true)
        setError(null)
        model = await Live2DModel.from(modelPath)
        if (isUnmounted) return
        modelRef.current = model

        // bounding box 기반 자동 스케일 조정 (캔버스의 80% 크기)
        model.scale.set(1)
        await new Promise(r => setTimeout(r, 0)) // 한 프레임 대기(정확한 bounds 측정)
        const bounds = model.getBounds()
        const actualWidth = bounds.width
        const targetWidth = app.screen.width * 0.8
        const scale = targetWidth / actualWidth
        model.scale.set(scale)

        // layout 정보 활용: 자동 스케일/위치 조정
        const layout = (model as any).internalModel?.settings?.layout;
        if (layout) {
          // 위치 자동 조정
          if (layout.center_x !== undefined) {
            model.x = app.screen.width * (0.5 + layout.center_x / 2)
          } else {
            model.x = app.screen.width / 2
          }
          if (layout.center_y !== undefined) {
            model.y = app.screen.height * (1 + layout.center_y / 2)
          } else {
            model.y = app.screen.height * 0.8
          }
          model.anchor.set(0.5, 1)
        } else {
          // layout 정보가 없으면 기존 방식 fallback
          model.x = app.screen.width / 2
          model.y = app.screen.height * 0.8
          model.anchor.set(0.5, 1)
        }

        // 기본 모션(있으면) 재생
        if (model.internalModel.motionManager) {
          try {
            const motions = model.internalModel.motionManager.definitions
            if (motions && Array.isArray(motions) && motions.length > 0) {
              const firstMotion = motions[0]
              if (firstMotion && typeof firstMotion === 'object' && 'name' in firstMotion) {
                model.motion(firstMotion.name as string)
              }
            }
          } catch (motionError) {}
        }

        // 모델이 완전히 준비된 후에만 addChild (app, stage, model 모두 살아있는지 재확인)
        if (appRef.current && appRef.current.stage && model && model instanceof PIXI.Container) {
          appRef.current.stage.addChild(model)
        }
        setIsLoading(false)
        onModelLoaded?.(model)
      } catch (error) {
        if (!isUnmounted) {
          setError('Live2D 모델 로드 실패: ' + (error as Error).message)
          setIsLoading(false)
          onModelError?.(error as Error)
        }
      }
    }

    initializePIXI()

    // 클린업
    return () => {
      isUnmounted = true
      const app = appRef.current
      const model = modelRef.current
      // model이 stage에 있고, PIXI.Container라면 명확하게 제거
      if (app && app.stage && model && model instanceof PIXI.Container && model.parent) {
        try {
          app.stage.removeChild(model)
        } catch (e) {}
      }
      if (app && app.ticker) {
        try {
          app.ticker.stop()
        } catch (e) {}
      }
      if (app && typeof app.destroy === 'function') {
        try {
          app.destroy(true)
        } catch (e) {}
      }
      appRef.current = null
      modelRef.current = null
    }
  }, [modelPath])

  return (
    <div className="live2d-canvas-container">
      <div ref={canvasRef} className="live2d-canvas" />
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
})

export default Live2DCanvas 