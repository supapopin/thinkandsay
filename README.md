📘 AI English Essay Writing App

AI 기반 영어 에세이 연습 웹 앱입니다. 
학습자가 에세이를 작성하고, 저장하고, AI 첨삭을 받으며 한 질문(Topic)에 대해 여러 버전을 비교하며 학습할 수 있습니다.

🚀 주요 기능
1. ✨ AI Topic Generation
- 난이도(B1/B2/C1)에 따른 AI 주제 생성
- 첫 생성은 무료
- 이후 “주제 새로고침”은 30분 동안 최대 3회
- localStorage 기반 카운트 및 리셋 시간 관리

2. 📝 Writing (에세이 작성)
- AI가 제공한 Topic 기반 에세이 작성
- 작성한 에세이를 Supabase DB에 저장
- “한글 → 영어 키워드 힌트”
  → 사용자가 한글로 “이런 내용 쓰고 싶어” 입력하면
  AI가 문장 아닌 키워드/표현만 제공해줌

3. 🧠 Studying (AI 첨삭 + 버전 관리)
토픽(질문)을 기준으로 버전들이 정리됩니다.
- 같은 질문에 대해 여러 번 작성/저장 가능
- AI 첨삭 요청 시 새 버전 저장
- Revised Essay와 Original Essay 비교 기능
    - Original: 잘못된 부분 → 노란색 highlight
    - Revised: 수정된 부분 → 초록색 highlight

- 버전 리스트에서 현재 보고 있는 버전은 회색 배경으로 강조
- “되돌아가기”로 버전 리스트로 복귀 가능

4. 📄 Listing (저장된 에세이 목록)
- 모든 에세이 목록 로딩
- 로딩 중에는 “불러오는 중…” 표시
- 클릭 시 Studying 페이지로 연결

🏗️ 기술 스택
- Next.js App Router
- Supabase (Postgres + API layer)
- OpenAI GPT-4o-mini (AI topic, hint, feedback)
- React Hooks 기반 상태 관리
- localStorage (topic refresh count)
- Tailwind-like 스타일 클래스 사용

🔧 개발 시 유의사항
- Topic 새로고침 카운트는 topicRefreshState localStorage로 관리됨
- feedback API는 최소 변경 단위만 changes 배열에 포함하도록 프롬프트 튜닝됨
- Supabase의 essays와 essay_versions는 강한 연관관계 (1:N 구조)

📌 TODO (다음 버전에서 개선할 사항)
- UI 전체 스타일 리뉴얼
- 점수 기반 그래프 도입 (진도/향상도 시각화)
- 계정/로그인 도입
- “문장 단위 diff” 고급 모드
- 음성 입력 기능