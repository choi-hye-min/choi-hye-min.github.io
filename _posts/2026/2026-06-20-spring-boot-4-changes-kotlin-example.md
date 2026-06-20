---
layout: post
title: "Spring Boot 4 주요 변경사항과 Kotlin 예제"
date: 2026-06-20 13:00:00 +0900
categories: [Spring Boot, Kotlin]
tags: [Spring Boot 4, Spring Framework 7, Kotlin, API Versioning, Jackson 3, Migration]
description: "Spring Boot 4에서 달라진 실행 환경, 모듈 구조, Jackson 3, 테스트 방식과 주요 신기능을 Kotlin 예제와 함께 쉽게 설명합니다."
---

> Spring Boot 4는 단순히 버전 숫자만 오른 릴리스가 아니라 Spring Framework 7, Jakarta EE 11, Jackson 3을 기반으로 생태계를 정리한 큰 변화입니다.
> 이 글은 2026년 6월 20일 기준 최신 안정판인 `4.1.0`을 기준으로, Boot 3 사용자가 알아야 할 변경점과 새 기능을 쉬운 예제로 설명합니다.
> 글을 읽고 나면 새 프로젝트를 시작하는 방법과 기존 프로젝트를 어떤 순서로 옮겨야 하는지 판단할 수 있습니다.

## 먼저 결론부터: Spring Boot 4는 무엇이 달라졌나?

Spring Boot는 복잡한 Spring 설정을 자동으로 구성하고, 실행 가능한 애플리케이션을 빠르게 만드는 도구입니다. `starter` 의존성을 추가하면 웹 서버, JSON 변환기, 데이터베이스 연결 같은 기능을 합리적인 기본값으로 준비해 줍니다. Spring Boot 4도 이 핵심 역할은 그대로 유지합니다.

달라진 부분은 **기반 기술과 내부 구성이 한 세대 올라갔다**는 점입니다. Spring Framework 7과 Jakarta EE 11을 사용하고, 기본 JSON 라이브러리는 Jackson 3이 되었습니다. Boot 자체도 작은 모듈로 나뉘어 필요한 기능과 테스트 도구를 더 명확히 선택하게 되었습니다.

가장 먼저 기억할 내용은 아래와 같습니다.

| 구분 | Spring Boot 4의 기준과 변화 | 개발자에게 미치는 영향 |
|---|---|---|
| 최신 안정판 | `4.1.0` | 새 프로젝트는 최신 패치 버전을 사용 |
| Java | 최소 17, 4.1.0은 Java 26까지 호환 | 새 프로젝트는 Java 21 또는 25 LTS를 권장 |
| Spring | Spring Framework 7.0.8 이상 | Spring 6에서 deprecated였던 API 점검 필요 |
| 웹 기반 | Jakarta EE 11, Servlet 6.1 | Tomcat 11·Jetty 12.1, 외부 컨테이너 호환성 확인 |
| Kotlin | 최소 Kotlin 2.2.x | 오래된 Kotlin 플러그인 업그레이드 필요 |
| 빌드 도구 | Maven 3.6.3+, Gradle 8.14+ 또는 9.x | 오래된 CI 빌드 이미지 확인 |
| JSON | Jackson 3 기본 | 패키지명, 커스터마이징 코드, 서드파티 호환성 확인 |
| 모듈 | 작고 기술별로 분리된 starter | 직접 의존성을 조합한 프로젝트는 starter 재검토 |

여기서 “Java 17 이상”은 실행 가능한 최저선입니다. 새 서비스를 시작한다면 지원 기간이 긴 LTS 버전을 선택하고, 조직의 배포 환경과 APM(Application Performance Monitoring), JDBC 드라이버가 해당 JDK를 지원하는지도 함께 확인하는 편이 안전합니다.

## 4.0과 4.1을 구분해서 보자

Spring Boot 4를 이해할 때 버전 역할을 나누면 혼란이 줄어듭니다.

- `4.0`은 새 모듈 구조, Jackson 3, API 버저닝, HTTP Service Client처럼 **큰 방향을 바꾼 메이저 릴리스**입니다.
- `4.1`은 4.0의 기반 위에 Spring gRPC, 비동기 컨텍스트 전파, 지연 JDBC 연결 같은 **기능을 추가한 마이너 릴리스**입니다.
- `4.0.7`과 `4.1.0`은 둘 다 현재 안정판이지만, 새 프로젝트라면 특별한 호환성 제약이 없는 한 최신 기능이 포함된 `4.1.0`부터 검토하면 됩니다.

이 글의 빌드 예제는 `4.1.0`을 사용합니다. 다만 “Boot 4에서 무엇이 크게 달라졌는가?”라는 설명은 대부분 4.0에서 도입된 변경을 의미합니다.

## 실행 환경이 Spring Framework 7과 Jakarta EE 11로 올라갔다

Spring Boot 4는 Spring Framework 7을 기반으로 합니다. 웹 애플리케이션의 기준도 Jakarta EE 11과 Servlet 6.1로 올라가며, 내장 서버는 Tomcat 11 또는 Jetty 12.1을 사용합니다. WAR 파일을 외부 서버에 배포한다면 그 서버도 Servlet 6.1을 지원해야 합니다.

Boot 2에서 Boot 3으로 이동할 때 `javax.*`가 `jakarta.*`로 바뀌는 큰 전환은 이미 일어났습니다. 따라서 Boot 3.5에서 4로 옮기는 프로젝트는 다시 대규모 패키지 변경을 하는 것이 아니라, Jakarta EE 11에 맞는 라이브러리 버전과 제거된 deprecated API를 확인하는 일이 중심입니다.

주의할 점은 Undertow입니다. Spring Boot 4.0은 Servlet 6.1 기준을 만족하지 못한 Undertow 지원을 제거했습니다. `spring-boot-starter-undertow`를 사용하는 서비스라면 Tomcat이나 Jetty로 바꾸거나, 사용하는 서버와 Spring Boot의 향후 지원 상태를 공식 문서에서 다시 확인해야 합니다.

## 가장 눈에 띄는 구조 변화: starter와 모듈이 더 잘게 나뉜다

Boot 3까지는 큰 JAR 하나에 여러 자동 설정이 함께 들어 있는 경우가 많았습니다. Boot 4는 `spring-boot-<기술>`이라는 작은 모듈과 `spring-boot-starter-<기술>`이라는 starter를 일관되게 제공합니다. 필요한 기능의 출처가 명확해지고, 사용하지 않는 자동 설정이 classpath에 섞이는 문제를 줄이려는 변화입니다.

예를 들어 웹 MVC starter 이름은 다음처럼 정리되었습니다.

```kotlin
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
}
```

기존 `spring-boot-starter-web`은 Boot 4에서 곧바로 삭제된 것이 아니라 deprecated 되었으며, 대체 이름은 `spring-boot-starter-webmvc`입니다. 테스트 인프라도 같은 원칙으로 나뉘었습니다. 특정 기술을 테스트한다면 `spring-boot-starter-<기술>-test`를 사용하고, 이 test starter가 공통 `spring-boot-starter-test`를 전이 의존성으로 가져옵니다.

Flyway나 Liquibase처럼 과거에는 서드파티 라이브러리만 추가해도 자동 설정이 작동하던 기능도 주의해야 합니다. Boot 4에서는 각각 `spring-boot-starter-flyway`, `spring-boot-starter-liquibase`처럼 전용 starter를 사용해야 합니다. starter를 거의 쓰지 않고 의존성을 직접 조합한 프로젝트일수록 이 변경의 영향을 크게 받습니다.

큰 프로젝트를 한 번에 고치기 어렵다면 일시적으로 `spring-boot-starter-classic`과 `spring-boot-starter-test-classic`을 사용할 수 있습니다. 이전처럼 여러 인프라를 classpath에 제공해 컴파일 오류부터 정리할 수 있게 돕는 징검다리입니다. 다만 공식 가이드도 최종적으로 classic starter를 제거하고 필요한 기술별 starter로 옮길 것을 권장합니다.

## 기본 JSON 라이브러리가 Jackson 3으로 바뀐다

Spring Boot 4의 기본 JSON 라이브러리는 Jackson 3입니다. 가장 직접적인 변화는 Maven group과 Java package가 `com.fasterxml.jackson`에서 `tools.jackson`으로 바뀐다는 점입니다. 단, `jackson-annotations`의 group과 `com.fasterxml.jackson.annotation` 패키지는 그대로 유지됩니다.

단순히 REST 컨트롤러에서 Kotlin `data class`를 주고받는 코드는 대부분 같은 모습입니다. 영향을 크게 받는 곳은 `ObjectMapper`를 직접 주입하거나 모듈을 등록하고, serializer를 작성하며, Jackson 2 전용 서드파티 라이브러리를 사용하는 코드입니다.

설정 이름도 일부 달라졌습니다. 예를 들어 Boot 3의 `spring.jackson.read.*`, `spring.jackson.write.*`는 각각 `spring.jackson.json.read.*`, `spring.jackson.json.write.*` 아래로 이동했습니다. Boot 4는 classpath에 있는 Jackson 모듈을 모두 찾아 mapper에 등록하며, 이 동작이 필요 없다면 `spring.jackson.find-and-add-modules=false`로 끌 수 있습니다.

바로 Jackson 3으로 옮기기 어려운 프로젝트에는 임시 호환 수단이 있습니다.

```kotlin
dependencies {
    implementation("org.springframework.boot:spring-boot-jackson2")
}
```

이 모듈은 Jackson 2가 필요한 라이브러리를 위한 전환용이며 이미 deprecated 상태입니다. “Boot 4에서도 계속 Jackson 2를 쓰는 장기 전략”으로 보기보다, 호환되지 않는 라이브러리를 찾아 교체할 시간을 버는 수단으로 보는 것이 맞습니다.

Kotlin Serialization을 선호한다면 Boot 4에 새로 추가된 starter를 사용할 수도 있습니다.

```kotlin
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-kotlinx-serialization-json")
}
```

이 starter는 `Json` 빈과 `spring.kotlinx.serialization.json.*` 설정을 자동 구성하고, JSON용 `HttpMessageConverter`를 제공합니다. 한 프로젝트에서 JSON 구현을 여러 개 섞으면 어떤 converter가 선택되는지 이해하기 어려워질 수 있으므로, 특별한 이유가 없다면 주력 구현을 하나 정하는 편이 좋습니다.

## 새 기능 1: 컨트롤러에서 API 버전을 직접 표현한다

API가 성장하면 같은 `/api/greetings/{name}` 경로라도 구버전 응답은 유지하면서 새 필드를 추가해야 할 수 있습니다. 예전에는 헤더 조건이나 커스텀 인터셉터로 이를 직접 구현하는 경우가 많았습니다. Spring Framework 7과 Boot 4는 컨트롤러 매핑의 `version` 속성과 버전 해석 설정을 정식으로 지원합니다.

아래 설정은 `X-API-Version` 헤더를 읽고, 헤더가 없으면 `1.0.0`을 사용합니다.

```yaml
spring:
  mvc:
    apiversion:
      default: 1.0.0
      use:
        header: X-API-Version
```

같은 경로에 두 버전의 메서드를 선언할 수 있습니다.

```kotlin
package com.example.boot4

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

data class GreetingV1(
    val message: String,
)

data class GreetingV2(
    val message: String,
    val language: String,
)

@RestController
@RequestMapping("/api/greetings")
class GreetingController {

    @GetMapping("/{name}", version = "1.0.0")
    fun greetV1(@PathVariable name: String): GreetingV1 =
        GreetingV1(message = "안녕하세요, $name")

    @GetMapping("/{name}", version = "2.0.0")
    fun greetV2(@PathVariable name: String): GreetingV2 =
        GreetingV2(
            message = "반갑습니다, $name",
            language = "ko",
        )
}
```

요청 결과는 다음처럼 달라집니다.

```bash
curl http://localhost:8080/api/greetings/codex
curl -H "X-API-Version: 2.0.0" http://localhost:8080/api/greetings/codex
```

첫 요청은 기본값인 1.0.0 응답을 받고, 두 번째 요청은 2.0.0 응답을 받습니다. 헤더 외에도 쿼리 파라미터, 미디어 타입 파라미터, URL 경로에서 버전을 읽도록 구성할 수 있습니다. 공개 API라면 버전 선택 방식뿐 아니라 지원 종료일과 폐기 정책도 문서화해야 합니다.

## 새 기능 2: HTTP 인터페이스가 선언형 클라이언트가 된다

외부 API를 호출할 때마다 URL 조립과 응답 변환 코드를 반복하지 않고, 인터페이스에 계약만 선언할 수 있습니다. Spring의 HTTP Service Client 자체는 이전 세대에도 있었지만, Boot 4는 이 인터페이스를 검색하고 설정하는 자동 구성을 제공합니다.

```kotlin
package com.example.boot4.client

import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.service.annotation.GetExchange
import org.springframework.web.service.annotation.HttpExchange

data class UserResponse(
    val id: Long,
    val name: String,
)

@HttpExchange("/users")
interface UserClient {

    @GetExchange("/{id}")
    fun findById(@PathVariable id: Long): UserResponse
}
```

메인 애플리케이션에서 해당 인터페이스를 가져옵니다.

```kotlin
package com.example.boot4

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.web.service.registry.ImportHttpServices

@ImportHttpServices(
    group = "user-api",
    basePackages = ["com.example.boot4.client"],
)
@SpringBootApplication
class Boot4Application

fun main(args: Array<String>) {
    runApplication<Boot4Application>(*args)
}
```

`user-api` 그룹에 실제 주소와 timeout을 연결합니다. 환경별로 base URL만 바꾸면 인터페이스 코드는 그대로 유지할 수 있습니다.

```yaml
spring:
  http:
    serviceclient:
      user-api:
        base-url: https://users.example.com
        connect-timeout: 1s
        read-timeout: 2s
```

실무에서는 인증 헤더와 SSL 설정도 클라이언트 그룹이나 customizer로 함께 구성해야 합니다. 인터페이스가 편하다는 이유로 외부 공개 API의 모델까지 내부 도메인 모델과 강하게 묶으면 변경 영향이 커질 수 있으므로, 경계에서 사용하는 요청·응답 타입을 따로 두는 편이 안전합니다.

## 새 기능 3: OpenTelemetry 시작이 간단해진다

Boot 4에는 `spring-boot-starter-opentelemetry`가 추가되었습니다. 이 starter는 OpenTelemetry SDK를 자동 구성하고, OTLP(OpenTelemetry Protocol)로 trace와 metric을 내보내는 데 필요한 의존성을 제공합니다.

```kotlin
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-opentelemetry")
}
```

```yaml
management:
  tracing:
    sampling:
      probability: 0.1
  otlp:
    tracing:
      endpoint: http://localhost:4318/v1/traces
```

위의 `0.1`은 요청의 약 10%를 trace 대상으로 선택한다는 뜻입니다. 운영 환경에서 무조건 100% 수집하면 트래픽과 저장 비용이 크게 늘 수 있습니다. 인증, TLS, Collector 장애 시 동작, 민감 정보가 span 속성에 들어가지 않는지도 함께 설계해야 합니다.

## 테스트도 모듈화되고 RestTestClient가 추가된다

Boot 4에서는 `@SpringBootTest`만 붙였다고 `MockMvc`, `WebClient`, `TestRestTemplate`이 자동으로 생기지 않습니다. 필요한 클라이언트의 자동 구성 어노테이션을 명시해야 합니다. 또한 Boot의 `@MockBean`, `@SpyBean`은 제거되었고 Spring Framework의 `@MockitoBean`, `@MockitoSpyBean`을 사용합니다.

새 `RestTestClient`는 같은 API로 MockMvc 기반 테스트와 실제 서버 통합 테스트를 작성할 수 있게 해 줍니다. 앞의 버전별 컨트롤러를 실제 서버에서 확인하는 테스트는 다음과 같습니다.

```kotlin
package com.example.boot4

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.web.servlet.client.RestTestClient

@AutoConfigureRestTestClient
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class GreetingControllerTest(
    @Autowired private val client: RestTestClient,
) {

    @Test
    fun `헤더가 없으면 기본 버전으로 응답한다`() {
        client.get()
            .uri("/api/greetings/codex")
            .exchange()
            .expectStatus().isOk
            .expectBody()
            .jsonPath("$.message").isEqualTo("안녕하세요, codex")
            .jsonPath("$.language").doesNotExist()
    }

    @Test
    fun `버전 헤더로 2 버전을 선택한다`() {
        client.get()
            .uri("/api/greetings/codex")
            .header("X-API-Version", "2.0.0")
            .exchange()
            .expectStatus().isOk
            .expectBody()
            .jsonPath("$.message").isEqualTo("반갑습니다, codex")
            .jsonPath("$.language").isEqualTo("ko")
    }
}
```

`RANDOM_PORT`는 실제 내장 서버를 띄우므로 클라이언트와 서버가 서로 다른 스레드와 트랜잭션에서 실행됩니다. 테스트 메서드에 `@Transactional`을 붙여도 서버에서 저장한 데이터는 자동 롤백되지 않습니다. 데이터베이스 통합 테스트라면 테스트 데이터 정리 전략을 별도로 준비해야 합니다.

## 4.1에서 새로 추가된 기능은 무엇인가?

현재 최신 안정판인 4.1에는 4.0 이후의 개선도 포함됩니다. 모든 기능을 한 프로젝트에 넣을 필요는 없고, 아래처럼 문제와 기능을 연결해서 보면 이해하기 쉽습니다.

| 필요한 상황 | Spring Boot 4.1 기능 | 의미 |
|---|---|---|
| gRPC 서버·클라이언트 구성 | Spring gRPC 자동 구성 | protobuf 기반 서비스 연결을 Boot 방식으로 설정 |
| `@Async`에서 trace 문맥 유지 | 비동기 컨텍스트 전파 | 호출 전후의 관찰 정보를 이어서 추적 |
| 트랜잭션 중 실제 SQL이 없을 수 있음 | `spring.datasource.connection-fetch=lazy` | JDBC 문장이 필요할 때 물리 연결 획득 |
| Redis 메시지를 어노테이션으로 수신 | `@RedisListener` 자동 구성 | 기본 listener container와 endpoint 검색 제공 |
| JWT 권한 claim 구조가 복잡함 | claim SpEL 표현식 | 여러 표현식으로 authority 추출 |
| 운영 정보 확인 | Actuator `info`의 process 정보 | uptime, 시작 시각, 시간대, 작업 경로 확인 |

이 가운데 lazy JDBC 연결은 풀의 연결을 늦게 빌린다는 장점이 있지만, 모든 서비스의 성능을 자동으로 높이는 스위치는 아닙니다. 연결을 실제로 사용하는 시점과 장애가 드러나는 시점도 늦어질 수 있으므로 부하 테스트와 장애 시나리오를 확인한 뒤 적용해야 합니다.

## 최소 프로젝트 구성

아래 예제는 Java 21, Kotlin 2.3.21, Gradle Kotlin DSL을 사용합니다. Boot 4.1.0이 관리하는 버전과 맞춘 예시이며, 실제 프로젝트에서는 Spring Initializr가 생성한 최신 구성을 먼저 사용하는 것이 가장 간단합니다.

```kotlin
plugins {
    kotlin("jvm") version "2.3.21"
    kotlin("plugin.spring") version "2.3.21"
    id("org.springframework.boot") version "4.1.0"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "com.example"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("tools.jackson.module:jackson-module-kotlin")

    testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll(
            "-Xjsr305=strict",
            "-Xannotation-default-target=param-property",
        )
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}
```

Kotlin 2.2부터 어노테이션의 기본 적용 대상 규칙이 달라졌습니다. Spring Boot 공식 문서는 앞으로의 기본 동작과 경고를 고려해 `-Xannotation-default-target=param-property` 컴파일러 옵션을 권장합니다. 새 프로젝트를 Initializr에서 만들면 필요한 Kotlin 플러그인과 기본 의존성도 함께 확인할 수 있습니다.

## 기존 Spring Boot 3 프로젝트를 옮기는 순서

공식 마이그레이션 가이드는 바로 4로 점프하기보다 먼저 최신 `3.5.x`로 올릴 것을 권장합니다. 중간 단계를 거치면 Boot 3에서 이미 deprecated 된 API를 제거하고, 의존성 문제와 Boot 4 자체의 변경을 분리해서 볼 수 있습니다.

### 1. 최신 3.5.x에서 경고를 먼저 없앤다

컴파일 경고와 deprecated API를 정리하고 전체 테스트를 통과시킵니다. Spring Cloud, Spring Security, Spring Batch처럼 별도의 릴리스 주기를 가진 프로젝트의 호환 버전도 확인합니다. 자동 설정 내부 클래스를 직접 import했다면 Boot 4에서 패키지가 바뀌거나 접근할 수 없게 될 가능성이 큽니다.

### 2. JDK, Kotlin, Gradle과 CI 이미지를 올린다

로컬에서만 빌드되는 상태로 끝내지 말고 CI와 배포 이미지의 JDK도 함께 올립니다. Gradle wrapper는 최소 8.14 이상인지 확인합니다. GraalVM Native Image를 만든다면 GraalVM 25 이상이 필요합니다.

### 3. Boot 4 버전과 starter를 변경한다

`spring-boot-starter-web`을 `spring-boot-starter-webmvc`로 바꾸고, Flyway·Liquibase·Security 같은 사용 기술의 전용 starter를 확인합니다. 규모가 큰 프로젝트는 classic starter로 먼저 실행 상태를 만든 뒤 기술별 starter로 줄여 나갈 수 있습니다.

### 4. 설정 이름은 migrator로 찾는다

설정 키 변경을 찾을 때는 다음 의존성을 임시로 추가할 수 있습니다.

```kotlin
dependencies {
    runtimeOnly("org.springframework.boot:spring-boot-properties-migrator")
}
```

애플리케이션 시작 시 바뀐 속성을 진단하고 일부를 임시 변환해 줍니다. 로그에 나온 설정을 실제 `application.yml`에서 수정한 뒤에는 이 의존성을 반드시 제거합니다. migrator를 영구적인 호환 계층처럼 남겨 두면 설정 부채가 숨어 버립니다.

### 5. JSON과 테스트를 별도 작업으로 검증한다

Jackson 3 전환은 정상 응답뿐 아니라 날짜, enum, nullable 필드, 커스텀 serializer를 포함한 회귀 테스트로 확인합니다. 테스트 코드에서는 `@MockBean`을 `@MockitoBean`으로 바꾸고, `MockMvc`나 `RestTestClient`에 필요한 자동 구성 어노테이션을 명시합니다.

### 6. 운영 환경에서 관찰하고 단계적으로 배포한다

Actuator health, trace, metric, 시작 시간과 메모리 사용량을 이전 버전과 비교합니다. 데이터베이스 마이그레이션이나 메시지 포맷 변경을 Boot 업그레이드와 한 번에 묶으면 원인 분리가 어려우므로 가능한 한 배포 단위를 나눕니다.

## 자주 하는 실수와 주의사항

### “버전만 4.1.0으로 바꾸면 끝난다”

단순한 MVC 서비스는 예상보다 쉽게 실행될 수 있지만, 직접 작성한 자동 설정, Jackson 커스터마이징, 테스트 도구, 외부 컨테이너가 있다면 영향 범위가 커집니다. 컴파일 성공을 완료 조건으로 보지 말고 API 계약, 데이터 직렬화, 운영 지표까지 확인해야 합니다.

### Boot 3.3이나 더 낮은 버전에서 바로 4로 간다

가능하더라도 문제의 출처가 섞입니다. 먼저 최신 3.5.x로 이동하고 deprecated 요소를 제거하면, Boot 4 단계에서는 모듈과 새 기반 기술에 집중할 수 있습니다.

### starter와 개별 라이브러리를 무작정 함께 추가한다

Boot가 관리하는 starter 옆에 다른 버전의 Jackson, Tomcat, Spring Framework를 직접 고정하면 의존성 정렬이 깨질 수 있습니다. 보안 패치처럼 명확한 이유가 없다면 Boot BOM(Bill of Materials)의 버전 관리를 우선 사용하고, override 이유를 기록합니다.

### Jackson 2 호환 모듈을 최종 상태로 둔다

`spring-boot-jackson2`는 이주를 돕는 임시 수단입니다. 어떤 라이브러리가 Jackson 3을 막는지 목록을 만들고 업그레이드 또는 교체 일정을 정해야 합니다.

### 모든 새 기능을 한 번에 도입한다

Boot 버전 업그레이드, API 버저닝, OpenTelemetry 전환, gRPC 도입을 한 배포에 묶으면 장애 원인을 찾기 어렵습니다. 먼저 기존 동작을 Boot 4에서 재현하고, 새 기능은 독립된 변경으로 추가하는 편이 안전합니다.

## 적용 전 체크리스트

- 현재 서비스가 최신 Spring Boot `3.5.x`에서 정상 동작하는가?
- Java, Kotlin, Gradle, CI 이미지가 Boot 4 요구사항을 만족하는가?
- Spring Cloud와 서드파티 starter가 Boot 4를 지원하는가?
- Undertow 또는 Servlet 6.1 미지원 외부 컨테이너를 사용하지 않는가?
- 기술별 main starter와 test starter를 명시했는가?
- Jackson 3 패키지와 JSON 회귀 테스트를 확인했는가?
- `@MockBean`, 암묵적 `MockMvc`·`TestRestTemplate` 설정을 수정했는가?
- properties migrator의 진단을 반영한 뒤 의존성을 제거했는가?
- 카나리 또는 단계적 배포에서 metric과 trace를 비교할 수 있는가?

체크 항목이 많아 보여도 핵심은 간단합니다. **기반 환경 → 의존성 → 컴파일 → 테스트 → 운영 관찰** 순서로 한 층씩 확인하면 문제의 위치를 빠르게 좁힐 수 있습니다.

## 결론 및 도움말

> Spring Boot 4의 중심 변화는 Spring Framework 7과 Jakarta EE 11이라는 새 기반, 기술별 모듈화, Jackson 3, 명시적인 테스트 구성입니다. API 버저닝, HTTP Service Client, OpenTelemetry starter 같은 기능은 반복 코드를 줄이지만, 기존 프로젝트에서는 먼저 호환성 정리가 선행되어야 합니다.
>
> 새 프로젝트라면 Spring Initializr에서 최신 안정판 4.1.x와 LTS JDK로 시작하세요. 기존 프로젝트라면 최신 3.5.x를 징검다리로 삼아 한 번에 한 종류의 변화만 적용하고, JSON 계약과 운영 지표까지 확인한 뒤 다음 단계로 넘어가는 것이 가장 안전합니다.

## 참고자료/레퍼런스

- [Spring Boot 프로젝트 페이지](https://spring.io/projects/spring-boot)
- [Spring Boot 4.1 시스템 요구사항](https://docs.spring.io/spring-boot/4.1/system-requirements.html)
- [Spring Boot 4.0 릴리스 노트](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Release-Notes)
- [Spring Boot 4.0 마이그레이션 가이드](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide)
- [Spring Boot 4.1 릴리스 노트](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.1-Release-Notes)
- [Spring Boot HTTP Service Client 문서](https://docs.spring.io/spring-boot/4.1/reference/io/rest-client.html#io.rest-client.httpservice)
- [Spring Boot MVC API 버저닝 문서](https://docs.spring.io/spring-boot/4.1/reference/web/servlet.html#web.servlet.spring-mvc.api-versioning)
- [Spring Boot Kotlin 지원 문서](https://docs.spring.io/spring-boot/4.1/reference/features/kotlin.html)
