/**
 * Dynamic Interactive Dot Canvas Background with Clean Water Drop & Ripple Physics
 * Norman Lee Weng Hong Portfolio
 */

(function () {
    const canvas = document.getElementById('dots-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles = [];
    let waterRipples = [];
    let splashParticles = [];
    let activeDrop = null;
    let animationFrameId = null;

    // Mouse state
    const mouse = {
        x: null,
        y: null,
        targetX: null,
        targetY: null,
        radius: 180,
        active: false,
        lastActiveTime: 0
    };

    // Configuration
    const CONFIG = {
        baseParticleCount: 110,
        maxConnectionsDistance: 125,
        mouseRepelForce: 3.5,
        returnEase: 0.05,
        dotPalette: [
            { r: 56, g: 189, b: 248 },  // Sky cyan (#38bdf8)
            { r: 99, g: 102, b: 241 },  // Indigo (#6366f1)
            { r: 168, g: 85, b: 247 },  // Purple (#a855f7)
            { r: 52, g: 211, b: 153 }   // Emerald (#34d399)
        ]
    };

    class Particle {
        constructor(w, h) {
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.vx = (Math.random() - 0.5) * 0.7;
            this.vy = (Math.random() - 0.5) * 0.7;
            this.radius = Math.random() * 1.8 + 1.2;
            this.baseRadius = this.radius;
            this.color = CONFIG.dotPalette[Math.floor(Math.random() * CONFIG.dotPalette.length)];
            this.baseAlpha = Math.random() * 0.45 + 0.35;
            this.currentAlpha = this.baseAlpha;
            this.glow = Math.random() > 0.6;
        }

        update(w, h) {
            // Drift
            this.x += this.vx;
            this.y += this.vy;

            // Bounce on boundaries
            if (this.x < 0) {
                this.x = 0;
                this.vx *= -1;
            } else if (this.x > w) {
                this.x = w;
                this.vx *= -1;
            }
            if (this.y < 0) {
                this.y = 0;
                this.vy *= -1;
            } else if (this.y > h) {
                this.y = h;
                this.vy *= -1;
            }

            // Mouse interaction (Repel + Glow)
            if (mouse.x !== null && mouse.y !== null && mouse.active) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const dist = Math.hypot(dx, dy);

                if (dist < mouse.radius && dist > 0) {
                    const angle = Math.atan2(dy, dx);
                    const force = (1 - dist / mouse.radius) * CONFIG.mouseRepelForce;
                    
                    this.x += Math.cos(angle) * force * 1.5;
                    this.y += Math.sin(angle) * force * 1.5;
                    
                    this.radius = this.baseRadius + (1 - dist / mouse.radius) * 2.5;
                    this.currentAlpha = Math.min(1, this.baseAlpha + (1 - dist / mouse.radius) * 0.5);
                } else {
                    this.radius += (this.baseRadius - this.radius) * CONFIG.returnEase;
                    this.currentAlpha += (this.baseAlpha - this.currentAlpha) * CONFIG.returnEase;
                }
            } else {
                this.radius += (this.baseRadius - this.radius) * CONFIG.returnEase;
                this.currentAlpha += (this.baseAlpha - this.currentAlpha) * CONFIG.returnEase;
            }

            // Water Ripple displacement physics (fluid wave impulse)
            for (let i = 0; i < waterRipples.length; i++) {
                const rip = waterRipples[i];
                if (rip.delay > 0) continue;

                const dx = this.x - rip.x;
                const dy = this.y - rip.y;
                const dist = Math.hypot(dx, dy);
                const diff = Math.abs(dist - rip.currentRadius);
                
                if (diff < 32 && dist > 0) {
                    const waveFactor = Math.sin((1 - diff / 32) * Math.PI);
                    const push = waveFactor * rip.intensity * 3.4;
                    this.x += (dx / dist) * push;
                    this.y += (dy / dist) * push;
                    this.currentAlpha = Math.min(1, this.currentAlpha + waveFactor * 0.35);
                }
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.currentAlpha})`;
            
            if (this.glow || this.radius > this.baseRadius + 0.8) {
                ctx.shadowColor = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
                ctx.shadowBlur = 8;
            }
            
            ctx.fill();
            ctx.restore();
        }
    }

    // Single Falling Water Drop (for page load/entry)
    class FallingWaterDrop {
        constructor(startX, startY, targetY) {
            this.x = startX;
            this.y = startY;
            this.targetY = targetY;
            this.vy = 2.5;
            this.gravity = 0.55;
            this.radius = 3.2;
            this.completed = false;
        }

        update() {
            if (this.completed) return false;
            this.vy += this.gravity;
            this.y += this.vy;

            if (this.y >= this.targetY) {
                this.y = this.targetY;
                this.completed = true;
                // Trigger concentric clean ripples on landing
                createWaterRipples(this.x, this.targetY, 1.35);
                createSplashParticles(this.x, this.targetY);
                onDropImpact(this.x, this.targetY);
                return false;
            }
            return true;
        }

        draw(ctx) {
            if (this.completed) return;
            ctx.save();

            // Elegant light trail
            const trailLength = Math.min(28, this.vy * 2.2);
            const grad = ctx.createLinearGradient(this.x, this.y - trailLength, this.x, this.y);
            grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
            grad.addColorStop(0.7, 'rgba(125, 211, 252, 0.5)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');

            ctx.beginPath();
            ctx.moveTo(this.x, this.y - trailLength);
            ctx.lineTo(this.x - 1.8, this.y);
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI);
            ctx.lineTo(this.x + 1.8, this.y);
            ctx.closePath();

            ctx.fillStyle = grad;
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.restore();
        }
    }

    // Concentric Clean Water Ripple Ring
    class WaterRippleRing {
        constructor(x, y, maxRadius, speed, delay = 0, initialAlpha = 0.75) {
            this.x = x;
            this.y = y;
            this.currentRadius = 0;
            this.maxRadius = maxRadius;
            this.speed = speed;
            this.delay = delay;
            this.alpha = initialAlpha;
            this.initialAlpha = initialAlpha;
            this.intensity = 1.0;
        }

        update() {
            if (this.delay > 0) {
                this.delay--;
                return true;
            }

            this.currentRadius += this.speed;
            this.speed *= 0.985; // Natural liquid viscosity deceleration

            const progress = this.currentRadius / this.maxRadius;
            this.alpha = (1 - progress) * this.initialAlpha;
            this.intensity = Math.max(0, 1 - progress);

            return this.currentRadius < this.maxRadius && this.alpha > 0.01;
        }

        draw(ctx) {
            if (this.delay > 0 || this.alpha <= 0) return;
            ctx.save();

            const progress = this.currentRadius / this.maxRadius;
            const lineWidth = Math.max(0.4, 2.0 * (1 - progress));

            // Outer crisp ripple
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(56, 189, 248, ${this.alpha})`;
            ctx.lineWidth = lineWidth;
            ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
            ctx.shadowBlur = 6;
            ctx.stroke();

            // Inner subtle reflection ring
            if (this.currentRadius > 8) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, Math.max(1, this.currentRadius - 3.5), 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 255, 255, ${this.alpha * 0.35})`;
                ctx.lineWidth = lineWidth * 0.6;
                ctx.stroke();
            }

            ctx.restore();
        }
    }

    // Micro Splash Particles on impact
    class SplashParticle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2.8 + 1.2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed - 1.5; // slight upward bias
            this.radius = Math.random() * 1.5 + 0.8;
            this.alpha = 0.85;
            this.gravity = 0.12;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += this.gravity;
            this.alpha -= 0.035;
            return this.alpha > 0;
        }

        draw(ctx) {
            if (this.alpha <= 0) return;
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(186, 230, 253, ${this.alpha})`;
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 4;
            ctx.fill();
            ctx.restore();
        }
    }

    // Helper: spawn concentric clean ripples
    function createWaterRipples(x, y, scale = 1.0) {
        // 3 concentric rings with subtle delays for true fluid droplet behavior
        waterRipples.push(new WaterRippleRing(x, y, 540 * scale, 7.2 * scale, 0, 0.75));
        waterRipples.push(new WaterRippleRing(x, y, 420 * scale, 5.8 * scale, 8, 0.55));
        waterRipples.push(new WaterRippleRing(x, y, 320 * scale, 4.4 * scale, 18, 0.40));
    }

    function createSplashParticles(x, y) {
        for (let i = 0; i < 9; i++) {
            splashParticles.push(new SplashParticle(x, y));
        }
    }

    // Trigger Initial Water Drop on Page Load / Reload
    function triggerInitialWaterDrop() {
        const dropX = width * 0.5;
        const dropTargetY = Math.min(height * 0.42, 380);
        activeDrop = new FallingWaterDrop(dropX, -15, dropTargetY);
    }

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;

        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        initParticles();
    }

    function initParticles() {
        const area = width * height;
        const targetCount = Math.max(45, Math.min(140, Math.floor(area / 11000)));
        particles = [];
        for (let i = 0; i < targetCount; i++) {
            particles.push(new Particle(width, height));
        }
    }

    function render() {
        ctx.clearRect(0, 0, width, height);

        // Smooth mouse position interpolation
        if (mouse.targetX !== null && mouse.targetY !== null) {
            if (mouse.x === null) {
                mouse.x = mouse.targetX;
                mouse.y = mouse.targetY;
            } else {
                mouse.x += (mouse.targetX - mouse.x) * 0.25;
                mouse.y += (mouse.targetY - mouse.y) * 0.25;
            }
        }

        // Draw inter-particle lines
        const maxDist = CONFIG.maxConnectionsDistance;
        for (let i = 0; i < particles.length; i++) {
            const p1 = particles[i];
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.hypot(dx, dy);

                if (dist < maxDist) {
                    const factor = 1 - dist / maxDist;
                    const alpha = factor * 0.22;
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(125, 211, 252, ${alpha})`;
                    ctx.lineWidth = factor * 0.9;
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }

        // Draw cursor connection lines & interactive glow web
        if (mouse.x !== null && mouse.y !== null && mouse.active) {
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const dist = Math.hypot(dx, dy);

                if (dist < mouse.radius) {
                    const factor = 1 - dist / mouse.radius;
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(mouse.x, mouse.y);
                    ctx.lineTo(p.x, p.y);
                    
                    const grad = ctx.createLinearGradient(mouse.x, mouse.y, p.x, p.y);
                    grad.addColorStop(0, `rgba(56, 189, 248, ${factor * 0.7})`);
                    grad.addColorStop(1, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${factor * 0.3})`);
                    
                    ctx.strokeStyle = grad;
                    ctx.lineWidth = factor * 1.5;
                    ctx.stroke();
                    ctx.restore();
                }
            }

            // Subtle cursor radar glow
            ctx.save();
            const radGrad = ctx.createRadialGradient(
                mouse.x, mouse.y, 0,
                mouse.x, mouse.y, mouse.radius
            );
            radGrad.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
            radGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.03)');
            radGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');
            ctx.fillStyle = radGrad;
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, mouse.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Update and draw falling water drop
        if (activeDrop) {
            if (!activeDrop.update()) {
                activeDrop = null;
            } else {
                activeDrop.draw(ctx);
            }
        }

        // Update and draw water ripples
        for (let i = waterRipples.length - 1; i >= 0; i--) {
            const rip = waterRipples[i];
            if (rip.update()) {
                rip.draw(ctx);
            } else {
                waterRipples.splice(i, 1);
            }
        }

        // Update and draw splash particles
        for (let i = splashParticles.length - 1; i >= 0; i--) {
            const sp = splashParticles[i];
            if (sp.update()) {
                sp.draw(ctx);
            } else {
                splashParticles.splice(i, 1);
            }
        }

        // Update & draw background particles
        for (let i = 0; i < particles.length; i++) {
            particles[i].update(width, height);
            particles[i].draw(ctx);
        }

        // Decay mouse activity if idle
        if (Date.now() - mouse.lastActiveTime > 2500) {
            mouse.active = false;
        }

        animationFrameId = requestAnimationFrame(render);
    }

    // Event listeners
    window.addEventListener('resize', () => {
        resize();
    });

    window.addEventListener('mousemove', (e) => {
        mouse.targetX = e.clientX;
        mouse.targetY = e.clientY;
        mouse.active = true;
        mouse.lastActiveTime = Date.now();
    });

    window.addEventListener('mouseleave', () => {
        mouse.active = false;
    });

    window.addEventListener('mouseenter', () => {
        mouse.active = true;
        mouse.lastActiveTime = Date.now();
    });

    // Touch support for mobile devices
    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            mouse.targetX = e.touches[0].clientX;
            mouse.targetY = e.touches[0].clientY;
            mouse.active = true;
            mouse.lastActiveTime = Date.now();
        }
    }, { passive: true });

    window.addEventListener('touchend', () => {
        mouse.active = false;
    });

    // Water ripple trigger on click
    window.addEventListener('click', (e) => {
        createWaterRipples(e.clientX, e.clientY, 0.75);
        createSplashParticles(e.clientX, e.clientY);
    });

    // Energy saving when tab is hidden
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        } else {
            if (!animationFrameId) {
                animationFrameId = requestAnimationFrame(render);
            }
        }
    });

    // Initialize
    resize();
    animationFrameId = requestAnimationFrame(render);

    // Coordinate water drop impact with smooth circular page expansion
    function onDropImpact(x, y) {
        revealPageNow(x, y);
    }

    function revealPageNow(x, y) {
        if (document.body.classList.contains('revealed')) return;
        
        const posX = (typeof x === 'number') ? x : (width * 0.5);
        const posY = (typeof y === 'number') ? y : Math.min(height * 0.42, 380);
        
        const pctX = Math.round((posX / width) * 100);
        const pctY = Math.round((posY / height) * 100);

        document.documentElement.style.setProperty('--reveal-x', pctX + '%');
        document.documentElement.style.setProperty('--reveal-y', pctY + '%');
        document.body.classList.add('revealed');

        setTimeout(() => {
            document.body.classList.add('revealed-done');
        }, 1250);
    }

    // Trigger clean water drop effect shortly after initial load / reload
    setTimeout(() => {
        triggerInitialWaterDrop();
    }, 140);

    // Safety fallback: ensure page is always visible even if tab is unfocused or delayed
    setTimeout(() => {
        revealPageNow();
    }, 950);

    // Skip intro immediately on user action if desired
    window.addEventListener('keydown', () => revealPageNow(), { once: true });

    // Expose for manual trigger if ever desired
    window.triggerWaterDrop = triggerInitialWaterDrop;
    window.revealPortfolio = revealPageNow;
})();
