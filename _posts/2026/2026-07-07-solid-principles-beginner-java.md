---
layout: post
title: "SOLID 원칙 초보자를 위한 쉬운 설명과 Java 예제"
date: 2026-07-07 01:58:51 +0900
categories: [Architecture, Java, OOP]
tags: [SOLID, Java, 객체지향, 설계, 리팩터링, 테스트]
description: "SOLID 원칙을 처음 배우는 개발자를 위해 단일 책임, 개방 폐쇄, 리스코프 치환, 인터페이스 분리, 의존성 역전을 Java 예제와 실무 체크리스트로 쉽게 설명합니다."
---

> SOLID 원칙은 외워야 하는 구호가 아니라 변경이 생겼을 때 덜 흔들리는 코드를 만들기 위한 설계 기준입니다.
> 이 글은 객체지향 설계가 처음인 개발자를 위해 다섯 원칙을 작은 Java 예제와 함께 풀어 설명합니다.
> 글을 읽고 나면 클래스를 언제 나누고, 인터페이스를 언제 만들고, 테스트하기 쉬운 의존성 구조를 어떻게 잡을지 판단할 수 있습니다.

## SOLID를 왜 배워야 할까

처음 개발을 배울 때는 코드가 동작하는지가 가장 중요합니다. 요청을 받고, 데이터를 저장하고, 화면에 보여주면 일단 성공처럼 느껴집니다. 하지만 프로젝트가 조금만 커져도 “동작은 하는데 고치기 무서운 코드”가 생깁니다.

예를 들어 주문 생성 기능을 하나 만든다고 해보겠습니다. 처음에는 `OrderService` 하나에 주문 검증, 가격 계산, 할인 적용, 결제 요청, 이메일 발송, 데이터 저장을 모두 넣어도 빠르게 완성됩니다. 문제는 다음 요구사항이 들어올 때입니다.

- 할인 정책만 바꾸려는데 결제 코드까지 다시 읽어야 한다.
- 이메일 발송 실패 때문에 주문 저장 테스트가 깨진다.
- 카드 결제 외에 계좌이체를 추가하려면 기존 결제 분기문을 계속 수정해야 한다.
- 테스트에서 실제 외부 API를 호출하지 않도록 막기 어렵다.

SOLID는 이런 문제를 줄이기 위한 객체지향 설계 원칙입니다. Robert C. Martin의 객체지향 설계 원칙들이 널리 알려졌고, 이후 Michael Feathers가 다섯 원칙의 앞글자를 모아 SOLID라는 이름으로 소개한 것으로 알려져 있습니다. 이 글은 역사보다 실무 감각에 집중합니다.

SOLID를 적용한다는 말은 모든 클래스에 인터페이스를 붙이고 파일을 많이 만드는 뜻이 아닙니다. 핵심은 변경 이유를 살피고, 변경이 자주 일어나는 부분과 안정적인 부분을 적당히 나누는 것입니다.

| 원칙 | 쉬운 질문 | 목적 |
|---|---|---|
| SRP | 이 클래스가 바뀌는 이유가 하나인가? | 책임을 섞지 않기 |
| OCP | 새 기능을 넣을 때 기존 코드를 덜 고칠 수 있는가? | 확장에 강한 구조 만들기 |
| LSP | 부모 타입 자리에 자식 타입을 넣어도 문제없는가? | 상속과 구현체의 약속 지키기 |
| ISP | 사용하지 않는 메서드까지 의존하고 있지 않은가? | 인터페이스를 작게 유지하기 |
| DIP | 중요한 정책이 세부 기술에 끌려가지 않는가? | 추상화에 의존하기 |

다섯 원칙은 서로 따로 떨어져 있지 않습니다. 단일 책임 원칙을 지키다 보면 인터페이스가 작아지고, 인터페이스가 작아지면 의존성 역전이 쉬워집니다. 개방 폐쇄 원칙을 지키려다 보면 전략 패턴이나 포트와 어댑터 구조로 자연스럽게 이어지기도 합니다.

## 예제로 볼 문제 상황

아래 코드는 초보 프로젝트에서 흔히 볼 수 있는 주문 서비스입니다. 동작 자체는 이해하기 쉽지만, 여러 책임이 한 클래스에 섞여 있습니다.

```java
public class OrderService {

    public void createOrder(OrderRequest request) {
        if (request.quantity() < 1) {
            throw new IllegalArgumentException("quantity must be positive");
        }

        int price = request.quantity() * 10_000;

        if ("WELCOME".equals(request.couponCode())) {
            price = price - 1_000;
        }

        PaymentClient paymentClient = new PaymentClient();
        paymentClient.pay(request.cardNumber(), price);

        OrderRepository repository = new OrderRepository();
        repository.save(request.productId(), request.quantity(), price);

        EmailSender emailSender = new EmailSender();
        emailSender.send(request.email(), "주문이 완료되었습니다.");
    }
}
```

이 코드는 한 번에 많은 일을 합니다. 주문 수량 검증, 가격 계산, 쿠폰 할인, 결제, 저장, 이메일 발송이 모두 `createOrder` 안에 있습니다. 요구사항이 작을 때는 괜찮아 보이지만, 한 가지 변경이 다른 코드에 영향을 주기 쉽습니다.

이 글에서는 이 코드를 한 번에 “완벽한 구조”로 바꾸지 않습니다. SOLID 원칙을 하나씩 보며 어떤 문제가 보이는지, 어느 정도까지 나누면 충분한지 살펴보겠습니다.

## SRP: 단일 책임 원칙

SRP(Single Responsibility Principle)는 클래스가 하나의 책임만 가져야 한다는 원칙입니다. 여기서 책임은 “메서드가 하나”라는 뜻이 아닙니다. 더 실용적으로는 **바뀌는 이유가 하나인가**라고 생각하면 쉽습니다.

`OrderService`는 바뀌는 이유가 많습니다. 할인 정책이 바뀌어도 수정되고, 결제 방식이 바뀌어도 수정되고, 이메일 문구가 바뀌어도 수정됩니다. 이 상태에서는 작은 요구사항도 큰 파일을 건드리게 됩니다.

먼저 할인 계산만 분리해 보겠습니다.

```java
public class DiscountPolicy {

    public int discount(String couponCode) {
        if ("WELCOME".equals(couponCode)) {
            return 1_000;
        }
        return 0;
    }
}
```

이 코드는 쿠폰 코드에 따른 할인 금액만 책임집니다. 주문 저장 방식이나 이메일 발송 방식은 모릅니다. 덕분에 쿠폰 정책이 바뀔 때 읽어야 할 범위가 줄어듭니다.

`OrderService`는 할인 계산을 위임합니다.

```java
public class OrderService {

    private final DiscountPolicy discountPolicy;

    public OrderService(DiscountPolicy discountPolicy) {
        this.discountPolicy = discountPolicy;
    }

    public int calculatePrice(OrderRequest request) {
        if (request.quantity() < 1) {
            throw new IllegalArgumentException("quantity must be positive");
        }

        int originalPrice = request.quantity() * 10_000;
        return originalPrice - discountPolicy.discount(request.couponCode());
    }
}
```

이 예제는 아직 결제와 저장까지 다루지 않습니다. 중요한 것은 처음부터 거대한 구조를 만들지 않고, 변경 이유가 뚜렷한 부분부터 분리했다는 점입니다.

단일 책임 원칙을 오해하면 클래스가 너무 잘게 쪼개집니다. `QuantityValidator`, `PriceMultiplier`, `CouponCodeReader`처럼 의미가 약한 클래스를 많이 만들면 오히려 읽기 어렵습니다. 좋은 분리는 이름을 봤을 때 책임이 자연스럽고, 테스트할 이유가 분명합니다.

## OCP: 개방 폐쇄 원칙

OCP(Open-Closed Principle)는 확장에는 열려 있고 수정에는 닫혀 있어야 한다는 원칙입니다. 말이 조금 어렵지만, 새 기능을 추가할 때 이미 검증된 코드를 계속 고치지 않도록 만들자는 뜻입니다.

쿠폰이 하나뿐일 때는 `if` 하나면 충분합니다. 하지만 쿠폰이 늘어나면 문제가 생깁니다.

```java
public int discount(String couponCode) {
    if ("WELCOME".equals(couponCode)) {
        return 1_000;
    }
    if ("VIP".equals(couponCode)) {
        return 3_000;
    }
    if ("SUMMER".equals(couponCode)) {
        return 2_000;
    }
    return 0;
}
```

새 쿠폰을 추가할 때마다 기존 메서드를 수정해야 합니다. 분기가 많아질수록 테스트해야 할 조합도 늘어납니다. 이때는 쿠폰 정책을 인터페이스로 나눌 수 있습니다.

```java
public interface CouponPolicy {

    boolean supports(String couponCode);

    int discount(int originalPrice);
}
```

각 쿠폰은 자신의 조건과 할인 계산만 압니다.

```java
public class WelcomeCouponPolicy implements CouponPolicy {

    @Override
    public boolean supports(String couponCode) {
        return "WELCOME".equals(couponCode);
    }

    @Override
    public int discount(int originalPrice) {
        return 1_000;
    }
}
```

```java
public class VipCouponPolicy implements CouponPolicy {

    @Override
    public boolean supports(String couponCode) {
        return "VIP".equals(couponCode);
    }

    @Override
    public int discount(int originalPrice) {
        return Math.min(3_000, originalPrice / 10);
    }
}
```

계산기는 여러 정책 중 사용할 정책을 찾습니다.

```java
import java.util.List;

public class DiscountCalculator {

    private final List<CouponPolicy> couponPolicies;

    public DiscountCalculator(List<CouponPolicy> couponPolicies) {
        this.couponPolicies = couponPolicies;
    }

    public int calculate(String couponCode, int originalPrice) {
        return couponPolicies.stream()
                .filter(policy -> policy.supports(couponCode))
                .findFirst()
                .map(policy -> policy.discount(originalPrice))
                .orElse(0);
    }
}
```

이제 새 쿠폰이 생기면 `CouponPolicy` 구현체를 추가하면 됩니다. 기존 계산 흐름은 거의 바꾸지 않습니다. 이것이 OCP의 핵심입니다.

그렇다고 모든 `if`를 없애야 하는 것은 아닙니다. 분기가 두세 개이고 자주 바뀌지 않는다면 단순한 `if`가 더 읽기 좋습니다. OCP는 변경이 자주 생기는 지점에서 효과가 큽니다. 아직 변하지 않는 코드에 미리 복잡한 확장 구조를 넣는 것은 설계가 아니라 추측에 가깝습니다.

## LSP: 리스코프 치환 원칙

LSP(Liskov Substitution Principle)는 부모 타입을 사용하는 코드가 자식 타입으로 바뀌어도 깨지지 않아야 한다는 원칙입니다. 상속을 배울 때 “공통 코드를 재사용하려고 부모 클래스를 만든다”고 생각하기 쉽지만, LSP는 행동의 약속이 더 중요하다고 말합니다.

아래 예제를 보겠습니다.

```java
public interface PaymentMethod {

    void pay(int amount);

    void refund(int amount);
}
```

카드 결제는 결제와 환불을 모두 지원합니다.

```java
public class CardPayment implements PaymentMethod {

    @Override
    public void pay(int amount) {
        System.out.println("카드 결제: " + amount);
    }

    @Override
    public void refund(int amount) {
        System.out.println("카드 환불: " + amount);
    }
}
```

그런데 포인트 적립 결제는 환불을 지원하지 않는다고 가정해 보겠습니다.

```java
public class RewardPointPayment implements PaymentMethod {

    @Override
    public void pay(int amount) {
        System.out.println("포인트 사용: " + amount);
    }

    @Override
    public void refund(int amount) {
        throw new UnsupportedOperationException("포인트 환불은 지원하지 않습니다.");
    }
}
```

이 구현은 컴파일은 됩니다. 하지만 `PaymentMethod`를 믿고 `refund`를 호출하는 코드는 런타임에 깨집니다. 부모 타입의 약속을 자식 타입이 지키지 못한 것입니다.

LSP를 지키려면 타입의 약속을 더 정확히 나눠야 합니다.

```java
public interface Payable {

    void pay(int amount);
}
```

```java
public interface Refundable {

    void refund(int amount);
}
```

카드 결제는 두 인터페이스를 모두 구현합니다.

```java
public class CardPayment implements Payable, Refundable {

    @Override
    public void pay(int amount) {
        System.out.println("카드 결제: " + amount);
    }

    @Override
    public void refund(int amount) {
        System.out.println("카드 환불: " + amount);
    }
}
```

포인트 결제는 결제 기능만 구현합니다.

```java
public class RewardPointPayment implements Payable {

    @Override
    public void pay(int amount) {
        System.out.println("포인트 사용: " + amount);
    }
}
```

이제 환불 기능이 필요한 코드는 `Refundable`에만 의존하면 됩니다. 지원하지 않는 기능을 억지로 구현하지 않아도 됩니다.

LSP는 특히 상속 구조에서 중요합니다. 자식 클래스가 부모보다 더 강한 사전 조건을 요구하거나, 부모가 보장하던 결과를 보장하지 못하면 치환이 깨집니다. 초보 단계에서는 “부모 타입으로 호출했을 때 예상 가능한가?”라는 질문만 기억해도 충분합니다.

## ISP: 인터페이스 분리 원칙

ISP(Interface Segregation Principle)는 사용하지 않는 메서드에 의존하지 않게 인터페이스를 작게 나누라는 원칙입니다. 큰 인터페이스는 구현체에게 불필요한 부담을 줍니다.

아래 인터페이스는 주문 알림을 너무 넓게 표현합니다.

```java
public interface OrderNotifier {

    void sendEmail(String email, String message);

    void sendSms(String phoneNumber, String message);

    void sendPush(String deviceToken, String message);
}
```

이메일만 보내는 구현체도 SMS와 Push 메서드를 구현해야 합니다.

```java
public class EmailOrderNotifier implements OrderNotifier {

    @Override
    public void sendEmail(String email, String message) {
        System.out.println("email: " + message);
    }

    @Override
    public void sendSms(String phoneNumber, String message) {
        throw new UnsupportedOperationException();
    }

    @Override
    public void sendPush(String deviceToken, String message) {
        throw new UnsupportedOperationException();
    }
}
```

이런 코드는 LSP도 함께 깨뜨립니다. 타입은 `OrderNotifier`인데 실제로는 일부 기능을 사용할 수 없습니다.

인터페이스를 사용 목적별로 나누면 더 단순합니다.

```java
public interface EmailNotifier {

    void sendEmail(String email, String message);
}
```

```java
public interface SmsNotifier {

    void sendSms(String phoneNumber, String message);
}
```

주문 완료 메일만 필요한 서비스는 `EmailNotifier`만 의존합니다.

```java
public class OrderCompleteMessageService {

    private final EmailNotifier emailNotifier;

    public OrderCompleteMessageService(EmailNotifier emailNotifier) {
        this.emailNotifier = emailNotifier;
    }

    public void send(String email) {
        emailNotifier.sendEmail(email, "주문이 완료되었습니다.");
    }
}
```

이렇게 하면 SMS 관련 변경이 이메일 발송 서비스에 영향을 주지 않습니다. 테스트도 쉬워집니다. 테스트에서는 `EmailNotifier` 하나만 fake로 만들면 됩니다.

다만 인터페이스를 너무 잘게 나누면 이름과 파일만 많아질 수 있습니다. ISP의 기준은 “클라이언트가 실제로 사용하는 기능만 보게 하는가”입니다. 같은 클라이언트가 항상 함께 사용하는 메서드라면 하나의 인터페이스에 있어도 괜찮습니다.

## DIP: 의존성 역전 원칙

DIP(Dependency Inversion Principle)는 고수준 정책이 저수준 세부사항에 직접 의존하지 않도록 하라는 원칙입니다. 말이 어렵지만, 주문 생성 같은 핵심 흐름이 `PaymentClient`, `JpaRepository`, `EmailSender` 같은 구체 기술에 끌려가지 않게 하자는 뜻입니다.

처음 예제의 `OrderService`는 메서드 안에서 직접 구현체를 생성했습니다.

```java
public class OrderService {

    public void createOrder(OrderRequest request) {
        PaymentClient paymentClient = new PaymentClient();
        paymentClient.pay(request.cardNumber(), 10_000);
    }
}
```

이 구조에서는 테스트가 어렵습니다. 테스트 중 실제 결제 API를 부르지 않으려면 생성 코드를 바꾸거나 복잡한 우회가 필요합니다. 결제 구현체가 바뀌어도 주문 서비스가 함께 바뀝니다.

먼저 결제 기능을 추상화합니다.

```java
public interface PaymentPort {

    void pay(PaymentCommand command);
}
```

```java
public record PaymentCommand(
        String paymentKey,
        int amount
) {
}
```

주문 서비스는 구체 결제 클라이언트가 아니라 `PaymentPort`에 의존합니다.

```java
public class OrderService {

    private final PaymentPort paymentPort;
    private final OrderRepository orderRepository;

    public OrderService(PaymentPort paymentPort, OrderRepository orderRepository) {
        this.paymentPort = paymentPort;
        this.orderRepository = orderRepository;
    }

    public void createOrder(OrderRequest request) {
        int price = request.quantity() * 10_000;

        paymentPort.pay(new PaymentCommand(request.paymentKey(), price));
        orderRepository.save(request.productId(), request.quantity(), price);
    }
}
```

실제 외부 결제 API 호출은 어댑터가 담당합니다.

```java
public class ExternalPaymentAdapter implements PaymentPort {

    private final PaymentClient paymentClient;

    public ExternalPaymentAdapter(PaymentClient paymentClient) {
        this.paymentClient = paymentClient;
    }

    @Override
    public void pay(PaymentCommand command) {
        paymentClient.requestPayment(command.paymentKey(), command.amount());
    }
}
```

테스트에서는 fake 구현체를 넣을 수 있습니다.

```java
public class FakePaymentPort implements PaymentPort {

    private boolean paid;

    @Override
    public void pay(PaymentCommand command) {
        this.paid = true;
    }

    public boolean isPaid() {
        return paid;
    }
}
```

DIP를 적용하면 의존성 방향이 바뀝니다. 예전에는 주문 서비스가 외부 결제 클라이언트를 직접 알았습니다. 이제는 주문 서비스가 필요한 기능을 `PaymentPort`로 정의하고, 외부 결제 어댑터가 그 약속을 구현합니다.

Spring을 사용한다면 생성자 주입이 DIP를 실천하는 대표적인 방식입니다. 다만 “생성자 주입을 썼으니 DIP를 지켰다”라고 단정하면 안 됩니다. 낮은 추상화의 구체 클래스, 예를 들어 외부 API SDK 객체를 그대로 주입받는다면 여전히 핵심 정책이 세부 기술을 알고 있을 수 있습니다.

## 다섯 원칙을 함께 적용한 작은 구조

SOLID를 실제 코드에 적용하면 아래처럼 책임이 나뉠 수 있습니다.

```text
order
├── OrderService.java
├── DiscountCalculator.java
├── CouponPolicy.java
├── WelcomeCouponPolicy.java
├── PaymentPort.java
├── ExternalPaymentAdapter.java
├── EmailNotifier.java
└── SmtpEmailNotifier.java
```

이 구조에서 `OrderService`는 주문 흐름을 조정합니다. 할인 계산은 `DiscountCalculator`가 담당하고, 쿠폰별 계산은 `CouponPolicy` 구현체가 담당합니다. 결제와 이메일은 포트 또는 작은 인터페이스 뒤로 숨깁니다.

테스트도 단순해집니다.

```java
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class OrderServiceTest {

    @Test
    void createsOrderWithPayment() {
        FakePaymentPort paymentPort = new FakePaymentPort();
        InMemoryOrderRepository orderRepository = new InMemoryOrderRepository();
        OrderService orderService = new OrderService(paymentPort, orderRepository);

        orderService.createOrder(new OrderRequest(
                1L,
                2,
                "payment-key"
        ));

        assertThat(paymentPort.isPaid()).isTrue();
        assertThat(orderRepository.count()).isEqualTo(1);
    }
}
```

이 테스트는 외부 결제 서버나 실제 데이터베이스를 필요로 하지 않습니다. 주문 생성이라는 고수준 흐름을 빠르게 확인합니다. 실제 결제 API URL, 인증 헤더, 실패 응답 변환은 `ExternalPaymentAdapter` 테스트에서 따로 확인하면 됩니다.

좋은 구조는 한 테스트가 너무 많은 것을 검증하지 않게 도와줍니다. SOLID의 목적도 결국 비슷합니다. 변경이 생겼을 때 봐야 할 코드와 깨질 수 있는 테스트의 범위를 줄이는 것입니다.

## 자주 하는 실수와 주의사항

### 원칙을 적용하려고 코드를 과하게 쪼갠다

SOLID는 파일 수를 늘리는 규칙이 아닙니다. 변경 이유가 분명하지 않은데 인터페이스와 구현체를 나누면 읽을 파일만 늘어납니다. 지금은 하나의 클래스가 더 명확하다면 그대로 두는 것이 좋습니다.

### 모든 분기문을 나쁜 코드로 본다

`if`와 `switch`가 항상 나쁜 것은 아닙니다. 분기가 안정적이고 적다면 가장 단순한 해결책입니다. OCP는 변경이 자주 일어나는 지점에서 효과가 큽니다.

### 인터페이스 이름만 만들고 추상화가 없다

`PaymentServiceInterface`가 `PaymentServiceImpl` 하나만 감싸고, 메서드도 구현체와 똑같다면 실질적인 추상화가 아닐 수 있습니다. 좋은 인터페이스는 구현 기술보다 사용자의 의도를 드러냅니다. `PaymentPort`, `EmailNotifier`, `CouponPolicy`처럼 무엇을 기대하는지 보이는 이름이 낫습니다.

### 상속으로 재사용부터 하려고 한다

상속은 강한 관계입니다. 부모의 행동 약속을 자식이 계속 지켜야 합니다. 단순히 코드 몇 줄을 공유하려고 상속을 쓰면 LSP를 깨기 쉽습니다. 초보 단계에서는 상속보다 조합을 먼저 고려하는 편이 안전합니다.

### Spring DI와 DIP를 같은 것으로 본다

DI(Dependency Injection)는 의존성을 밖에서 넣어주는 기법입니다. DIP는 고수준 정책과 저수준 세부사항의 의존 방향에 대한 설계 원칙입니다. DI는 DIP를 구현하는 데 도움을 주지만, 둘은 같은 말이 아닙니다.

## 실무 적용 체크리스트

아래 질문은 코드 리뷰 때 바로 사용할 수 있습니다.

- 이 클래스가 바뀌는 이유를 한 문장으로 말할 수 있는가?
- 새 정책을 추가할 때 기존 분기문을 계속 수정하고 있지 않은가?
- 부모 타입이나 인터페이스로 호출했을 때 구현체가 예상 밖 예외를 던지지 않는가?
- 구현체가 사용하지 않는 메서드를 억지로 구현하고 있지 않은가?
- 핵심 업무 흐름이 외부 API SDK, DB 구현, 메시지 브로커에 직접 의존하지 않는가?
- 테스트에서 외부 시스템 없이 중요한 업무 흐름을 검증할 수 있는가?
- 인터페이스가 구현 기술 이름보다 업무 행동 이름을 드러내는가?
- 단순한 문제에 너무 많은 추상화를 넣고 있지 않은가?

이 체크리스트를 모두 만족해야 좋은 코드라는 뜻은 아닙니다. 설계 원칙은 점수표가 아니라 대화 도구입니다. 팀원이 같은 질문으로 코드를 바라보면 설계 판단이 조금씩 일관됩니다.

## 언제 SOLID를 덜 적용해도 될까

SOLID는 유지보수와 확장이 중요한 코드에서 힘을 발휘합니다. 반대로 아주 작은 스크립트, 한 번 쓰고 버릴 프로토타입, 단순 CRUD 관리자 화면에는 과한 구조가 될 수 있습니다.

| 상황 | 추천 |
|---|---|
| 핵심 도메인 규칙이 많고 오래 유지됨 | SOLID를 적극 적용 |
| 외부 API, DB, 메시지 등 바뀔 수 있는 기술이 많음 | DIP와 작은 인터페이스 검토 |
| 할인, 배송, 결제처럼 정책이 자주 늘어남 | OCP와 전략 분리 검토 |
| 단순 조회 화면과 CRUD 중심 | 단순한 계층형 구조로 시작 |
| 팀이 원칙을 처음 배움 | 한 유스케이스에만 작게 적용 |

초보자에게 가장 좋은 연습은 기존 코드를 모두 갈아엎는 것이 아닙니다. 테스트하기 어렵거나 변경 요청이 자주 들어오는 클래스 하나를 고르고, 그 안에서 바뀌는 이유가 많은 부분을 하나씩 분리해 보는 것입니다.

## 결론 및 도움말

> SOLID 원칙은 “좋은 개발자라면 반드시 이렇게 해야 한다”는 규칙이 아니라 변경을 다루기 위한 생각의 도구입니다. SRP는 변경 이유를 나누고, OCP는 새 기능 추가 방식을 고민하게 하며, LSP와 ISP는 타입의 약속을 작고 정확하게 만들고, DIP는 중요한 정책을 세부 기술에서 보호합니다.
>
> 처음에는 다섯 원칙을 한 번에 적용하려 하지 마세요. 가장 자주 바뀌는 코드 하나를 골라 책임을 나누고, 테스트에서 외부 시스템을 가짜 구현으로 바꿔 끼울 수 있게 만드는 것부터 시작하면 충분합니다.

## 참고자료/레퍼런스

- [Robert C. Martin - Design Principles and Design Patterns](https://www.fil.univ-lille.fr/~routier/enseignement/licence/coo/cours/Principles_and_Patterns.pdf)
- [Barbara Liskov - Data Abstraction and Hierarchy](https://www.cs.tufts.edu/~nr/cs257/archive/barbara-liskov/data-abstraction-and-hierarchy.pdf)
- [Martin Fowler - Inversion of Control Containers and the Dependency Injection pattern](https://martinfowler.com/articles/injection.html)
- [Martin Fowler - DIP in the Wild](https://martinfowler.com/articles/dipInTheWild.html)

