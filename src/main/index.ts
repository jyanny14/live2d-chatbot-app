import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { OllamaService } from './ollama-service'
import { DEFAULT_MODEL } from '../constants/models'
import * as fs from 'fs'

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

// GPU 가속 및 DPI 스케일링 최적화
app.commandLine.appendSwitch('enable-gpu')
app.commandLine.appendSwitch('high-dpi-support', '1')
app.commandLine.appendSwitch('force-device-scale-factor', '1')

let win: BrowserWindow | null = null
let ollamaService: OllamaService

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    transparent: true,
    frame: false,
    backgroundColor: '#00000000',
    hasShadow: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
      offscreen: false,
      webSecurity: false,
      zoomFactor: 1.0,
      enableWebSQL: false,
      spellcheck: false
    },
    icon: join(__dirname, '../../public/icon.ico'),
    show: false
  })

  win.once('ready-to-show', () => win?.show())

  // 개발 모드와 프로덕션 모드 구분
  const isDev = process.env.IS_DEV === 'true'
  
  if (isDev) {
    // 개발 모드: Vite 개발 서버 로드
    win.loadURL('http://localhost:5174')
    win.webContents.openDevTools()
  } else {
    // 프로덕션 모드: 빌드된 파일 로드
    win.loadFile(join(__dirname, '../../dist/index.html'))
  }

  win.on('closed', () => {
    win = null
  })
}

async function initializeOllama() {
  try {
    console.log('🔄 Ollama 서비스를 초기화합니다...')
    
    // Ollama 디렉토리 확인
    const ollamaDir = join(__dirname, '../../ollama')
    const ollamaBinDir = join(ollamaDir, 'bin')
    
    console.log('Ollama 디렉토리 확인:', ollamaDir)
    console.log('Ollama 바이너리 디렉토리 확인:', ollamaBinDir)
    
    if (!fs.existsSync(ollamaDir)) {
      console.log('⚠️ Ollama 디렉토리가 존재하지 않습니다.')
      console.log('💡 다음 명령어로 Ollama를 설치하세요: npm run download-ollama')
      return
    }
    
    if (!fs.existsSync(ollamaBinDir)) {
      console.log('⚠️ Ollama 바이너리 디렉토리가 존재하지 않습니다.')
      console.log('💡 다음 명령어로 Ollama를 설치하세요: npm run download-ollama')
      return
    }
    
    const ollamaBinary = join(ollamaBinDir, process.platform === 'win32' ? 'ollama.exe' : 'ollama')
    if (!fs.existsSync(ollamaBinary)) {
      console.log('⚠️ Ollama 바이너리가 존재하지 않습니다.')
      console.log('💡 다음 명령어로 Ollama를 설치하세요: npm run download-ollama')
      return
    }
    
    console.log('✅ Ollama 바이너리 발견:', ollamaBinary)
    
    ollamaService = new OllamaService()
    await ollamaService.start()
    
    if (ollamaService.isExternalServer()) {
      console.log('✅ 외부에서 실행 중인 Ollama 서버를 사용합니다.')
    } else {
      console.log('✅ Ollama 서비스가 성공적으로 초기화되었습니다.')
    }

    // 모델 설치 확인 및 설치
    try {
      await ollamaService.ensureModelInstalled(DEFAULT_MODEL)
    } catch (error) {
      console.error('⚠️ 모델 설치 실패:', error)
      console.log(`💡 수동으로 모델을 설치하려면: .\\ollama\\bin\\ollama.exe pull ${DEFAULT_MODEL}`)
    }
  } catch (error) {
    console.error('❌ Ollama 서비스 초기화 실패:', error)
    console.log('⚠️ Ollama 서비스 없이 앱을 실행합니다.')
    console.log('💡 문제 해결 방법:')
    console.log('   1. npm run download-ollama 실행')
    console.log('   2. npm run setup-gemma 실행')
    console.log('   3. 앱 재시작')
    // Ollama 서비스 실패 시에도 앱은 계속 실행
  }
}

app.on('ready', async () => {
  console.log('🚀 Live2D Chatbot 앱을 시작합니다...')
  
  // Ollama 서비스 초기화
  await initializeOllama()
  
  // 메인 윈도우 생성
  createWindow()
  
  console.log('✅ 앱 초기화가 완료되었습니다.')
})

app.on('window-all-closed', async () => {
  console.log('🔄 앱을 종료합니다...')
  
  // Ollama 서비스 정리
  if (ollamaService) {
    try {
      await ollamaService.stop()
      console.log('✅ Ollama 서비스가 정상적으로 종료되었습니다.')
    } catch (error) {
      console.error('❌ Ollama 서비스 종료 중 오류:', error)
    }
  }
  
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('before-quit', async () => {
  console.log('🔄 앱 종료 준비 중...')
  
  // Ollama 서비스 정리
  if (ollamaService) {
    try {
      await ollamaService.stop()
      console.log('✅ Ollama 서비스 정리 완료')
    } catch (error) {
      console.error('❌ Ollama 서비스 정리 실패:', error)
    }
  }
})

// 예기치 않은 오류 처리
process.on('uncaughtException', (error) => {
  console.error('❌ 예기치 않은 오류:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 처리되지 않은 Promise 거부:', reason)
}) 