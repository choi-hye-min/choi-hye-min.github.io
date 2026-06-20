(function () {
    var article = document.querySelector('.post-content');
    var progress = document.querySelector('.reading-progress span');
    if (!article) return;

    var viewCounter = document.querySelector('[data-goatcounter-endpoint][data-goatcounter-path]');
    if (viewCounter) {
        var endpoint = viewCounter.getAttribute('data-goatcounter-endpoint');
        var path = viewCounter.getAttribute('data-goatcounter-path');
        var counterUrl = new URL('/counter/' + encodeURIComponent(path) + '.json', endpoint);

        fetch(counterUrl)
            .then(function (response) {
                if (response.status === 404) return { count: '0' };
                if (!response.ok) throw new Error('GoatCounter request failed');
                return response.json();
            })
            .then(function (data) {
                viewCounter.querySelector('[data-goatcounter-count]').textContent = data.count;
                viewCounter.hidden = false;
            })
            .catch(function () {
                viewCounter.hidden = true;
            });
    }

    var headings = Array.prototype.slice.call(article.querySelectorAll('h2, h3'));
    var tocTargets = document.querySelectorAll('.toc-list');

    article.querySelectorAll('pre > code.language-mermaid').forEach(function (code) {
        var pre = code.parentElement;
        var replacement = pre;
        var parent = pre.parentElement;

        if (parent.classList.contains('highlight') && parent.parentElement.classList.contains('highlighter-rouge')) {
            replacement = parent.parentElement;
        } else if (parent.classList.contains('highlighter-rouge')) {
            replacement = parent;
        }

        var diagram = document.createElement('div');
        diagram.className = 'mermaid mermaid-diagram';
        diagram.setAttribute('role', 'img');
        diagram.setAttribute('aria-label', '포스트 다이어그램');
        diagram.textContent = code.textContent;
        replacement.parentNode.replaceChild(diagram, replacement);
    });

    article.querySelectorAll('pre > code').forEach(function (code) {
        var pre = code.parentElement;
        if (pre.parentElement.classList.contains('code-block-wrap')) return;

        var source = code.textContent;
        if (source.endsWith('\n')) source = source.slice(0, -1);
        var lineCount = Math.max(1, source.split('\n').length);
        var numbers = Array.from({ length: lineCount }, function (_, index) {
            return index + 1;
        }).join('\n');

        var wrapper = document.createElement('div');
        var gutter = document.createElement('span');
        wrapper.className = 'code-block-wrap';
        gutter.className = 'code-line-numbers';
        gutter.setAttribute('aria-hidden', 'true');
        gutter.textContent = numbers;

        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(gutter);
        wrapper.appendChild(pre);
    });

    headings.forEach(function (heading, index) {
        if (!heading.id) heading.id = 'section-' + (index + 1);
    });

    tocTargets.forEach(function (target) {
        headings.forEach(function (heading, index) {
            var link = document.createElement('a');
            link.href = '#' + heading.id;
            link.textContent = heading.textContent;
            link.setAttribute('data-toc-index', index);
            if (heading.tagName === 'H3') link.className = 'toc-subitem';
            target.appendChild(link);
        });
    });

    var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc-list a'));

    function updateActiveToc() {
        if (!headings.length) return;

        var readingLine = Math.min(160, window.innerHeight * 0.3);
        var activeIndex = 0;

        headings.forEach(function (heading, index) {
            if (heading.getBoundingClientRect().top <= readingLine) activeIndex = index;
        });

        tocLinks.forEach(function (link) {
            var isActive = Number(link.getAttribute('data-toc-index')) === activeIndex;
            link.classList.toggle('is-active', isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'location');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    }

    if (!headings.length) {
        document.querySelectorAll('.desktop-toc, .mobile-toc').forEach(function (toc) {
            toc.hidden = true;
        });
    }

    function updateProgress() {
        if (!progress) return;
        var start = article.offsetTop;
        var distance = article.offsetHeight - window.innerHeight;
        var value = distance > 0 ? (window.scrollY - start) / distance : 1;
        progress.style.transform = 'scaleX(' + Math.max(0, Math.min(1, value)) + ')';
    }

    updateProgress();
    updateActiveToc();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('scroll', updateActiveToc, { passive: true });
    window.addEventListener('resize', updateProgress);
    window.addEventListener('resize', updateActiveToc);
}());
