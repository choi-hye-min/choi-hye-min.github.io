# Arthur Blog

CreatedAt: 2018/12/08

Jekyll 기반 기술 블로그입니다.

## 요구 사항

- Ruby
- Bundler
- Git

현재 프로젝트는 `Gemfile.lock` 기준 Bundler `2.6.9`로 관리됩니다.

## Windows 실행 가이드

### 1. Ruby 설치 확인

PowerShell에서 아래 명령어로 Ruby와 Bundler가 설치되어 있는지 확인합니다.

```powershell
ruby -v
bundle -v
```

Bundler가 없다면 설치합니다.

```powershell
gem install bundler
```

### 2. 의존성 설치

프로젝트 루트에서 실행합니다.

```powershell
bundle install
```

### 3. 로컬 서버 실행

```powershell
$env:RUBYOPT = "-W0"
bundle exec jekyll serve --livereload
```

또는 제공된 스크립트를 실행합니다.

```powershell
.\start.ps1
```

브라우저에서 아래 주소로 접속합니다.

```text
http://127.0.0.1:4000/
```

## macOS 실행 가이드

### 1. Ruby 설치 확인

터미널에서 아래 명령어로 Ruby와 Bundler가 설치되어 있는지 확인합니다.

```bash
ruby -v
bundle -v
```

Bundler가 없다면 설치합니다.

```bash
gem install bundler
```

시스템 Ruby에서 권한 문제가 발생하면 `rbenv` 또는 `asdf`로 별도 Ruby 버전을 설치해서 사용하는 것을 권장합니다.

### 2. 의존성 설치

프로젝트 루트에서 실행합니다.

```bash
bundle install
```

### 3. 로컬 서버 실행

```bash
RUBYOPT="-W0" bundle exec jekyll serve --livereload
```

또는 제공된 스크립트를 실행합니다.

```bash
chmod +x start.sh
./start.sh
```

브라우저에서 아래 주소로 접속합니다.

```text
http://127.0.0.1:4000/
```

## 새 포스트 작성

프로젝트 루트에서 제목과 영문 slug를 전달해 새 포스트를 생성합니다.

```bash
ruby scripts/new_post.rb "LangGraph 핵심 용어와 동작 구조 정리" langgraph-core-concepts
```

포스트는 작성일에 따라 `_posts/<연도>/<날짜>-<slug>.md` 경로에 생성됩니다.

```text
_posts/2026/2026-06-20-langgraph-core-concepts.md
```

slug에는 소문자 영문, 숫자, 하이픈만 사용할 수 있습니다. 주제 분류는 디렉터리 대신
생성된 front matter의 `categories`와 `tags`에 작성합니다. 포스트 전용 이미지는 다음
경로에 두는 것을 권장합니다.

```text
images/posts/langgraph-core-concepts/
```

기존 포스트의 파일명은 이전 URL을 유지하기 위해 변경하지 않습니다.

## 빌드 확인

서버 실행 전 정적 빌드만 확인하려면 아래 명령어를 사용합니다.

```bash
bundle exec jekyll build
```

빌드 결과물은 `_site/` 폴더에 생성됩니다.

## 경고 처리

- Ruby deprecation 경고는 `RUBYOPT="-W0"`로 숨깁니다. `start.ps1`, `start.sh`에는 이미 적용되어 있습니다.
- Windows 파일 변경 감지 경고를 줄이기 위해 `wdm` gem을 사용합니다.
- Sass `@import` deprecation 경고를 피하기 위해 SCSS는 `@use` 기반으로 구성합니다.
