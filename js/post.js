(function () {
    var article = document.querySelector('.post-content');
    var progress = document.querySelector('.reading-progress span');
    if (!article) return;

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
        headings.forEach(function (heading) {
            var link = document.createElement('a');
            link.href = '#' + heading.id;
            link.textContent = heading.textContent;
            if (heading.tagName === 'H3') link.className = 'toc-subitem';
            target.appendChild(link);
        });
    });

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
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
}());
