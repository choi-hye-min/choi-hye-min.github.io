---
description: random-post
---

# AI 기반 기술블로그 포스트 생성 규칙 (rule.md)

## 목적
AI 또는 자동화 시스템이 기술블로그 포스트를 작성할 때 일관성 있고 품질 높은 글을 생성할 수 있도록 상세한 규칙과 절차를 정의한다. 
포스트 주제 선정과 본문 작성에 대한 세부 절차를 포함한다.

---

## 사전 준비 및 주제 선정
1. 프롬프트에 입력된 주제가 없다면 기존 tags를 기반으로 새로운 주제 추천
2. 이미 작성된 포스트가 있다면 관련된 주제를 3가지 추천
---

## 파일 작성 규칙
1. **파일 위치**: `_posts/{YYYY}` 폴더에 작성한다.
2. **파일명**: `YYYY-MM-DD-postYYYYMMDD-{index}.md` 형식
    - YYYY-MM-DD: 작성 날짜
    - {index}: 같은 날짜 내 여러 포스트일 경우 1씩 증가
3. **Front-matter**
    - 예시:
      ```
      ---
      layout: post
      title: "포스트 제목"
      date: YYYY-MM-DD HH:MM:SS +0900
      categories: [카테고리1, 카테고리2]
      tags: [태그1, 태그2]
      ---
      ```
    - tags에는 특수기호 금지, date는 반드시 현재 시간
    - title은 본문 내용을 충분히 반영하여 작성

---

## 본문 작성 가이드
1. **간략한 설명**
    - 포스트 초반에 1~3줄 요약 설명(각 줄 앞에 `> `)
2. **본문**
    - 마크다운 문법을 준수한다.
    - 10,000자 이상 반드시 작성 (AI는 글자 수를 체크해야 함)
    - 초보자를 대상으로 하여 명확하고 쉽게 설명
    - 코드 예시는 가능하면 Kotlin 사용
      - 코드 예시사용시 config class부터 시작하여 전체 코드를 포함하여 예시할것
    - 최소 ####, ##### 등으로 계층적 구조 구분
    - 1., 1.1.1 숫자로 분리 금지
    - 코드블록, 이미지, 표 등 다양한 마크다운 기능 활용 가능
    - 강조 문구는 `문구` 형태로 작성
    - 도움이 될만한 레퍼런스/사이트 링크 추가
3. **결론 및 도움말**
    - 마지막 부분에 `> `로 시작하는 결론/도움말 작성

---

## 제목 규칙
- 제목에 "완전정복", "완전입문" 등 과장된 단어 사용 금지

---

## 포스트 작성 절차 (AI용)
1. `_posts/*.md`의 tags 필드를 모두 조사해 이미 다룬 주제와 미다룬 주제 목록화
2. 미다룬 주제 중 하나를 선정
3. 본 규칙을 모두 준수하여 포스트 초안 작성
4. 본문(샘플코드 제외)이 10,000자 이상인지 체크
    - 미달 시, 추가 설명/예시/배경지식/실전팁 등 최대한 자세히 보강
5. 작성 완료 후 마크다운 렌더링이 깨지지 않는지 확인
6. 이론적인 설명보다 코드위주로 포스트를 작성하고 설명 (중요)

---

## 체크리스트 (AI용)
- [ ] 파일명, 위치, Front-matter 규칙 준수
- [ ] tags 중복/미사용 주제 확인 및 선정
- [ ] 본문 10,000자 이상 (샘플코드 제외) 반드시 글자수 체크할것
- [ ] 마크다운 문법 오류 없음
- [ ] 제목 규칙 준수
- [ ] 결론/도움말 포함
- [ ] 레퍼런스 링크/자료 포함

---

## 참고
- 프롬프트에 작성될 포스트 내용을 출력할 필요없음