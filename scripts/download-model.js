const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

const OLLAMA_DIR = path.join(__dirname, '..', 'ollama');
const BIN_DIR = path.join(OLLAMA_DIR, 'bin');
const MODELS_DIR = path.join(__dirname, '..', 'models');

async function downloadModel() {
  try {
    console.log('🔄 DeepSeek R1 1.5B 모델 다운로드를 시작합니다...');
    
    const ollamaPath = path.join(BIN_DIR, process.platform === 'win32' ? 'ollama.exe' : 'ollama');
    
    // Ollama가 설치되어 있는지 확인
    if (!await fs.pathExists(ollamaPath)) {
      console.error('❌ Ollama가 설치되어 있지 않습니다. 먼저 npm run download-ollama를 실행하세요.');
      process.exit(1);
    }
    
    // 모델 디렉토리 생성
    await fs.ensureDir(MODELS_DIR);
    
    // Ollama 서버 시작
    console.log('🚀 Ollama 서버를 시작합니다...');
    const ollamaProcess = spawn(ollamaPath, ['serve'], {
      stdio: 'pipe',
      detached: false
    });
    
    // 서버 시작 대기
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // DeepSeek R1 1.5B 모델 다운로드
    console.log('📥 DeepSeek R1 1.5B 모델을 다운로드합니다... (시간이 오래 걸릴 수 있습니다)');
    
    const pullProcess = spawn(ollamaPath, ['pull', 'deepseek-r1:1.5b'], {
      stdio: 'inherit',
      detached: false
    });
    
    await new Promise((resolve, reject) => {
      pullProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ DeepSeek R1 1.5B 모델 다운로드 완료!');
          resolve();
        } else {
          reject(new Error(`모델 다운로드 실패: ${code}`));
        }
      });
    });
    
    // 모델 파일을 앱 디렉토리로 복사
    console.log('📁 모델을 앱 디렉토리로 복사합니다...');
    const modelDestDir = path.join(MODELS_DIR, 'deepseek-r1-1.5b');
    await fs.ensureDir(modelDestDir);
    
    // Ollama 모델을 로컬 디렉토리로 복사
    const modelCopyName = 'deepseek-r1-1.5b-local';
    console.log('📦 모델을 로컬 디렉토리로 복사 중...');
    
    const copyProcess = spawn(ollamaPath, ['cp', 'deepseek-r1:1.5b', modelCopyName], {
      stdio: 'inherit',
      detached: false
    });
    
    await new Promise((resolve, reject) => {
      copyProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ 모델 복사 완료!');
          resolve();
        } else {
          reject(new Error(`모델 복사 실패: ${code}`));
        }
      });
    });
    
    // 복사된 모델 정보 확인
    console.log('📊 복사된 모델 정보:');
    const showProcess = spawn(ollamaPath, ['show', modelCopyName], {
      stdio: 'inherit',
      detached: false
    });
    
    await new Promise((resolve, reject) => {
      showProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ 모델 정보 확인 완료!');
          resolve();
        } else {
          reject(new Error(`모델 정보 확인 실패: ${code}`));
        }
      });
    });
    
    console.log('✅ 모델 내장 설정 완료!');
    console.log('💡 이제 앱에서 내장 모델을 사용할 수 있습니다.');
    
  } catch (error) {
    console.error('❌ 모델 다운로드 실패:', error.message);
    process.exit(1);
  }
}

downloadModel(); 