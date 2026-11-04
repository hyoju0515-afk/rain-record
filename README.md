# 비 만난 날 기록

Google Apps Script 없이 동작하는 정적 웹사이트입니다.

## 기능
- 날짜, 별칭, 대략적인 위치, 우산 여부, 대처, 우산값, 비고 입력
- 입력값 검증
- 브라우저 `localStorage`에 기록 저장
- 현재 브라우저에 저장된 기록 목록 표시 및 전체 삭제

## 데이터 저장 범위
이 프로젝트는 서버 데이터베이스를 사용하지 않습니다. 기록은 저장한 브라우저/기기에만 남으며 다른 기기와 동기화되지 않습니다. 브라우저 사이트 데이터 삭제 또는 시크릿 모드 종료 시 기록이 사라질 수 있습니다.

## GitHub 업로드 및 Vercel 배포
1. GitHub에 새 저장소(예: `rain-record`)를 만듭니다.
2. 이 폴더의 `index.html`, `README.md`, `.gitignore`, `vercel.json`을 저장소 루트에 올립니다.
3. Vercel에서 **Add New → Project**를 선택하고 GitHub 저장소를 Import합니다.
4. Framework Preset은 **Other**, Build Command는 비워 두고 Output Directory는 `.`로 설정한 뒤 Deploy합니다.

추가 환경변수나 API 키는 필요하지 않습니다.
