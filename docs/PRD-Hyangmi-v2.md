# PRD: Hyangmi (CoffeeDex) v2.0 - "Taste Passport"

## 1. Executive Summary & Market Context (via oma-market)
### 1.1 Market Research (Community Signals)
최근 Reddit (r/coffee, r/espresso) 등의 하드코어 홈브루어 커뮤니티 분석 결과, 스페셜티 커피 트래킹 앱 시장에는 뚜렷한 **Pain Point**와 **기회**가 존재합니다.
- **기존 앱의 한계 (Beanconqueror, Angel's Cup 등)**: 데이터 로깅(추출 시간, 수율, 온도 등)에 지나치게 치중되어 있어 "너무 복잡하고 무겁다(Cumbersome)"는 평가가 지배적입니다. 
- **유저들의 우회책 (Workaround)**: 복잡한 앱을 기피하는 유저들은 결국 가장 단순한 형태인 Google Sheets, Notion, 혹은 인스타그램 스토리에 사진과 함께 수기로 텍스트를 적어 올리는 방식을 택하고 있습니다.
- **결론적 기회 (Market Gap)**: 기존 앱들은 기능은 많으나 '시각적 심미성'과 '소셜 공유 욕구(자랑)'를 채워주지 못합니다. 커피 매니아들은 자신이 소비한 고가의 프리미엄 스페셜티 원두의 경험을 세련되게 "인증"하고 싶어합니다.

### 1.2 Product Vision
**Hyangmi(CoffeeDex)**는 추출 데이터의 복잡한 로깅을 과감히 덜어내고, **"감각적이고 세련된 디지털 맛 여권(Taste Passport)"**에 집중합니다. AI 기반 라벨 스캔으로 입력의 귀찮음을 없애고, 인스타그램에 당장 공유하고 싶은 초프리미엄 UI를 제공하여 바이럴을 유도합니다. 궁극적으로는 유저의 취향 데이터(Acidity, Sweetness, Body)를 바탕으로 마이크로 로스터리와 연결되는 마켓플레이스로 확장합니다.

---

## 2. Target Audience & Value Proposition
- **Target Audience**: 스페셜티 커피를 소비하고 홈브루잉을 즐기며, 자신의 커피 경험을 인스타그램 등 SNS에 아카이빙/공유하기 좋아하는 20~30대 하드코어 홈브루어.
- **Value Prop 1 (Zero-friction)**: "사진 한 장으로 끝나는 로깅" (Gemini Vision AI 라벨 스캔).
- **Value Prop 2 (Aesthetic Shareability)**: "자랑하고 싶은 커피 여권" (Dynamic SVG, Glassmorphism UI 기반의 초프리미엄 카드).
- **Value Prop 3 (Taste-Driven Discovery)**: "내 입맛에 딱 맞는 다음 원두" (누적 테이스팅 데이터 기반 로스터리 원두 매칭).

---

## 3. Product Features & Requirements (via oma-pm)

### Phase 1: Viral "Taste Passport" (Wedge A)
| Feature | User Story | Acceptance Criteria |
|---------|------------|---------------------|
| **Premium Card UI** | 유저는 생성된 맛 카드를 보고 초프리미엄 감성을 느껴 SNS에 공유하고 싶어야 한다. | - 8px Grid 및 HSL 기반 세련된 컬러 팔레트 적용<br>- Glassmorphism 및 부드러운 애니메이션 적용<br>- 인스타그램 스토리 규격(9:16)에 맞춘 Export 모드 지원 |
| **AI Label Scanner 2.0** | 유저는 영문/국문이 혼용된 국내 로스터리 원두 라벨을 스캔해도 95% 이상의 정확도로 자동 입력받기를 원한다. | - Gemini Vision 프롬프트 고도화 (국내 로스터리 특화)<br>- Fallback UI 제공 (스캔 실패 시 수동 입력 전환)<br>- 스캔 소요 시간 3초 이내 |
| **AI SCA Tasting Note** | 유저는 태그 몇 개만 선택해도 SCA 수준의 전문적인 테이스팅 노트를 자동 작성받길 원한다. | - `/api/v1/cards/ai-note` 엔드포인트 응답 속도 최적화<br>- 문맥에 맞는 자연스러운 한국어/영어 문장 생성 |

### Phase 2: Retention & Marketplace Preparation (Wedge B)
| Feature | User Story | Acceptance Criteria |
|---------|------------|---------------------|
| **Taste Analytics Dashboard** | 유저는 자신이 마셔온 원두의 산미, 단맛, 바디감 평균치와 자주 찾는 풍미 태그를 한눈에 보고 싶다. | - 누적 카드 데이터 기반 방사형 차트 또는 세련된 그래프 제공<br>- `/api/v1/profile/analytics` 데이터와 UI 완벽 연동 |
| **Roastery Match (Draft)** | 유저의 Taste 통계를 기반으로 국내 파트너 로스터리의 원두와 매칭 스코어를 계산한다. | - Acidity, Sweetness, Body 유클리디안 거리 기반 매칭 알고리즘 구현<br>- (추후 확장을 위한) 파트너 원두 메타데이터 DB 스키마 설계 |
| **Monetization & Limits** | 유저는 무료로 앱의 핵심 가치를 체험하되, 프리미엄 기능을 위해 결제할 의향이 있다. | - 월간 무료 스캔 횟수 제한 로직 적용<br>- Stripe 결제를 통한 크레딧 충전 및 PDF 내보내기 활성화 |

---

## 4. Disproof Criteria (가설 검증 지표)
초기 런칭 후 30일 이내에 다음 지표를 추적하여 비즈니스 모델의 존속 여부를 결정합니다.
1. **소셜 공유율 (Viral Coefficient)**: 맛 카드를 생성한 유저 중 인스타그램 등 외부로 공유한 유저가 **5% 이상**인가? (미달 시 UI 디자인 전면 재검토)
2. **AI 스캔 성공률**: 유저가 업로드한 원두 이미지 중 수정 없이 그대로 저장된 비율이 **80% 이상**인가? (미달 시 Vision 프롬프트 및 파인튜닝 필요)

---

## 5. System Architecture & Constraints
- **Frontend**: Next.js 16 (App Router), Tailwind CSS, Shadcn UI, Framer Motion (프리미엄 애니메이션).
- **Backend & DB**: Supabase (Postgres, Auth, Storage).
- **AI Processing**: Gemini Vision API (원두 스캔), Text API (테이스팅 노트).
- **Monetization**: Stripe.
- **Contract Strictness**: `docs/api-spec.md`를 단일 진실 공급원(SSOT)으로 삼으며, 데이터 모델은 `tasting_cards` 테이블에 종속됨.
