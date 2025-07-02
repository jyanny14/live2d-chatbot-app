const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '..', 'models');
const ggufFile = 'DeepSeek-R1-Distill-Qwen-1.5B-Q6_K_L.gguf';
const modelfilePath = path.join(modelsDir, 'Modelfile');

const content = `# DeepSeek R1 Distill Qwen 1.5B Q6_K_L 모델
FROM ./${ggufFile}

# 시스템 프롬프트 (기본)
SYSTEM """당신은 친근하고 도움이 되는 AI 어시스턴트입니다. 
사용자의 질문에 정확하고 유용한 답변을 제공하세요.
한국어로 대화하되, 필요시 영어도 사용할 수 있습니다."""

# 모델 파라미터 (일관된 응답을 위해 낮은 temperature)
PARAMETER temperature 0.3
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER num_ctx 2048
PARAMETER num_predict 200
PARAMETER stop "<|im_end|>"
PARAMETER stop "사용자:"
PARAMETER stop "User:"

# 라이선스 정보
LICENSE """Apache 2.0 License
This model is based on DeepSeek R1 Distill Qwen 1.5B model.
Please refer to the original model's license for more details."""
`;

if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

fs.writeFileSync(modelfilePath, content, 'utf-8');
console.log('✅ Modelfile 생성 완료:', modelfilePath);
console.log('내용:');
console.log(content); 