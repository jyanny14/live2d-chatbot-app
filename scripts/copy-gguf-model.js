const fs = require('fs-extra');
const path = require('path');

async function copyGGUFModel() {
  try {
    console.log('📁 GGUF 모델 파일 복사 시작...');
    
    // 소스 GGUF 파일 경로 (상대 경로 사용)
    const sourcePath = path.join(__dirname, '..', 'ollama', 'models', 'DeepSeek-R1-Distill-Qwen-1.5B-Q6_K_L.gguf');
    
    // 대상 경로 (앱의 models 디렉토리)
    const targetPath = path.join(__dirname, '..', 'models', 'DeepSeek-R1-Distill-Qwen-1.5B-Q6_K_L.gguf');
    
    // 소스 파일 존재 확인
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`소스 GGUF 파일을 찾을 수 없습니다: ${sourcePath}`);
    }
    
    console.log('✅ 소스 GGUF 파일 발견:', sourcePath);
    
    // 대상 디렉토리 생성
    const targetDir = path.dirname(targetPath);
    await fs.ensureDir(targetDir);
    console.log('✅ 대상 디렉토리 생성:', targetDir);
    
    // 파일 복사
    console.log('📋 GGUF 파일 복사 중...');
    await fs.copy(sourcePath, targetPath);
    
    console.log('✅ GGUF 모델 파일 복사 완료!');
    console.log('📁 복사된 파일:', targetPath);
    
    // 파일 크기 확인
    const stats = await fs.stat(targetPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 파일 크기: ${fileSizeInMB} MB`);
    
  } catch (error) {
    console.error('❌ GGUF 모델 파일 복사 실패:', error);
    process.exit(1);
  }
}

// 스크립트 실행
copyGGUFModel(); 