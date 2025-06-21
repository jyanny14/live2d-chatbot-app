# Live2D 모델 파일

이 폴더에 Live2D 모델 파일을 추가하세요.

## 지원 형식
- `.model3.json` (Live2D Cubism 3.x)
- `.model.json` (Live2D Cubism 2.x)

## 모델 파일 구조 예시

### Cubism 3.x 모델
```
your-model/
├── your-model.model3.json
├── your-model.moc3
├── your-model.physics3.json
├── your-model.cdi3.json
├── textures/
│   ├── texture_00.png
│   └── texture_01.png
└── motions/
    ├── idle.motion3.json
    └── talk.motion3.json
```

### Cubism 2.x 모델
```
your-model/
├── your-model.model.json
├── your-model.moc
├── your-model.physics.json
├── textures/
│   └── texture_00.png
└── motions/
    ├── idle.motion.json
    └── talk.motion.json
```

## 테스트용 모델 다운로드

무료 Live2D 모델을 다음 사이트에서 다운로드할 수 있습니다:
- [Live2D 공식 샘플](https://www.live2d.com/download/sample-data/)
- [GitHub Live2D 샘플](https://github.com/guansss/pixi-live2d-display/tree/master/samples)

## 사용법

1. 모델 파일을 이 폴더에 복사
2. `src/renderer/App.tsx`에서 경로 수정:
   ```typescript
   <Live2DCanvas modelPath="/models/your-model/your-model.model3.json" />
   ```

## 주의사항

- 모델 파일의 라이선스를 확인하세요
- 상업적 사용 시 별도 라이선스가 필요할 수 있습니다
- 모델 파일이 올바른 구조를 가지고 있는지 확인하세요 