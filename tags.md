---
layout: page
title: Tags
section: Explore
permalink: /tags/
---
<p class="page-intro">관심 있는 주제를 골라 관련 글을 모아보세요.</p>

<nav class="tag-directory" aria-label="태그 목록">
{% assign sorted_tags = site.tags | sort %}
{% for tag in sorted_tags %}
    <a href="#tag-{{ tag | first | url_encode }}">
        {{ tag | first }} <span>{{ tag | last | size }}</span>
    </a>
{% endfor %}
</nav>

<div class="tag-archives">
{% for tag in sorted_tags %}
    {% assign tag_name = tag | first %}
    <section class="tag-archive" id="tag-{{ tag_name | url_encode }}">
        <div class="tag-archive-heading">
            <h2>{{ tag_name }}</h2>
            <span>{{ tag | last | size }} posts</span>
        </div>
        <div class="archive-list">
        {% for post in site.tags[tag_name] %}
            <article>
                <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%Y. %m. %d" }}</time>
                <h3><a href="{{ post.url | prepend: site.baseurl }}">{{ post.title }}</a></h3>
            </article>
        {% endfor %}
        </div>
    </section>
{% endfor %}
</div>
