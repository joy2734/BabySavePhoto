# devApp

모바일 앱 개발을 위한 초기 모노레포입니다.

- `apps/mobile`: Expo SDK 57 + React Native + TypeScript + Expo Router
- `apps/api`: Express + TypeScript 기반 API

## 요구 환경

- Node.js 22 이상, npm
- 휴대폰에서 테스트할 때 Expo Go와 동일한 Wi-Fi 연결

## 설치

```bash
npm install
cd apps/mobile && npm install && cd ../..
```

## 실행 (터미널 2개)

```bash
# 1. API 서버: http://localhost:4000/api/health
npm run dev:api

# 2. 모바일 앱 개발 서버
npm run dev:mobile
```

두 명령은 각각 별도 터미널에서 실행합니다. Expo가 표시하는 QR 코드를 Expo Go 앱으로 스캔합니다.

## 모바일에서 API 연결

`apps/mobile/.env.example`을 복사해 `apps/mobile/.env`을 만들고 `EXPO_PUBLIC_API_URL`을 환경에 맞게 변경합니다.

| 개발 환경 | API URL 예시 |
| --- | --- |
| 웹 / iOS 시뮬레이터 | `http://localhost:4000` |
| Android 에뮬레이터 | `http://10.0.2.2:4000` |
| 실제 휴대폰 | `http://192.168.x.x:4000` (개발 PC의 LAN IPv4로 교체) |

실제 휴대폰은 개발 PC와 같은 네트워크에 연결해야 합니다. Windows 방화벽에서 개발용 API 포트 4000의 접근을 허용해야 할 수 있습니다. 개발 서버는 LAN 접속을 위해 기본적으로 모든 인터페이스에서 대기하므로 신뢰할 수 있는 개인 네트워크에서만 사용하세요. 인터넷에 직접 노출하지 마세요.

`EXPO_PUBLIC_` 환경 변수는 앱 번들에 포함됩니다. 비밀번호나 API 비밀키를 저장하지 마세요.

API 서버 환경변수를 변경하려면 `apps/api/.env.example`을 `apps/api/.env`로 복사하세요. 개발 상태 확인 API: `GET /api/health`.

## 검사

```bash
npm run check:api
npm run check:mobile
```

현재 앱은 초기 UI 및 헬스체크만 제공합니다. 데이터베이스, 로그인, 배포용 HTTPS, 비밀키 관리, 테스트 및 운영 인프라는 요구사항이 정해지면 추가하세요.
