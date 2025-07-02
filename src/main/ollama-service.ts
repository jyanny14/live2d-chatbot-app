import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import axios from 'axios';
import * as fs from 'fs';
import { ContentFilter } from './content-filter';
import { DEFAULT_MODEL } from '../constants/models';
import { ServiceStatus, AppError } from '../types';
import { isDevelopment, isWindows, normalizeErrorMessage, delay } from '../utils/common';

export class OllamaService {
  private ollamaPath: string;
  private modelPath: string;
  private isRunning = false;
  private isExternalOllama = false;
  private ollamaServerProcess: ChildProcess | null = null;
  private contentFilter = new ContentFilter();
  private lastError: AppError | null = null;

  private static readonly OLLAMA_API_BASE = 'http://127.0.0.1:11434';
  private static readonly SERVER_START_TIMEOUT = 30000; // 30초
  private static readonly SERVER_CHECK_INTERVAL = 1000; // 1초

  constructor() {
    if (isDevelopment()) {
      // 개발 모드: 프로젝트 루트의 ollama 디렉토리 사용
      this.ollamaPath = join(__dirname, '../../ollama/bin', isWindows() ? 'ollama.exe' : 'ollama');
      this.modelPath = join(__dirname, '../../models');
    } else {
      // 프로덕션 모드: 앱 리소스 디렉토리 사용
      this.ollamaPath = join(process.resourcesPath, 'ollama', isWindows() ? 'ollama.exe' : 'ollama');
      this.modelPath = join(process.resourcesPath, 'models');
    }
  }

  /**
   * 서비스 시작
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('✅ Ollama 서비스가 이미 실행 중입니다.');
      return;
    }

    try {
      console.log('🚀 Ollama 서비스를 시작합니다...');
      console.log('📁 Ollama 경로:', this.ollamaPath);
      
      // Ollama 바이너리 존재 확인
      await this.validateOllamaBinary();
      
      // 기존 서버 확인
      const isAlreadyRunning = await this.checkIfOllamaIsRunning();
      if (isAlreadyRunning) {
        console.log('✅ 이미 실행 중인 Ollama 서버를 발견했습니다.');
        this.isRunning = true;
        this.isExternalOllama = true;
        return;
      }
      
      // 새 서버 시작
      await this.startOllamaServer();
      await this.waitForServerStart();
      
      console.log('✅ Ollama 서버가 성공적으로 시작되었습니다.');
      this.isRunning = true;
      this.isExternalOllama = false;
      this.lastError = null;

    } catch (error) {
      const errorMessage = normalizeErrorMessage(error);
      this.lastError = {
        code: 'OLLAMA_START_FAILED',
        message: errorMessage,
        details: error
      };
      console.error('❌ Ollama 서비스 시작 실패:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * 서비스 종료
   */
  async stop(): Promise<void> {
    console.log('🛑 Ollama 서비스를 종료합니다...');
    
    if (this.isExternalOllama) {
      console.log('ℹ️ 외부에서 실행된 Ollama 서버는 종료하지 않습니다.');
      this.isRunning = false;
      this.isExternalOllama = false;
      return;
    }
    
    await this.stopOllamaServer();
    this.isRunning = false;
  }

  /**
   * 서비스 상태 반환
   */
  getStatus(): ServiceStatus {
    return {
      isRunning: this.isRunning,
      isExternal: this.isExternalOllama,
      model: DEFAULT_MODEL,
      lastError: this.lastError || undefined
    };
  }

  /**
   * Ollama 바이너리 검증
   */
  private async validateOllamaBinary(): Promise<void> {
    if (!fs.existsSync(this.ollamaPath)) {
      throw new Error(`Ollama 바이너리를 찾을 수 없습니다: ${this.ollamaPath}`);
    }
    console.log('✅ Ollama 바이너리 발견:', this.ollamaPath);
  }

  /**
   * Ollama 서버 실행 여부 확인
   */
  private async checkIfOllamaIsRunning(): Promise<boolean> {
    try {
      console.log('🔍 기존 Ollama 서버 연결 확인 중...');
      const response = await axios.get(`${OllamaService.OLLAMA_API_BASE}/api/tags`, {
        timeout: 5000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200) {
        console.log('✅ 기존 Ollama 서버 발견');
        return true;
      }
      return false;
    } catch (error) {
      console.log('ℹ️ 기존 Ollama 서버 없음');
      return false;
    }
  }

  /**
   * Ollama 서버 시작
   */
  private async startOllamaServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('📡 Ollama 서버 프로세스를 시작합니다...');
      
      this.ollamaServerProcess = spawn(this.ollamaPath, ['serve'], {
        stdio: 'ignore',
        detached: true,
        env: { ...process.env }
      });

      if (this.ollamaServerProcess) {
        this.ollamaServerProcess.unref();

        this.ollamaServerProcess.on('error', (error) => {
          console.error('❌ Ollama 서버 시작 실패:', error);
          reject(error);
        });
      }

      // 서버 시작 완료 대기
      setTimeout(() => {
        console.log('✅ Ollama 서버 프로세스가 시작되었습니다.');
        resolve();
      }, 2000);
    });
  }

  /**
   * 서버 시작 대기
   */
  private async waitForServerStart(): Promise<void> {
    const maxAttempts = Math.floor(OllamaService.SERVER_START_TIMEOUT / OllamaService.SERVER_CHECK_INTERVAL);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔍 서버 시작 확인 중... (${attempt}/${maxAttempts})`);
        const response = await axios.get(`${OllamaService.OLLAMA_API_BASE}/api/tags`, {
          timeout: 2000,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 200) {
          console.log('✅ Ollama 서버가 정상적으로 응답합니다.');
          return;
        }
      } catch (error) {
        console.log(`⏳ 서버 시작 대기 중... (${attempt}/${maxAttempts})`);
        if (attempt === maxAttempts) {
          throw new Error('Ollama 서버 시작 시간 초과');
        }
        await delay(OllamaService.SERVER_CHECK_INTERVAL);
      }
    }
  }

  /**
   * Ollama 서버 종료
   */
  private async stopOllamaServer(): Promise<void> {
    if (!this.ollamaServerProcess) return;

    try {
      console.log('🔄 Ollama 서버 프로세스를 종료합니다...');
      this.ollamaServerProcess.kill();
      this.ollamaServerProcess = null;
      console.log('✅ Ollama 서버 프로세스가 종료되었습니다.');
    } catch (error) {
      console.error('❌ Ollama 서버 프로세스 종료 실패:', error);
    }
  }

  /**
   * 모델 목록 조회
   */
  async listModels(): Promise<string[]> {
    try {
      console.log('🔍 모델 목록 조회 중...');
      
      return new Promise((resolve, reject) => {
        const ollamaProcess = spawn(this.ollamaPath, ['list'], {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env }
        });
        
        let output = '';
        let errorOutput = '';
        
        ollamaProcess.stdout.on('data', (data: Buffer) => {
          output += data.toString();
        });
        
        ollamaProcess.stderr.on('data', (data: Buffer) => {
          errorOutput += data.toString();
        });
        
        ollamaProcess.on('close', (code: number) => {
          if (code === 0) {
            console.log('✅ 모델 목록 조회 완료');
            const lines = output.trim().split('\n');
            const models: string[] = [];
            
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i]?.trim();
              if (line) {
                const parts = line.split(/\s+/);
                if (parts.length > 0 && parts[0]) {
                  models.push(parts[0]);
                }
              }
            }
            
            console.log('📋 추출된 모델명:', models);
            resolve(models);
          } else {
            console.error('❌ 모델 목록 조회 실패:', errorOutput);
            reject(new Error(`Ollama list 실패 (코드: ${code}): ${errorOutput}`));
          }
        });
        
        ollamaProcess.on('error', (error: Error) => {
          console.error('❌ Ollama 프로세스 오류:', error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('❌ 모델 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 모델 설치 (원격)
   */
  async installModel(modelName: string = DEFAULT_MODEL): Promise<void> {
    try {
      console.log(`📥 ${modelName} 모델을 설치합니다...`);
      
      return new Promise((resolve, reject) => {
        const ollamaProcess = spawn(this.ollamaPath, ['pull', modelName], {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env }
        });
        
        let output = '';
        let errorOutput = '';
        
        ollamaProcess.stdout.on('data', (data: Buffer) => {
          output += data.toString();
          console.log(`📥 ${modelName} 다운로드 진행:`, data.toString().trim());
        });
        
        ollamaProcess.stderr.on('data', (data: Buffer) => {
          errorOutput += data.toString();
          console.log(`📥 ${modelName} 다운로드 정보:`, data.toString().trim());
        });
        
        ollamaProcess.on('close', (code: number) => {
          if (code === 0) {
            console.log(`✅ ${modelName} 모델 설치 완료`);
            resolve();
          } else {
            console.error(`❌ ${modelName} 모델 설치 실패:`, errorOutput);
            reject(new Error(`Ollama pull 실패 (코드: ${code}): ${errorOutput}`));
          }
        });
        
        ollamaProcess.on('error', (error: Error) => {
          console.error('❌ Ollama 프로세스 오류:', error);
          reject(error);
        });
      });
    } catch (error) {
      console.error(`❌ ${modelName} 모델 설치 실패:`, error);
      throw error;
    }
  }

  /**
   * 내장 GGUF 모델 파일에서 설치 (Modelfile 사용)
   */
  async installFromLocalModel(modelName: string = 'DeepSeek-R1-Distill-Qwen-1.5B-Q6_K_L'): Promise<void> {
    try {
      console.log(`📥 내장 GGUF 모델에서 ${modelName} 설치 중...`);
      
      // GGUF 모델 파일 경로
      const ggufModelPath = join(this.modelPath, 'DeepSeek-R1-Distill-Qwen-1.5B-Q6_K_L.gguf');
      
      // GGUF 모델 파일 존재 확인
      if (!fs.existsSync(ggufModelPath)) {
        throw new Error(`GGUF 모델 파일을 찾을 수 없습니다: ${ggufModelPath}`);
      }
      
      console.log('✅ GGUF 모델 파일 발견:', ggufModelPath);
      
      // Modelfile 경로 확인
      const modelfilePath = join(this.modelPath, 'Modelfile');
      if (!fs.existsSync(modelfilePath)) {
        throw new Error(`Modelfile을 찾을 수 없습니다: ${modelfilePath}`);
      }
      
      console.log('✅ Modelfile 발견:', modelfilePath);
      
      // 모델이 이미 설치되어 있는지 확인
      const models = await this.listModels();
      if (models.includes(modelName)) {
        console.log(`✅ ${modelName} 모델이 이미 설치되어 있습니다.`);
        return;
      }
      
      // Ollama create 명령으로 Modelfile을 사용하여 모델 생성
      return new Promise((resolve, reject) => {
        console.log(`🔨 ${modelName} 모델 생성 중...`);
        
        // Modelfile을 사용하여 모델 생성
        const ollamaProcess = spawn(this.ollamaPath, ['create', modelName, '-f', modelfilePath], {
          stdio: ['pipe', 'pipe', 'pipe'],
          cwd: this.modelPath, // models 디렉토리에서 실행
          env: { ...process.env }
        });
        
        let output = '';
        let errorOutput = '';
        
        ollamaProcess.stdout.on('data', (data: Buffer) => {
          output += data.toString();
          console.log(`🔨 모델 생성 진행:`, data.toString().trim());
        });
        
        ollamaProcess.stderr.on('data', (data: Buffer) => {
          errorOutput += data.toString();
          console.log(`🔨 모델 생성 정보:`, data.toString().trim());
        });
        
        ollamaProcess.on('close', (code: number) => {
          if (code === 0) {
            console.log(`✅ ${modelName} 모델이 성공적으로 생성되었습니다.`);
            resolve();
          } else {
            console.error(`❌ ${modelName} 모델 생성 실패:`, errorOutput);
            reject(new Error(`Ollama create 실패 (코드: ${code}): ${errorOutput}`));
          }
        });
        
        ollamaProcess.on('error', (error: Error) => {
          console.error('❌ Ollama 프로세스 오류:', error);
          reject(error);
        });
      });
      
    } catch (error) {
      console.error(`❌ 내장 GGUF 모델 설치 실패:`, error);
      throw error;
    }
  }

  /**
   * 모델 설치 확인 및 설치
   */
  async ensureModelInstalled(modelName: string = 'DeepSeek-R1-Distill-Qwen-1.5B-Q6_K_L'): Promise<void> {
    try {
      console.log(`🔍 ${modelName} 모델 설치 확인 중...`);
      const models = await this.listModels();
      if (!models.includes(modelName)) {
        await this.installFromLocalModel(modelName);
      } else {
        console.log(`✅ ${modelName} 모델이 이미 설치되어 있습니다.`);
      }
    } catch (error) {
      console.error('❌ 모델 확인/설치 실패:', error);
      throw error;
    }
  }

  // Getter 메서드들
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