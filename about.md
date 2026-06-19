---
layout: page
title: About
section: Backend Developer
description: Kotlin과 Java 기반 백엔드 시스템과 AI Agent의 실무 활용을 고민하고 기록합니다.
permalink: /about/
---
<div class="about-profile">
    <div class="about-intro">
        <p class="about-role">Backend Engineer · Arthur</p>
        <h2>복잡한 요구사항을<br>명확한 시스템으로 만듭니다.</h2>
        <p class="about-lead">
            Kotlin과 Java를 중심으로 견고한 API와 확장 가능한 백엔드 구조를 설계합니다.
            동작하는 코드를 넘어, 변경하기 쉽고 운영 중에 이해할 수 있는 시스템을 만드는 데 관심이 있습니다.
            최근에는 AI Agent를 실무 개발 흐름에 연결해 반복 작업을 줄이고 더 나은 의사결정을 돕는 방법을 실험하고 있습니다.
        </p>
        <div class="about-actions">
            <a class="about-primary-link" href="https://github.com/choi-hye-min" target="_blank" rel="noopener noreferrer">GitHub 보기 <span aria-hidden="true">↗</span></a>
            <a href="mailto:{{ site.email }}">이메일 보내기 <span aria-hidden="true">→</span></a>
        </div>
    </div>

    <dl class="about-summary">
        <div>
            <dt>Focus</dt>
            <dd>Backend Architecture<br>API &amp; Distributed Systems</dd>
        </div>
        <div>
            <dt>Primary</dt>
            <dd>Kotlin · Java<br>Spring Ecosystem</dd>
        </div>
        <div>
            <dt>Interested in</dt>
            <dd>AI Agents · MSA<br>Reactive Systems</dd>
        </div>
    </dl>
</div>

<section class="about-section" aria-labelledby="expertise-title">
    <div class="about-section-heading">
        <p class="section-label">Expertise</p>
        <h2 id="expertise-title">집중하는 문제</h2>
    </div>
    <div class="about-card-grid">
        <article class="about-card">
            <span>01</span>
            <h3>Architecture &amp; API</h3>
            <p>헥사고날·클린 아키텍처의 경계를 실무 코드에 적용하고, REST와 gRPC API가 안전하게 진화할 수 있는 구조를 고민합니다.</p>
        </article>
        <article class="about-card">
            <span>02</span>
            <h3>Reactive &amp; Messaging</h3>
            <p>Spring WebFlux와 Kafka를 활용해 비동기 흐름을 설계하고, 예외 처리와 재시도처럼 분산 환경에서 중요한 실패 경로를 다룹니다.</p>
        </article>
        <article class="about-card">
            <span>03</span>
            <h3>Reliability &amp; Testing</h3>
            <p>테스트 가능한 설계, 일관된 로깅, 장애 격리와 복구 전략을 통해 배포 이후에도 이해하고 신뢰할 수 있는 시스템을 지향합니다.</p>
        </article>
        <article class="about-card">
            <span>04</span>
            <h3>AI Agents &amp; Automation</h3>
            <p>AI Agent를 개발·운영 워크플로에 연결하고, 도구 호출과 반복 작업 자동화가 실무 생산성과 결과의 품질을 어떻게 높일 수 있는지 검증합니다.</p>
        </article>
    </div>
</section>

<section class="about-section about-principles" aria-labelledby="principles-title">
    <div class="about-section-heading">
        <p class="section-label">Principles</p>
        <h2 id="principles-title">일하는 방식</h2>
    </div>
    <ol>
        <li>
            <strong>문제와 경계를 먼저 정의합니다.</strong>
            <p>기술을 선택하기 전에 해결할 문제, 책임의 경계, 실패 조건을 명확히 합니다.</p>
        </li>
        <li>
            <strong>단순하게 시작하고 근거를 갖고 확장합니다.</strong>
            <p>불필요한 추상화를 줄이고, 측정 가능한 요구와 변화에 맞춰 구조를 발전시킵니다.</p>
        </li>
        <li>
            <strong>배운 내용을 다시 사용할 수 있게 기록합니다.</strong>
            <p>문제의 맥락과 선택의 이유를 문서화해 개인의 경험을 팀과 다음 작업의 자산으로 만듭니다.</p>
        </li>
    </ol>
</section>

<section class="about-section" aria-labelledby="stack-title">
    <div class="about-section-heading">
        <p class="section-label">Technology</p>
        <h2 id="stack-title">기술 스택</h2>
    </div>
    <div class="about-stack">
        <div>
            <h3>Core</h3>
            <p>Kotlin · Java · Spring Boot · Spring WebFlux</p>
        </div>
        <div>
            <h3>Data &amp; Messaging</h3>
            <p>MongoDB · R2DBC · Kafka · MySQL</p>
        </div>
        <div>
            <h3>API &amp; Architecture</h3>
            <p>REST · gRPC · Armeria · Hexagonal Architecture</p>
        </div>
        <div>
            <h3>Platform &amp; Tools</h3>
            <p>AWS · Linux · Git · Gradle</p>
        </div>
        <div>
            <h3>AI &amp; Automation</h3>
            <p>AI Agents · LLM Applications · Tool Integration · Workflow Automation</p>
        </div>
        <div>
            <h3>Additional Languages</h3>
            <p>Python · Go · PHP</p>
        </div>
    </div>
</section>

<section class="about-section" aria-labelledby="writing-title">
    <div class="about-section-heading about-writing-heading">
        <div>
            <p class="section-label">Recent Writing</p>
            <h2 id="writing-title">최근 기록</h2>
        </div>
        <a href="{{ site.baseurl }}/">모든 글 보기 <span aria-hidden="true">→</span></a>
    </div>
    <div class="about-writing-list">
        {% for post in site.posts limit:3 %}
        <article>
            <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%Y. %m. %d" }}</time>
            <h3><a href="{{ post.url | prepend: site.baseurl }}">{{ post.title }}</a></h3>
        </article>
        {% endfor %}
    </div>
</section>

<section class="about-contact" aria-labelledby="contact-title">
    <p class="section-label">Contact</p>
    <h2 id="contact-title">좋은 시스템과 배움을 함께 나누고 싶습니다.</h2>
    <p>백엔드 개발, 아키텍처, 기술적인 아이디어에 관한 이야기를 환영합니다.</p>
    <a href="mailto:{{ site.email }}">{{ site.email }} <span aria-hidden="true">→</span></a>
</section>
