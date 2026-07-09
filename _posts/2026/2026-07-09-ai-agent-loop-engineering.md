---
layout: post
title: "AI Agent Loop 엔지니어링 실전 설계"
date: 2026-07-09 20:48:27 +0900
categories: [AI, Architecture]
tags: [AI, Agent, LLM, Tool Calling, Workflow, Java, Observability]
description: "AI Agent를 단순한 프롬프트가 아니라 관찰, 판단, 실행, 검증 루프로 설계하는 방법과 Java 예제, 운영 체크리스트를 정리합니다."
---

> AI Agent는 모델에게 모든 결정을 맡기는 기능이 아니라, 목표를 작은 관찰과 행동의 반복으로 실행하는 시스템입니다.
> 이 글은 `관찰 → 판단 → 실행 → 검증` 루프를 기준으로 Agent를 설계하고, 도구 호출과 테스트, 운영 안전장치를 함께 다룹니다.
> 글을 읽고 나면 에이전트가 필요한 문제와 고정 워크플로가 더 나은 문제를 구분하고, 실패해도 멈출 수 있는 루프를 설계할 수 있습니다.

이 글은 2026년 7월 9일 기준의 OpenAI 도구 호출 문서, Anthropic의 에이전트 설계 글, ReAct와 Reflexion 논문을 참고했습니다. 특정 프레임워크의 사용법보다 Agent Loop를 안전하게 제품 코드에 넣는 엔지니어링 기준에 초점을 맞춥니다.

## 왜 Agent Loop부터 봐야 할까?

AI Agent를 처음 만들 때 가장 흔한 출발점은 “모델이 알아서 도구를 고르게 하자”입니다. 하지만 실무에서 중요한 질문은 도구를 몇 개 붙였는지가 아닙니다. 모델이 어떤 정보를 보고, 어떤 조건에서 행동하고, 실패하면 어디서 멈추는지입니다.

Agent는 한 번의 LLM(Large Language Model) 호출로 끝나는 기능이 아닙니다. 목표를 받고, 현재 상태를 관찰하고, 다음 행동을 고르고, 도구를 실행하고, 결과를 다시 관찰하는 반복 구조입니다. 그래서 Agent를 설계한다는 말은 사실상 **반복 루프를 설계한다**는 뜻에 가깝습니다.

루프를 명시하지 않으면 문제가 생겼을 때 원인을 찾기 어렵습니다. 모델이 잘못 판단했는지, 도구 입력이 틀렸는지, 도구 결과를 검증하지 않았는지, 반복 횟수가 과했는지 분리할 수 없습니다. 반대로 루프가 분명하면 Agent도 일반 백엔드 기능처럼 테스트하고 운영할 수 있습니다.

## Agent와 Workflow의 차이

Workflow는 실행 경로를 코드가 정합니다. 예를 들어 “파일 업로드 → 바이러스 검사 → 썸네일 생성 → 저장”처럼 단계가 고정된 작업은 Workflow에 가깝습니다. 분기가 있더라도 조건은 대부분 사람이 코드로 명시합니다.

Agent는 다음 행동 선택의 일부를 모델에게 맡깁니다. 사용자의 조사 요청을 처리하면서 검색할지, 문서를 읽을지, 계산기를 쓸지, 추가 질문을 할지 동적으로 고릅니다. Anthropic은 이런 구분을 설명하면서, 가능한 경우에는 단순한 패턴에서 시작하고 복잡성은 필요할 때만 늘리라고 권장합니다.

두 방식 중 어느 쪽이 더 고급이라는 뜻은 아닙니다. 결정적인 업무에는 Workflow가 더 좋고, 탐색적인 업무에는 Agent가 더 자연스럽습니다. 핵심은 “경로를 미리 안정적으로 열거할 수 있는가?”입니다.

| 구분 | Workflow | Agent |
|---|---|---|
| 경로 선택 | 코드와 규칙이 정함 | 모델이 상태를 보고 일부 선택 |
| 적합한 작업 | 승인, 정산, 배치, 고정 절차 | 리서치, 진단, 탐색, 복합 질의 |
| 테스트 방식 | 경로별 단위/통합 테스트 | 루프 상태, 도구 계약, 평가 데이터 |
| 주요 위험 | 분기 증가와 유지보수 비용 | 예측 불가능성, 비용, 권한 오남용 |

이 표를 기준으로 보면 결제 취소, 권한 변경, 데이터 삭제처럼 실패 비용이 큰 작업은 Agent가 직접 실행하기보다 제안까지만 맡기는 편이 안전합니다. 반면 장애 로그를 요약하고 가능한 원인을 좁히는 작업은 Agent가 여러 도구를 오가며 탐색할 가치가 있습니다.

## Agent Loop의 기본 구조

Agent Loop는 여러 방식으로 표현할 수 있지만, 실무에서는 다음 네 단계로 시작하면 충분합니다.

1. 관찰: 사용자 요청, 현재 상태, 도구 결과, 이전 시도를 읽습니다.
2. 판단: 다음 행동, 도구 입력, 중단 여부를 결정합니다.
3. 실행: 선택된 도구를 애플리케이션 코드가 실행합니다.
4. 검증: 결과가 목표와 정책을 만족하는지 확인하고 다음 반복으로 넘깁니다.

여기서 중요한 점은 실행 주체입니다. 모델은 도구 호출 의도를 만들 수 있지만, 실제 API 호출, DB 변경, 파일 수정은 애플리케이션 코드가 수행해야 합니다. OpenAI의 도구 호출 흐름도 모델이 도구 호출을 반환하면 애플리케이션이 코드를 실행하고, 그 결과를 다시 모델에 제공하는 다단계 대화로 설명합니다.

루프를 더 구체적으로 적으면 아래와 같습니다.

```text
Goal
  -> Observe context
  -> Decide next action
  -> Execute tool in application code
  -> Validate result
  -> Stop or continue
```

이 구조는 단순하지만 많은 설계 결정을 포함합니다. 관찰 단계에는 어떤 컨텍스트를 넣을지, 판단 단계에는 어떤 도구를 허용할지, 실행 단계에는 어떤 권한을 줄지, 검증 단계에는 어떤 실패를 재시도할지 정해야 합니다.

## ReAct와 Reflexion에서 얻는 힌트

ReAct는 reasoning과 acting을 번갈아 수행하는 패턴을 제시한 연구입니다. 논문의 핵심은 모델이 생각만 하거나 행동만 하는 것이 아니라, 외부 환경과 상호작용하면서 계획을 갱신할 수 있다는 점입니다. 실무 구현에서는 내부 추론을 그대로 노출하기보다 “상태를 보고 다음 도구를 고른다”는 제어 구조로 받아들이면 됩니다.

Reflexion은 실패 결과를 언어적 피드백으로 저장하고 다음 시도에 활용하는 방식을 제안했습니다. 이 아이디어도 운영 시스템에 그대로 복사할 필요는 없습니다. 다만 Agent가 실패했을 때 “그냥 다시 시도”가 아니라, 실패 원인과 다음 제약을 명시적으로 남기는 설계가 필요하다는 교훈을 줍니다.

두 연구를 제품 코드에 적용할 때는 조심해야 합니다. 논문 환경의 성공률이나 벤치마크 결과가 내 서비스의 성공을 보장하지 않습니다. 실무에서는 모델 성능보다 도구 계약, 권한 범위, 평가 데이터, 장애 대응 절차가 더 자주 문제를 만듭니다.

## 실전 예제: 최소 Agent Loop 모델

아래 Java 예제는 프레임워크 없이 Agent Loop의 뼈대를 보여 줍니다. 실제 프로젝트에서는 LLM 클라이언트, 도구 레지스트리, 인증, 로깅이 더 들어가지만, 먼저 상태와 중단 조건을 분리하는 것이 중요합니다.

```java
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public final class AgentLoop {
    private final Planner planner;
    private final ToolExecutor toolExecutor;
    private final ResultVerifier verifier;
    private final int maxSteps;

    public AgentLoop(
            Planner planner,
            ToolExecutor toolExecutor,
            ResultVerifier verifier,
            int maxSteps
    ) {
        this.planner = planner;
        this.toolExecutor = toolExecutor;
        this.verifier = verifier;
        this.maxSteps = maxSteps;
    }

    public AgentResult run(String goal) {
        AgentState state = new AgentState(goal, new ArrayList<>());

        for (int step = 1; step <= maxSteps; step++) {
            AgentDecision decision = planner.decide(state);

            if (decision.type() == DecisionType.FINAL_ANSWER) {
                return verifier.verifyFinalAnswer(state, decision);
            }

            ToolResult toolResult = toolExecutor.execute(decision.toolCall());
            state = state.append(step, decision, toolResult);

            Optional<AgentResult> failed = verifier.verifyStep(state);
            if (failed.isPresent()) {
                return failed.get();
            }
        }

        return AgentResult.failed("max step limit exceeded", state.history());
    }

    public record AgentState(String goal, List<AgentStep> history) {
        public AgentState append(
                int step,
                AgentDecision decision,
                ToolResult toolResult
        ) {
            List<AgentStep> next = new ArrayList<>(history);
            next.add(new AgentStep(step, decision, toolResult));
            return new AgentState(goal, List.copyOf(next));
        }
    }

    public record AgentStep(
            int step,
            AgentDecision decision,
            ToolResult toolResult
    ) {
    }
}
```

이 코드는 “모델 호출”보다 루프의 소유권을 보여 줍니다. `Planner`는 다음 행동을 제안하지만, 반복 횟수 제한과 도구 실행, 검증은 애플리케이션 코드가 담당합니다. 실무에서는 `maxSteps`뿐 아니라 최대 비용, 최대 실행 시간, 사용자별 권한, 도구별 rate limit도 함께 둬야 합니다.

## 도구 호출은 계약으로 설계한다

Agent의 도구는 모델이 부르는 함수 이름 목록이 아닙니다. 외부 세계와 연결되는 계약입니다. 따라서 도구마다 입력 스키마, 권한, 부작용, 실패 방식, 관측 로그를 명시해야 합니다.

예를 들어 고객 지원 Agent가 주문 조회와 환불 요청 도구를 가진다고 가정해 보겠습니다. 주문 조회는 읽기 도구이고, 환불 요청은 쓰기 도구입니다. 두 도구를 같은 수준으로 노출하면 위험합니다. 읽기 도구는 비교적 자유롭게 호출할 수 있지만, 쓰기 도구는 정책 검증과 승인 단계를 거쳐야 합니다.

아래 예제는 도구의 위험도를 코드에서 구분하는 단순한 모델입니다.

```java
public enum ToolRiskLevel {
    READ_ONLY,
    INTERNAL_WRITE,
    CUSTOMER_VISIBLE_WRITE
}

public record ToolDefinition(
        String name,
        String description,
        ToolRiskLevel riskLevel,
        boolean requiresApproval
) {
    public boolean canRunAutomatically() {
        return riskLevel == ToolRiskLevel.READ_ONLY && !requiresApproval;
    }
}
```

실무에서는 이 정보가 프롬프트 설명으로만 존재하면 부족합니다. 도구 실행 계층에서도 같은 정책을 검사해야 합니다. 모델이 “안전하다”고 판단하더라도 애플리케이션이 권한과 승인 여부를 다시 확인해야 합니다.

## 검증 게이트를 루프 안에 넣기

Agent Loop의 검증은 마지막 답변을 읽는 단계가 아닙니다. 각 도구 호출 뒤에 실행되어야 합니다. 도구가 실패했는지, 결과가 비어 있는지, 같은 행동을 반복하고 있는지, 금지된 리소스에 접근하려는지 확인해야 합니다.

아래 예제는 반복 행동과 위험 도구를 막는 검증기를 단순화한 코드입니다.

```java
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

public final class ResultVerifier {
    public Optional<AgentResult> verifyStep(AgentLoop.AgentState state) {
        AgentLoop.AgentStep latest = state.history()
                .get(state.history().size() - 1);

        if (!latest.toolResult().success()) {
            return Optional.of(AgentResult.failed(
                    "tool failed: " + latest.toolResult().message(),
                    state.history()
            ));
        }

        if (hasRepeatedSameToolCall(state)) {
            return Optional.of(AgentResult.failed(
                    "repeated same tool call",
                    state.history()
            ));
        }

        if (latest.decision().requiresHumanApproval()) {
            return Optional.of(AgentResult.waitingForApproval(
                    latest.decision(),
                    state.history()
            ));
        }

        return Optional.empty();
    }

    private boolean hasRepeatedSameToolCall(AgentLoop.AgentState state) {
        Set<String> calls = new HashSet<>();

        for (AgentLoop.AgentStep step : state.history()) {
            String key = step.decision().toolCall().idempotencyKey();
            if (!calls.add(key)) {
                return true;
            }
        }

        return false;
    }

    public AgentResult verifyFinalAnswer(
            AgentLoop.AgentState state,
            AgentDecision decision
    ) {
        if (decision.finalAnswer().isBlank()) {
            return AgentResult.failed("empty final answer", state.history());
        }

        return AgentResult.succeeded(decision.finalAnswer(), state.history());
    }
}
```

이 검증기는 예시이므로 실제 서비스에는 그대로 충분하지 않습니다. 운영 환경에서는 권한 검사, 데이터 마스킹, 비용 예산, timeout, 재시도 횟수, 사용자 확인 절차가 더 필요합니다. 그래도 핵심은 같습니다. Agent를 믿는 것이 아니라, Agent가 통과해야 하는 게이트를 코드로 둡니다.

## 테스트는 정답보다 실패 경로를 잡는다

Agent 테스트는 “모델이 항상 같은 문장을 출력하는가?”를 확인하기 어렵습니다. 모델 출력은 변할 수 있고, 버전이나 샘플링 설정에 따라 달라질 수 있습니다. 그래서 테스트는 문장 자체보다 루프의 불변 조건을 확인해야 합니다.

테스트하기 좋은 조건은 다음과 같습니다.

- 최대 반복 횟수를 넘으면 실패로 종료한다.
- 같은 도구 호출을 반복하면 중단한다.
- 쓰기 도구는 승인 없이 실행하지 않는다.
- 도구 실패가 최종 성공으로 포장되지 않는다.
- 최종 답변에는 검증된 도구 결과만 사용한다.

아래는 JUnit 스타일로 표현한 테스트 예시입니다. 실제 프로젝트에서는 mock 라이브러리나 fake 구현을 사용해 LLM 호출 없이 루프를 검증하는 편이 좋습니다.

```java
import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class AgentLoopTest {
    @Test
    void stopsWhenPlannerRepeatsSameToolCall() {
        Planner planner = new RepeatingPlanner("search:order-123");
        ToolExecutor executor = call -> ToolResult.succeeded("same result");
        ResultVerifier verifier = new ResultVerifier();

        AgentLoop loop = new AgentLoop(planner, executor, verifier, 5);

        AgentResult result = loop.run("Find order delivery status");

        assertEquals(AgentStatus.FAILED, result.status());
        assertEquals("repeated same tool call", result.message());
    }
}
```

이 테스트는 모델 품질을 평가하지 않습니다. 대신 루프가 같은 행동을 반복할 때 멈추는지 확인합니다. Agent 운영에서 이런 실패는 흔합니다. 검색 결과가 부족하거나 도구 설명이 모호하면 모델이 비슷한 호출을 반복할 수 있기 때문입니다.

## 운영에서 필요한 관측 가능성

Agent는 일반 API보다 실행 경로가 다양합니다. 그래서 로그와 메트릭이 없으면 운영에서 거의 디버깅할 수 없습니다. 최소한 루프 단위, 단계 단위, 도구 단위의 관측 정보가 필요합니다.

처음에는 다음 필드를 남기는 것부터 시작할 수 있습니다.

| 대상 | 남길 정보 | 이유 |
|---|---|---|
| 루프 | goal type, user id hash, session id, status | 어떤 작업이 성공/실패했는지 추적 |
| 단계 | step number, decision type, stop reason | 반복 흐름과 중단 원인 확인 |
| 도구 | tool name, latency, result status, retry count | 느리거나 실패하는 도구 찾기 |
| 비용 | model calls, token usage, tool cost | 예산 초과와 비정상 루프 탐지 |
| 안전 | approval required, policy violation | 권한과 정책 위반 감사 |

로그에는 민감 정보를 그대로 남기지 않아야 합니다. 사용자 요청, 도구 입력, 외부 API 응답에는 개인정보나 내부 비밀값이 섞일 수 있습니다. 원문 전체를 저장하기보다 식별자를 해시 처리하고, 필요한 필드만 구조화해서 남기는 편이 안전합니다.

메트릭은 평균보다 분포를 봐야 합니다. Agent는 대부분 빠르게 끝나더라도 일부 요청이 긴 루프에 빠질 수 있습니다. `step_count`, `tool_latency`, `approval_wait_count`, `failed_stop_reason` 같은 지표를 보면 어떤 작업에서 위험이 커지는지 찾기 쉽습니다.

## 실패 처리와 중단 조건

Agent Loop는 실패를 정상적인 상태로 다뤄야 합니다. 도구가 실패할 수 있고, 모델이 잘못된 입력을 만들 수 있고, 사용자의 목표가 모호할 수 있습니다. 문제는 실패 자체가 아니라 실패를 성공처럼 포장하거나 무한히 재시도하는 것입니다.

다음 중단 조건은 초기에 꼭 넣는 것이 좋습니다.

- 최대 반복 횟수 초과
- 최대 실행 시간 초과
- 최대 비용 또는 토큰 예산 초과
- 같은 도구 호출 반복
- 도구 입력 스키마 검증 실패
- 권한 없는 리소스 접근 시도
- 승인 필요한 작업 발견
- 목표를 달성할 근거 부족

중단 메시지도 설계 대상입니다. “실패했습니다”만 반환하면 사용자도 운영자도 다음 행동을 알 수 없습니다. “배송 상태를 확인하려 했지만 주문 조회 도구가 3회 연속 timeout으로 실패했습니다. 잠시 후 다시 시도하거나 주문 번호를 확인해 주세요”처럼 원인과 가능한 다음 행동을 분리해야 합니다.

## Human-in-the-loop는 예외가 아니라 설계 요소

Agent를 제품에 넣을 때 사람 승인은 나중에 붙이는 옵션이 아닙니다. 특히 고객에게 보이는 변경, 금전 처리, 권한 변경, 데이터 삭제는 처음부터 승인 단계를 설계해야 합니다.

좋은 human-in-the-loop 설계는 사람에게 모든 것을 떠넘기지 않습니다. Agent는 관찰한 사실, 추천 행동, 위험, 되돌리는 방법을 정리하고, 사람은 승인 또는 거절을 결정합니다. 승인 화면에는 모델의 긴 추론보다 검증 가능한 근거가 보여야 합니다.

예를 들어 환불 Agent라면 다음 정보가 필요합니다.

- 주문 번호와 사용자 식별자
- 환불 가능 정책에 맞는 근거
- 환불 금액과 결제 수단
- 이미 처리된 환불 이력
- 실행될 도구와 부작용
- 승인 후 롤백 가능 여부

이런 정보가 없으면 사람 승인은 형식적인 버튼이 됩니다. 반대로 근거가 잘 정리되면 Agent는 실행자가 아니라 의사결정 보조자로 안전하게 쓰일 수 있습니다.

## 자주 하는 실수와 주의사항

### 처음부터 자율성을 크게 준다

Agent의 자율성은 기능이 안정된 뒤 늘려야 합니다. 처음에는 읽기 도구와 제안 작업부터 시작하고, 쓰기 작업은 승인 뒤에 실행하는 편이 안전합니다. 자율성을 크게 주면 멋있어 보이지만 테스트 공간과 장애 범위가 빠르게 커집니다.

### 프롬프트만으로 정책을 지킨다고 믿는다

프롬프트에 “위험한 작업은 하지 마”라고 쓰는 것은 필요하지만 충분하지 않습니다. 정책은 도구 실행 계층과 권한 시스템에서도 검사해야 합니다. 모델 출력은 입력이고, 최종 권한 판단은 애플리케이션 코드가 해야 합니다.

### 도구 설명을 느슨하게 작성한다

도구 설명이 모호하면 모델은 비슷한 도구를 잘못 고르거나 잘못된 입력을 만들 수 있습니다. 도구 이름, 사용 조건, 입력 필드, 실패 의미를 구체적으로 적어야 합니다. 특히 쓰기 도구는 “언제 사용하면 안 되는지”가 설명에 들어가야 합니다.

### 루프 실패를 관측하지 않는다

Agent가 실패할 때 최종 답변만 저장하면 원인을 알 수 없습니다. 어느 단계에서 어떤 도구를 호출했고, 어떤 결과가 나왔고, 왜 중단했는지 남겨야 합니다. 다만 민감 정보는 마스킹하고 필요한 메타데이터만 남겨야 합니다.

### 멀티 Agent로 복잡성을 숨긴다

여러 Agent로 나누면 구조가 좋아 보일 수 있습니다. 하지만 실제로는 상태 동기화, 비용, 책임 경계, 실패 지점이 늘어납니다. 역할과 권한이 명확히 분리되지 않는다면 하나의 Agent와 명시적인 도구 목록으로 시작하는 편이 낫습니다.

## 언제 Agent를 쓰지 말아야 할까?

Agent는 강력하지만 기본값이 되어서는 안 됩니다. 고정된 순서로 처리할 수 있고 실패 비용이 큰 업무라면 Workflow가 더 적합합니다. 예를 들어 급여 계산, 포인트 차감, 권한 승격, 데이터 삭제 같은 작업은 예측 가능성과 감사 가능성이 더 중요합니다.

다음 조건에 해당하면 Agent보다 Workflow를 먼저 검토하세요.

- 실행 경로를 사전에 열거할 수 있다.
- 같은 입력은 항상 같은 결과를 내야 한다.
- 실패 시 금전, 법적 책임, 개인정보 노출 위험이 크다.
- 테스트와 감사 로그가 엄격하게 필요하다.
- 모델이 추가 탐색을 해도 얻는 이점이 작다.

Agent가 필요 없는 문제에 Agent를 넣으면 시스템은 더 똑똑해지는 것이 아니라 더 불안정해질 수 있습니다. 좋은 설계는 모델을 많이 쓰는 설계가 아니라, 불확실성이 필요한 곳에만 모델을 배치하는 설계입니다.

## 적용 순서 체크리스트

실무 프로젝트에 Agent Loop를 넣을 때는 다음 순서로 작게 시작하는 편이 좋습니다.

1. 사용자 목표와 성공 조건을 문장으로 정의합니다.
2. Workflow로 충분한지 먼저 판단합니다.
3. 읽기 전용 도구부터 도구 계약을 만듭니다.
4. 루프 상태, 최대 반복 횟수, 중단 이유를 코드로 분리합니다.
5. 도구 실행 계층에 권한과 스키마 검증을 넣습니다.
6. fake planner와 fake tool로 루프 테스트를 작성합니다.
7. 운영 로그와 메트릭을 먼저 붙입니다.
8. 작은 사용자 그룹에서 실패 사례를 수집합니다.
9. 쓰기 도구는 승인 단계 뒤에 제한적으로 엽니다.
10. 반복 실패와 정책 위반을 평가 데이터로 축적합니다.

이 순서는 느려 보일 수 있지만 실제로는 문제를 빨리 발견하게 해 줍니다. Agent 개발에서 가장 비싼 실패는 모델이 틀린 답을 한 번 내는 것이 아니라, 왜 틀렸는지 재현할 수 없는 상태로 운영에 들어가는 것입니다.

## 결론 및 도움말

> AI Agent Loop 엔지니어링의 핵심은 모델에게 더 많은 자유를 주는 것이 아니라, 모델이 자유롭게 선택해도 시스템이 관찰하고 검증하고 멈출 수 있게 만드는 일입니다. `관찰 → 판단 → 실행 → 검증`을 코드 구조와 로그, 테스트에 남기면 Agent도 운영 가능한 백엔드 컴포넌트가 됩니다.
>
> 처음부터 큰 자율성을 목표로 삼지 마세요. 읽기 도구, 작은 반복 횟수, 명확한 중단 조건, human-in-the-loop 승인부터 시작하면 실패를 학습 데이터로 바꿀 수 있습니다. Agent가 필요한 곳과 Workflow가 충분한 곳을 구분하는 판단이 가장 중요한 설계 능력입니다.

## 참고자료/레퍼런스

- [OpenAI Platform Docs: Function calling](https://developers.openai.com/api/docs/guides/function-calling)
- [OpenAI Platform Docs: Tools](https://developers.openai.com/api/docs/guides/tools)
- [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)
- [Reflexion: Language Agents with Verbal Reinforcement Learning](https://arxiv.org/abs/2303.11366)
