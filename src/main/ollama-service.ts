import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { app } from 'electron';
import axios from 'axios';
import * as fs from 'fs';

// 기본 모델 상수
export const DEFAULT_MODEL = 'gemma:2b';

export class OllamaService {
  private ollamaProcess: ChildProcess | null = null;
  private ollamaPath: string;
  private isRunning = false;
  private isExternalOllama = false; // 외부에서 실행된 Ollama인지 확인

  constructor() {
    const isDev = process.env.IS_DEV === 'true';
    if (isDev) {
      // 개발 모드: 프로젝트 루트의 ollama 디렉토리 사용
      this.ollamaPath = join(__dirname, '../../ollama/bin', process.platform === 'win32' ? 'ollama.exe' : 'ollama');
    } else {
      // 프로덕션 모드: 앱 리소스 디렉토리 사용
      this.ollamaPath = join(process.resourcesPath, 'ollama', process.platform === 'win32' ? 'ollama.exe' : 'ollama');
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Ollama 서버가 이미 실행 중입니다.');
      return;
    }

    try {
      console.log('🔄 Ollama 서버를 시작합니다...');
      console.log('Ollama 경로:', this.ollamaPath);
      
      // 시작 전 기존 프로세스 정리
      await this.cleanupExistingProcesses();
      
      // 먼저 이미 실행 중인 Ollama 서버가 있는지 확인
      const isAlreadyRunning = await this.checkIfOllamaIsRunning();
      if (isAlreadyRunning) {
        console.log('✅ 이미 실행 중인 Ollama 서버를 발견했습니다. 기존 서버를 사용합니다.');
        this.isRunning = true;
        this.isExternalOllama = true;
        return;
      }
      
      // Ollama 바이너리 존재 확인
      if (!fs.existsSync(this.ollamaPath)) {
        throw new Error(`Ollama 바이너리를 찾을 수 없습니다: ${this.ollamaPath}`);
      }

      console.log('✅ Ollama 바이너리 발견:', this.ollamaPath);
      
      // 새 Ollama 서버 시작
      await this.startNewOllama();

    } catch (error) {
      console.error('❌ Ollama 서버 시작 실패:', error);
      throw error;
    }
  }

  private async cleanupExistingProcesses(): Promise<void> {
    try {
      console.log('🧹 기존 Ollama 프로세스를 정리합니다...');
      
      if (process.platform === 'win32') {
        // Windows에서 Ollama 프로세스 종료
        const { exec } = require('child_process');
        
        // ollama.exe 프로세스 종료
        exec('taskkill /f /im ollama.exe 2>nul', (error: any) => {
          if (!error) {
            console.log('✅ ollama.exe 프로세스를 종료했습니다.');
          }
        });
        
        // ollama app.exe 프로세스 종료
        exec('taskkill /f /im "ollama app.exe" 2>nul', (error: any) => {
          if (!error) {
            console.log('✅ ollama app.exe 프로세스를 종료했습니다.');
          }
        });
        
        // 포트 11434 사용 중인 프로세스 확인 및 종료
        exec('for /f "tokens=5" %a in (\'netstat -ano ^| findstr :11434\') do taskkill /f /pid %a 2>nul', (error: any) => {
          if (!error) {
            console.log('✅ 포트 11434 사용 프로세스를 종료했습니다.');
          }
        });
        
      } else {
        // Unix/Linux/macOS에서 Ollama 프로세스 종료
        const { exec } = require('child_process');
        exec('pkill -f ollama', (error: any) => {
          if (!error) {
            console.log('✅ Ollama 프로세스를 종료했습니다.');
          }
        });
      }
      
      // 프로세스 종료 대기
      console.log('⏳ 프로세스 정리 완료 대기 중...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error('⚠️ 프로세스 정리 중 오류:', error);
    }
  }

  private async startNewOllama(): Promise<void> {
    try {
      console.log('🚀 새로운 Ollama 서버를 시작합니다...');
      
      this.ollamaProcess = spawn(this.ollamaPath, ['serve'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false,
        cwd: process.cwd(),
        env: {
          ...process.env,
          // 모델 경로 설정 (Steam 패키지화용)
          OLLAMA_MODELS: join(__dirname, '../../ollama/models')
        }
      });

      this.ollamaProcess.stdout?.on('data', (data) => {
        console.log('📤 Ollama:', data.toString());
      });

      this.ollamaProcess.stderr?.on('data', (data) => {
        const errorMessage = data.toString();
        
        // INFO 레벨 로그는 정상적인 정보이므로 Error가 아님
        if (errorMessage.includes('level=INFO')) {
          console.log('📤 Ollama Info:', errorMessage);
        } else if (errorMessage.includes('level=WARN')) {
          console.warn('⚠️ Ollama Warning:', errorMessage);
        } else if (errorMessage.includes('level=ERROR')) {
          console.error('❌ Ollama Error:', errorMessage);
        } else {
          // 기타 stderr 출력
          console.log('📤 Ollama:', errorMessage);
        }
        
        // 포트 충돌 오류 처리
        if (errorMessage.includes('bind: Only one usage of each socket address')) {
          console.log('⚠️ 포트 충돌 발생. 프로세스를 다시 정리합니다.');
          this.cleanupExistingProcesses().then(() => {
            console.log('🔄 프로세스 정리 후 다시 시작합니다.');
            this.startNewOllama();
          });
        }
      });

      this.ollamaProcess.on('close', (code) => {
        console.log(`🔚 Ollama 서버가 종료되었습니다. 코드: ${code}`);
        this.isRunning = false;
        this.isExternalOllama = false;
      });

      this.ollamaProcess.on('error', (error) => {
        console.error('💥 Ollama 프로세스 오류:', error);
        this.isRunning = false;
        this.isExternalOllama = false;
      });

      // 서버 프로세스 시작 후 잠시 대기
      console.log('⏳ Ollama 프로세스 시작 대기 중...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 서버 시작 대기
      await this.waitForServer();
      this.isRunning = true;
      this.isExternalOllama = false;
      console.log('✅ 새로운 Ollama 서버가 성공적으로 시작되었습니다.');
      
    } catch (error) {
      console.error('❌ 새로운 Ollama 서버 시작 실패:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    // 외부에서 실행된 Ollama는 종료하지 않음
    if (this.isExternalOllama) {
      console.log('ℹ️ 외부에서 실행된 Ollama 서버는 종료하지 않습니다.');
      this.isRunning = false;
      this.isExternalOllama = false;
      return;
    }
    
    if (this.ollamaProcess) {
      console.log('🛑 Ollama 서버를 종료합니다...');
      this.ollamaProcess.kill();
      this.ollamaProcess = null;
      this.isRunning = false;
    }
  }

  private async checkIfOllamaIsRunning(): Promise<boolean> {
    try {
      console.log('🔍 기존 Ollama 서버 연결 확인 중...');
      const response = await axios.get('http://127.0.0.1:11434/api/tags', {
        timeout: 5000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200) {
        console.log('✅ 기존 Ollama 서버 발견:', response.data);
        return true;
      }
      return false;
    } catch (error: any) {
      console.log('ℹ️ 기존 Ollama 서버 없음:', error.message);
      return false;
    }
  }

  private async waitForServer(): Promise<void> {
    const maxAttempts = 30;
    const delay = 1000;

    console.log('⏳ Ollama 서버 준비 대기 중...');
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        console.log(`🔍 Ollama 서버 연결 시도 ${i + 1}/${maxAttempts}...`);
        
        // 더 긴 타임아웃으로 연결 시도
        const response = await axios.get('http://127.0.0.1:11434/api/tags', {
          timeout: 5000,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 200) {
          console.log('✅ Ollama 서버 연결 성공!');
          console.log('📊 서버 응답:', response.data);
          return;
        }
      } catch (error: any) {
        const errorMessage = error.message || '알 수 없는 오류';
        console.log(`⏳ 연결 시도 ${i + 1} 실패 (${errorMessage}), ${delay}ms 후 재시도...`);
        
        // 마지막 시도에서는 더 자세한 오류 정보 출력
        if (i === maxAttempts - 1) {
          console.error('❌ 최종 연결 실패 상세 정보:', {
            error: errorMessage,
            code: error.code,
            response: error.response?.data
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // 서버 프로세스 상태 확인
    if (this.ollamaProcess) {
      const isAlive = !this.ollamaProcess.killed;
      console.log(`🔍 Ollama 프로세스 상태: ${isAlive ? '실행 중' : '종료됨'}`);
      
      if (!isAlive) {
        throw new Error('Ollama 프로세스가 예기치 않게 종료되었습니다.');
      }
    }

    throw new Error('⏰ Ollama 서버 시작 시간 초과 (30초)');
  }

  async generateResponse(prompt: string, model: string = DEFAULT_MODEL): Promise<string> {
    if (!this.isRunning) {
      throw new Error('Ollama 서버가 실행되지 않았습니다.');
    }

    try {
      const response = await axios.post('http://127.0.0.1:11434/api/chat', {
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: false
      }, {
        timeout: 30000
      });

      // chat API 응답 구조: { message: { content: string } }
      return response.data.message?.content || response.data.response || '응답을 생성할 수 없습니다.';
    } catch (error) {
      console.error('❌ Ollama API 호출 실패:', error);
      throw error;
    }
  }

  async listModels(): Promise<string[]> {
    if (!this.isRunning) {
      throw new Error('Ollama 서버가 실행되지 않았습니다.');
    }

    try {
      console.log('🔍 모델 목록 조회 중...');
      
      // /api/tags 엔드포인트 사용 (Ollama 0.9.3에서 지원)
      const response = await axios.get('http://127.0.0.1:11434/api/tags', {
        timeout: 5000
      });
      
      console.log('📊 /api/tags 응답:', response.data);
      console.log('📋 models 필드:', response.data.models);
      console.log('📋 models 타입:', typeof response.data.models);
      
      const models = response.data.models?.map((model: any) => model.name) || [];
      console.log('📋 추출된 모델명:', models);
      
      return models;
    } catch (error) {
      console.error('❌ 모델 목록 조회 실패:', error);
      throw error;
    }
  }

  async installModel(modelName: string = DEFAULT_MODEL): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Ollama 서버가 실행되지 않았습니다.');
    }

    try {
      console.log(`📥 ${modelName} 모델을 설치합니다...`);
      
      const response = await axios.post('http://127.0.0.1:11434/api/pull', {
        name: modelName
      }, {
        timeout: 300000 // 5분 타임아웃 (모델 다운로드 시간 고려)
      });

      console.log(`✅ ${modelName} 모델 설치 완료:`, response.data);
    } catch (error) {
      console.error(`❌ ${modelName} 모델 설치 실패:`, error);
      throw error;
    }
  }

  async ensureModelInstalled(modelName: string = DEFAULT_MODEL): Promise<void> {
    try {
      console.log(`🔍 ${modelName} 모델 설치 확인 중...`);
      const models = await this.listModels();
      console.log('📋 설치된 모델 목록:', models);
      console.log(`🔍 찾는 모델: ${modelName}`);
      console.log(`🔍 포함 여부: ${models.includes(modelName)}`);
      
      if (!models.includes(modelName)) {
        console.log(`⚠️ ${modelName} 모델이 설치되지 않았습니다. 설치를 시작합니다...`);
        await this.installModel(modelName);
      } else {
        console.log(`✅ ${modelName} 모델이 이미 설치되어 있습니다.`);
      }
    } catch (error) {
      console.error('❌ 모델 확인/설치 실패:', error);
      throw error;
    }
  }

  isServerRunning(): boolean {
    return this.isRunning;
  }

  isExternalServer(): boolean {
    return this.isExternalOllama;
  }

  getOllamaPath(): string {
    return this.ollamaPath;
  }
} 