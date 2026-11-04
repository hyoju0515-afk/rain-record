# 비 만난 날 기록 + 아침 비 알림

정적 기록 앱과 아이폰 웹 푸시 알림을 함께 제공합니다.

## 기록 기능
- 날짜, 별칭, 대략적인 위치, 우산 여부, 대처, 우산값, 비고 입력
- 기록은 브라우저 localStorage에 저장되며 다른 기기와 동기화되지 않습니다.

## 아침 비 알림
- 위치: 광주광역시 북구 중흥동(동네 대표 좌표 기준)
- 확인 시간: 오전 8시 예보
- 알림 예약: 매일 오전 7시 30분(한국 시간) Cron
- 강수 확률 40% 이상 또는 시간 강수량 0.1mm 이상이면 푸시 알림 발송
- 날씨 데이터: Open-Meteo
- iPhone은 iOS 16.4 이상에서 사이트를 홈 화면에 추가한 뒤 앱 안의 '아이폰 비 알림 켜기'를 눌러야 합니다.

## Vercel 설정
1. GitHub 저장소를 Vercel 프로젝트로 Import합니다.
2. 프로젝트의 Storage에서 Blob Store를 만들고 프로젝트에 연결합니다. 연결하면 `BLOB_READ_WRITE_TOKEN` 환경 변수가 설정됩니다.
3. Project Settings → Environment Variables에 아래 변수를 Production에 추가합니다.
   - `VAPID_PUBLIC_KEY`: 웹 푸시 공개 키
   - `VAPID_PRIVATE_KEY`: 웹 푸시 개인 키(절대 공개하거나 GitHub에 올리지 마세요)
   - `CRON_SECRET`: 임의의 긴 비밀 문자열
4. 재배포합니다.
5. 배포 주소를 iPhone Safari로 열고 공유 → 홈 화면에 추가를 선택합니다. 홈 화면 아이콘으로 앱을 실행한 다음 '아이폰 비 알림 켜기'를 눌러 권한을 허용합니다.

Vercel Hobby Cron은 하루 1회 실행이며 지정된 시각에서 최대 59분 지연될 수 있습니다. 따라서 오전 7:30 예약은 대략 오전 7:30~8:29 사이에 실행될 수 있습니다. 정각 실행은 보장되지 않습니다.

## 개발
`npm install` 후 Vercel에 배포합니다. API 경로는 `/api/subscribe`, `/api/cron`입니다.
