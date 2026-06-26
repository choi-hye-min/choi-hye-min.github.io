---
layout: post
title: "헥사고날 아키텍처 초보자를 위한 가이드 1탄"
date: 2026-06-26 19:30:58 +0900
categories: [Architecture, Spring Boot, Java]
tags: [Hexagonal Architecture, Ports and Adapters, Spring Boot, Java, 테스트, 아키텍처]
description: "헥사고날 아키텍처를 처음 접하는 Spring Boot Java 개발자를 위해 포트와 어댑터의 의미, 패키지 구조, 작은 주문 생성 예제, 테스트 기준을 설명합니다."
---

> 계층형 구조로 시작한 Spring Boot 프로젝트가 커지면 서비스가 Controller, JPA, 외부 API에 쉽게 끌려갑니다.
> 이 글은 헥사고날 아키텍처를 처음 접하는 Java 개발자를 위해 포트와 어댑터를 작은 주문 생성 예제로 설명합니다.
> 글을 읽고 나면 어떤 코드를 안쪽에 두고, 어떤 코드를 바깥쪽으로 밀어야 하는지 판단할 수 있습니다.

## 왜 헥사고날 아키텍처를 배우나

처음 Spring Boot를 배우면 보통 Controller, Service, Repository로 나누는 계층형 구조를 사용합니다. 이 구조는 단순하고 빠르게 시작하기 좋습니다. 요청을 Controller가 받고, Service가 처리하고, Repository가 데이터베이스를 다루는 흐름이 눈에 잘 들어오기 때문입니다.

문제는 프로젝트가 커질 때부터 생깁니다. Service가 HTTP 요청 DTO를 그대로 받고, JPA Entity를 그대로 반환하고, 외부 결제 API 예외까지 직접 처리하기 시작하면 핵심 업무 규칙이 기술 코드에 둘러싸입니다. 그러면 데이터베이스를 바꾸거나 메시지 큐를 붙이는 일보다 더 작은 변경도 어렵게 느껴집니다.

헥사고날 아키텍처는 이 문제를 풀기 위한 구조입니다. 핵심은 애플리케이션의 업무 규칙을 가운데에 두고, 웹, 데이터베이스, 외부 API, 메시지 큐 같은 기술 세부사항을 바깥쪽 어댑터로 분리하는 것입니다. 이름은 육각형이지만 실제로 중요한 것은 도형이 아니라 **안쪽의 정책이 바깥쪽 기술에 의존하지 않게 만드는 방향**입니다.

초보자가 가장 먼저 기억할 문장은 하나입니다.

| 질문 | 헥사고날 관점의 답 |
|---|---|
| Controller가 업무 규칙인가? | 아니다. 웹 요청을 애플리케이션으로 전달하는 입력 어댑터다. |
| Repository 인터페이스는 어디에 둘까? | 유스케이스가 필요로 하는 포트라면 안쪽에 둔다. |
| JPA Entity는 도메인 모델인가? | 반드시 그렇지는 않다. 영속성 기술에 묶인 모델이면 바깥쪽에 둘 수 있다. |
| Service는 무조건 하나면 충분한가? | 유스케이스와 도메인 규칙을 나누면 더 명확할 때가 있다. |

이 글은 1탄이므로 모든 변형을 다루지 않습니다. DDD(Domain-Driven Design), CQRS(Command Query Responsibility Segregation), 이벤트 소싱 같은 주제는 잠시 내려놓고, Spring Boot와 Java로 가장 작은 골격을 이해하는 데 집중합니다.

## 포트와 어댑터를 먼저 이해하기

헥사고날 아키텍처는 Ports and Adapters라고도 부릅니다. 포트는 안쪽 애플리케이션이 바깥과 대화하기 위해 정의한 약속입니다. 어댑터는 그 약속을 특정 기술로 연결하는 구현입니다.

포트에는 크게 두 종류가 있습니다.

| 종류 | 방향 | 예시 |
|---|---|---|
| 입력 포트 | 바깥에서 안쪽으로 들어오는 요청 | `CreateOrderUseCase` |
| 출력 포트 | 안쪽에서 바깥 기능을 필요로 할 때 호출 | `SaveOrderPort`, `PaymentPort` |

입력 포트는 “이 애플리케이션이 할 수 있는 일”을 표현합니다. 예를 들어 주문을 생성하는 기능은 `CreateOrderUseCase`라는 Java 인터페이스로 표현할 수 있습니다. 웹 Controller는 이 포트를 호출할 뿐, 주문 생성 규칙을 직접 알 필요가 없습니다.

출력 포트는 “업무 규칙을 수행하려면 바깥 세계에서 무엇이 필요한가”를 표현합니다. 주문을 저장해야 한다면 `SaveOrderPort`가 필요합니다. 결제를 요청해야 한다면 `PaymentPort`가 필요합니다. 중요한 점은 안쪽 코드가 `JpaRepository`, `WebClient`, `KafkaTemplate` 같은 구체 기술을 직접 알지 않는다는 것입니다.

어댑터는 포트를 실제 기술에 맞게 연결합니다. REST Controller는 입력 어댑터입니다. JPA Repository 구현체는 출력 어댑터입니다. 테스트에서 사용하는 in-memory 저장소도 출력 어댑터가 될 수 있습니다.

## 예제 환경과 목표

예제는 Java 21, Spring Boot 4.1 기준으로 작성합니다. 2026년 6월 26일 현재 Spring Boot 공식 문서는 Boot 4.1이 Java 17 이상을 요구하고 Java 26까지 호환된다고 안내합니다. 실무 프로젝트가 Spring Boot 3.x라면 패키지 구조와 설계 방향은 그대로 적용할 수 있고, 의존성 버전만 프로젝트 기준에 맞추면 됩니다.

이번 예제의 목표는 작습니다.

- 고객이 상품 ID와 수량을 보내면 주문을 생성한다.
- 주문 수량은 1개 이상이어야 한다.
- 주문은 저장소 포트를 통해 저장한다.
- 웹 Controller와 JPA 구현은 업무 규칙 바깥에 둔다.
- 유스케이스는 Spring 없이도 단위 테스트할 수 있어야 한다.

일부러 결제, 재고 차감, 이벤트 발행은 넣지 않습니다. 처음부터 많은 포트를 만들면 구조는 화려해 보이지만 학습하기 어렵습니다. 헥사고날 아키텍처는 폴더를 많이 만드는 기술이 아니라 의존성 방향을 관리하는 방법입니다.

Gradle 의존성은 일반적인 Spring Web, Spring Data JPA, 테스트 구성을 가정합니다.

```kotlin
plugins {
    java
    id("org.springframework.boot") version "4.1.0"
    id("io.spring.dependency-management") version "1.1.7"
}

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
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    runtimeOnly("com.h2database:h2")

    testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
    testImplementation("org.springframework.boot:spring-boot-starter-data-jpa-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}
```

위 코드는 실행 가능한 프로젝트의 출발점만 보여줍니다. 운영에서는 사용하는 데이터베이스 드라이버, 마이그레이션 도구, 관측성 의존성을 별도로 추가해야 합니다.

## 패키지 구조 잡기

처음에는 아래 정도의 패키지 구조면 충분합니다.

```text
com.example.order
├── application
│   ├── port
│   │   ├── in
│   │   │   └── CreateOrderUseCase.java
│   │   └── out
│   │       └── SaveOrderPort.java
│   └── service
│       └── CreateOrderService.java
├── domain
│   └── Order.java
└── adapter
    ├── in
    │   └── web
    │       └── OrderController.java
    └── out
        └── persistence
            ├── JpaOrderAdapter.java
            ├── OrderJpaEntity.java
            └── SpringDataOrderRepository.java
```

`domain`은 업무 모델을 둡니다. `application`은 유스케이스와 포트를 둡니다. `adapter`는 Spring MVC, JPA 같은 외부 기술을 둡니다.

이 구조의 핵심은 패키지 이름이 아닙니다. 의존성 방향입니다.

| 코드 | 의존해도 되는 대상 | 피해야 할 대상 |
|---|---|---|
| `domain` | Java 표준 타입, 자신의 값 객체 | Spring, JPA, 웹 DTO |
| `application` | `domain`, 포트 인터페이스 | Controller, JPA 구현체 |
| `adapter.in.web` | 입력 포트, 웹 기술 | 도메인 내부 규칙 직접 구현 |
| `adapter.out.persistence` | 출력 포트, JPA 기술 | 유스케이스 흐름 결정 |

초보자가 자주 헷갈리는 부분은 `application`이 Spring을 전혀 쓰면 안 되는지입니다. 원칙적으로는 Spring에 덜 묶일수록 테스트와 이식성이 좋아집니다. 다만 Spring Boot 프로젝트에서 유스케이스 구현체에 `@Service`를 붙이는 정도는 현실적인 선택일 수 있습니다. 중요한 것은 안쪽 정책이 웹과 데이터베이스의 구체 API에 끌려가지 않는 것입니다.

## 도메인 모델 만들기

먼저 주문 도메인을 만듭니다. 도메인은 “주문은 어떤 상태와 규칙을 가지는가”를 표현합니다. 여기서는 주문 수량이 1개 이상이어야 한다는 규칙만 넣습니다.

```java
package com.example.order.domain;

import java.util.Objects;

public class Order {

    private final Long id;
    private final Long productId;
    private final int quantity;

    private Order(Long id, Long productId, int quantity) {
        this.id = id;
        this.productId = Objects.requireNonNull(productId);
        this.quantity = quantity;
    }

    public static Order create(Long productId, int quantity) {
        if (quantity < 1) {
            throw new IllegalArgumentException("quantity must be greater than zero");
        }
        return new Order(null, productId, quantity);
    }

    public Order withId(Long id) {
        return new Order(id, productId, quantity);
    }

    public Long getId() {
        return id;
    }

    public Long getProductId() {
        return productId;
    }

    public int getQuantity() {
        return quantity;
    }
}
```

이 예제에서는 도메인 객체에 JPA 어노테이션을 붙이지 않았습니다. `Order`는 데이터베이스 테이블이 아니라 업무 개념입니다. 저장 방식이 JPA인지 JDBC인지 MongoDB인지는 도메인 모델이 몰라도 됩니다.

실무에서는 도메인 모델과 JPA Entity를 분리하면 매핑 코드가 늘어납니다. 반대로 하나로 합치면 빠르게 개발할 수 있지만 영속성 제약이 도메인 규칙 안으로 들어오기 쉽습니다. 처음부터 무조건 분리하라는 뜻은 아닙니다. 다만 헥사고날 아키텍처를 연습할 때는 분리해 보면 경계가 더 잘 보입니다.

## 입력 포트와 출력 포트 만들기

이제 애플리케이션이 제공할 기능을 입력 포트로 정의합니다. 주문 생성에 필요한 값과 결과를 record로 함께 둡니다.

```java
package com.example.order.application.port.in;

public interface CreateOrderUseCase {

    CreateOrderResult create(CreateOrderCommand command);

    record CreateOrderCommand(Long productId, int quantity) {
    }

    record CreateOrderResult(Long orderId) {
    }
}
```

입력 포트는 Controller를 위해 존재하는 인터페이스가 아닙니다. 웹, 배치, 메시지 소비자, 테스트 코드가 모두 같은 유스케이스를 호출할 수 있게 만드는 애플리케이션의 입구입니다.

출력 포트는 유스케이스가 바깥 저장소에 기대하는 기능입니다.

```java
package com.example.order.application.port.out;

import com.example.order.domain.Order;

public interface SaveOrderPort {

    Order save(Order order);
}
```

여기서 `SaveOrderPort`가 `JpaRepository`를 상속하지 않는 점이 중요합니다. 유스케이스는 “주문을 저장한다”만 필요로 합니다. JPA의 `flush`, `findAll`, pagination 같은 기능이 필요하지 않다면 포트에 노출하지 않습니다.

포트는 작게 시작해야 합니다. `OrderRepositoryPort` 하나에 조회, 저장, 삭제, 통계, 잠금까지 모두 넣으면 다시 거대한 Repository가 됩니다. 유스케이스가 실제로 필요한 동작을 기준으로 나누면 테스트도 쉬워집니다.

## 유스케이스 구현하기

유스케이스 구현체는 입력 포트를 구현하고 출력 포트를 사용합니다. 이 클래스는 애플리케이션 흐름을 조정합니다. 도메인 객체를 만들고, 필요한 포트를 호출하고, 결과를 반환합니다.

```java
package com.example.order.application.service;

import com.example.order.application.port.in.CreateOrderUseCase;
import com.example.order.application.port.out.SaveOrderPort;
import com.example.order.domain.Order;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CreateOrderService implements CreateOrderUseCase {

    private final SaveOrderPort saveOrderPort;

    public CreateOrderService(SaveOrderPort saveOrderPort) {
        this.saveOrderPort = saveOrderPort;
    }

    @Override
    @Transactional
    public CreateOrderResult create(CreateOrderCommand command) {
        Order order = Order.create(command.productId(), command.quantity());
        Order savedOrder = saveOrderPort.save(order);
        return new CreateOrderResult(savedOrder.getId());
    }
}
```

`CreateOrderService`는 JPA Entity를 모릅니다. HTTP 요청 객체도 모릅니다. 그래서 유스케이스 테스트는 Spring MVC나 데이터베이스 없이도 작성할 수 있습니다.

위 코드에는 `@Service`와 `@Transactional`이 있습니다. 엄격한 해석에서는 애플리케이션 안쪽이 Spring 어노테이션에 의존하지 않도록 설정 클래스로 Bean을 등록할 수 있습니다. 하지만 초보자용 Spring Boot 프로젝트에서는 이 정도 타협이 이해하기 쉽습니다. 나중에 Spring 의존성까지 제거하고 싶다면 2탄에서 설정 분리 방식으로 발전시키면 됩니다.

## 웹 입력 어댑터 만들기

Controller는 HTTP를 애플리케이션 입력 포트로 바꾸는 어댑터입니다. 요청 JSON을 command로 변환하고, 유스케이스 결과를 HTTP 응답으로 변환합니다.

```java
package com.example.order.adapter.in.web;

import com.example.order.application.port.in.CreateOrderUseCase;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private final CreateOrderUseCase createOrderUseCase;

    public OrderController(CreateOrderUseCase createOrderUseCase) {
        this.createOrderUseCase = createOrderUseCase;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CreateOrderResponse create(@Valid @RequestBody CreateOrderRequest request) {
        CreateOrderUseCase.CreateOrderResult result = createOrderUseCase.create(
                new CreateOrderUseCase.CreateOrderCommand(
                        request.productId(),
                        request.quantity()
                )
        );
        return new CreateOrderResponse(result.orderId());
    }

    public record CreateOrderRequest(
            @NotNull Long productId,
            @Min(1) int quantity
    ) {
    }

    public record CreateOrderResponse(Long orderId) {
    }
}
```

Controller에 Bean Validation을 둔 이유는 HTTP 요청 형식의 1차 검증을 빠르게 실패시키기 위해서입니다. 하지만 이것만 믿고 도메인 규칙을 제거하면 안 됩니다. 웹이 아닌 배치나 메시지 어댑터가 유스케이스를 호출할 수도 있으므로 핵심 규칙은 도메인이나 유스케이스 안에도 있어야 합니다.

Controller가 직접 `Order.create()`를 호출하거나 JPA Repository를 주입받기 시작하면 경계가 흐려집니다. Controller의 책임은 웹 요청과 응답 변환입니다. 업무 흐름은 입력 포트 너머에 둡니다.

## JPA 출력 어댑터 만들기

저장소 어댑터는 출력 포트 구현체입니다. 유스케이스가 원하는 `SaveOrderPort`를 JPA로 구현합니다.

```java
package com.example.order.adapter.out.persistence;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "orders")
public class OrderJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long productId;

    private int quantity;

    protected OrderJpaEntity() {
    }

    public OrderJpaEntity(Long id, Long productId, int quantity) {
        this.id = id;
        this.productId = productId;
        this.quantity = quantity;
    }

    public Long getId() {
        return id;
    }

    public Long getProductId() {
        return productId;
    }

    public int getQuantity() {
        return quantity;
    }
}
```

JPA Entity는 JPA가 객체를 만들 수 있도록 기본 생성자가 필요하고, 프록시나 지연 로딩 같은 영속성 규칙에 영향을 받습니다. 그래서 이 글에서는 도메인 모델과 분리했습니다.

Spring Data JPA Repository는 어댑터 내부의 도구입니다.

```java
package com.example.order.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

interface SpringDataOrderRepository extends JpaRepository<OrderJpaEntity, Long> {
}
```

마지막으로 출력 포트를 구현합니다.

```java
package com.example.order.adapter.out.persistence;

import com.example.order.application.port.out.SaveOrderPort;
import com.example.order.domain.Order;
import org.springframework.stereotype.Component;

@Component
public class JpaOrderAdapter implements SaveOrderPort {

    private final SpringDataOrderRepository repository;

    public JpaOrderAdapter(SpringDataOrderRepository repository) {
        this.repository = repository;
    }

    @Override
    public Order save(Order order) {
        OrderJpaEntity entity = new OrderJpaEntity(
                order.getId(),
                order.getProductId(),
                order.getQuantity()
        );
        OrderJpaEntity savedEntity = repository.save(entity);
        return Order.create(
                savedEntity.getProductId(),
                savedEntity.getQuantity()
        ).withId(savedEntity.getId());
    }
}
```

이 매핑 코드는 작지만 의미가 있습니다. 유스케이스는 `SaveOrderPort`만 보고, JPA 구현은 어댑터에 갇힙니다. 나중에 저장 방식을 JDBC나 외부 주문 서비스로 바꾸더라도 유스케이스 코드는 그대로 둘 수 있습니다.

실무에서는 매핑이 커지면 별도 mapper 클래스를 둘 수 있습니다. 다만 예제처럼 한 곳에서만 쓰는 매핑을 처음부터 추상화할 필요는 없습니다. 코드가 반복되고 의미가 분명해질 때 분리해도 늦지 않습니다.

## 테스트를 어디에 둘까

헥사고날 아키텍처의 장점은 테스트에서 잘 드러납니다. 유스케이스가 출력 포트 인터페이스에만 의존하면, 데이터베이스 없이도 업무 흐름을 검증할 수 있습니다.

아래 테스트는 저장소 포트를 간단한 fake로 대체합니다.

```java
package com.example.order.application.service;

import com.example.order.application.port.in.CreateOrderUseCase.CreateOrderCommand;
import com.example.order.application.port.out.SaveOrderPort;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CreateOrderServiceTest {

    @Test
    void createsOrder() {
        SaveOrderPort saveOrderPort = order -> order.withId(1L);
        CreateOrderService service = new CreateOrderService(saveOrderPort);

        var result = service.create(new CreateOrderCommand(10L, 2));

        assertThat(result.orderId()).isEqualTo(1L);
    }

    @Test
    void rejectsInvalidQuantity() {
        SaveOrderPort saveOrderPort = order -> order.withId(1L);
        CreateOrderService service = new CreateOrderService(saveOrderPort);

        assertThatThrownBy(() -> service.create(new CreateOrderCommand(10L, 0)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("quantity must be greater than zero");
    }
}
```

이 테스트는 Spring 컨텍스트를 띄우지 않습니다. 그래서 빠르고 실패 원인이 분명합니다. 주문 생성 규칙이 깨졌는지, Spring MVC 설정이 잘못됐는지, 데이터베이스 연결이 실패했는지가 섞이지 않습니다.

반대로 Controller는 웹 어댑터로서 따로 테스트합니다. `@WebMvcTest`를 사용하면 HTTP 요청 매핑, JSON 변환, Validation 동작을 확인할 수 있습니다.

```java
package com.example.order.adapter.in.web;

import com.example.order.application.port.in.CreateOrderUseCase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OrderController.class)
class OrderControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    CreateOrderUseCase createOrderUseCase;

    @Test
    void returnsCreatedOrderId() throws Exception {
        when(createOrderUseCase.create(any()))
                .thenReturn(new CreateOrderUseCase.CreateOrderResult(1L));

        mockMvc.perform(post("/orders")
                        .contentType("application/json")
                        .content("""
                                {"productId":10,"quantity":2}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderId").value(1));
    }
}
```

Spring Boot의 테스트 문서는 테스트 유틸리티와 slice test를 제공합니다. Controller 테스트는 웹 어댑터의 책임만 확인하고, JPA 어댑터는 `@DataJpaTest`로 매핑과 쿼리를 확인하는 식으로 나누면 테스트 목적이 선명해집니다.

## 자주 하는 실수와 주의사항

### 폴더만 나누고 의존성은 그대로 둔다

`domain`, `application`, `adapter` 패키지를 만들었는데 유스케이스가 `OrderJpaEntity`를 직접 반환하면 구조의 이점이 사라집니다. 패키지명보다 중요한 것은 안쪽 코드가 바깥 구현을 모르는지입니다.

### 모든 Repository를 포트로 감싼다

헥사고날 아키텍처는 모든 기술 클래스를 기계적으로 포장하라는 뜻이 아닙니다. 유스케이스가 정말 필요로 하는 외부 기능만 포트로 정의합니다. 단순 CRUD 관리자 화면처럼 업무 규칙이 거의 없는 경우에는 계층형 구조가 더 단순할 수 있습니다.

### 포트 이름이 기술 중심이 된다

`JpaOrderPort`, `WebClientPaymentPort` 같은 이름은 안쪽 포트가 바깥 기술을 알고 있음을 드러냅니다. 포트는 `SaveOrderPort`, `ChargePaymentPort`처럼 애플리케이션이 원하는 행동으로 이름 짓는 편이 좋습니다.

### 도메인 모델을 너무 일찍 복잡하게 만든다

초반부터 Aggregate, Factory, Domain Service, Event를 모두 넣으면 팀원이 구조를 이해하기 어렵습니다. 먼저 유스케이스와 포트 경계를 잡고, 규칙이 커질 때 도메인 모델을 풍부하게 만드는 편이 안전합니다.

### 테스트 더블이 실제 어댑터와 너무 다르다

유스케이스 테스트에서 fake 저장소를 쓰는 것은 좋습니다. 하지만 fake가 실제 저장소 제약을 완전히 무시하면 운영 버그를 놓칠 수 있습니다. 유스케이스 테스트와 별도로 JPA 어댑터 테스트를 두어 매핑, 제약 조건, 트랜잭션 동작을 확인해야 합니다.

## 언제 쓰면 좋고 언제 피할까

헥사고날 아키텍처는 변경이 잦은 업무 규칙과 여러 입출력 기술이 만나는 서비스에 잘 맞습니다. 예를 들어 같은 주문 생성 기능을 REST API, 배치, 메시지 소비자가 함께 사용하거나, 저장소와 외부 API가 자주 바뀌는 도메인이라면 포트와 어댑터 경계가 도움이 됩니다.

반대로 단순 조회 위주의 백오피스, 빠르게 검증해야 하는 작은 프로토타입, 데이터베이스 테이블과 화면이 거의 1:1인 CRUD 서비스라면 처음부터 헥사고날 구조를 강하게 적용하지 않아도 됩니다. 구조가 문제를 줄여야지, 코드 탐색 비용만 늘리면 안 됩니다.

판단 기준은 다음과 같습니다.

| 상황 | 추천 |
|---|---|
| 업무 규칙이 많고 오래 유지될 서비스 | 헥사고날 구조를 적극 검토 |
| 외부 API, DB, 메시지 큐 등 어댑터가 여러 개 | 포트로 경계를 명확히 분리 |
| 단순 CRUD와 관리자 화면 중심 | 계층형 구조로 시작해도 충분 |
| 팀이 아직 구조를 이해하지 못함 | 작은 유스케이스 하나부터 적용 |
| 테스트가 느리고 어려움 | 유스케이스와 어댑터 테스트 분리 검토 |

처음부터 모든 코드를 완벽하게 나누려 하지 마세요. 가장 변경이 잦고 테스트하기 어려운 유스케이스 하나를 골라 입력 포트, 출력 포트, 어댑터로 분리해 보는 것이 좋은 출발점입니다.

## 적용 전 체크리스트

- 도메인과 유스케이스가 Controller, JPA, 외부 API 구현체를 직접 의존하지 않는가?
- 입력 포트가 애플리케이션이 제공하는 기능을 행동 중심 이름으로 표현하는가?
- 출력 포트가 유스케이스에 필요한 최소 동작만 노출하는가?
- Controller는 HTTP 요청과 응답 변환에 집중하는가?
- JPA 어댑터는 Entity와 도메인 모델의 변환을 책임지는가?
- 유스케이스 테스트가 Spring 컨텍스트 없이 실행되는가?
- 웹, JPA 같은 어댑터는 별도의 slice test나 통합 테스트로 검증하는가?
- 단순한 CRUD까지 과하게 분리하고 있지는 않은가?

체크리스트를 모두 만족해야만 헥사고날 아키텍처라고 부를 수 있는 것은 아닙니다. 하지만 이 질문에 답하다 보면 지금 코드가 어떤 기술에 묶여 있는지 훨씬 빨리 발견할 수 있습니다.

## 결론 및 도움말

> 헥사고날 아키텍처의 출발점은 육각형 그림이 아니라 의존성 방향입니다. 업무 규칙과 유스케이스를 안쪽에 두고, 웹과 JPA 같은 기술 세부사항은 포트 뒤의 어댑터로 밀어내면 변경과 테스트가 쉬워집니다.
>
> 1탄에서는 주문 생성이라는 작은 예제로 입력 포트, 출력 포트, 웹 어댑터, JPA 어댑터를 나눴습니다. 다음 단계로는 조회 유스케이스, 외부 결제 포트, 도메인 이벤트처럼 경계가 더 복잡해지는 사례를 하나씩 추가해 보면 좋습니다.

## 참고자료/레퍼런스

- [Alistair Cockburn - Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture)
- [Spring Boot System Requirements](https://docs.spring.io/spring-boot/system-requirements.html)
- [Spring Framework Dependency Injection](https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html)
- [Spring Boot Testing](https://docs.spring.io/spring-boot/reference/testing/index.html)

