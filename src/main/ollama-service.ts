import { spawn } from 'child_process';
import { join } from 'path';
import axios from 'axios';
import * as fs from 'fs';
import { ContentFilter } from './content-filter';
import { DEFAULT_MODEL } from '../constants/models';

export class OllamaService {
  private ollamaPath: string;
  private isRunning = false;
  private isExternalOllama = false; // 외부에서 실행된 Ollama인지 확인
  private contentFilter = new ContentFilter();

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
      console.log('Ollama 서비스가 이미 실행 중입니다.');
      return;
    }

    try {
      console.log('🚀 Ollama 서비스를 시작합니다...');
      console.log('Ollama 경로:', this.ollamaPath);
      
      // Ollama 바이너리 존재 확인
      if (!fs.existsSync(this.ollamaPath)) {
        throw new Error(`Ollama 바이너리를 찾을 수 없습니다: ${this.ollamaPath}`);
      }

      console.log('✅ Ollama 바이너리 발견:', this.ollamaPath);
      
      // 먼저 이미 실행 중인 Ollama 서버가 있는지 확인
      const isAlreadyRunning = await this.checkIfOllamaIsRunning();
      if (isAlreadyRunning) {
        console.log('✅ 이미 실행 중인 Ollama 서버를 발견했습니다. 기존 서버를 사용합니다.');
        this.isRunning = true;
        this.isExternalOllama = true;
        return;
      }
      
      // 직접 실행 방식에서는 서버 시작이 필요 없음
      console.log('✅ 직접 실행 모드로 설정되었습니다. 서버 시작 없이 바로 사용 가능합니다.');
      this.isRunning = true;
      this.isExternalOllama = false;

    } catch (error) {
      console.error('❌ Ollama 서비스 시작 실패:', error);
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
    
    // 직접 실행 방식에서는 별도의 서버 프로세스가 없음
    console.log('🛑 Ollama 서비스를 종료합니다...');
    this.isRunning = false;
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



  async generateResponse(prompt: string, model: string = DEFAULT_MODEL): Promise<string> {
    try {
      // 입력 필터링
      const filteredPrompt = this.contentFilter.filterUserInput(prompt);
      
      // 서버 모드 대신 직접 실행 방식 사용
      return new Promise((resolve, reject) => {
        
        // system 프롬프트와 사용자 프롬프트를 결합
        const fullPrompt = `당신은 친근하고 도움이 되는 AI 어시스턴트입니다. 항상 친절하고 정중하게 한국어로 답변해주세요.\n\n사용자: ${filteredPrompt}\n어시스턴트:`;
        
        console.log(`🚀 직접 실행 모드: ${model} 모델로 응답 생성 중...`);
        console.log(`📝 프롬프트: ${fullPrompt.substring(0, 100)}...`);
        
        const ollamaProcess = spawn(this.ollamaPath, ['run', model], {
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
            console.log('✅ 직접 실행 모드 응답 생성 완료');
            const rawResponse = output.trim();
            const filteredResponse = this.contentFilter.filterResponse(rawResponse);
            resolve(filteredResponse);
          } else {
            console.error('❌ 직접 실행 모드 실패:', errorOutput);
            reject(new Error(`Ollama 실행 실패 (코드: ${code}): ${errorOutput}`));
          }
        });
        
        ollamaProcess.on('error', (error: Error) => {
          console.error('❌ Ollama 프로세스 오류:', error);
          reject(error);
        });
        
        // 프롬프트 전송
        ollamaProcess.stdin.write(fullPrompt);
        ollamaProcess.stdin.end();
      });
    } catch (error) {
      console.error('❌ Ollama 직접 실행 실패:', error);
      throw error;
    }
  }

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
            // 출력에서 모델명 추출 (NAME 컬럼)
            const lines = output.trim().split('\n');
            const models: string[] = [];
            
            for (let i = 1; i < lines.length; i++) { // 헤더 제외
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