---
layout: post
title: "Java 25 주요 변경사항과 실무 적용 포인트"
date: 2026-08-06 04:13:03 +0900
categories: [Java, JDK]
tags: [Java 25, JDK 25, LTS, OpenJDK, JVM, JFR, Virtual Threads]
description: "Java 25 LTS에 추가된 주요 JEP를 언어, 라이브러리, 성능, 관측, 마이그레이션 관점으로 정리하고 실무 적용 시 주의할 점을 설명합니다."
---

> Java 25는 2025년 9월 16일 공개된 LTS(Long-Term Support) 릴리스이며, 18개의 JEP가 포함되었습니다.
> 이 글은 Java 25에서 무엇이 추가되었는지 언어 문법, 라이브러리, JVM 성능, 관측성, 제거 항목으로 나누어 설명합니다.
> 글을 읽고 나면 Java 21에서 Java 25로 올릴 때 바로 확인해야 할 기능과 조심해야 할 지점을 정리할 수 있습니다.

이 글은 2026년 8월 6일 기준의 Oracle JDK 25 Release Notes, OpenJDK JDK 25 문서, Inside Java의 Java 25 소개 글을 참고했습니다. Java 25는 이미 GA(General Availability)로 공개된 릴리스이며, Oracle은 Java 25에 대해 장기 지원 제공을 안내하고 있습니다. 다만 `preview`, `incubator`, `experimental`로 표시된 기능은 실무 코드에 바로 고정 API처럼 쓰기보다 실험과 검증을 먼저 해야 합니다.

## 먼저 결론: Java 25는 Java 21 이후 기능을 묶는 LTS

Java 25를 볼 때 가장 중요한 배경은 “새로운 LTS”라는 점입니다. Java는 6개월마다 기능 릴리스를 내지만, 많은 회사는 모든 버전을 따라가기보다 LTS 단위로 업그레이드합니다. 그래서 Java 25는 Java 22, 23, 24에서 다듬어진 기능과 Java 25에서 확정된 기능을 한 번에 만나는 버전이라고 보는 편이 이해하기 쉽습니다.

Java 25에 포함된 JEP는 크게 네 묶음으로 볼 수 있습니다.

| 영역 | 대표 기능 | 실무에서 보는 포인트 |
|---|---|---|
| 언어 | Module Import, Compact Source Files, Flexible Constructor Bodies | 작은 프로그램과 예제 코드가 짧아지고 생성자 검증 코드가 자연스러워짐 |
| 동시성 | Scoped Values, Structured Concurrency | Virtual Thread 기반 서버에서 요청 컨텍스트 전달과 병렬 작업 관리가 쉬워짐 |
| 성능과 런타임 | AOT, Compact Object Headers, Generational Shenandoah, Vector API | 시작 시간, 메모리 사용량, GC, 계산 성능 개선 여지 |
| 보안과 관측 | KDF API, PEM API, JFR CPU/Method 기능 | 키 파생, 인증서 처리, 병목 분석을 JDK 표준 기능으로 다루기 쉬워짐 |

모든 기능을 같은 우선순위로 볼 필요는 없습니다. 일반적인 백엔드 애플리케이션이라면 `Scoped Values`, `Flexible Constructor Bodies`, `JFR Method Timing & Tracing`, `AOT` 관련 기능부터 살펴보는 것이 좋습니다. 라이브러리나 교육용 도구를 만든다면 `Compact Source Files`와 `Module Import Declarations`의 체감이 더 큽니다.

## Java 25에 포함된 18개 JEP 한눈에 보기

Java 25에는 다음 18개 JEP가 포함되었습니다. 여기서 `final`은 정식 기능으로 사용할 수 있다는 뜻이고, `preview`, `incubator`, `experimental`은 이후 릴리스에서 API나 문법이 바뀔 수 있다는 뜻입니다.

| JEP | 이름 | 상태 | 핵심 |
|---|---|---|---|
| JEP 470 | PEM Encodings of Cryptographic Objects | Preview | 키, 인증서, CRL을 PEM 형식으로 읽고 쓰는 API |
| JEP 502 | Stable Values | Preview | 한 번만 초기화되는 값을 JVM이 안정적인 값처럼 최적화할 수 있게 함 |
| JEP 503 | Remove the 32-bit x86 Port | Final | 32비트 x86 포트 코드와 빌드 지원 제거 |
| JEP 505 | Structured Concurrency | Fifth Preview | 관련된 여러 작업을 하나의 작업 단위처럼 관리 |
| JEP 506 | Scoped Values | Final | 특정 실행 범위 안에서 불변 컨텍스트 값을 공유 |
| JEP 507 | Primitive Types in Patterns, instanceof, and switch | Third Preview | primitive 타입을 패턴 매칭, `instanceof`, `switch`에서 더 일관되게 사용 |
| JEP 508 | Vector API | Tenth Incubator | CPU 벡터 명령을 활용하는 계산 API |
| JEP 509 | JFR CPU-Time Profiling | Experimental | Java Flight Recorder에서 CPU 시간 기반 샘플링 지원 |
| JEP 510 | Key Derivation Function API | Final | 비밀 값에서 추가 키를 파생하는 표준 API |
| JEP 511 | Module Import Declarations | Final | 모듈이 export하는 패키지를 한 줄로 import |
| JEP 512 | Compact Source Files and Instance Main Methods | Final | 작은 Java 프로그램을 class 선언 없이 간결하게 작성 |
| JEP 513 | Flexible Constructor Bodies | Final | `super(...)`, `this(...)` 호출 전에 안전한 문장 허용 |
| JEP 514 | Ahead-of-Time Command-Line Ergonomics | Final | AOT 캐시 생성 명령을 단순화 |
| JEP 515 | Ahead-of-Time Method Profiling | Final | 훈련 실행의 프로파일을 AOT 캐시에 담아 warmup 개선 |
| JEP 518 | JFR Cooperative Sampling | Final | JFR 샘플링 지점과 런타임 협력을 개선 |
| JEP 519 | Compact Object Headers | Final | 64비트 환경에서 객체 헤더 크기를 줄여 메모리 사용량 감소 |
| JEP 520 | JFR Method Timing & Tracing | Final | 지정 메서드의 호출 시간과 추적 정보를 JFR로 수집 |
| JEP 521 | Generational Shenandoah | Final | Shenandoah GC에 세대별 수집 모드 도입 |

이 표만 보면 기능이 많아 보이지만, 애플리케이션 개발자가 바로 코드를 바꿔야 하는 항목은 일부입니다. 반대로 JVM, 보안, 관측성 기능은 코드 변경보다 실행 옵션, 운영 도구, 라이브러리 호환성 점검이 더 중요합니다.

## 언어 기능: 작은 코드와 생성자가 더 자연스러워진다

### Compact Source Files and Instance Main Methods

JEP 512는 Java 입문자와 작은 스크립트성 프로그램을 위한 기능입니다. 예전에는 `public class Main`과 `public static void main(String[] args)`를 거의 주문처럼 외워야 했습니다. Java 25에서는 간단한 프로그램을 더 짧게 시작할 수 있습니다.

아래 코드는 Java 25에서 작은 파일 하나로 실행할 수 있는 형태를 보여 줍니다.

```java
void main() {
    IO.println("Hello Java 25");
}
```

이 코드는 “Java가 갑자기 다른 언어가 되었다”는 뜻이 아닙니다. 큰 애플리케이션에서는 여전히 패키지, 클래스, 접근 제어자, 테스트 구조가 필요합니다. 다만 교육, 운영용 작은 점검 스크립트, 문서 예제에서는 불필요한 문법 소음을 줄일 수 있습니다.

실무에서는 이 기능을 운영 서비스의 핵심 코드에 남발하기보다, 샘플 코드나 작은 도구에 쓰는 정도가 안전합니다. 팀원이 코드를 열었을 때 파일의 역할과 실행 방식이 명확해야 하므로, 규모가 커지면 일반적인 class 구조로 자연스럽게 옮기는 것이 좋습니다.

### Module Import Declarations

JEP 511은 모듈이 export하는 패키지를 한 번에 import할 수 있게 합니다. 예를 들어 `java.base` 모듈을 import하면 `java.util`, `java.util.stream`, `java.util.function`처럼 자주 함께 쓰는 API를 더 짧게 사용할 수 있습니다.

```java
import module java.base;

void main() {
    var names = List.of("java", "spring", "jvm");

    var upperNames = names.stream()
            .map(String::toUpperCase)
            .toList();

    IO.println(upperNames);
}
```

이 예제는 작은 프로그램에서 import 목록을 줄이는 데 유용합니다. 하지만 업무 코드에서는 명시적인 import가 코드 리뷰와 자동 정리에 더 편할 때가 많습니다. 특히 여러 모듈에 같은 단순 이름의 타입이 있으면 충돌이 생길 수 있으므로, 충돌하는 타입은 명시적으로 import해서 의도를 드러내야 합니다.

### Flexible Constructor Bodies

JEP 513은 생성자 본문에서 `super(...)` 또는 `this(...)` 호출보다 앞에 일부 문장을 둘 수 있게 합니다. 이전 Java에서는 명시적인 생성자 호출이 반드시 첫 문장이어야 했기 때문에, 부모 생성자에 넘기기 전에 값을 검증하거나 정규화하는 코드가 어색해질 때가 있었습니다.

아래 예제는 입력 검증 후 부모 생성자에 안전한 값을 넘기는 흐름을 보여 줍니다.

```java
class UserCommand extends Command {
    UserCommand(String rawUserId) {
        if (rawUserId == null || rawUserId.isBlank()) {
            throw new IllegalArgumentException("userId is required");
        }

        var normalizedUserId = rawUserId.trim().toLowerCase();

        super(normalizedUserId);
    }
}
```

핵심은 아무 코드나 앞에 둘 수 있다는 뜻이 아니라는 점입니다. 아직 생성 중인 객체의 메서드를 호출하거나 `this`를 외부로 노출하는 식의 위험한 코드는 허용되지 않습니다. Java 25의 변화는 생성자 안정성을 깨뜨리기 위한 것이 아니라, 부모 생성자를 호출하기 전에 필요한 계산과 검증을 더 자연스럽게 표현하기 위한 것입니다.

실무에서는 DTO나 값 객체를 만들 때 도움이 됩니다. 기존에는 정적 팩토리 메서드로 우회하거나 부모 생성자 안으로 검증 책임이 몰리던 코드를 하위 생성자에서 더 읽기 좋게 정리할 수 있습니다.

### Primitive Types in Patterns, instanceof, and switch

JEP 507은 preview 기능입니다. Java의 패턴 매칭이 참조 타입 중심으로 발전해 왔다면, 이 기능은 primitive 타입까지 더 일관되게 다루려는 방향입니다. 예를 들어 `switch`에서 primitive 타입 패턴과 guard 조건을 함께 사용할 수 있습니다.

```java
String grade(int score) {
    return switch (score) {
        case int s when s < 0 || s > 100 -> "invalid";
        case int s when s >= 90 -> "A";
        case int s when s >= 80 -> "B";
        case int s when s >= 70 -> "C";
        default -> "D";
    };
}
```

이 기능은 Java 25에서 세 번째 preview입니다. 따라서 실무 코드에 적용하려면 `--enable-preview` 컴파일 옵션과 런타임 옵션이 필요하고, 다음 JDK에서 문법이 바뀔 가능성도 받아들여야 합니다. 장기 운영 서비스보다는 학습, PoC(Proof of Concept), 내부 도구에서 먼저 확인하는 편이 좋습니다.

## 동시성: Virtual Thread 시대의 컨텍스트와 작업 묶음

### Scoped Values

JEP 506은 Java 25에서 final이 된 기능입니다. Scoped Values는 특정 실행 범위 안에서 불변 값을 공유하는 방법입니다. 요청 ID, 사용자 정보, 트랜잭션 컨텍스트처럼 여러 계층에서 필요하지만 매개변수로 계속 넘기기 번거로운 값을 다룰 때 유용합니다.

기존에는 이런 문제를 `ThreadLocal`로 해결하는 경우가 많았습니다. 하지만 Virtual Thread를 적극적으로 쓰는 환경에서는 `ThreadLocal`을 많이 사용하는 방식이 메모리와 추론 가능성 측면에서 부담이 될 수 있습니다. Scoped Values는 “이 범위 안에서만 이 값을 읽을 수 있다”는 구조가 더 명확합니다.

```java
import java.lang.ScopedValue;

class RequestContextExample {
    private static final ScopedValue<String> REQUEST_ID = ScopedValue.newInstance();

    void handle(String requestId) {
        ScopedValue.where(REQUEST_ID, requestId)
                .run(this::process);
    }

    private void process() {
        audit("start");
        callService();
        audit("end");
    }

    private void callService() {
        IO.println("requestId=" + REQUEST_ID.get());
    }

    private void audit(String event) {
        IO.println(event + " requestId=" + REQUEST_ID.get());
    }
}
```

이 예제는 요청 ID를 메서드 인자로 계속 넘기지 않고도 하위 호출에서 읽는 방식을 보여 줍니다. 실무에서는 로깅 MDC(Mapped Diagnostic Context), 인증 정보, tracing context와의 연동을 검토하게 됩니다. 단, 값을 바꾸는 용도로 쓰면 안 됩니다. Scoped Values는 불변 데이터를 명확한 범위 안에서 공유하는 기능이지, 전역 상태를 더 편하게 만들기 위한 기능이 아닙니다.

### Structured Concurrency

JEP 505는 다섯 번째 preview입니다. Structured Concurrency는 여러 하위 작업을 하나의 작업 단위처럼 다루는 모델입니다. 예를 들어 한 HTTP 요청을 처리하면서 사용자 정보, 주문 정보, 추천 정보를 병렬로 가져온다면, 이 세 작업은 요청이 끝날 때 함께 성공하거나 함께 취소되어야 합니다.

```java
import java.util.concurrent.StructuredTaskScope;

class OrderSummaryService {
    OrderSummary load(long userId) throws InterruptedException {
        try (var scope = StructuredTaskScope.open()) {
            var user = scope.fork(() -> findUser(userId));
            var orders = scope.fork(() -> findRecentOrders(userId));

            scope.join();

            return new OrderSummary(user.get(), orders.get());
        }
    }

    private User findUser(long userId) {
        return new User(userId, "choi");
    }

    private List<Order> findRecentOrders(long userId) {
        return List.of(new Order(1L), new Order(2L));
    }
}
```

이 코드는 병렬 작업을 시작하고, 모두 끝난 뒤 결과를 조합하는 흐름을 보여 줍니다. 실무에서는 실패 정책이 중요합니다. 하나가 실패하면 나머지를 취소할지, 일부 실패를 허용할지, timeout을 어디에 둘지 정해야 합니다. preview 기능이므로 API 변경 가능성도 고려해야 합니다.

Structured Concurrency는 Virtual Thread와 함께 볼 때 가치가 커집니다. 많은 요청을 적은 비용의 스레드로 처리하면서도, 하위 작업의 생명주기를 요청 범위에 묶어 추적할 수 있기 때문입니다.

## 보안 라이브러리: 키와 인증서 작업이 표준 API로 가까워진다

### Key Derivation Function API

JEP 510은 Java 25에서 final이 된 KDF(Key Derivation Function) API입니다. KDF는 하나의 비밀 값에서 목적에 맞는 다른 키를 만들어 내는 암호학적 함수입니다. 예를 들어 공유 비밀, salt, context 정보를 바탕으로 암호화용 키를 파생할 수 있습니다.

```java
import javax.crypto.KDF;
import javax.crypto.SecretKey;
import javax.crypto.spec.HKDFParameterSpec;
import java.security.spec.AlgorithmParameterSpec;

class KeyDerivationExample {
    SecretKey deriveAesKey(byte[] initialKeyMaterial, byte[] salt, byte[] info)
            throws Exception {
        KDF kdf = KDF.getInstance("HKDF-SHA256");

        AlgorithmParameterSpec params = HKDFParameterSpec.ofExtract()
                .addIKM(initialKeyMaterial)
                .addSalt(salt)
                .thenExpand(info, 32);

        return kdf.deriveKey("AES", params);
    }
}
```

이 예제는 HKDF 기반으로 AES 키를 파생하는 흐름입니다. 실제 서비스에서는 salt와 context 정보를 어떻게 만들고 저장할지, 키 회전 정책을 어떻게 둘지, 암호화 라이브러리와 HSM(Hardware Security Module) 또는 KMS(Key Management Service)가 어떤 알고리즘을 지원하는지 함께 확인해야 합니다.

### PEM Encodings of Cryptographic Objects

JEP 470은 preview 기능입니다. PEM은 인증서와 키를 파일이나 문자열로 주고받을 때 흔히 보는 형식입니다. Java 25는 키, 인증서, 인증서 폐기 목록(CRL)을 PEM 형식으로 인코딩하고 디코딩하는 API를 preview로 제공합니다.

이 기능이 반가운 이유는 간단합니다. 그동안 Java에서 PEM 처리는 프로젝트마다 유틸리티 코드를 직접 만들거나 외부 라이브러리에 기대는 경우가 많았습니다. 표준 API가 자리 잡으면 인증서 기반 인증, mTLS(mutual TLS), 내부 CA(Certificate Authority) 연동 코드가 더 읽기 쉬워질 수 있습니다.

다만 preview 기능이므로 장기 운영 코드에서 바로 표준화된 계약으로 믿으면 위험합니다. 보안 영역은 API 안정성뿐 아니라 키 보관, 권한, 감사 로그, 비밀 값 노출 방지가 더 중요합니다. PEM API는 “파싱이 쉬워졌다”는 의미이지, 키 관리 전체가 안전해졌다는 뜻은 아닙니다.

## 성능과 런타임: 시작 시간, 메모리, GC를 다듬는다

### Ahead-of-Time 관련 기능

JEP 514와 JEP 515는 AOT(Ahead-of-Time) 캐시 사용성을 개선합니다. AOT는 애플리케이션 실행 전에 일부 로딩, 링크, 프로파일 정보를 준비해 두고 시작 시 활용하는 방향입니다. Java 25에서는 AOT 캐시 생성 명령을 단순화하고, 훈련 실행에서 얻은 메서드 프로파일을 캐시에 담아 초기 warmup을 줄이는 기능이 포함되었습니다.

운영 관점에서는 다음 질문을 먼저 해야 합니다.

- 애플리케이션 시작 시간이 실제 병목인가?
- 배포 이미지 또는 컨테이너가 자주 새로 뜨는가?
- 훈련 실행이 운영 트래픽과 충분히 비슷한가?
- AOT 캐시를 빌드 산출물로 관리할 수 있는가?

AOT는 모든 서비스에 자동으로 이득을 주는 마법 버튼이 아닙니다. 서버가 오래 살아 있고 시작 시간이 중요하지 않다면 우선순위가 낮을 수 있습니다. 반대로 서버리스, 짧은 수명 컨테이너, CLI 도구, 배치 작업처럼 시작 시간이 사용자 경험이나 비용에 직접 영향을 주는 환경에서는 검토할 가치가 큽니다.

### Compact Object Headers

JEP 519는 64비트 아키텍처에서 객체 헤더를 64비트로 줄여 메모리 사용량을 낮추는 기능입니다. Java 애플리케이션은 작은 객체를 많이 만들기 쉽습니다. 객체마다 붙는 헤더가 줄어들면 전체 힙 사용량과 캐시 지역성에 긍정적인 영향을 줄 수 있습니다.

이 기능은 코드 변경보다 검증이 중요합니다. 객체가 많은 애플리케이션, 캐시를 크게 들고 있는 서비스, 대량 DTO를 다루는 API 서버는 효과를 볼 가능성이 있습니다. 하지만 실제 효과는 객체 수, 힙 크기, GC, CPU 캐시, 라이브러리 동작에 따라 다릅니다.

마이그레이션 때는 기존 성능 지표와 비교해야 합니다. `p95`, `p99` 응답 시간, GC pause, allocation rate, RSS(Resident Set Size), 컨테이너 메모리 제한을 함께 봐야 합니다. “메모리 사용량이 줄었다”만 보고 배포하면 tail latency가 나빠지는 변화를 놓칠 수 있습니다.

### Generational Shenandoah

JEP 521은 Shenandoah GC의 세대별 모드를 final로 만듭니다. 세대별 GC는 대부분의 객체가 짧게 살다 사라진다는 관찰을 바탕으로 young 세대와 old 세대를 나누어 수집합니다. Shenandoah는 낮은 pause time을 목표로 하는 GC이고, 세대별 모드는 일반적인 애플리케이션 객체 생명주기와 더 잘 맞도록 개선하는 방향입니다.

```bash
java -XX:+UseShenandoahGC -XX:ShenandoahGCMode=generational -jar app.jar
```

이 옵션은 Shenandoah를 선택하고 세대별 모드를 사용한다는 뜻입니다. 실제 적용 전에는 같은 트래픽으로 G1, ZGC, Shenandoah를 비교하는 부하 테스트가 필요합니다. GC 선택은 “최신 기능이니까 사용”이 아니라, 서비스의 pause time 목표, 처리량, 메모리 여유, 운영팀의 진단 경험을 기준으로 정해야 합니다.

### Vector API

JEP 508은 열 번째 incubator인 Vector API입니다. 벡터 계산은 여러 숫자 연산을 CPU의 SIMD(Single Instruction, Multiple Data) 명령으로 처리하는 방식입니다. 이미지 처리, 머신러닝 추론의 일부 계산, 암호화 주변 연산, 대규모 수치 계산에서 의미가 있을 수 있습니다.

일반적인 CRUD 백엔드에서는 직접 사용할 일이 많지 않습니다. 하지만 라이브러리 개발자나 검색, 추천, 데이터 처리 엔진을 만드는 팀에게는 중요합니다. incubator 상태이므로 API 변경 가능성이 있고, CPU 아키텍처별 성능 차이도 큽니다. 벤치마크 없이 도입하면 코드만 어려워지고 실제 이득은 적을 수 있습니다.

## 관측성: JFR로 더 깊게 본다

Java 25는 JFR(Java Flight Recorder) 관련 기능도 여럿 포함합니다. JFR은 JVM 내부 이벤트와 애플리케이션 실행 정보를 낮은 오버헤드로 수집하는 도구입니다. 장애가 났을 때 “어디가 느린지”, “CPU를 누가 쓰는지”, “스레드와 GC가 어떤 상태인지”를 보는 데 도움이 됩니다.

### JFR Method Timing & Tracing

JEP 520은 특정 메서드의 timing과 tracing 정보를 JFR로 수집할 수 있게 합니다. 예전에는 이런 분석을 위해 APM 에이전트, 바이트코드 계측 도구, 별도 profiler를 붙이는 경우가 많았습니다. JDK 안에서 제공하는 방법이 늘어나면 운영 환경에서 사용할 수 있는 선택지가 넓어집니다.

```bash
java \
  -XX:StartFlightRecording=method-timing='com.example.OrderService::createOrder',dumponexit=true,filename=order.jfr \
  -jar app.jar

jfr view method-timing order.jfr
```

이 예제는 `OrderService::createOrder` 메서드의 실행 시간을 JFR 기록에 담고, `jfr view`로 확인하는 흐름입니다. 실무에서는 계측 대상 메서드를 좁게 잡아야 합니다. 모든 메서드를 추적하려고 하면 기록 크기와 오버헤드가 커지고, 정작 중요한 신호가 묻힐 수 있습니다.

### JFR CPU-Time Profiling과 Cooperative Sampling

JEP 509는 experimental 기능으로, JFR에서 CPU 시간 기반 프로파일링을 지원합니다. Inside Java 설명 기준으로 이 기능은 Linux에서 동작합니다. 벽시계 시간 기준 샘플링은 대기 시간과 CPU 사용 시간을 함께 섞어 볼 수 있는데, CPU 시간 기반 분석은 실제 CPU를 태우는 코드를 더 분리해서 보는 데 도움이 됩니다.

JEP 518은 JFR Cooperative Sampling입니다. 런타임과 JFR 샘플링이 더 협력적으로 동작하도록 개선하는 기능으로 보면 됩니다. 개발자가 애플리케이션 코드를 크게 바꾸는 기능은 아니지만, 운영 중 프로파일링 품질과 안정성 측면에서 의미가 있습니다.

## 제거와 호환성: 32비트 x86과 오래된 옵션을 확인하자

JEP 503으로 OpenJDK의 32비트 x86 포트 코드와 빌드 지원이 제거되었습니다. 이미 대부분의 서버와 개발 환경은 64비트이므로 영향이 없을 가능성이 큽니다. 하지만 오래된 Windows 장비, 레거시 빌드 서버, 특수 단말 환경을 지원한다면 확인이 필요합니다.

Oracle 릴리스 노트에는 JEP 외에도 제거되거나 동작이 바뀐 항목이 정리되어 있습니다. 예를 들어 `java.net.Socket`의 오래된 생성자 중 `stream` 인자를 받는 형태는 `stream`이 `false`일 때 더 이상 datagram socket을 만들 수 없고 `IllegalArgumentException`을 던집니다. datagram socket이 필요하다면 `java.net.DatagramSocket`을 사용해야 합니다.

또한 오래된 JMX 시스템 프로퍼티 일부, PerfData 샘플링, 일부 성능 카운터가 제거되었습니다. 애플리케이션 코드에는 영향이 없더라도 모니터링 도구가 이런 내부 카운터를 직접 읽고 있다면 지표가 사라질 수 있습니다. JDK 업그레이드 검증에서는 애플리케이션 테스트뿐 아니라 대시보드와 알림도 같이 확인해야 합니다.

## Java 21에서 Java 25로 올릴 때의 체크리스트

Java 25는 LTS이기 때문에 Java 21을 쓰는 팀이 다음 업그레이드 후보로 검토하기 좋습니다. 하지만 JDK만 바꾸고 끝내면 작은 호환성 문제가 운영에서 늦게 드러날 수 있습니다.

- 빌드 도구가 Java 25 toolchain을 지원하는지 확인합니다.
- Spring Boot, Gradle, Maven plugin, Lombok, Mockito, Byte Buddy, Kotlin 같은 도구의 Java 25 지원 버전을 확인합니다.
- CI 이미지와 Docker base image를 Java 25로 바꾼 뒤 테스트를 실행합니다.
- preview 기능을 쓰는 샘플과 운영 코드를 분리합니다.
- GC, 힙, CPU, 시작 시간 지표를 Java 21 기준선과 비교합니다.
- JFR 기록을 남겨 warmup, GC, hot method가 어떻게 달라졌는지 봅니다.
- 32비트 x86 의존 환경이나 오래된 JMX/PerfData 기반 모니터링이 있는지 확인합니다.

아래는 Gradle에서 Java 25 toolchain을 지정하는 예시입니다. 프로젝트가 Spring Boot나 Kotlin을 사용한다면 각 플러그인의 지원 버전도 함께 맞춰야 합니다.

```kotlin
plugins {
    java
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}
```

이 설정은 “컴파일과 테스트에 Java 25 toolchain을 쓰겠다”는 의미입니다. 운영 배포 이미지가 여전히 Java 21이면 로컬과 운영의 차이가 생깁니다. 그래서 CI, Dockerfile, Kubernetes 이미지 태그, 런타임 옵션까지 한 번에 확인하는 것이 좋습니다.

## 자주 하는 실수와 주의사항

첫 번째 실수는 LTS라는 말만 보고 preview 기능까지 안정 기능처럼 사용하는 것입니다. Java 25에는 final 기능도 많지만, `PEM API`, `Stable Values`, `Structured Concurrency`, `Primitive Types in Patterns`, `Vector API`, `JFR CPU-Time Profiling`처럼 상태가 다른 기능도 섞여 있습니다. 블로그 예제나 실험 코드에서는 써볼 수 있지만, 운영 코드에 넣을 때는 다음 JDK에서 바뀔 가능성을 고려해야 합니다.

두 번째 실수는 성능 기능을 켜기만 하고 비교 기준을 두지 않는 것입니다. AOT, Compact Object Headers, Generational Shenandoah는 모두 흥미로운 기능이지만 애플리케이션마다 결과가 다릅니다. 배포 전후의 시작 시간, 메모리, GC pause, 처리량, tail latency를 같은 조건에서 비교해야 합니다.

세 번째 실수는 JDK 업그레이드를 애플리케이션 코드 문제로만 보는 것입니다. 실제 장애는 빌드 플러그인, 에이전트, APM, 테스트 도구, 컨테이너 이미지, 운영 스크립트에서 더 자주 발생합니다. 특히 바이트코드 조작을 하는 라이브러리나 JVM 내부 API에 기대는 도구는 JDK 업그레이드 때 먼저 확인해야 합니다.

네 번째 실수는 `ThreadLocal`을 모두 Scoped Values로 바꾸려는 것입니다. Scoped Values는 불변 컨텍스트를 범위 안에서 전달하는 데 좋지만, 값을 바꿔 가며 사용하는 상태 저장 용도에는 맞지 않습니다. 기존 코드의 의미를 먼저 파악하고, 요청 컨텍스트처럼 읽기 전용으로 전달되는 값부터 적용하는 것이 안전합니다.

## 실무 적용 순서 추천

작은 팀이나 기존 서비스라면 다음 순서로 접근하는 것을 추천합니다.

1. 먼저 Java 25로 빌드와 테스트가 통과하는지 확인합니다.
2. 운영과 비슷한 트래픽으로 Java 21 대비 성능 기준선을 비교합니다.
3. JFR를 켜서 GC, CPU, hot method를 확인합니다.
4. 생성자 검증 코드처럼 위험이 낮은 언어 기능부터 적용합니다.
5. Scoped Values는 요청 컨텍스트 전달처럼 경계가 명확한 곳에 작게 도입합니다.
6. AOT와 GC 변경은 별도 실험 브랜치에서 수치로 검증합니다.
7. preview와 incubator 기능은 운영 코드가 아니라 학습용 또는 내부 PoC로 분리합니다.

이 순서는 보수적으로 보일 수 있지만, JDK 업그레이드는 한 번에 너무 많은 변수를 바꾸면 원인 분석이 어려워집니다. 특히 Java 25는 언어 기능뿐 아니라 JVM 내부와 관측성 기능도 함께 바뀌었기 때문에, “버전 변경”과 “새 기능 도입”을 분리하는 편이 좋습니다.

## 결론 및 도움말

> Java 25는 단순히 문법 몇 개가 추가된 릴리스가 아니라, Java 21 이후의 언어 간소화, Virtual Thread 친화적인 컨텍스트 전달, JVM 성능 개선, JFR 관측성 강화를 LTS 기준으로 묶은 버전입니다. 당장 모든 기능을 쓸 필요는 없지만, Java 21을 쓰는 팀이라면 다음 업그레이드 후보로 진지하게 검토할 만합니다.
>
> 실무에서는 final 기능과 preview 기능을 구분하고, 빌드·테스트·운영 지표를 먼저 맞춘 뒤 작은 범위부터 적용하세요. Java 25의 가치는 “새 문법을 많이 쓰는 것”보다, 더 안전한 생성자 코드, 더 명확한 요청 컨텍스트, 더 좋은 JFR 분석, 더 나은 시작 시간과 메모리 사용량을 검증 가능한 방식으로 가져오는 데 있습니다.

## 참고자료/레퍼런스

- [OpenJDK - JDK 25](https://openjdk.org/projects/jdk/25/)
- [Oracle - JDK 25 Release Notes](https://www.oracle.com/java/technologies/javase/25-relnote-issues.html)
- [Oracle - Oracle Releases Java 25](https://www.oracle.com/news/announcement/oracle-releases-java-25-2025-09-16/)
- [Inside Java - What's New in Java 25 in 2 Minutes](https://inside.java/2025/10/17/new-in-jdk-25-2-mins/)
- [OpenJDK - JEPs in JDK 25 integrated since JDK 21](https://openjdk.org/projects/jdk/25/jeps-since-jdk-21)

