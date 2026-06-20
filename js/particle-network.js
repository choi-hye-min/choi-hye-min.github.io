(function () {
    var canvases = document.querySelectorAll('.particle-network');
    if (!canvases.length) return;

    Array.prototype.forEach.call(canvases, function (canvas) {
        var container = canvas.parentElement;
        if (!container) return;

        var context = canvas.getContext('2d');
        var particles = [];
        var mouse = { x: null, y: null };
        var frameId = null;
        var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var connectionDistance = Number(canvas.getAttribute('data-particle-connection-distance')) || 130;
        var repelDistance = 105;
        var width = 0;
        var height = 0;
        var desktopCount = Number(canvas.getAttribute('data-particle-count')) || 80;
        var mobileCount = Number(canvas.getAttribute('data-particle-count-mobile')) || 36;
        var opacity = Number(canvas.getAttribute('data-particle-opacity')) || 1;
        var speedScale = Number(canvas.getAttribute('data-particle-speed')) || 1;
        var interactive = canvas.getAttribute('data-particle-interactive') !== 'false';

        function createParticle() {
            var angle = Math.random() * Math.PI * 2;
            var speed = (0.08 + Math.random() * 0.18) * speedScale;
            return {
                x: Math.random() * width,
                y: Math.random() * height,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 1 + Math.random() * 1.3
            };
        }

        function resize() {
            var ratio = Math.min(window.devicePixelRatio || 1, 2);
            width = container.clientWidth;
            height = container.clientHeight;
            canvas.width = Math.round(width * ratio);
            canvas.height = Math.round(height * ratio);
            context.setTransform(ratio, 0, 0, ratio, 0, 0);

            var particleCount = window.innerWidth <= 767 ? mobileCount : desktopCount;
            particles = Array.from({ length: particleCount }, createParticle);
            draw();
        }

        function updateParticle(particle) {
            if (interactive && mouse.x !== null) {
                var dx = particle.x - mouse.x;
                var dy = particle.y - mouse.y;
                var distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > 0 && distance < repelDistance) {
                    var force = (1 - distance / repelDistance) * 0.045;
                    particle.vx += dx / distance * force;
                    particle.vy += dy / distance * force;
                }
            }

            var currentSpeed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
            if (currentSpeed > 0.55) {
                particle.vx = particle.vx / currentSpeed * 0.55;
                particle.vy = particle.vy / currentSpeed * 0.55;
            }
            particle.x += particle.vx;
            particle.y += particle.vy;

            if (particle.x < 0 || particle.x > width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > height) particle.vy *= -1;
            particle.x = Math.max(0, Math.min(width, particle.x));
            particle.y = Math.max(0, Math.min(height, particle.y));
        }

        function draw() {
            context.clearRect(0, 0, width, height);

            for (var i = 0; i < particles.length; i += 1) {
                var particle = particles[i];
                for (var j = i + 1; j < particles.length; j += 1) {
                    var other = particles[j];
                    var dx = particle.x - other.x;
                    var dy = particle.y - other.y;
                    var distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < connectionDistance) {
                        context.beginPath();
                        context.moveTo(particle.x, particle.y);
                        context.lineTo(other.x, other.y);
                        context.strokeStyle = 'rgba(103, 232, 249, ' + ((1 - distance / connectionDistance) * 0.2 * opacity) + ')';
                        context.lineWidth = 0.7;
                        context.stroke();
                    }
                }

                context.beginPath();
                context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                context.fillStyle = 'rgba(103, 232, 249, ' + (0.58 * opacity) + ')';
                context.fill();
            }
        }

        function animate() {
            particles.forEach(updateParticle);
            draw();
            frameId = window.requestAnimationFrame(animate);
        }

        if (interactive) {
            container.addEventListener('pointermove', function (event) {
                var bounds = container.getBoundingClientRect();
                mouse.x = event.clientX - bounds.left;
                mouse.y = event.clientY - bounds.top;
            });

            container.addEventListener('pointerleave', function () {
                mouse.x = null;
                mouse.y = null;
            });
        }

        window.addEventListener('resize', resize);
        if ('ResizeObserver' in window) {
            new ResizeObserver(function () {
                if (container.clientWidth !== width || container.clientHeight !== height) resize();
            }).observe(container);
        }
        document.addEventListener('visibilitychange', function () {
            if (document.hidden && frameId) {
                window.cancelAnimationFrame(frameId);
                frameId = null;
            } else if (!document.hidden && !reducedMotion && !frameId) {
                animate();
            }
        });

        resize();
        if (!reducedMotion) animate();
    });
}());
