const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

const OLLAMA_DIR = path.join(__dirname, '..', 'ollama');
const BIN_DIR = path.join(OLLAMA_DIR, 'bin');

async function setupGemma() {
  try {
    console.log('🔄 Gemma 2B 모델 설정을 시작합니다...');
    
    const ollamaPath = path.join(BIN_DIR, process.platform === 'win32' ? 'ollama.exe' : 'ollama');
    
    // Ollama가 설치되어 있는지 확인
    if (!await fs.pathExists(ollamaPath)) {
      console.error('❌ Ollama가 설치되어 있지 않습니다. 먼저 npm run download-ollama를 실행하세요.');
      process.exit(1);
    }
    
    // Ollama 서버 시작
    console.log('🚀 Ollama 서버를 시작합니다...');
    const ollamaProcess = spawn(ollamaPath, ['serve'], {
      stdio: 'pipe',
      detached: false
    });
    
    // 서버 시작 대기
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Gemma 2B 모델 설치
    console.log('📥 Gemma 2B 모델을 다운로드합니다... (시간이 오래 걸릴 수 있습니다)');
    
    const pullProcess = spawn(ollamaPath, ['pull', 'gemma2:2b'], {
      stdio: 'inherit',
      detached: false
    });
    
    await new Promise((resolve, reject) => {
      pullProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Gemma 2B 모델 설치 완료!');
          resolve();
        } else {
          reject(new Error(`모델 설치 실패: ${code}`));
        }
      });
    });
    
    // Ollama 서버 종료
    ollamaProcess.kill();
    
    console.log('🎉 Gemma 2B 모델 설정이 완료되었습니다!');
    
  } catch (error) {
    console.error('❌ Gemma 2B 모델 설정 실패:', error.message);
    process.exit(1);
  }
}

setupGemma(); 