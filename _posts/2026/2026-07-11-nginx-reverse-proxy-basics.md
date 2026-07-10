---
layout: post
title: "Nginx Reverse Proxy 개념과 설정 예제"
date: 2026-07-11 00:55:54 +0900
categories: [Nginx, Infrastructure, Network]
tags: [Nginx, Reverse Proxy, Proxy, Load Balancing, HTTP, DevOps, nginx.conf]
description: "Nginx reverse proxy의 역할과 요청 흐름을 쉽게 설명하고, Host·X-Forwarded-* 헤더, upstream, TLS 종료를 포함한 nginx.conf 예제를 정리합니다."
---

> Reverse proxy는 클라이언트 대신 백엔드 서버 앞에서 요청을 받아 전달하는 진입점입니다.
> 이 글은 Nginx에서 reverse proxy가 왜 필요한지, 요청이 어떻게 흘러가는지, `nginx.conf`를 어떤 기준으로 작성해야 하는지 설명합니다.
> 글을 읽고 나면 단순한 `proxy_pass` 예제를 넘어 헤더, 경로, timeout, 로드밸런싱, TLS 종료까지 기본 운영 구성을 판단할 수 있습니다.

이 글은 2026년 7월 11일 기준 Nginx 공식 문서를 바탕으로 작성했습니다. 설정 예제는 Nginx Open Source의 HTTP reverse proxy 기능을 기준으로 하며, 운영 환경에서는 배포 방식, 인증서 관리, 클라우드 로드밸런서, 애플리케이션 프레임워크 설정에 맞게 조정해야 합니다.

## Reverse Proxy를 먼저 한 문장으로 이해하기

Reverse proxy는 **서버 앞에 서 있는 대리 접수 창구**입니다. 사용자는 실제 애플리케이션 서버의 주소나 포트를 직접 알 필요 없이 `https://example.com`으로 요청을 보냅니다. Nginx는 그 요청을 받아 내부의 Spring Boot, Node.js, Django 같은 백엔드 서버로 전달하고, 응답을 다시 사용자에게 돌려줍니다.

일반 proxy와 reverse proxy는 바라보는 방향이 다릅니다. 일반 forward proxy는 클라이언트 대신 외부 인터넷에 나가는 역할을 합니다. 회사 네트워크에서 사용자의 웹 요청을 대신 보내는 프록시가 여기에 가깝습니다. 반대로 reverse proxy는 서버 대신 외부 요청을 받습니다. 클라이언트 입장에서는 Nginx가 곧 서비스처럼 보이고, 실제 백엔드는 Nginx 뒤에 숨습니다.

흐름을 단순화하면 다음과 같습니다.

```text
Client
  -> Nginx reverse proxy
      -> Backend application 1
      -> Backend application 2
      -> Static file server
  <- Nginx reverse proxy
<- Client
```

이 구조의 핵심은 “중간에 서버를 하나 더 둔다”가 아닙니다. 외부 요청이 들어오는 지점을 하나로 모으고, 그 지점에서 보안, 라우팅, 압축, 캐싱, 로드밸런싱, TLS 종료 같은 공통 관심사를 처리한다는 데 의미가 있습니다.

## Nginx가 Reverse Proxy로 자주 쓰이는 이유

Nginx는 정적 파일 서버이면서 HTTP reverse proxy, 로드밸런서, 캐시 서버로도 동작할 수 있습니다. 공식 문서의 `ngx_http_proxy_module`은 요청을 다른 서버로 전달하는 기능을 제공합니다. reverse proxy 구성에서 가장 자주 보는 지시어가 바로 `proxy_pass`입니다.

백엔드 애플리케이션은 보통 `127.0.0.1:8080`, `10.0.1.23:8080`, 컨테이너 네트워크의 `app:8080`처럼 내부 주소에서 실행됩니다. 외부 사용자가 이 주소로 직접 접근하게 만들면 배포와 보안 경계가 흐려집니다. Nginx를 앞에 두면 외부에는 80 또는 443 포트만 열고, 백엔드는 내부 네트워크에서만 접근하도록 만들 수 있습니다.

실무에서 reverse proxy를 두는 대표적인 이유는 다음과 같습니다.

| 목적 | Nginx가 하는 일 | 백엔드가 덜 신경 써도 되는 것 |
|---|---|---|
| 단일 진입점 | 도메인과 포트 정리 | 서버별 외부 포트 노출 |
| TLS 종료 | HTTPS 인증서 처리 | 애플리케이션별 인증서 설정 |
| 라우팅 | 경로와 호스트 기준 분기 | 프론트/백엔드 배포 위치 |
| 부하 분산 | 여러 upstream으로 요청 분배 | 직접 서버 목록 관리 |
| 정적 파일 | 이미지, CSS, JS 직접 서빙 | 애플리케이션 서버 부하 |
| 공통 정책 | 요청 크기, timeout, 헤더 관리 | 반복 설정 |

하지만 reverse proxy가 모든 문제를 해결하지는 않습니다. 애플리케이션의 인증, 권한, 비즈니스 검증은 여전히 백엔드에서 처리해야 합니다. Nginx는 입구의 정책을 담당하고, 애플리케이션은 서비스의 의미를 담당한다고 나누어 생각하면 이해하기 쉽습니다.

## 가장 작은 nginx.conf 예제

먼저 가장 단순한 reverse proxy 설정부터 보겠습니다. 아래 예제는 `example.com`으로 들어온 HTTP 요청을 같은 서버에서 실행 중인 백엔드 `127.0.0.1:8080`으로 전달합니다.

```nginx
events {}

http {
    server {
        listen 80;
        server_name example.com;

        location / {
            proxy_pass http://127.0.0.1:8080;
        }
    }
}
```

이 설정에서 `server` 블록은 하나의 가상 서버를 나타냅니다. `listen 80`은 80번 포트에서 요청을 받겠다는 뜻이고, `server_name example.com`은 요청의 `Host` 헤더가 이 도메인일 때 이 블록을 우선 사용하게 합니다. `location /`은 모든 경로를 의미합니다. 마지막으로 `proxy_pass`가 요청을 백엔드 서버로 넘깁니다.

로컬에서 테스트한다면 도메인 대신 `localhost`를 사용할 수 있습니다.

```nginx
events {}

http {
    server {
        listen 80;
        server_name localhost;

        location / {
            proxy_pass http://127.0.0.1:8080;
        }
    }
}
```

이 예제는 reverse proxy의 최소 형태를 보여주기에는 충분합니다. 다만 운영 환경에서는 이대로 쓰기에는 부족합니다. 백엔드가 원래 요청의 호스트, 클라이언트 IP, 프로토콜을 알아야 하는 경우가 많기 때문입니다. 그래서 다음 단계에서는 헤더 설정을 추가해야 합니다.

## proxy_set_header가 중요한 이유

Nginx가 백엔드에 요청을 전달하면 백엔드 입장에서는 직접 클라이언트와 통신하는 것이 아니라 Nginx와 통신합니다. 이때 아무 설정 없이 넘기면 백엔드가 “원래 사용자가 어떤 도메인으로 들어왔는지”, “실제 클라이언트 IP가 무엇인지”, “처음 요청이 HTTPS였는지”를 제대로 알기 어렵습니다.

그래서 reverse proxy 설정에서는 보통 다음 헤더를 함께 전달합니다.

```nginx
events {}

http {
    server {
        listen 80;
        server_name example.com;

        location / {
            proxy_pass http://127.0.0.1:8080;

            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

`Host`는 사용자가 요청한 도메인을 백엔드에 알려줍니다. 백엔드가 도메인별 링크를 만들거나 멀티테넌트 서비스를 처리한다면 중요합니다. `X-Real-IP`는 Nginx가 본 클라이언트 주소를 담습니다. `X-Forwarded-For`는 여러 proxy를 거칠 때 IP 목록을 누적하는 관례적인 헤더입니다. `$proxy_add_x_forwarded_for`는 기존 `X-Forwarded-For` 값 뒤에 현재 클라이언트 주소를 덧붙입니다.

`X-Forwarded-Proto`는 원래 요청의 scheme을 전달합니다. 예를 들어 사용자는 HTTPS로 접속했지만 Nginx와 백엔드 사이가 HTTP라면, 백엔드는 그냥 보면 `http` 요청처럼 느낄 수 있습니다. 이 값을 제대로 전달하지 않으면 애플리케이션이 `http://` 링크를 만들거나 HTTPS redirect loop가 생길 수 있습니다.

주의할 점도 있습니다. `X-Forwarded-*` 헤더는 HTTP 헤더일 뿐이라 클라이언트가 직접 조작할 수도 있습니다. 백엔드는 “신뢰할 수 있는 reverse proxy에서 온 요청”일 때만 이 헤더를 믿어야 합니다. Spring Boot, Express, Django 같은 프레임워크에서는 forwarded header를 신뢰하는 설정이 따로 있는 경우가 많으므로, Nginx 설정과 애플리케이션 설정을 함께 맞춰야 합니다.

## proxy_pass의 경로 처리에서 자주 헷갈리는 부분

`proxy_pass`는 뒤에 URI를 붙이는지에 따라 백엔드로 전달되는 경로가 달라질 수 있습니다. 이 부분은 reverse proxy 입문자가 가장 자주 실수하는 지점입니다.

먼저 URI 없이 upstream 주소만 쓰는 경우입니다.

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8080;
}
```

사용자가 `/api/users`로 요청하면 백엔드도 `/api/users`를 받습니다. 원래 요청 URI가 그대로 전달된다고 이해하면 됩니다.

반대로 `proxy_pass` 뒤에 `/` 같은 URI를 붙이면 매칭된 location 부분이 지정한 URI로 바뀝니다.

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8080/;
}
```

이 경우 사용자가 `/api/users`로 요청하면 백엔드는 `/users`를 받습니다. 즉 외부에는 `/api` prefix를 노출하지만 백엔드 애플리케이션은 `/users` 경로만 알면 됩니다.

두 방식 중 무엇이 더 좋다고 단정할 수는 없습니다. 백엔드가 `/api` prefix를 포함해 라우팅하도록 설계됐다면 첫 번째가 자연스럽고, Nginx가 외부 prefix를 제거해 주길 원한다면 두 번째가 맞습니다. 중요한 것은 팀 안에서 한 가지 규칙을 정하고 테스트로 확인하는 것입니다.

배포 전에 다음처럼 실제 요청 경로를 확인하면 실수를 줄일 수 있습니다.

```bash
curl -i http://example.com/api/health
```

백엔드 로그에는 어떤 path로 들어왔는지 남기고, Nginx access log에는 외부 path를 남기면 prefix가 의도대로 처리되는지 비교할 수 있습니다.

## 경로별로 프론트엔드와 API 나누기

많은 서비스는 같은 도메인에서 정적 파일과 API를 함께 제공합니다. 예를 들어 `/`는 빌드된 프론트엔드 파일을 내려주고, `/api/`는 백엔드 애플리케이션으로 넘기는 방식입니다.

```nginx
events {}

http {
    server {
        listen 80;
        server_name example.com;

        root /var/www/app;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        location /api/ {
            proxy_pass http://127.0.0.1:8080/;

            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

`try_files $uri $uri/ /index.html;`은 요청한 정적 파일이 있으면 그대로 내려주고, 없으면 `index.html`로 넘깁니다. React Router, Vue Router 같은 SPA(Single Page Application) 라우팅에서 흔히 쓰는 방식입니다.

`/api/` location은 백엔드로 전달합니다. 여기서는 `proxy_pass http://127.0.0.1:8080/;`처럼 뒤에 `/`를 붙였기 때문에 외부 `/api/users` 요청이 백엔드 `/users`로 전달됩니다. 백엔드가 `/api/users`를 기대한다면 이 줄은 `proxy_pass http://127.0.0.1:8080;`처럼 URI 없이 작성해야 합니다.

이 예제에서 실무적으로 바꿔야 할 부분은 `root`, `server_name`, 백엔드 주소입니다. 컨테이너 환경에서는 `127.0.0.1`이 Nginx 컨테이너 자신을 가리키므로, 같은 Docker 네트워크의 서비스 이름인 `backend:8080` 같은 주소를 써야 할 수 있습니다.

## upstream으로 여러 백엔드에 분산하기

백엔드 서버가 여러 대라면 `upstream` 블록으로 서버 그룹을 만들 수 있습니다. Nginx 공식 문서의 `ngx_http_upstream_module`은 `proxy_pass`에서 참조할 수 있는 서버 그룹을 정의하는 기능을 제공합니다.

```nginx
events {}

http {
    upstream app_backend {
        server 10.0.1.10:8080;
        server 10.0.1.11:8080;
        server 10.0.1.12:8080;
    }

    server {
        listen 80;
        server_name example.com;

        location / {
            proxy_pass http://app_backend;

            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

기본적으로 Nginx는 upstream 서버들에 요청을 분배합니다. 여기서 중요한 점은 로드밸런싱이 애플리케이션의 상태 관리 문제를 자동으로 해결하지는 않는다는 것입니다. 로그인 세션을 서버 메모리에만 저장한다면 사용자가 매번 다른 서버로 갈 때 문제가 생길 수 있습니다. 세션은 Redis 같은 외부 저장소로 빼거나, stateless 인증 구조를 검토해야 합니다.

장애 대응도 별도로 생각해야 합니다. 특정 upstream이 죽었을 때 Nginx가 어떻게 판단하고 얼마나 오래 제외할지, 백엔드의 health check는 누가 담당할지, 배포 중 서버를 어떻게 빼고 넣을지 정해야 합니다. Nginx Open Source의 기능만으로 충분한지, 클라우드 로드밸런서나 오케스트레이션 플랫폼의 readiness probe가 더 적합한지도 환경에 따라 달라집니다.

## Timeout과 요청 크기 제한

reverse proxy는 백엔드 앞에서 기다리는 위치에 있습니다. timeout을 전혀 조정하지 않으면 느린 백엔드 때문에 연결이 오래 묶일 수 있고, 너무 짧게 잡으면 정상 요청도 실패할 수 있습니다. 따라서 서비스의 응답 시간 목표와 백엔드 특성을 기준으로 제한 시간을 명시하는 편이 좋습니다.

```nginx
events {}

http {
    server {
        listen 80;
        server_name example.com;

        client_max_body_size 10m;

        location / {
            proxy_pass http://127.0.0.1:8080;

            proxy_connect_timeout 3s;
            proxy_send_timeout 10s;
            proxy_read_timeout 10s;

            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

`client_max_body_size`는 클라이언트가 보낼 수 있는 요청 본문 크기를 제한합니다. 파일 업로드가 없는 API라면 작게 두는 것이 안전하고, 업로드가 있다면 기능별 location에서 필요한 만큼만 키우는 편이 좋습니다. 모든 요청에 큰 값을 주면 실수로 큰 요청을 받아 백엔드와 네트워크에 부담을 줄 수 있습니다.

`proxy_connect_timeout`은 Nginx가 백엔드에 연결을 맺을 때 기다리는 시간입니다. `proxy_send_timeout`은 백엔드로 요청을 보내는 과정의 timeout이고, `proxy_read_timeout`은 백엔드 응답을 읽는 과정의 timeout입니다. 이 값들은 “사용자가 최대 몇 초 기다릴 수 있는가”뿐 아니라 “상위 로드밸런서나 클라이언트 timeout보다 짧은가”까지 함께 봐야 합니다.

예를 들어 클라우드 로드밸런서가 30초에 연결을 끊는데 Nginx가 60초를 기다리도록 설정하면, 사용자는 이미 실패했는데 내부에서는 요청이 계속 처리될 수 있습니다. timeout은 여러 계층에서 맞물리므로 한 파일의 값만 보고 결정하면 안 됩니다.

## HTTPS를 Nginx에서 종료하기

운영 서비스에서는 보통 외부 요청을 HTTPS로 받습니다. 이때 Nginx가 인증서를 들고 TLS 연결을 종료한 뒤, 내부 백엔드에는 HTTP로 전달하는 구성을 자주 사용합니다. 이를 TLS termination이라고 부릅니다.

```nginx
events {}

http {
    server {
        listen 80;
        server_name example.com;

        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl;
        server_name example.com;

        ssl_certificate /etc/nginx/certs/example.com.crt;
        ssl_certificate_key /etc/nginx/certs/example.com.key;

        location / {
            proxy_pass http://127.0.0.1:8080;

            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

첫 번째 `server` 블록은 HTTP 요청을 HTTPS로 redirect합니다. 두 번째 블록은 443 포트에서 TLS 요청을 받고 백엔드로 넘깁니다. 실제 운영에서는 인증서 경로, 갱신 방식, TLS 프로토콜과 cipher 정책, HSTS 적용 여부를 조직 보안 기준에 맞춰 관리해야 합니다.

이 구성을 쓰면 백엔드는 Nginx와 HTTP로 통신합니다. 그래서 백엔드가 “현재 요청은 HTTPS로 들어왔다”고 판단하려면 `X-Forwarded-Proto` 같은 헤더를 올바르게 해석해야 합니다. 애플리케이션이 이 헤더를 신뢰하도록 설정하지 않으면 로그인 redirect, OAuth callback URL, absolute URL 생성에서 문제가 날 수 있습니다.

## 로그를 보면 Reverse Proxy가 보인다

reverse proxy 문제를 해결할 때는 Nginx access log와 백엔드 로그를 함께 봐야 합니다. Nginx에는 외부 클라이언트가 어떤 요청을 보냈는지가 남고, 백엔드에는 Nginx가 어떤 요청을 전달했는지가 남습니다. 두 로그를 연결하지 못하면 “Nginx에서 막힌 건지, 백엔드에서 실패한 건지”를 판단하기 어렵습니다.

기본 access log만으로도 상태 코드와 path를 볼 수 있지만, upstream 상태와 응답 시간을 함께 남기면 훨씬 유용합니다.

```nginx
events {}

http {
    log_format upstream_timing
        '$remote_addr - $host "$request" '
        'status=$status upstream_status=$upstream_status '
        'request_time=$request_time upstream_response_time=$upstream_response_time';

    access_log /var/log/nginx/access.log upstream_timing;

    server {
        listen 80;
        server_name example.com;

        location / {
            proxy_pass http://127.0.0.1:8080;

            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

`status`는 Nginx가 클라이언트에게 돌려준 최종 상태 코드이고, `upstream_status`는 백엔드에서 받은 상태 코드입니다. `request_time`은 Nginx가 요청 전체를 처리한 시간이고, `upstream_response_time`은 upstream 응답을 기다린 시간입니다. 백엔드가 느린지, Nginx 앞단에서 지연되는지 분리해서 볼 때 도움이 됩니다.

단, 로그에 개인정보, 토큰, 쿠키, 전체 요청 본문을 남기는 것은 피해야 합니다. 문제 해결을 위해 일시적으로 더 자세한 로그가 필요하더라도 마스킹, 보관 기간, 접근 권한을 함께 정해야 합니다.

## 자주 하는 실수와 주의사항

### proxy_pass 뒤의 슬래시를 습관적으로 붙인다

`location /api/`와 `proxy_pass http://backend/;` 조합은 `/api/users`를 `/users`로 바꿉니다. 반면 `proxy_pass http://backend;`는 `/api/users`를 그대로 전달합니다. 둘 중 하나가 틀린 것이 아니라 백엔드 라우팅과 맞지 않으면 장애가 됩니다.

### X-Forwarded-For를 무조건 믿는다

클라이언트가 직접 보낸 `X-Forwarded-For`는 조작될 수 있습니다. Nginx 앞에 또 다른 신뢰 가능한 proxy가 있는지, 백엔드가 어떤 proxy의 헤더만 신뢰해야 하는지 정해야 합니다. 실제 클라이언트 IP가 보안 판단에 쓰인다면 `real_ip` 설정과 네트워크 경계를 더 신중하게 검토해야 합니다.

### Nginx에서 인증을 했다고 백엔드 검증을 빼버린다

Nginx는 공통 인증이나 접근 제한을 앞단에서 수행할 수 있지만, 백엔드의 권한 검사를 완전히 대체한다고 보면 위험합니다. 특히 내부 네트워크에서 백엔드가 우회 접근될 수 있거나, 여러 경로로 호출되는 API라면 애플리케이션 레벨의 검증이 필요합니다.

### 컨테이너에서 127.0.0.1 의미를 착각한다

Docker 컨테이너 안의 `127.0.0.1`은 호스트나 다른 컨테이너가 아니라 자기 자신입니다. Nginx 컨테이너에서 백엔드 컨테이너로 연결하려면 같은 네트워크의 서비스 이름을 사용해야 합니다. 예를 들어 Docker Compose에서는 `proxy_pass http://app:8080;`처럼 서비스명을 쓰는 경우가 많습니다.

### timeout을 늘리는 것으로 장애를 해결하려 한다

timeout을 늘리면 일시적으로 오류가 줄어든 것처럼 보일 수 있지만, 느린 요청이 더 오래 쌓여 전체 장애로 번질 수 있습니다. 원인이 백엔드 지연인지, 데이터베이스 lock인지, 외부 API 대기인지 먼저 봐야 합니다. timeout은 복구 전략이 아니라 실패를 제한하는 안전장치입니다.

## 배포 전 체크리스트

- 외부에 노출할 포트는 80과 443처럼 필요한 것만 열려 있는가?
- 백엔드 서버는 내부 네트워크에서만 접근 가능한가?
- `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto` 전달이 필요한가?
- 애플리케이션이 forwarded header를 신뢰하도록 올바르게 설정되어 있는가?
- `proxy_pass` 뒤 URI 유무에 따른 path 변환을 테스트했는가?
- `client_max_body_size`가 기능별로 적절한가?
- Nginx timeout, 백엔드 timeout, 클라우드 로드밸런서 timeout이 서로 어긋나지 않는가?
- access log에서 upstream 상태 코드와 응답 시간을 확인할 수 있는가?
- HTTP에서 HTTPS로 redirect할 때 무한 redirect가 생기지 않는가?
- 인증서 갱신과 Nginx reload 절차가 자동화되어 있는가?

체크리스트의 목적은 설정을 많이 넣는 것이 아닙니다. reverse proxy가 요청의 입구이기 때문에, 입구에서 어떤 정보를 보존하고 어떤 실패를 제한할지 명확히 하자는 것입니다.

## 언제 Reverse Proxy를 쓰지 않아도 될까?

작은 내부 도구나 로컬 개발 환경에서는 Nginx reverse proxy가 오히려 복잡도를 늘릴 수 있습니다. 애플리케이션 하나가 직접 8080 포트로만 실행되고, TLS와 도메인, 여러 서비스 라우팅이 필요 없다면 처음부터 Nginx를 넣지 않아도 됩니다.

또한 클라우드 환경에서는 이미 관리형 로드밸런서, API Gateway, Ingress Controller가 reverse proxy 역할을 수행할 수 있습니다. 이 경우 Nginx를 한 번 더 앞에 두는 것이 필요한지 확인해야 합니다. 두 계층이 모두 timeout, redirect, header, body size를 관리하면 장애 원인을 찾기 어려워질 수 있습니다.

반대로 다음 조건이 있다면 reverse proxy를 검토할 만합니다.

- 하나의 도메인에서 여러 애플리케이션을 나눠 서비스해야 한다.
- TLS 인증서를 애플리케이션 밖에서 관리하고 싶다.
- 정적 파일과 API를 같은 도메인으로 제공하고 싶다.
- 여러 백엔드 서버로 요청을 분산해야 한다.
- 요청 크기, timeout, 로그 형식을 입구에서 통일하고 싶다.

결국 Nginx reverse proxy는 “멋진 인프라 구성”이 아니라 요청의 경계를 명확히 하기 위한 도구입니다. 서비스가 단순할 때는 단순하게 두고, 외부 진입점의 책임이 커질 때 도입하는 편이 좋습니다.

## 결론 및 도움말

> Nginx reverse proxy는 클라이언트와 백엔드 사이에서 요청을 받아 전달하는 서버 앞단의 진입점입니다. 핵심 설정은 `proxy_pass`이지만, 운영에서는 `Host`, `X-Forwarded-*`, path 변환, timeout, body size, upstream 로그까지 함께 봐야 합니다.
>
> 처음에는 단일 백엔드로 시작해도 괜찮습니다. 다만 배포 전에는 “백엔드가 원래 요청 정보를 제대로 아는가?”, “실패가 너무 오래 쌓이지 않는가?”, “로그로 Nginx와 upstream 중 어디가 문제인지 구분할 수 있는가?”를 반드시 확인하세요. reverse proxy는 백엔드를 숨기는 장치이면서, 동시에 서비스의 첫 번째 관측 지점입니다.

## 참고자료/레퍼런스

- [Nginx 공식 소개](https://nginx.org/)
- [Nginx Beginner's Guide](https://nginx.org/en/docs/beginners_guide.html)
- [Nginx ngx_http_proxy_module](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [Nginx ngx_http_upstream_module](https://nginx.org/en/docs/http/ngx_http_upstream_module.html)
- [Nginx request processing](https://nginx.org/en/docs/http/request_processing.html)
- [Nginx server names](https://nginx.org/en/docs/http/server_names.html)
- [Nginx ngx_http_realip_module](https://nginx.org/en/docs/http/ngx_http_realip_module.html)
