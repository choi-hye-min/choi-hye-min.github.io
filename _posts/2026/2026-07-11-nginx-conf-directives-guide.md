---
layout: post
title: "nginx.conf 구조와 주요 설정 항목 설명"
date: 2026-07-11 01:27:32 +0900
categories: [Nginx, Infrastructure, DevOps]
tags: [Nginx, nginx.conf, Configuration, HTTP, Reverse Proxy, Logging, DevOps]
description: "nginx.conf를 처음 읽는 개발자를 위해 main, events, http, server, location 블록과 자주 쓰는 지시어의 의미를 예제 중심으로 설명합니다."
---

> `nginx.conf`는 단순한 옵션 목록이 아니라 context 안에 directive를 배치하는 계층형 설정 파일입니다.
> 이 글은 `main`, `events`, `http`, `server`, `location` 블록과 자주 쓰는 설정 항목을 예제와 함께 설명합니다.
> 글을 읽고 나면 복사한 Nginx 설정을 그대로 붙여 넣는 대신, 각 줄이 어느 범위에 영향을 주는지 판단할 수 있습니다.

이 글은 2026년 7월 11일 기준 Nginx 공식 문서를 바탕으로 작성했습니다. 예제는 Linux 서버에서 Nginx Open Source를 HTTP 서버와 reverse proxy로 사용하는 일반적인 상황을 기준으로 합니다. 배포판, 패키지 설치 방식, 컨테이너 환경에 따라 실제 파일 위치와 include 구조는 달라질 수 있습니다.

## nginx.conf를 읽기 전에 알아야 할 두 단어

Nginx 설정을 읽을 때 가장 먼저 알아야 할 단어는 **directive**와 **context**입니다. directive는 Nginx에게 어떤 동작을 하라고 알려주는 설정 명령입니다. 예를 들어 `worker_processes auto;`, `listen 80;`, `proxy_pass http://app;` 같은 한 줄이 directive입니다.

context는 directive가 놓이는 범위입니다. Nginx 설정은 중괄호 `{}`로 묶인 블록을 사용해 범위를 나눕니다. `events {}`, `http {}`, `server {}`, `location {}` 같은 블록이 context입니다. 어떤 directive는 파일 최상단에만 쓸 수 있고, 어떤 directive는 `server`나 `location` 안에서만 의미가 있습니다.

공식 Beginner's Guide는 Nginx directive를 단순 directive와 block directive로 나눕니다. 단순 directive는 세미콜론으로 끝나고, block directive는 중괄호 안에 추가 설정을 담습니다. 이 규칙만 알아도 `nginx: [emerg] directive is not allowed here` 같은 오류를 훨씬 쉽게 이해할 수 있습니다.

## 전체 예제로 먼저 보기

아래 설정은 정적 파일과 API reverse proxy를 함께 처리하는 예제입니다. 처음부터 모든 값을 외울 필요는 없습니다. 전체 모양을 먼저 보고, 이후 섹션에서 각 항목을 하나씩 해석하겠습니다.

```nginx
user nginx;
worker_processes auto;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $host "$request" '
                    'status=$status bytes=$body_bytes_sent '
                    'request_time=$request_time';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    sendfile on;
    keepalive_timeout 65;
    client_max_body_size 10m;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript application/xml;

    upstream app_backend {
        server 127.0.0.1:8080;
    }

    server {
        listen 80;
        server_name example.com www.example.com;

        root /var/www/example;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        location /api/ {
            proxy_pass http://app_backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            proxy_connect_timeout 3s;
            proxy_read_timeout 10s;
        }
    }
}
```

이 설정은 크게 네 단계로 나눠 읽으면 됩니다. 파일 최상단은 Nginx 프로세스 전체에 영향을 주는 main context입니다. `events`는 연결 처리 방식과 worker당 연결 수를 다룹니다. `http`는 HTTP 서버 전체에 공통으로 적용되는 설정입니다. 그 안의 `server`와 `location`은 특정 도메인과 경로에 대한 동작을 정합니다.

## main context: Nginx 프로세스 전체 설정

main context는 어떤 중괄호에도 들어가지 않은 최상위 영역입니다. 여기에는 Nginx 프로세스 자체와 관련된 설정이 들어갑니다. 대표적으로 `user`, `worker_processes`, `pid`, `error_log` 같은 항목이 있습니다.

```nginx
user nginx;
worker_processes auto;
pid /run/nginx.pid;
```

`user`는 worker process가 어떤 OS 사용자 권한으로 실행될지 정합니다. master process는 보통 root 권한으로 시작해 80, 443 같은 privileged port를 열 수 있고, 실제 요청 처리는 더 제한된 사용자 권한의 worker가 담당합니다. 배포판에 따라 기본 사용자는 `nginx`, `www-data` 등으로 다를 수 있습니다.

`worker_processes`는 요청을 처리하는 worker process 수를 정합니다. `auto`로 두면 Nginx가 사용 가능한 CPU 코어 수를 기준으로 자동 조정합니다. 대부분의 일반적인 HTTP 서버에서는 `auto`가 좋은 출발점입니다. 다만 CPU 제한이 걸린 컨테이너나 특수한 워크로드에서는 실제 할당 자원과 관측 지표를 보고 조정해야 합니다.

`pid`는 master process의 PID(Process ID)를 기록할 파일 경로입니다. 운영자가 `nginx -s reload`처럼 신호를 보낼 때 내부적으로 master process를 식별하는 데 사용됩니다. 직접 자주 만질 항목은 아니지만, 프로세스 제어와 서비스 매니저 연동에서 문제가 생겼을 때 확인할 수 있습니다.

main context에 둘 수 있는 directive를 `server`나 `location` 안에 넣으면 Nginx가 시작되지 않습니다. 예를 들어 `worker_processes`는 site별 설정 파일인 `/etc/nginx/conf.d/default.conf` 안에 두면 안 됩니다. 이 파일은 보통 이미 `http` context 안으로 include되기 때문입니다.

## events context: 연결 처리의 기본값

`events` context는 Nginx가 네트워크 연결을 어떻게 처리할지 정하는 영역입니다. 초보자에게 가장 중요한 항목은 `worker_connections`입니다.

```nginx
events {
    worker_connections 1024;
}
```

`worker_connections`는 worker process 하나가 동시에 열 수 있는 최대 연결 수를 의미합니다. 단순히 “동시 사용자 수”와 같지는 않습니다. 클라이언트 연결뿐 아니라 upstream 서버와의 연결도 여기에 포함될 수 있기 때문입니다. reverse proxy 서버에서는 클라이언트와 백엔드 양쪽 연결을 모두 고려해야 합니다.

대략적인 상한은 `worker_processes × worker_connections`로 생각할 수 있지만, 실제 처리량은 파일 디스크립터 제한, upstream 연결, keep-alive, OS 설정, 애플리케이션 지연에 영향을 받습니다. 따라서 이 값을 크게 올리는 것만으로 성능 문제가 해결되지는 않습니다.

운영에서 연결 한계가 의심된다면 Nginx 설정만 보지 말고 OS의 file descriptor limit과 로그, upstream 응답 시간, worker 상태를 함께 봐야 합니다. `worker_connections`는 용량 계획의 일부이지, 만능 성능 스위치가 아닙니다.

## http context: HTTP 서버 전체의 공통 설정

`http` context는 HTTP와 관련된 공통 설정을 담습니다. 여러 `server` 블록에 공통으로 적용할 값은 여기 두는 것이 자연스럽습니다. MIME 타입, 로그 형식, 파일 전송 방식, gzip, upstream 그룹, 기본 timeout 등이 여기에 들어갈 수 있습니다.

```nginx
http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    sendfile on;
    keepalive_timeout 65;
    client_max_body_size 10m;
}
```

`include`는 다른 설정 파일을 현재 위치에 끼워 넣습니다. Nginx 배포판에서는 보통 `mime.types`, `conf.d/*.conf`, `sites-enabled/*` 같은 파일을 include합니다. include는 파일을 “읽기 쉽게 나누는 기능”이지 별도의 scope를 만드는 기능이 아닙니다. include된 파일의 내용은 include가 적힌 위치의 context에서 해석됩니다.

`default_type`은 응답의 기본 Content-Type을 정합니다. `mime.types`가 확장자별 타입을 매핑하지만, 타입을 알 수 없는 파일에는 `default_type`이 사용됩니다. 보통 기본값으로 충분하고, 특정 location에서만 바꿀 수도 있습니다.

`sendfile on;`은 정적 파일 전송에서 커널의 효율적인 파일 전송 기능을 사용하게 합니다. 정적 파일을 많이 제공하는 서버에서는 유용할 수 있습니다. 반대로 개발 환경이나 특수한 네트워크 파일 시스템에서는 캐시 문제를 겪는 경우가 있어 환경에 맞게 확인해야 합니다.

`keepalive_timeout`은 클라이언트와의 keep-alive 연결을 얼마나 유지할지 정합니다. 값이 너무 짧으면 연결 재사용 이점이 줄고, 너무 길면 유휴 연결이 자원을 오래 잡을 수 있습니다. 이 값은 트래픽 특성과 앞단 로드밸런서 timeout과 함께 맞춰야 합니다.

`client_max_body_size`는 클라이언트 요청 본문의 최대 크기입니다. 파일 업로드가 없는 API에 큰 값을 둘 필요는 없습니다. 업로드 기능이 있다면 전체 `http`에 크게 주기보다 업로드 location에만 필요한 값을 주는 편이 더 안전합니다.

## server context: 도메인과 포트 단위의 가상 서버

`server` context는 하나의 가상 서버를 정의합니다. 같은 Nginx 인스턴스에서 여러 도메인이나 포트를 처리할 때 `server` 블록을 여러 개 둡니다.

```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    root /var/www/example;
    index index.html;
}
```

`listen`은 이 server 블록이 어떤 주소와 포트에서 요청을 받을지 정합니다. 가장 흔한 형태는 `listen 80;`과 `listen 443 ssl;`입니다. 같은 포트에 여러 `server` 블록이 있으면 Nginx는 요청의 `Host` 헤더와 `server_name`을 보고 어떤 블록을 사용할지 결정합니다.

`server_name`은 이 server 블록이 처리할 도메인을 나열합니다. 정확한 이름, wildcard, 정규식 등을 사용할 수 있지만, 처음에는 정확한 도메인 이름을 명시하는 방식이 가장 이해하기 쉽습니다. 도메인이 맞지 않는 요청은 해당 listen 주소의 default server로 갈 수 있으므로, 기본 서버를 어떻게 둘지도 운영 기준에 포함해야 합니다.

`root`는 정적 파일을 찾을 기준 디렉터리입니다. 예를 들어 `root /var/www/example;`이고 사용자가 `/css/main.css`를 요청하면 Nginx는 `/var/www/example/css/main.css`를 찾습니다. `root`는 `http`, `server`, `location`에서 사용할 수 있지만, location별로 바꿀 때는 경로 결합 결과를 반드시 확인해야 합니다.

`index`는 디렉터리 요청이 들어왔을 때 찾을 기본 파일입니다. `/` 요청에서 `/var/www/example/index.html`을 응답하는 식입니다. `index`가 없거나 접근 권한이 없으면 403 또는 404처럼 보이는 문제가 생길 수 있으므로 정적 파일 배포 후 권한과 실제 파일 위치를 함께 확인해야 합니다.

## location context: URI 경로별 처리 규칙

`location` context는 요청 URI에 따라 다른 동작을 하게 만드는 핵심 블록입니다. 정적 파일을 내려줄지, 백엔드로 proxy할지, 특정 파일을 fallback으로 줄지 여기서 결정합니다.

```nginx
location / {
    try_files $uri $uri/ /index.html;
}

location /api/ {
    proxy_pass http://app_backend/;
}
```

`location /`은 가장 넓은 경로 매칭입니다. 다른 location이 매칭되지 않을 때 마지막으로 사용되는 기본 처리처럼 생각할 수 있습니다. SPA(Single Page Application)에서는 `try_files $uri $uri/ /index.html;` 조합을 자주 사용합니다. 실제 파일이 있으면 파일을 제공하고, 없으면 프론트엔드 라우터가 처리하도록 `index.html`을 반환하는 방식입니다.

`try_files`는 주어진 파일 후보를 순서대로 확인하고, 없으면 마지막 인자로 내부 redirect 또는 상태 코드를 사용합니다. `$uri`는 요청 URI에 해당하는 파일을 의미하고, `$uri/`는 디렉터리를 의미합니다. 마지막 `/index.html`은 앞의 후보가 없을 때 사용할 fallback입니다.

`location /api/`는 `/api/`로 시작하는 요청을 처리합니다. 여기서는 `proxy_pass`로 백엔드 upstream에 요청을 넘깁니다. `proxy_pass http://app_backend/;`처럼 뒤에 `/`가 있으면 `/api/users`가 백엔드의 `/users`로 전달될 수 있습니다. 반대로 `proxy_pass http://app_backend;`처럼 URI를 붙이지 않으면 원래 URI가 유지됩니다.

location 매칭은 단순해 보이지만 실무 장애가 자주 생기는 영역입니다. prefix location, exact match, regular expression location이 섞이면 우선순위를 이해해야 합니다. 처음에는 정규식 location을 남발하지 말고, 명확한 prefix 기반으로 구성하는 편이 좋습니다.

## upstream context: 백엔드 서버 그룹

`upstream`은 여러 백엔드 서버를 하나의 이름으로 묶는 블록입니다. reverse proxy나 load balancing 구성에서 자주 사용합니다.

```nginx
upstream app_backend {
    server 127.0.0.1:8080;
    server 127.0.0.1:8081;
}
```

이렇게 정의하면 `proxy_pass http://app_backend;`처럼 이름으로 참조할 수 있습니다. 백엔드 서버가 한 대뿐이어도 upstream 이름을 쓰면 나중에 서버를 추가하거나 주소를 바꿀 때 location 설정을 덜 건드릴 수 있습니다.

`server` directive는 upstream 안에서는 백엔드 서버 주소를 의미합니다. 앞서 본 `server {}` 블록과 이름은 같지만 context가 다릅니다. 이처럼 Nginx 설정에서는 같은 단어라도 놓인 위치에 따라 의미가 달라질 수 있습니다.

운영에서는 upstream에 서버를 여러 대 넣는 것만으로 충분하지 않습니다. 세션 저장 방식, 배포 중 트래픽 제외, 장애 감지, retry 정책을 함께 봐야 합니다. 백엔드가 상태를 메모리에만 저장한다면 요청이 다른 서버로 갈 때 문제가 생길 수 있습니다.

## logging 설정: access_log, error_log, log_format

로그는 Nginx 설정에서 가장 먼저 정리해 둘 만한 운영 도구입니다. Nginx에는 요청 로그인 access log와 문제 로그인 error log가 있습니다.

```nginx
log_format main '$remote_addr - $host "$request" '
                'status=$status bytes=$body_bytes_sent '
                'request_time=$request_time';

access_log /var/log/nginx/access.log main;
error_log /var/log/nginx/error.log warn;
```

`log_format`은 access log의 형식을 정의합니다. `$remote_addr`, `$host`, `$request`, `$status`, `$request_time` 같은 변수로 요청 정보를 남길 수 있습니다. 운영에서는 upstream 상태와 응답 시간도 함께 남기면 proxy 문제를 구분하기 쉽습니다.

`access_log`는 요청 로그를 어디에 어떤 형식으로 남길지 정합니다. `http`에 두면 기본값처럼 여러 server에 적용되고, 특정 `server`나 `location`에서 다시 정의할 수 있습니다. 정적 파일 요청이 너무 많다면 일부 location에서 access log를 끄는 선택도 가능하지만, 장애 분석에 필요한 요청까지 사라지지 않도록 주의해야 합니다.

`error_log`는 Nginx 내부 오류, 경고, upstream 연결 실패 같은 정보를 남깁니다. `warn`, `error`, `crit`처럼 로그 레벨을 조정할 수 있습니다. 운영에서는 너무 낮은 레벨을 장기간 켜 두면 로그가 과도하게 쌓일 수 있고, 너무 높은 레벨만 남기면 문제 원인이 사라질 수 있습니다.

로그에는 개인정보, 인증 토큰, 쿠키, 요청 본문을 그대로 남기지 않는 것이 기본입니다. 디버깅 때문에 일시적으로 자세한 로그가 필요하다면 샘플링, 마스킹, 보관 기간, 접근 권한을 함께 정해야 합니다.

## gzip 설정: 응답 압축을 켜는 위치

`gzip`은 텍스트 기반 응답을 압축해 전송량을 줄이는 기능입니다. HTML, CSS, JavaScript, JSON 같은 응답에 효과가 있습니다. 이미 압축된 이미지나 zip 파일에는 보통 효과가 거의 없습니다.

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript application/xml;
```

`gzip on;`은 gzip 압축을 활성화합니다. `gzip_types`는 어떤 MIME 타입을 압축할지 정합니다. `text/html`은 별도 지정이 없어도 기본적으로 처리되는 타입이므로, 예제에서는 CSS, JSON, JavaScript, XML을 추가했습니다.

gzip은 전송량을 줄이지만 CPU를 사용합니다. 정적 파일이 매우 크거나 트래픽이 많다면 압축 레벨, 캐싱, 사전 압축 파일 제공 같은 전략을 함께 봐야 합니다. 또한 이미 CDN이나 앞단 proxy에서 압축을 처리한다면 Nginx와 역할이 중복될 수 있습니다.

## proxy 설정: 백엔드로 넘길 때 필요한 항목

reverse proxy에서 가장 중요한 directive는 `proxy_pass`입니다. 하지만 운영 설정에서는 `proxy_set_header`, timeout, 요청 크기 제한을 함께 봐야 합니다.

```nginx
location /api/ {
    proxy_pass http://app_backend/;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_connect_timeout 3s;
    proxy_read_timeout 10s;
}
```

`proxy_pass`는 요청을 전달할 upstream이나 URL을 지정합니다. 뒤에 URI를 붙이는지에 따라 백엔드가 받는 path가 달라질 수 있으므로 반드시 테스트해야 합니다. 이 항목은 이전 reverse proxy 글의 핵심이기도 하지만, `nginx.conf`를 읽을 때도 가장 먼저 확인할 줄입니다.

`proxy_set_header`는 백엔드에 전달할 HTTP 헤더를 설정합니다. `Host`는 원래 요청 도메인을 유지하고, `X-Real-IP`와 `X-Forwarded-For`는 클라이언트 IP 추적에 쓰입니다. `X-Forwarded-Proto`는 원래 요청이 HTTP인지 HTTPS인지 알려 줍니다. 백엔드 프레임워크가 이 헤더를 신뢰하도록 별도 설정이 필요한 경우도 많습니다.

`proxy_connect_timeout`은 Nginx가 백엔드에 연결을 맺을 때 기다리는 시간입니다. `proxy_read_timeout`은 백엔드 응답을 읽는 동안의 timeout입니다. 값을 늘리면 오류가 줄어드는 것처럼 보일 수 있지만, 느린 요청이 오래 쌓여 더 큰 장애가 될 수 있습니다. timeout은 장애를 숨기는 설정이 아니라 실패를 제한하는 설정으로 봐야 합니다.

## include 구조: nginx.conf와 conf.d의 관계

많은 배포판의 `/etc/nginx/nginx.conf`는 실제 사이트 설정을 직접 길게 쓰지 않고, 다른 파일을 include합니다.

```nginx
http {
    include /etc/nginx/mime.types;
    include /etc/nginx/conf.d/*.conf;
}
```

이 구조에서 `/etc/nginx/conf.d/app.conf` 파일은 독립적인 최상위 설정 파일이 아닙니다. `http` context 안에서 include되므로, 그 파일 안에는 보통 `server { ... }` 블록을 작성합니다. 여기에 `http {}`나 `events {}`를 다시 쓰면 context 오류가 날 수 있습니다.

이 점은 초보자가 많이 헷갈리는 부분입니다. 블로그나 문서에서 본 전체 `nginx.conf` 예제를 `conf.d/default.conf`에 그대로 붙여 넣으면 실패할 수 있습니다. 자신이 편집하는 파일이 main config인지, `http` 안으로 include되는 site config인지 먼저 확인해야 합니다.

배포 전에는 다음 명령으로 Nginx가 실제로 읽는 전체 설정을 확인할 수 있습니다.

```bash
nginx -T
```

`nginx -T`는 설정 문법을 검사하고, include된 파일까지 합친 설정을 출력합니다. 운영 서버에서는 출력에 경로나 내부 도메인이 포함될 수 있으므로 외부에 공유할 때는 민감 정보를 제거해야 합니다.

## 설정 검증과 reload 순서

Nginx 설정은 문법이 틀리면 reload 시도에서 실패할 수 있습니다. 운영에서는 설정 파일을 수정한 뒤 바로 reload하지 말고 먼저 문법 검사를 실행하는 습관을 들여야 합니다.

```bash
nginx -t
```

`nginx -t`는 설정 파일의 문법과 참조 파일을 검사합니다. 성공하면 다음처럼 reload할 수 있습니다.

```bash
nginx -s reload
```

systemd를 사용하는 서버에서는 보통 다음 명령을 씁니다.

```bash
sudo systemctl reload nginx
```

공식 문서에 따르면 reload 시 master process는 새 설정의 문법을 확인하고 적용을 시도합니다. 성공하면 새 worker process를 시작하고 기존 worker에게 종료를 요청합니다. 실패하면 기존 설정으로 계속 동작합니다. 그래도 운영에서는 reload 전후로 error log와 상태 확인을 해야 합니다. 문법은 맞아도 upstream 주소, 인증서 경로, 파일 권한 같은 런타임 문제가 남아 있을 수 있기 때문입니다.

## 어디에 어떤 항목을 둘지 판단하는 기준

Nginx 설정을 잘 읽으려면 directive의 뜻만큼이나 위치를 봐야 합니다. 같은 항목이라도 `http`, `server`, `location` 중 어디에 두느냐에 따라 적용 범위가 달라집니다.

| 설정 위치 | 적용 범위 | 예시 |
|---|---|---|
| main | Nginx 프로세스 전체 | `user`, `worker_processes`, `pid` |
| events | 연결 처리 | `worker_connections` |
| http | 모든 HTTP 서버 기본값 | `log_format`, `gzip`, `client_max_body_size` |
| server | 특정 도메인과 포트 | `listen`, `server_name`, `root` |
| location | 특정 URI 경로 | `try_files`, `proxy_pass`, 경로별 제한 |
| upstream | 백엔드 서버 그룹 | `server 127.0.0.1:8080` |

공통 설정은 상위 context에 두고, 예외만 하위 context에서 덮어쓰는 방식이 읽기 쉽습니다. 예를 들어 모든 API에 요청 크기 제한이 같다면 `http`나 공통 include에 둘 수 있습니다. 특정 업로드 경로만 큰 파일을 받아야 한다면 해당 `location`에만 더 큰 `client_max_body_size`를 둡니다.

반대로 모든 설정을 location마다 반복하면 변경이 어렵고 누락이 생깁니다. 모든 설정을 http에 몰아넣으면 특정 서비스의 예외 정책이 보이지 않습니다. “누가 이 값을 공유하는가?”를 기준으로 위치를 정하면 과한 중복과 과한 전역 설정을 피할 수 있습니다.

## 자주 하는 실수와 주의사항

### conf.d 파일에 전체 nginx.conf를 붙여 넣는다

`conf.d/*.conf`는 보통 `http` context 안에서 include됩니다. 이 파일에 `events {}`나 `http {}`를 다시 쓰면 context 오류가 날 수 있습니다. 전체 예제인지, site server 블록 예제인지 구분해야 합니다.

### directive가 허용되는 context를 확인하지 않는다

Nginx 공식 directive 문서에는 각 항목의 `Context`가 적혀 있습니다. 오류 메시지가 `not allowed here`라면 오타보다 위치 문제일 가능성이 큽니다. directive 이름을 검색해 어느 context에서 허용되는지 확인하세요.

### root와 location 경로 결합을 착각한다

`root /var/www/example;`와 `location /images/`가 만나면 `/images/a.png`는 `/var/www/example/images/a.png`를 찾습니다. location 이름이 파일 시스템 경로를 대체하는 것이 아니라 URI와 root가 결합된다는 점을 이해해야 합니다.

### proxy_pass 뒤의 URI 유무를 테스트하지 않는다

`proxy_pass http://app;`와 `proxy_pass http://app/;`는 경로 전달 결과가 달라질 수 있습니다. 특히 `/api/` prefix 제거 여부가 서비스 라우팅과 맞지 않으면 404가 발생합니다. 배포 전에 `curl`과 백엔드 로그로 실제 path를 확인해야 합니다.

### nginx -t 없이 reload한다

작은 수정처럼 보여도 세미콜론 누락, 중괄호 위치, 인증서 경로 오류로 reload가 실패할 수 있습니다. 운영에서는 `nginx -t`를 먼저 실행하고, reload 후 error log를 확인하는 절차를 습관으로 만드는 것이 좋습니다.

## 배포 전 체크리스트

- 현재 편집하는 파일이 main `nginx.conf`인지, `http` 안에 include되는 site config인지 확인했는가?
- 각 directive가 허용되는 context에 있는가?
- `server_name`과 DNS, 인증서의 도메인이 일치하는가?
- `root`와 `try_files`가 실제 파일 경로와 맞는가?
- `/api/` 같은 prefix가 백엔드에 유지되는지 제거되는지 테스트했는가?
- `client_max_body_size`가 기능별 요구사항과 보안 기준에 맞는가?
- access log와 error log에서 장애 원인을 찾을 수 있는가?
- `nginx -t`가 성공하는가?
- reload 후 기존 연결과 새 요청이 정상 동작하는가?
- `nginx -T` 출력에 민감 정보가 포함되지 않도록 관리하고 있는가?

체크리스트의 핵심은 “Nginx가 켜지는가?”보다 “내가 쓴 각 줄의 적용 범위를 알고 있는가?”입니다. 설정 파일은 한 번 동작하면 끝나는 코드가 아니라, 장애가 났을 때 가장 먼저 읽게 되는 운영 문서이기도 합니다.

## 결론 및 도움말

> `nginx.conf`는 `main → events/http → server → location`으로 내려가는 계층형 설정입니다. 각 directive는 허용되는 context가 있고, 그 위치가 곧 적용 범위를 결정합니다. 설정을 복사하기 전에 “이 줄은 어느 블록에 있어야 하며, 누구에게 적용되는가?”를 먼저 물어보세요.
>
> 처음에는 전체 예제 하나를 기준으로 삼고, `worker_processes`, `worker_connections`, `listen`, `server_name`, `root`, `try_files`, `proxy_pass`, `access_log`처럼 자주 보는 항목부터 익히면 충분합니다. 이후 운영에서는 `nginx -t`, `nginx -T`, access log, error log를 함께 사용해 설정과 실제 동작이 일치하는지 확인해야 합니다.

## 참고자료/레퍼런스

- [Nginx Beginner's Guide](https://nginx.org/en/docs/beginners_guide.html)
- [Nginx Core functionality](https://nginx.org/en/docs/ngx_core_module.html)
- [Nginx ngx_http_core_module](https://nginx.org/en/docs/http/ngx_http_core_module.html)
- [Nginx ngx_http_proxy_module](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [Nginx ngx_http_upstream_module](https://nginx.org/en/docs/http/ngx_http_upstream_module.html)
- [Nginx ngx_http_log_module](https://nginx.org/en/docs/http/ngx_http_log_module.html)
- [Nginx Alphabetical index of directives](https://nginx.org/en/docs/dirindex.html)
