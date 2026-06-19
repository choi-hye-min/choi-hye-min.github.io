(function () {
    var input = document.getElementById('post-search');
    var resultContainer = document.getElementById('search-results');
    var emptyMessage = document.getElementById('search-empty');
    var count = document.querySelector('.search-count');
    var dataElement = document.getElementById('search-data');
    if (!input || !resultContainer || !dataElement) return;

    var posts = JSON.parse(dataElement.textContent);

    function normalize(value) {
        return String(value || '').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
    }

    function createResult(post) {
        var article = document.createElement('article');
        var meta = document.createElement('div');
        var date = document.createElement('time');
        var heading = document.createElement('h2');
        var link = document.createElement('a');
        var excerpt = document.createElement('p');

        article.className = 'search-result';
        meta.className = 'search-result-meta';
        date.textContent = post.date;
        link.href = post.url;
        link.textContent = post.title;
        excerpt.textContent = post.excerpt;

        (post.tags || []).slice(0, 3).forEach(function (tag) {
            var chip = document.createElement('span');
            chip.className = 'tag-chip';
            chip.textContent = tag;
            meta.appendChild(chip);
        });
        meta.insertBefore(date, meta.firstChild);
        heading.appendChild(link);
        article.appendChild(meta);
        article.appendChild(heading);
        article.appendChild(excerpt);
        return article;
    }

    function render() {
        var query = normalize(input.value);
        var filtered = posts.filter(function (post) {
            var searchable = [post.title, post.excerpt].concat(post.tags || []).join(' ');
            return normalize(searchable).indexOf(query) !== -1;
        });

        resultContainer.textContent = '';
        filtered.forEach(function (post) {
            resultContainer.appendChild(createResult(post));
        });
        emptyMessage.hidden = filtered.length !== 0;
        count.textContent = filtered.length + '개의 글';
    }

    var initialQuery = new URLSearchParams(window.location.search).get('q') || '';
    input.value = initialQuery;
    input.addEventListener('input', render);
    render();
}());
