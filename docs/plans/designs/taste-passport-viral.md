# Design: Viral Taste Passport & Blind Quiz (A + B 통합)

## 1. 개요 (Overview)
본 설계는 Hyangmi(CoffeeDex)의 소셜 바이럴 및 유저 인게이지먼트를 극대화하기 위해, **압도적인 시각적 인터랙션(A)**과 **외부 유저 유입을 위한 퀴즈 루프(B)**를 통합한 하이브리드 바이럴 엔진을 구축하는 것을 목표로 합니다.

## 2. 세부 설계 (Section-by-Section)

### Section 1: 극강의 시각화 - Interactive 3D & Fluid UI (Option A)
* **Fluid Flavor Wheel (유동적 맛 표현)**: 기존의 딱딱한 방사형 그래프 대신, 액체가 퍼지는 듯한(Fluid) 애니메이션이 적용된 SVG 기반의 테이스팅 휠을 구현합니다. 산미, 단맛, 바디감 수치에 따라 물방울 모양이 다이내믹하게 변화합니다.
* **Haptic & Tilt 반응형 카드**: 모바일 웹/앱 환경에서 기기를 기울일 때마다(Device Orientation API) 카드의 배경 빛 반사각(Glassmorphism Shine)이 변하는 효과를 주어 프리미엄 실물 카드를 만지는 듯한 감각을 제공합니다.
* **Export for Instagram**: 단순 정적 이미지가 아닌, 이 Fluid 애니메이션이 3초간 움직이는 **mp4/gif 비디오 클립** 형태로 Export 하는 기능을 추가하여 스토리 공유 시 시선을 사로잡습니다.

### Section 2: 소셜 공유 및 바이럴 훅 - Blind Tasting Quiz (Option B)
* **Quiz Link Generation**: 인스타에 카드를 공유할 때, "내가 마신 이 커피의 메인 노트를 맞춰봐!"라는 문구와 함께 고유 웹 링크(`hyangmi.app/quiz/[card-id]`)를 클립보드에 자동 복사해 줍니다.
* **Guest Quiz 랜딩 페이지**: 링크를 타고 들어온 친구(비가입자)는 커피 이름과 로스터리만 볼 수 있고, 플레이버 휠의 구체적 수치나 메인 노트(ex: 베리류, 견과류)는 블라인드 처리되어 있습니다.
* **게시물 인터랙션**: 친구가 3지 선다 혹은 플레이버 휠 터치로 정답을 유추하여 클릭합니다.
* **Reveal & Call-to-Action (회원가입 유도)**:
  정답 공개 직후 화려한 Confetti(폭죽) 애니메이션과 함께 정답 여부를 알려줍니다. 
  *"당신도 훌륭한 미각을 가졌군요! 지금 CoffeeDex에서 나만의 스페셜티 커피 여권을 만들어보세요."* 라는 CTA 버튼을 배치하여 앱 가입(신규 유저 유입)으로 연결합니다.

## 3. 예상 유저 플로우 (User Flow)
1. **[기존 유저]** 원두 라벨 스캔 ➡️ 테이스팅 노트 AI 자동 작성 ➡️ 저장 및 카드 발급.
2. **[기존 유저]** 카드를 기울이며(인터랙션) 감상 ➡️ [인스타 스토리로 공유하기] ➡️ 짧은 동영상 저장 및 퀴즈 링크 복사.
3. **[외부 유저]** 인스타 스토리에서 퀴즈 링크 클릭 ➡️ 게스트 랜딩 페이지 접속.
4. **[외부 유저]** 블라인드 퀴즈 참여 ➡️ 정답 확인 ➡️ 앱 가입(Conversion).

## 4. 기술 스택 및 라이브러리 검토
* **Fluid UI & Animation**: `framer-motion` (React용), 필요시 `d3.js`를 결합하여 유동적인 SVG 조작.
* **Tilt Effect**: `react-use`의 `useDeviceMotion` 훅 등 활용.
* **Video/GIF Export**: 클라이언트 사이드 렌더링 후 `html2canvas` + `ffmpeg.wasm`을 활용하거나, 서버리스 API에서 Puppeteer를 이용해 비디오 클립 생성 (비용 고려 필요).
