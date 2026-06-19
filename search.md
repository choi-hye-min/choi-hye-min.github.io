---
layout: page
title: Search
section: Explore
permalink: /search/
---
<p class="page-intro">제목, 요약 또는 태그로 글을 찾아보세요.</p>
<div class="search-box">
    <label class="sr-only" for="post-search">글 검색</label>
    <input id="post-search" type="search" placeholder="예: Spring, Kotlin, 아키텍처" autocomplete="off">
    <span class="search-count" aria-live="polite"></span>
</div>
<div id="search-results" class="search-results"></div>
<p id="search-empty" class="search-empty" hidden>검색 결과가 없습니다. 다른 키워드를 입력해보세요.</p>

<script id="search-data" type="application/json">
[
{% for post in site.posts %}
    {
        "title": {{ post.title | jsonify }},
        "url": {{ post.url | prepend: site.baseurl | jsonify }},
        "date": {{ post.date | date: "%Y. %m. %d" | jsonify }},
        "tags": {{ post.tags | jsonify }},
        "excerpt": {{ post.excerpt | strip_html | strip_newlines | truncate: 180 | jsonify }}
    }{% unless forloop.last %},{% endunless %}
{% endfor %}
]
</script>
<script src="{{ site.baseurl }}/js/search.js"></script>
