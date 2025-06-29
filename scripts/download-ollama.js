const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const extract = require('extract-zip');
const { execSync } = require('child_process');

const OLLAMA_VERSION = '0.9.3';
const OLLAMA_DIR = path.join(__dirname, '..', 'ollama');
const BIN_DIR = path.join(OLLAMA_DIR, 'bin');

async function downloadOllama() {
  try {
    console.log('🔄 Ollama 다운로드를 시작합니다...');
    
    // 디렉토리 생성
    await fs.ensureDir(OLLAMA_DIR);
    await fs.ensureDir(BIN_DIR);
    
    const platform = process.platform;
    let downloadUrl;
    let fileName;
    
    if (platform === 'win32') {
      downloadUrl = `https://github.com/ollama/ollama/releases/download/v${OLLAMA_VERSION}/ollama-windows-amd64.zip`;
      fileName = 'ollama-windows-amd64.zip';
    } else if (platform === 'darwin') {
      downloadUrl = `https://github.com/ollama/ollama/releases/download/v${OLLAMA_VERSION}/ollama-darwin-amd64`;
      fileName = 'ollama-darwin-amd64';
    } else {
      downloadUrl = `https://github.com/ollama/ollama/releases/download/v${OLLAMA_VERSION}/ollama-linux-amd64`;
      fileName = 'ollama-linux-amd64';
    }
    
    const zipPath = path.join(OLLAMA_DIR, fileName);
    const binPath = path.join(BIN_DIR, platform === 'win32' ? 'ollama.exe' : 'ollama');
    
    // 이미 존재하는지 확인
    if (await fs.pathExists(binPath)) {
      console.log('✅ Ollama가 이미 설치되어 있습니다.');
      return;
    }
    
    console.log(`📥 ${downloadUrl}에서 다운로드 중...`);
    
    const response = await axios({
      method: 'GET',
      url: downloadUrl,
      responseType: 'stream',
      timeout: 60000, // 60초 타임아웃
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const writer = fs.createWriteStream(zipPath);
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    console.log('📦 압축 해제 중...');
    
    if (platform === 'win32') {
      await extract(zipPath, { dir: BIN_DIR });
    } else {
      await fs.copy(zipPath, binPath);
      await fs.chmod(binPath, '755');
    }
    
    // 임시 파일 정리
    await fs.remove(zipPath);
    
    console.log('✅ Ollama 다운로드 완료!');
    
  } catch (error) {
    console.error('❌ Ollama 다운로드 실패:', error.message);
    
    // 대안 다운로드 방법 제안
    console.log('\n💡 대안 해결 방법:');
    console.log('1. 수동으로 Ollama 설치: https://ollama.ai/download');
    console.log('2. 또는 다음 명령어로 설치:');
    if (platform === 'win32') {
      console.log('   winget install Ollama.Ollama');
    } else if (platform === 'darwin') {
      console.log('   brew install ollama');
    } else {
      console.log('   curl -fsSL https://ollama.ai/install.sh | sh');
    }
    
    process.exit(1);
  }
}

downloadOllama(); 