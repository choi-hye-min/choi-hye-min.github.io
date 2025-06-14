# AI 기반 기술블로그 포스트 자동생성 규칙 (rule.md)

## 목적
AI 또는 자동화 시스템이 기술블로그 포스트를 작성할 때 일관성 있고 품질 높은 글을 생성할 수 있도록 상세한 규칙과 절차를 정의한다. 
포스트 주제 선정과 본문 작성에 대한 세부 절차를 포함한다.

---

## 사전 준비 및 주제 선정
1. **기존 포스트의 주제 파악**
    - `_posts/*.md` 파일의 `tags` 필드를 모두 조사한다.
    - 이미 다루어진 주제(태그)와 아직 다루지 않은 주제를 목록화한다.
    - 예시(이미 다루어진 태그):
      - springboot, lock, 동기화, 분산락, 동시성, 초보자, os, 운영체제, process, thread, memory, filesystem, scheduling, algorithm, data-structure, 코딩테스트, design-pattern, oop, 객체지향, network, osi, tcpip, http, https, ssl, tls, 보안, rest, api, 웹개발, git, github, cli, 버전관리, oauth2, 인증, 인가, security, intellij, vscode, gitbash, terminal, 개발환경, cloud, aws, gcp, azure, 인프라, database, rdb, nosql, sql, 데이터, cicd, githubactions, devops, 배포자동화, 실전, kotlin, 테스트, TDD, 단위테스트, 통합테스트, mock, coverage, junit, kotest, spring, webflux, databuffer, publish, autoconnect, cache, refcount, restful, api설계, bestpractice, frontend, html, css, javascript, docker, container, devops, 실습, coroutine, scope, GlobalScope, CoroutineScope, MainScope, viewModelScope, lifecycleScope, java, java8, java21, feature, samplecode, mdc, logging, mvc, errorhandling, springboot3, mongodb, customrepository, query, springdata, annotation, EnableCaching, 캐시, Redis, Caffeine, Armeria, gRPC, ContextPropagation, 코틀린, Java, 언어비교, 마이그레이션, Resilience4j, CircuitBreaker, 장애 대응, 마이크로서비스, Thrift, RPC, 프로토콜, 시스템 설계, 코루틴, async, armeira, Stub, ErrorHandling, 백엔드, proto, 실전팁, build.gradle.kts, Gradle, Kotlin DSL, 빌드, 비교 등.
    - **아직 다루지 않은 주제**(예시):
      - 최신 IT 트렌드, Spring boot3, kotlin, java, 개발자 커리어 관리 등 기존 태그에 없는 새로운 주제를 선정한다.
2. **새로운 포스트 주제 선정**
    - 위에서 파악한 '아직 다루지 않은 주제' 중 하나를 선정한다.
    - 선정 기준: 기존 포스트와 중복되지 않으며, 초보자에게 도움이 될 만한 주제.

---

## 파일 작성 규칙
1. **파일 위치**: `_posts` 폴더에 작성한다.
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
    - 샘플코드 제외 10,000자 이상 반드시 작성 (AI는 글자 수를 체크해야 함)
    - 초보자를 대상으로 하여 명확하고 쉽게 설명
    - 코드 예시는 가능하면 Kotlin 사용
    - ####, ##### 등으로 계층적 구조 구분
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

---

## 체크리스트 (AI용)
- [ ] 파일명, 위치, Front-matter 규칙 준수
- [ ] tags 중복/미사용 주제 확인 및 선정
- [ ] 본문 10,000자 이상 (샘플코드 제외)
- [ ] 마크다운 문법 오류 없음
- [ ] 제목 규칙 준수
- [ ] 결론/도움말 포함
- [ ] 레퍼런스 링크/자료 포함

---

