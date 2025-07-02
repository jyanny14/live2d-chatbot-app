const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

const OLLAMA_DIR = path.join(__dirname, '..', 'ollama');
const BIN_DIR = path.join(OLLAMA_DIR, 'bin');
const MODELS_DIR = path.join(__dirname, '..', 'models');

async function embedModel() {
  try {
    console.log('🔄 DeepSeek R1 1.5B 모델을 앱에 내장합니다...');
    
    const ollamaPath = path.join(BIN_DIR, process.platform === 'win32' ? 'ollama.exe' : 'ollama');
    
    // Ollama가 설치되어 있는지 확인
    if (!await fs.pathExists(ollamaPath)) {
      console.error('❌ Ollama가 설치되어 있지 않습니다. 먼저 npm run download-ollama를 실행하세요.');
      process.exit(1);
    }
    
    // 모델이 설치되어 있는지 확인
    console.log('🔍 모델 설치 상태 확인 중...');
    const listProcess = spawn(ollamaPath, ['list'], {
      stdio: 'pipe',
      detached: false
    });
    
    let listOutput = '';
    listProcess.stdout.on('data', (data) => {
      listOutput += data.toString();
    });
    
    await new Promise((resolve, reject) => {
      listProcess.on('close', (code) => {
        if (code === 0) {
          if (listOutput.includes('deepseek-r1:1.5b')) {
            console.log('✅ DeepSeek R1 1.5B 모델이 설치되어 있습니다.');
            resolve();
          } else {
            reject(new Error('DeepSeek R1 1.5B 모델이 설치되어 있지 않습니다. 먼저 npm run download-model을 실행하세요.'));
          }
        } else {
          reject(new Error(`모델 목록 조회 실패: ${code}`));
        }
      });
    });
    
    // 모델 디렉토리 생성
    await fs.ensureDir(MODELS_DIR);
    
    // Ollama 모델 디렉토리에서 모델 파일 복사
    console.log('📁 모델 파일을 앱 디렉토리로 복사합니다...');
    const ollamaModelDir = path.join(process.env.HOME || process.env.USERPROFILE, '.ollama', 'models');
    const appModelDir = path.join(MODELS_DIR, 'deepseek-r1-1.5b');
    
    // 기존 디렉토리 삭제 후 새로 생성
    if (await fs.pathExists(appModelDir)) {
      await fs.remove(appModelDir);
    }
    await fs.ensureDir(appModelDir);
    
    // Ollama 모델 디렉토리 전체를 앱 디렉토리로 복사
    await fs.copy(ollamaModelDir, appModelDir);
    
    // 복사된 파일 크기 확인
    const stats = await fs.stat(appModelDir);
    console.log(`📊 내장된 모델 크기: ${(await getDirSize(appModelDir) / (1024 * 1024)).toFixed(2)} MB`);
    
    console.log('✅ 모델 내장 완료!');
    console.log('💡 이제 앱에서 내장된 모델을 사용할 수 있습니다.');
    
  } catch (error) {
    console.error('❌ 모델 내장 실패:', error.message);
    process.exit(1);
  }
}

async function getDirSize(dirPath) {
  let totalSize = 0;
  
  const items = await fs.readdir(dirPath);
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = await fs.stat(itemPath);
    
    if (stat.isDirectory()) {
      totalSize += await getDirSize(itemPath);
    } else {
      totalSize += stat.size;
    }
  }
  
  return totalSize;
}

embedModel(); 