const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

const OLLAMA_DIR = path.join(__dirname, '..', 'ollama');
const BIN_DIR = path.join(OLLAMA_DIR, 'bin');
const MODELS_DIR = path.join(__dirname, '..', 'models');

async function createModelArchive() {
  try {
    console.log('🔄 DeepSeek R1 1.5B 모델 아카이브를 생성합니다...');
    
    // 모델 디렉토리 생성
    await fs.ensureDir(MODELS_DIR);
    
    // 내장 모델이 있는지 확인
    const embeddedModelDir = path.join(MODELS_DIR, 'deepseek-r1-1.5b');
    if (!await fs.pathExists(embeddedModelDir)) {
      console.error('❌ 내장 모델이 없습니다. 먼저 npm run embed-model을 실행하세요.');
      process.exit(1);
    }
    
    console.log('✅ 내장 모델 발견:', embeddedModelDir);
    
    // tar 아카이브 생성 (Windows에서는 tar 명령어 사용)
    const archivePath = path.join(MODELS_DIR, 'deepseek-r1-1.5b.tar');
    console.log('📦 모델을 tar 아카이브로 압축 중...');
    
    // Windows에서 tar 명령어 사용
    const tarProcess = spawn('tar', ['-czf', archivePath, '-C', embeddedModelDir, '.'], {
      stdio: 'inherit',
      detached: false
    });
    
    await new Promise((resolve, reject) => {
      tarProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ tar 아카이브 생성 완료!');
          resolve();
        } else {
          reject(new Error(`tar 압축 실패: ${code}`));
        }
      });
    });
    
    // Modelfile 생성
    const modelfilePath = path.join(MODELS_DIR, 'Modelfile');
    const modelfileContent = `FROM ./deepseek-r1-1.5b.tar
TEMPLATE """당신은 친근하고 도움이 되는 AI 어시스턴트입니다. 항상 친절하고 정중하게 한국어로 답변해주세요.

{{ .Prompt }}"""
PARAMETER stop "사용자:"
PARAMETER stop "User:"
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER num_predict 200
PARAMETER num_thread 4
PARAMETER num_ctx 2048`;
    
    await fs.writeFile(modelfilePath, modelfileContent);
    console.log('📄 Modelfile 생성 완료!');
    
    // 아카이브 파일 크기 확인
    const stats = await fs.stat(archivePath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 생성된 아카이브 크기: ${fileSizeInMB} MB`);
    
    console.log('✅ 모델 아카이브 생성 완료!');
    console.log('💡 이제 다음 명령어로 커스텀 모델을 생성할 수 있습니다:');
    console.log(`   ollama create my-custom-model -f ${modelfilePath}`);
    console.log('   ollama list');
    console.log('   ollama run my-custom-model');
    
  } catch (error) {
    console.error('❌ 모델 아카이브 생성 실패:', error.message);
    process.exit(1);
  }
}

createModelArchive(); 