# TrendLink - Web3 검색 인프라

> **TrendLink**는 기존 검색 API 앞단에 붙어, 사용자 검색 데이터를 블록체인에 기록하고 실시간 트렌드와 보상을 제공하는 Web3 검색 인프라입니다.

## 🏗️ 개념 모델 (Conceptual Model)

- **User**: 검색을 실행하는 주체
- **Platform**: 검색 위젯/SDK를 탑재한 서비스(예: 커머스몰, OTT 등)
- **Gateway**: 검색 요청을 받아 처리하고, 온체인 기록/보상 트리거 역할 (프론트엔드 라우터)
- **SearchAPI**: 기존 검색 엔진(Algolia 등)
- **CCIP**: 온체인 메시지 릴레이
- **SmartContract**: 온체인 기록 및 보상 분배
- **Analyst**: 검색 데이터 분석 및 트렌드 인사이트 활용 주체
- **SDK Developer**: TrendLink 위젯/SDK를 개발하고 유지보수하는 개발자(우리)

## 📁 폴더 구조

```
monad-blitz-seoul/
├── README.md                 # 프로젝트 소개
└── TrendLink/                # 🔗 TrendLink 서비스 메인 폴더
    ├── contracts/            # 🔧 스마트컨트랙트 (Solidity)
    │   └── SearchReward.sol  # 검색 보상 및 데이터 기록 컨트랙트
    │                         # - 보상 분배 로직
    │                         # - 온체인 검색 기록 저장
    │                         # - CCIP 메시지 수신 처리
    ├── gateway/              # 🔄 프론트엔드 라우터 (React/TypeScript)
    │   ├── SearchGateway.tsx # 검색 라우터 메인 컴포넌트
    │   ├── hooks/            # 커스텀 훅들
    │   │   ├── useSearchAPI.ts   # 외부 검색 API 연동
    │   │   ├── useCCIPSender.ts  # CCIP 메시지 전송
    │   │   └── useRewards.ts     # 보상 처리
    │   ├── services/         # 서비스 로직
    │   │   ├── searchProxy.ts    # 검색 API 프록시
    │   │   ├── ccipClient.ts     # CCIP 클라이언트
    │   │   └── rewardService.ts  # 보상 서비스
    │   └── types.ts          # 도메인 모델 정의 (User, Platform 등)
    │                         # - 검색 요청 라우팅
    │                         # - 외부 검색 API 연동
    │                         # - CCIP 메시지 전송
    │                         # - 보상/로그 생성
    ├── widget/               # 📦 검색 위젯 (React, 프론트엔드)
    │   ├── App.tsx           # 메인 위젯 컴포넌트
    │   ├── web3auth.ts       # Web3Auth 연동
    │   └── api.ts            # 게이트웨이와 통신
    │                         # - 실제 서비스 삽입용 위젯
    │                         # - Web3Auth 연동
    │                         # - 게이트웨이와 통신
    ├── docs/                 # 📚 문서/설계서
    │   └─── requirements.md   # 요구사항 명세
    │   
    └── package.json          # 의존성 관리
```

## 📋 요구사항 (Requirements)

### 👤 사용자 요구사항 (Web3Auth 기반)

- **📈 실시간 트렌드**: 실시간으로 가장 많이 검색된 검색어 Top 10 순위를 볼 수 있어야 한다
- **🔐 간편 로그인**: Web3Auth를 통해 Google, Twitter, Email 등으로 로그인할 수 있어야 한다
- **💳 자동 지갑 생성**: 로그인 시 자동으로 생성된 Web3 지갑이 검색 활동과 연결된다
- **🔍 검색 기능**: 검색어 입력 후 외부 검색 결과를 볼 수 있어야 한다
- **🏆 자동 보상**: 검색 기록은 블록체인에 자동 기록되며, 보상도 지갑 기준으로 부여된다

### 🏗️ 플랫폼 요구사항

- **🔗 Web3Auth 통합**: Web3Auth SDK를 프론트에 통합하여 지갑 자동 생성 및 연결을 지원해야 한다
- **🌐 데이터 플로우**: 외부 검색 API → 프론트엔드 Gateway → Chainlink CCIP → Monad 스마트컨트랙트로 데이터를 전달해야 한다
- **📝 정확한 기록**: CCIP 수신 컨트랙트는 검색어, 플랫폼 정보, 사용자 주소를 정확히 기록할 수 있어야 한다
- **👥 익명 사용자 처리**: 비로그인 사용자는 운영자 지갑(관리자 주소)로 이벤트가 기록되도록 처리해야 한다

### 📊 분석자 요구사항 (Analyst Requirements)

- **📈 플랫폼별 분석**: 각 검색어별로 **어떤 플랫폼(pickle, 누누TV 등)**에서 얼마나 발생했는지 플랫폼별 점유율을 확인할 수 있어야 한다
- **📅 기간별 통계**: 검색 이벤트의 전체 수량 및 기간별(일/주/월) 통계를 조회할 수 있어야 한다
- **👤 사용자 분석**: 사용자 로그인 여부에 따라 익명/지갑 기반 사용자 비율도 파악할 수 있어야 한다

## 🔧 스마트컨트랙트 스택 (온체인)

| 항목 | 기술 | 설명 |
|------|------|------|
| 언어 | Solidity (>=0.8.19) | 최신 문법 지원 (custom errors, gas 최적화 등) |
| CCIP 연동 | @chainlink/contracts-ccip | 검색 데이터 온체인 기록 및 보상 트리거 |
| 기본 라이브러리 | @openzeppelin/contracts | Ownable, AccessControl, 이벤트 관리 등 |

## 💻 프론트엔드 스택 (클라이언트)

| 항목 | 기술 | 설명 |
|------|------|------|
| 프레임워크 | React + Vite | 빠른 번들링, 개발 효율성 우수 |
| 상태관리 | Zustand | 간단하고 가벼운 글로벌 상태 관리 |
| 지갑 연동 | Wagmi + viem | React 기반 Web3 표준 조합 (타입 안전, 효율성 ↑) |
| 인증 시스템 | Web3Auth | Google, Twitter, Email 등 소셜 로그인 지원 |
| 스타일링 | Tailwind CSS | 유틸리티 퍼스트 CSS 프레임워크 |
| 패키지 매니저 | npm | 표준 JavaScript 패키지 관리 도구 |

## 🌐 백엔드 스택 (외부 API 연동)

| 항목 | 기술 | 설명 |
|------|------|------|
| 검색 API | Algolia/Elasticsearch | 기존 검색 엔진 REST API 연동 |
| 온체인 연동 | Wagmi + viem | 프론트엔드에서 직접 블록체인 상호작용 |
| CCIP 클라이언트 | @chainlink/contracts-ccip | 프론트엔드에서 CCIP 메시지 전송 |

## 📋 스마트컨트랙트 구현 기능 명세

### 🔍 1. 검색 로그 기록
- 검색 요청/보상 분배 트랜잭션이 발생할 때 로그를 온체인에 기록
- 로그에는 user, platform, widget(운영자), keyword, timestamp 등 포함
- 투명하고 불변한 검색 데이터 저장

### 💰 2. 보상 분배 (3자 분배)
- 검색 1건마다 보상액을 **user, platform, widget(운영자)**에게 자동 분배
- 보상 비율(예: user 30%, platform 40%, widget 30%)은 정책에 따라 변경 가능
- 보상 토큰(ERC20 등) 자동 전송

### ⚙️ 3. 보상 정책/비율/토큰 관리
- 보상 비율(user, platform, widget) 및 토큰 주소를 관리자가 변경 가능
- 유연한 보상 정책 운영
- (옵션) DAO 거버넌스 연동 가능

### 🔗 4. CCIP 메시지 수신
- CCIP를 통해 온 메시지(검색 로그, 보상 데이터 등) 수신 및 처리
- 메시지 인증(송신자 검증) 필요
- 크로스체인 데이터 안전 전송

### 📊 5. 이벤트 기록
- 검색 로그, 보상 분배 등 주요 액션마다 이벤트 발생
- 오프체인 대시보드/분석에 활용
- 실시간 모니터링 지원

### 💳 6. 잔여 토큰 관리
- 운영자가 컨트랙트에 남은 토큰을 인출할 수 있는 함수
- 토큰 유동성 관리 및 운영 효율성 확보

### 📋 기능별 함수/이벤트 구조

| 기능                | 함수 예시                    | 이벤트 예시                |
|---------------------|------------------------------|----------------------------|
| 검색 로그 기록      | `logSearch()`               | `event SearchLogged`       |
| 보상 분배           | `distributeReward()`        | `event RewardDistributed`  |
| 보상 정책 관리      | `setRewardPolicy()`         | `event PolicyUpdated`      |
| 토큰 관리           | `setRewardToken()`          | `event TokenUpdated`       |
| CCIP 메시지 수신    | `receiveCCIPMessage()`      | `event MessageReceived`    |
| 잔여 토큰 인출      | `withdraw()`                | `event TokenWithdrawn`     |

### 🎯 핵심 구현 요소
- ✅ 검색 로그 기록
- ✅ 보상 분배 (user, platform, widget)
- ✅ 보상 정책/비율/토큰 관리
- ✅ CCIP 메시지 수신 및 인증
- ✅ 이벤트 기록
- ✅ 잔여 토큰 인출

## 🎯 TrendLink 핵심 기능

- **🔍 검색 데이터 수집**: 모든 검색 쿼리를 블록체인에 투명하게 기록
- **📈 실시간 트렌드 분석**: 검색 데이터를 기반으로 한 실시간 트렌드 Top 10 제공
- **💰 사용자 보상 시스템**: 검색 활동에 따른 토큰 보상 분배
- **🏪 플랫폼 SDK**: 쉬운 통합을 위한 React 컴포넌트 라이브러리
- **📊 분석 대시보드**: 플랫폼별 검색 통계 및 트렌드 인사이트
- **🔐 Web3Auth 통합**: 소셜 로그인과 자동 지갑 생성
- **🌐 CCIP 기반 데이터 전송**: 안전한 크로스체인 데이터 전송

---

# Monad Blitz Seoul Submission Process

1. Visit the `monad-blitz-seoul` repo (link [here](https://github.com/monad-developers/monad-blitz-seoul)) and fork it.

<img width="1511" alt="Screenshot 2025-07-07 at 10 17 05 AM" src="https://github.com/user-attachments/assets/341c6774-f5ea-484d-a700-28e89eee9f95" />

2. Give it your project name, a one-liner description, make sure you are forking `main` branch and click `Create Fork`.

<img width="1511" alt="Screenshot 2025-07-07 at 10 17 55 AM" src="https://github.com/user-attachments/assets/b4a60b3b-6fd9-42b8-ba38-77fd79f76986" />

3. In your fork you can make all the changes you want, add code of your project, create branches, add information to `README.md`, you can change anything and everything.