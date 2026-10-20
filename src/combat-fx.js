// Presentation only: fixed-step combat owns every collision and timing window.
// Particle lifetimes use seconds, so effects stay smooth between simulation ticks.
const TAU = Math.PI * 2;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const fract = n => n - Math.floor(n);
const noise = n => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);
const smooth = n => 1 - (1 - n) ** 3;
const ELEMENTS = {
  Fire: ['#ff9b55', '#ffe7a5'], Electric: ['#ddfc81', '#fcffe4'],
  Ice: ['#99e7fa', '#f0fdff'], Wind: ['#9ce9d3', '#effff5'],
  Earth: ['#bad997', '#f7e6ae'], Shadow: ['#bb8fe9', '#f5c5ff'],
  Water: ['#80d9ed', '#e0fcff'], Steel: ['#c4d9ed', '#fff0dc'],
};
const ELEMENT_ALIASES={Rock:'Earth',Ground:'Earth',Grass:'Earth',Dark:'Shadow',Ghost:'Shadow',Void:'Shadow',Flying:'Wind',Fairy:'Wind',Dragon:'Steel',Light:'Electric',Psychic:'Shadow',Bug:'Earth'};
const materialFor=element=>ELEMENT_ALIASES[element]||element;
const BIOME_PALETTES = {
  sanctuary: ['#f7dda0', '#acdfbc'], moss: ['#a9ebad', '#efedb2'],
  forge: ['#ff9a60', '#ffd8a2'], reef: ['#8de1ed', '#c9f9f6'],
  storm: ['#cdb3ff', '#f7dcff'], frost: ['#c8ecff', '#f5fbff'],
  rift: ['#ed9fc7', '#c9aaff'],
};

function ellipse(c, x, y, rx, ry) {
  c.beginPath(); c.ellipse(x, y, Math.max(.01, rx), Math.max(.01, ry), 0, 0, TAU); c.fill();
}
function glow(c, x, y, radius, color, alpha = .2) {
  const gradient = c.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color); gradient.addColorStop(1, 'transparent');
  c.save(); c.globalAlpha *= alpha; c.fillStyle = gradient; ellipse(c, x, y, radius, radius); c.restore();
}

export class CombatFX {
  constructor({reducedMotion = false, maxParticles = 420} = {}) {
    this.reducedMotion = reducedMotion;
    this.maxParticles = clamp(maxParticles, 80, 600);
    this.particles = [];
    this.rings = [];
    this.slashes = [];
    this.time = 0;
    this.seed = 38219;
    this.shake = 0;
    this.shakeAngle = 0;
    this.kickX = 0;
    this.kickY = 0;
    this.flash = 0;
    this.flashColor = '#e5fff3';
    this.zoom = 0;
    this.impact = 0;
    this.impactAngle = 0;
    this.hurtVignette = 0;
    this.powerVignette = 0;
    this.lastTrail = 0;
  }

  random() {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  addParticle(p) {
    // Reuse the oldest slot when a long combo fills the pool.
    if (this.particles.length >= this.maxParticles) this.particles.shift();
    this.particles.push({life: .35, maxLife: .35, x: 0, y: 0, vx: 0, vy: 0, gravity: 0,
      drag: 2, size: 2, color: '#fff3c7', kind: 'spark', rotation: 0, spin: 0, ...p});
  }

  burst(x, y, count, colors, {angle = 0, spread = TAU, speed = 240, gravity = 220, kind = 'spark', life = .4} = {}) {
    count = Math.round(count * (this.reducedMotion ? .45 : 1));
    for (let i = 0; i < count; i++) {
      const a = angle + (this.random() - .5) * spread;
      const velocity = speed * (.25 + this.random() * .9);
      const duration = life * (.65 + this.random() * .7);
      this.addParticle({x, y, vx: Math.cos(a) * velocity, vy: Math.sin(a) * velocity,
        gravity, color: colors[i % colors.length], life: duration, maxLife: duration,
        size: 1 + this.random() * 3, rotation: a, spin: (this.random() - .5) * 8,
        kind: i % 6 === 0 ? 'diamond' : kind});
    }
  }

  materialImpact(x, y, element, face, strength = 1) {
    // Each material has a different weight, trajectory and fragment shape.
    // All pieces still use the shared bounded pool and event-driven lifetimes.
    const colors = ELEMENTS[element] || ELEMENTS.Steel;
    const forward = face > 0 ? 0 : Math.PI;
    const kinds = {Fire:'ember', Electric:'filament', Ice:'crystal', Wind:'wisp', Earth:'chip', Shadow:'cinder', Water:'droplet', Steel:'metal'};
    const count = this.reducedMotion ? 4 : 7 + Math.round(strength * 2);
    for(let i=0;i<count;i++) {
      const a=forward+(this.random()-.5)*2.8,speed=(65+this.random()*145)*strength;
      const airy=['Fire','Shadow','Wind','Electric'].includes(element),life=(airy?.34:.48)+this.random()*.2;
      this.addParticle({x:x+(this.random()-.5)*9,y:y+(this.random()-.5)*8,
        vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-(element==='Water'?60:airy?30:0),
        gravity:airy?-45:element==='Earth'?490:element==='Steel'?380:290,
        drag:airy?2.7:1.8,color:colors[i%2],size:1.2+this.random()*(element==='Earth'?3.3:2.2),
        rotation:a,spin:(this.random()-.5)*(element==='Steel'?18:7),kind:kinds[element]||'metal',life,maxLife:life});
    }
    if(element==='Water') {
      this.ring(x,y,colors[0],42+strength*9,.32,{squash:.36,width:1.3});
      this.ring(x,y+5,colors[1],28+strength*7,.25,{squash:.24,width:.8});
    } else if(element==='Wind'||element==='Shadow') {
      this.slashes.push({x,y,face,color:colors[0],life:.28,maxLife:.28,kind:'ribbon',angle:(this.random()-.5)*.7});
    } else if(element==='Electric') {
      this.slashes.push({x,y,face,color:colors[0],life:.14,maxLife:.14,kind:'bolt',angle:this.random()*TAU});
    }
  }

  ring(x, y, color, radius = 70, duration = .35, options = {}) {
    if (this.rings.length >= 32) this.rings.shift();
    this.rings.push({x, y, color, radius, life: duration, maxLife: duration,
      width: 3, squash: 1, rotation: 0, start: 0, end: TAU, ...options});
  }

  impulse(amount, face = 1, vertical = 0) {
    if (this.reducedMotion) return;
    this.shake = Math.min(15, Math.max(this.shake, amount));
    this.shakeAngle = this.random() * TAU;
    this.kickX = -face * amount * .55;
    this.kickY = vertical * amount * .4;
    this.zoom = Math.max(this.zoom, Math.min(.022, amount * .0016));
  }

  event(type, payload = {}, game = null) {
    // Accept renderer.event(event, game) and the explicit event(type, payload, game).
    if (typeof type === 'object') {
      game = payload || game; payload = type; type = payload.type;
    }
    const p = game?.player || {};
    const target = payload.target || payload.enemy || payload.e;
    const data = game?.data || {};
    const element = materialFor(payload.element || target?.element || data.element || 'Steel');
    const colors = payload.color ? [payload.color, '#fff6dc'] : ELEMENTS[element] || [data.color || '#b4e7cf', data.accent || '#fff3c7'];
    const face = payload.face || p.face || 1;
    const x = payload.x ?? target?.x ?? ((p.x || 0) + (type === 'hit' ? face * 48 : 0));
    const y = payload.y ?? (target ? target.y - (target.boss ? 82 : 28) : (p.y || 520) - 32);
    const heavy = payload.heavy || payload.move?.heavy || p.attack?.type === 'heavy';
    const strength = clamp(payload.strength || (heavy ? 1.5 : 1), .4, 3);

    switch (type) {
      case 'hit': case 'impact': case 'critical': case 'counterhit': {
        this.burst(x, y, 7 * strength, colors, {angle: face > 0 ? 0 : Math.PI, spread: 2.7, speed: 320 * strength, gravity: 260, life: .24});
        this.materialImpact(x,y,element,face,strength);
        this.burst(x, y, 5, ['#fffce1'], {speed: 150, gravity: 80, life: .14});
        this.ring(x, y, colors[1], 26 + strength * 18, .2, {width: heavy ? 4 : 2, squash: .8});
        this.impact = Math.max(this.impact, heavy ? .7 : .32); this.impactAngle = this.random() * TAU;
        this.impulse(heavy ? 4.8 : 2.4, face);
        // Material ribbons and shards provide the element cue, not extra flash.
        break;
      }
      case 'launch': case 'launcher': case 'wallslam': {
        this.burst(x, y, 28, colors, {angle: -Math.PI / 2, spread: 2.2, speed: 390, gravity: 300, life: .55});
        this.ring(x, y + 20, colors[0], 95, .4, {squash: .24, width: 4});
        this.impulse(7, face, -1); break;
      }
      case 'hurt': case 'damage': {
        this.burst(x, y, 19, ['#ffbd9c', '#f98189', '#ffe8ca'], {speed: 290, gravity: 330, life: .4});
        this.ring(x, y, '#ffd3ad', 40, .24, {width: 3});
        this.hurtVignette = .55;
        this.impulse(8, -face, 1); break;
      }
      case 'parry': case 'perfectguard': case 'perfectdodge': {
        const sx = payload.x ?? (p.x || 0) + face * 32;
        this.burst(sx, y, 34, ['#fef5b7', '#bbf9e8', '#ffffff'], {angle: face > 0 ? 0 : Math.PI, spread: Math.PI, speed: 410, gravity: 75, life: .48});
        this.ring(sx, y, '#fff5bb', 90, .4, {width: 5});
        this.ring(sx, y, '#aef5e6', 125, .5, {width: 1});
        this.slashes.push({x: sx, y, face, color: '#fff7bd', life: .28, maxLife: .28, kind: 'star', angle: -.3});
        this.flash = Math.max(this.flash, .16); this.flashColor = '#e9fff1'; this.impulse(5.5, face); break;
      }
      case 'guard': case 'block': case 'shieldhit': {
        const sx = payload.x ?? (p.x || 0) + face * 34;
        this.burst(sx, y, 12, ['#a9f3ed', '#e3fff5'], {angle: face > 0 ? 0 : Math.PI, spread: Math.PI, speed: 200, gravity: 60, life: .28});
        this.ring(sx, y, '#aff9ee', 42, .24, {squash: .4, width: 3});
        this.slashes.push({x:sx,y,face,color:'#d8fff1',life:.18,maxLife:.18,kind:'guardwave',angle:0});
        this.impulse(1.8, face); break;
      }
      case 'guardbreak': case 'shieldbreak': case 'break': case 'bossbreak': {
        this.burst(x, y, 46, ['#8ee5ef', '#f9dab8', '#f2ffff'], {speed: 340, gravity: 430, kind: 'shard', life: .65});
        this.ring(x, y, '#ffb995', 115, .4, {width: 5});
        this.slashes.push({x,y,face,color:type==='bossbreak'?'#ffe7b1':'#bdf5fa',life:.36,maxLife:.36,kind:'fracture',angle:this.random()*.5});
        if (type !== 'bossbreak') this.hurtVignette = .35;
        else { this.flash = Math.max(this.flash, .12); this.flashColor = '#fff1b0'; }
        this.impulse(10, face); break;
      }
      case 'shield': case 'shieldup': case 'shieldUp': {
        this.ring(x, y, '#a6f6e5', 53, .25, {start: -Math.PI * .7, end: Math.PI * .7, width: 2});
        this.burst(x + face * 25, y, 8, ['#b7ffed'], {angle: -Math.PI / 2, spread: Math.PI, speed: 95, gravity: -40, life: .3}); break;
      }
      case 'dash': case 'airdash': case 'blink': case 'slide': {
        this.burst(x - face * 16, (p.grounded ? p.y - 5 : y) || y, 13, [colors[0], '#effff0'],
          {angle: face > 0 ? Math.PI : 0, spread: .9, speed: 190, gravity: p.grounded ? 150 : 0, life: .28});
        this.ring(x, y, colors[0], 42, .24, {squash: .46, width: 2}); break;
      }
      case 'jump': case 'doublejump': case 'walljump': case 'grapple': case 'pogo': {
        const yy = type === 'pogo' ? (p.y || y) + 4 : (p.y || y) - 3;
        this.ring(x, yy, colors[0], type === 'doublejump' ? 44 : 30, .3, {squash: .24, width: 2});
        this.burst(x, yy, type === 'doublejump' ? 15 : 8, [colors[0], '#ecedcb'], {angle: Math.PI / 2, spread: 2, speed: 110, gravity: 150, life: .35});
        if (type === 'pogo') this.impulse(2.4, face, 1); break;
      }
      case 'land': case 'slam': {
        const yy = payload.y ?? p.y ?? 520;
        this.burst(x, yy - 3, type === 'slam' ? 30 : 11, [colors[0], '#e3d3ac'], {angle: -Math.PI / 2, spread: Math.PI * 1.5, speed: type === 'slam' ? 250 : 110, gravity: 380, life: .45});
        this.ring(x, yy, colors[0], type === 'slam' ? 135 : 43, .4, {squash: .16, width: 3});
        if (type === 'slam') this.impulse(5, face, 1); break;
      }
      case 'slash': {
        const attack = p.attack || {};
        this.slashes.push({x: (p.x || x) + face * 12, y: (p.y || y) - 32, face,
          color: colors[0], life: heavy ? .24 : .16, maxLife: heavy ? .24 : .16,
          kind: attack.dir === 'up' ? 'uppercut' : attack.dir === 'down' ? 'dive' : 'slash',
          angle: payload.angle || 0, heavy}); break;
      }
      case 'cast': case 'power': case 'powerup': case 'awakening': case 'surge': case 'oath': {
        const big = ['surge', 'awakening', 'oath'].includes(type);
        this.burst(x, y, big ? 60 : 26, colors, {speed: big ? 360 : 210, gravity: -60, life: big ? .9 : .55, kind: 'diamond'});
        this.ring(x, y, colors[0], big ? 220 : 90, big ? .8 : .42, {width: big ? 4 : 2});
        if (big) {
          this.ring(x, y, colors[1], 150, .6, {width: 2});
          this.flash = Math.max(this.flash, .16); this.flashColor = colors[0];
          this.powerVignette = .8; this.impulse(6, face);
        }
        break;
      }
      case 'heal': case 'bench': case 'levelup': case 'upgrade': case 'talentpoint': case 'relic': case 'loot': {
        this.burst(x, y, type === 'heal' ? 22 : 14, ['#c6f5b0', '#ffe8ad'], {angle: -Math.PI / 2, spread: Math.PI, speed: 120, gravity: -80, life: .75, kind: 'diamond'});
        this.ring(x, y + 24, '#bcecc4', 70, .7, {squash: .3, width: 2}); break;
      }
      case 'switch': {
        this.burst(x, y, 24, colors, {speed: 180, gravity: -20, life: .42, kind: 'diamond'});
        this.ring(x, y, colors[0], 72, .4, {squash: 1.2, width: 3}); break;
      }
      case 'bossdefeated': case 'bosskill': case 'enrage': {
        const boss = target || game?.enemies?.find(e => e.boss === payload.boss) || game?.enemies?.find(e => e.boss);
        const bx = payload.x ?? boss?.x ?? x, by = payload.y ?? ((boss?.y || 520) - 95);
        const defeated = type !== 'enrage';
        this.burst(bx, by, defeated ? 100 : 45, colors, {speed: defeated ? 440 : 290, gravity: defeated ? 90 : -80, life: 1.2, kind: 'shard'});
        this.ring(bx, by, colors[0], defeated ? 310 : 180, .9, {width: 5});
        this.ring(bx, by, '#fff7d4', defeated ? 200 : 120, .65, {width: 2});
        this.flash = defeated ? .32 : .15; this.flashColor = colors[0]; this.powerVignette = .6;
        this.impulse(defeated ? 13 : 8, face); break;
      }
      case 'kill': case 'shatter': {
        this.materialImpact(x,y,element,face,.75);
        this.burst(x, y, 9, colors, {speed: 95, gravity: -35, life: .7, kind: 'cinder'}); break;
      }
      case 'room': case 'respawn':
        this.particles.length = 0; this.rings.length = 0; this.slashes.length = 0;
        this.shake = 0; this.kickX = 0; this.kickY = 0; this.zoom = 0;
        this.hurtVignette = 0; this.powerVignette = 0; this.flash = 0; break;
    }
    // A sustained input can emit many slashes; bound every collection.
    if (this.slashes.length > 24) this.slashes.splice(0, this.slashes.length - 24);
  }

  update(dtSeconds) {
    const dt = clamp(Number.isFinite(dtSeconds) ? dtSeconds : 1 / 60, 0, .05);
    this.time += dt;
    this.shake *= Math.exp(-dt * 13);
    this.kickX *= Math.exp(-dt * 19); this.kickY *= Math.exp(-dt * 19);
    this.zoom *= Math.exp(-dt * 12); this.flash *= Math.exp(-dt * 12);
    this.impact *= Math.exp(-dt * 19); this.hurtVignette *= Math.exp(-dt * 5.5);
    this.powerVignette *= Math.exp(-dt * 3.6);
    let n = 0;
    for (const p of this.particles) {
      p.life -= dt; if (p.life <= 0) continue;
      p.vx *= Math.exp(-p.drag * dt); p.vy += p.gravity * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rotation += p.spin * dt;
      this.particles[n++] = p;
    }
    this.particles.length = n;
    for (const items of [this.rings, this.slashes]) {
      let kept = 0;
      for (const item of items) { item.life -= dt; if (item.life > 0) items[kept++] = item; }
      items.length = kept;
    }
  }

  camera() {
    if (this.reducedMotion) return {x: 0, y: 0, zoom: 1, flash: Math.min(.08, this.flash)};
    return {
      x: Math.sin(this.time * 93 + this.shakeAngle) * this.shake + this.kickX,
      y: Math.sin(this.time * 117 - this.shakeAngle) * this.shake * .55 + this.kickY,
      zoom: 1 + this.zoom, flash: this.flash,
    };
  }

  drawAmbient(c, game, cameraX, cameraY, width, height, time = this.time) {
    const biome = game?.room?.biome || 'moss';
    const colors = BIOME_PALETTES[biome] || BIOME_PALETTES.moss;
    const t = this.reducedMotion ? time * .3 : time;
    const count = this.reducedMotion ? 25 : 62;
    c.save();
    for (let i = 0; i < count; i++) {
      const depth = .18 + noise(i + 92) * .66;
      const speed = biome === 'storm' ? 65 : biome === 'forge' ? 16 : biome === 'frost' ? 21 : 7;
      const xx = noise(i + 4) * (width + 150) + t * speed * depth - cameraX * depth * .3;
      const x = ((xx % (width + 150)) + width + 150) % (width + 150) - 75;
      let y = noise(i + 80) * (height + 100) - cameraY * depth * .2;
      const rising = biome === 'forge' || biome === 'reef' || biome === 'rift';
      y += t * (rising ? -14 : biome === 'frost' ? 24 : 2) * depth;
      y = ((y % (height + 100)) + height + 100) % (height + 100) - 50;
      const shimmer = .45 + Math.sin(t * (1.3 + depth) + i * 3) * .25;
      const size = .8 + depth * 2.2;
      c.globalAlpha = shimmer * .65; c.fillStyle = colors[i % 2]; c.strokeStyle = colors[i % 2];
      if (biome === 'reef') {
        c.lineWidth = .6; c.beginPath(); c.arc(x, y, size * 2.4, 0, TAU); c.stroke();
        c.globalAlpha *= .5; ellipse(c, x - size * .65, y - size, size * .5, size * .7);
      } else if (biome === 'storm') {
        c.lineWidth = .7; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 14 * depth, y + 2); c.stroke();
        if (i % 9 === 0) { c.beginPath(); c.moveTo(x - 4, y - 7); c.lineTo(x, y - 2); c.lineTo(x - 2, y); c.lineTo(x + 3, y + 5); c.stroke(); }
      } else if (biome === 'frost') {
        ellipse(c, x + Math.sin(t + i) * 12, y, size, size * .75);
        if (i % 8 === 0) {
          c.globalAlpha *= .5; c.lineWidth = .7;
          c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x + 4, y); c.moveTo(x, y - 4); c.lineTo(x, y + 4); c.stroke();
        }
      } else if (biome === 'rift') {
        c.save(); c.translate(x, y); c.rotate(t * .2 + i); c.fillRect(-size, -size * 2, size * 2, size * 4); c.restore();
      } else {
        const wobble = Math.sin(t * .6 + i) * (biome === 'forge' ? 9 : 17);
        ellipse(c, x + wobble, y, size * (biome === 'forge' ? .65 : 1), size * (biome === 'forge' ? 1.7 : 1));
        if (i % 11 === 0) { c.globalAlpha = shimmer * .035; ellipse(c, x + wobble, y, 12 + size, 12 + size); }
      }
    }
    c.restore();
  }

  drawWorld(c, game, time = this.time) {
    const p = game?.player;
    if (!p) return;
    const color = game.data?.color || '#a6e9d2';
    const accent = game.data?.accent || '#eaffdf';
    const face = p.face || 1;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';

    // The guard's direction and remaining strength are visible in the silhouette.
    if (p.shielding || p.shieldHeld || p.guard > 0 || p.fortress) {
      const strength = clamp((game.shield ?? p.shield ?? 100) / (game.maxShield || p.maxShield || 100), .05, 1);
      const perfect = p.parryFrames > 0 || p.parryWindow > 0;
      const col = perfect ? '#fff6ba' : '#a9f8e8';
      const pulse = this.reducedMotion ? 0 : Math.sin(time * 7) * 2;
      c.save(); c.translate(p.x, p.y - 31); c.scale(face, 1);
      c.fillStyle = col; c.globalAlpha = .025 + strength * .035;
      c.beginPath(); c.ellipse(6, 0, 48 + pulse, 52 + pulse, 0, -1.42, 1.42); c.lineTo(6, 0); c.fill();
      c.globalAlpha = .42 + strength * .4; c.strokeStyle = col; c.lineWidth = perfect ? 3.3 : 1.8;
      c.beginPath(); c.ellipse(6, 0, 46 + pulse, 51 + pulse, 0, -1.42 * strength, 1.42 * strength); c.stroke();
      c.globalAlpha *= .55; c.lineWidth = .7;
      for (let i = 0; i < 3; i++) {
        const yy = (i - 1) * 21, xx = 43 - Math.abs(yy) * .17;
        c.beginPath(); c.moveTo(xx - 7, yy - 5); c.lineTo(xx + 1, yy - 9); c.lineTo(xx + 9, yy - 5);
        c.lineTo(xx + 9, yy + 5); c.lineTo(xx + 1, yy + 9); c.lineTo(xx - 7, yy + 5); c.closePath(); c.stroke();
      }
      c.restore();
    }
    if (p.dash > 0) {
      c.globalAlpha = .2; c.strokeStyle = color; c.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        const y = p.y - 9 - i * 12, offset = noise(i + 22) * 16;
        c.beginPath(); c.moveTo(p.x - face * (15 + offset), y);
        c.lineTo(p.x - face * (70 + offset + Math.abs(p.vx || 0) * 2), y + 2); c.stroke();
      }
      c.globalAlpha = .08; c.fillStyle = color; ellipse(c, p.x - face * 22, p.y - 30, 64, 24);
    }
    if (p.powerAura > 0 || game.powerActive || p.overdrive > 0) {
      c.globalAlpha = .6; c.strokeStyle = color; c.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const a = time * 2 + i * TAU / 5;
        c.beginPath(); c.ellipse(p.x, p.y - 28, 35 + i * 2, 43, a * .3, a, a + .8); c.stroke();
      }
      glow(c, p.x, p.y - 30, 62, color, .12);
    }
    if (p.healing) {
      c.strokeStyle = '#e1ffcb'; c.lineWidth = 1; c.globalAlpha = .38;
      for (let i = 0; i < 3; i++) {
        const phase = (time * .8 + i / 3) % 1;
        c.beginPath(); c.ellipse(p.x, p.y - phase * 58, 18 + phase * 20, 5 + phase * 4, 0, 0, TAU); c.stroke();
      }
    }

    // Boss charge-up motes point inward, distinguishing anticipation from impact.
    for (const e of game.enemies || []) if (e.hp > 0 && e.boss && ['windup', 'enrage'].includes(e.state)) {
      const col = e.phase === 2 ? '#ffc1b0' : '#f5dea8';
      c.fillStyle = col;
      const cy = e.y - 85;
      for (let i = 0; i < 9; i++) {
        const phase = (time * 1.8 + i / 9) % 1;
        const angle = i * 2.399 + Math.sin(time + i) * .15;
        const r = 35 + (1 - phase) * 90;
        c.globalAlpha = phase * .6; ellipse(c, e.x + Math.cos(angle) * r, cy + Math.sin(angle) * r * .8, 1.5 + phase, 1.5 + phase);
      }
    }

    c.globalCompositeOperation = 'lighter';
    for (const ring of this.rings) {
      const progress = 1 - ring.life / ring.maxLife, radius = ring.radius * smooth(progress);
      c.globalAlpha = (1 - progress) ** 1.6 * .8;
      c.strokeStyle = ring.color; c.lineWidth = ring.width * (1 - progress * .65);
      c.beginPath(); c.ellipse(ring.x, ring.y, Math.max(.01, radius), Math.max(.01, radius * ring.squash), ring.rotation, ring.start, ring.end); c.stroke();
    }
    for (const s of this.slashes) {
      const progress = 1 - s.life / s.maxLife;
      c.save(); c.translate(s.x, s.y); c.scale(s.face, 1); c.rotate(s.angle);
      c.globalAlpha = (1 - progress) ** .8; c.strokeStyle = s.color;
      if(s.kind==='guardwave') {
        c.lineWidth=2.5*(1-progress)+.4;c.beginPath();c.ellipse(0,0,12+progress*20,25+progress*25,0,-1.35,1.35);c.stroke();
        c.globalAlpha*=.5;c.lineWidth=.8;c.beginPath();c.ellipse(4,0,17+progress*21,29+progress*24,0,-1.2,1.2);c.stroke();
      } else if(s.kind==='fracture') {
        const extent=18+progress*51;c.lineWidth=1.3*(1-progress)+.4;
        for(let i=0;i<6;i++){const a=i*TAU/6;c.beginPath();c.moveTo(Math.cos(a)*8,Math.sin(a)*8);c.lineTo(Math.cos(a+.12)*extent*.5,Math.sin(a+.12)*extent*.5);c.lineTo(Math.cos(a)*extent,Math.sin(a)*extent);c.stroke();}
      } else if(s.kind==='ribbon') {
        c.lineWidth=(1-progress)*3+.6;const sweep=26+progress*39;c.beginPath();c.moveTo(-sweep,18);c.bezierCurveTo(-sweep*.6,-31,sweep*.7,-25,sweep,7);c.stroke();
        c.globalAlpha*=.5;c.lineWidth=.8;c.beginPath();c.moveTo(-sweep-5,23);c.bezierCurveTo(-sweep*.6,-24,sweep*.7,-18,sweep+4,11);c.stroke();
      } else if (s.kind === 'star') {
        for (let i = 0; i < 4; i++) {
          c.rotate(Math.PI / 4); c.lineWidth = i % 2 ? 1 : 2;
          c.beginPath(); c.moveTo(-55 * (1 - progress * .5), 0); c.lineTo(55 * (1 - progress * .5), 0); c.stroke();
        }
      } else if (s.kind === 'bolt') {
        c.lineWidth = 2;
        c.beginPath(); c.moveTo(-44, -28); c.lineTo(-9, -11); c.lineTo(-22, 9); c.lineTo(20, -3); c.lineTo(47, 26); c.stroke();
      } else {
        const r = (s.heavy ? 80 : 62) * (.7 + progress * .4);
        const turn = s.kind === 'uppercut' ? -.9 : s.kind === 'dive' ? .95 : -.15;
        c.rotate(turn);
        c.lineWidth = (s.heavy ? 8 : 5) * (1 - progress) + .6;
        c.beginPath(); c.ellipse(0, 0, r, r * .7, 0, -1.1 + progress * .35, 1.25 + progress * .35); c.stroke();
        c.globalAlpha *= .65; c.strokeStyle = accent; c.lineWidth = 1;
        c.beginPath(); c.ellipse(-3, 0, r + 8, r * .72 + 4, 0, -.9 + progress * .35, 1.1 + progress * .35); c.stroke();
      }
      c.restore();
    }
    for (const particle of this.particles) {
      const age = 1 - particle.life / particle.maxLife;
      c.globalAlpha = Math.min(1, particle.life * 8) * (1 - age * .25);
      c.fillStyle = particle.color; c.strokeStyle = particle.color;
      const size = particle.size * (1 - age * .6);
      if(particle.kind==='droplet') {
        c.save();c.translate(particle.x,particle.y);c.rotate(Math.atan2(particle.vy,particle.vx)+Math.PI/2);c.beginPath();c.moveTo(0,-size*2.8);c.quadraticCurveTo(size*1.5,size*.3,0,size*1.2);c.quadraticCurveTo(-size*1.5,size*.3,0,-size*2.8);c.fill();c.restore();
      } else if(particle.kind==='chip'||particle.kind==='crystal'||particle.kind==='metal') {
        c.save();c.translate(particle.x,particle.y);c.rotate(particle.rotation);c.beginPath();c.moveTo(-size,-size);c.lineTo(size*.7,-size*1.6);c.lineTo(size,particle.kind==='metal'?size*.3:size);c.lineTo(-size*.4,size*1.3);c.closePath();c.fill();
        c.globalAlpha*=.55;c.strokeStyle='#fff2d7';c.lineWidth=.55;c.beginPath();c.moveTo(-size,-size);c.lineTo(size*.7,-size*1.6);c.stroke();c.restore();
      } else if(particle.kind==='ember') {
        c.globalAlpha*=.75;ellipse(c,particle.x,particle.y,size*.75,size*1.4);c.fillStyle='#fff0bd';ellipse(c,particle.x,particle.y,size*.3,size*.5);
      } else if(particle.kind==='wisp'||particle.kind==='cinder') {
        c.globalAlpha*=particle.kind==='cinder'?.5:.45;c.lineWidth=Math.max(.6,size*.65);c.beginPath();c.moveTo(particle.x-particle.vx*.035,particle.y-particle.vy*.035);c.quadraticCurveTo(particle.x+Math.sin(particle.rotation)*size*3,particle.y-size*3,particle.x,particle.y);c.stroke();
      } else if(particle.kind==='filament') {
        c.lineWidth=.85;c.beginPath();c.moveTo(particle.x-particle.vx*.024,particle.y-particle.vy*.024);c.lineTo(particle.x+size,particle.y-size);c.lineTo(particle.x-size*.5,particle.y);c.lineTo(particle.x+particle.vx*.01,particle.y+particle.vy*.01);c.stroke();
      } else if (particle.kind === 'spark') {
        c.lineWidth = Math.max(.5, size * .55);
        c.beginPath(); c.moveTo(particle.x, particle.y);
        c.lineTo(particle.x - particle.vx * .028, particle.y - particle.vy * .028); c.stroke();
      } else if (particle.kind === 'diamond' || particle.kind === 'shard') {
        c.save(); c.translate(particle.x, particle.y); c.rotate(particle.rotation);
        c.beginPath(); c.moveTo(0, -size * 2); c.lineTo(size, 0); c.lineTo(0, size * 2); c.lineTo(-size, 0); c.closePath(); c.fill(); c.restore();
      } else ellipse(c, particle.x, particle.y, size, size);
    }
    c.restore();
  }

  drawScreen(c, width, height, time = this.time) {
    c.save();
    if (this.hurtVignette > .005 || this.powerVignette > .005) {
      const hurt = this.hurtVignette > this.powerVignette;
      const amount = hurt ? this.hurtVignette : this.powerVignette * .5;
      const gradient = c.createRadialGradient(width * .5, height * .5, Math.min(width, height) * .15, width * .5, height * .5, Math.max(width, height) * .64);
      gradient.addColorStop(0, 'transparent'); gradient.addColorStop(.5, 'transparent');
      gradient.addColorStop(1, hurt ? '#e87575' : '#83e8cc');
      c.globalAlpha = Math.min(this.reducedMotion ? .12 : .55, amount);
      c.fillStyle = gradient; c.fillRect(0, 0, width, height);
    }
    if (this.flash > .007) {
      c.globalAlpha = this.reducedMotion ? Math.min(.07, this.flash) : Math.min(.24, this.flash);
      c.fillStyle = this.flashColor; c.fillRect(0, 0, width, height);
    }
    if (this.impact > .02 && !this.reducedMotion) {
      c.strokeStyle = '#fff4d3'; c.globalAlpha = this.impact * .12; c.lineWidth = 1;
      for (let i = 0; i < 15; i++) {
        const angle = i * TAU / 15 + this.impactAngle;
        const dx = Math.cos(angle), dy = Math.sin(angle);
        const radius = Math.min(width, height) * (.38 + noise(i) * .13);
        const length = (26 + noise(i + 50) * 85) * this.impact;
        c.beginPath(); c.moveTo(width * .5 + dx * radius, height * .5 + dy * radius);
        c.lineTo(width * .5 + dx * (radius + length), height * .5 + dy * (radius + length)); c.stroke();
      }
    }
    c.restore();
  }
}
