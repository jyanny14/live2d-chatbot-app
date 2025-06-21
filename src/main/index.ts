import { app, BrowserWindow } from 'electron'
import { join } from 'path'

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

// GPU 가속 및 DPI 스케일링 최적화
app.commandLine.appendSwitch('enable-gpu')
app.commandLine.appendSwitch('high-dpi-support', '1')
app.commandLine.appendSwitch('force-device-scale-factor', '1')

let win: BrowserWindow | null = null

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

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
}) 