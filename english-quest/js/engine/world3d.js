/* ENGLISH QUEST – ĐỒ HỌA 3D KIỂU GHIBLI (bản 1.9, thử nghiệm)
 * Dựng lại bản đồ ô (EQ.world.rows) thành cảnh 3D bằng Three.js (js/lib/three.min.js, MIT):
 *  - nền đất vẽ tay (nét cọ màu trên canvas), cỏ đung đưa trong gió, hoa dại, hồ nước gợn sóng
 *  - cây tán tròn bồng bềnh, thông, cây táo, bụi cây, đá, hàng rào, nhà mái ngói, tường lâu đài
 *  - nhân vật & NPC dáng chibi tô màu mềm (toon), quái slime nảy, trùm to, rương, cổng, cổng dịch chuyển
 *  - bầu trời chuyển màu, mây trắng to, nắng vàng ấm, bóng đổ mềm, bụi phấn hoa bay
 * Toàn bộ logic (di chuyển, va chạm, nhiệm vụ, trận đấu) vẫn dùng EQ.world như bản 2D; file này CHỈ VẼ.
 * Bật/tắt: nút 🎨 trên màn hình hoặc EQ.store.settings().gfx3d. Máy không có WebGL → tự dùng 2D.
 * Đơn vị: 1 ô bản đồ = 1 đơn vị 3D; trục x = cột, trục z = hàng (hướng nam = +z, về phía máy quay).
 */
window.EQ = window.EQ || {};
(function () {
  const T = window.THREE;
  const W = EQ.world, TS = EQ.TILE, U = EQ.U;
  const W3 = { ok: !!T, active: false, cache: {}, zoom: 1 };
  if (!T) { EQ.world3d = W3; return; }

  let renderer, scene, camera, cv, ov, octx, sun, hemi, sky, clouds, motes, outer;
  let reg = null;          // nhóm đối tượng của vùng đang hiển thị
  let entGroup = null, entsRef = null, monMap = new Map(), player = null, playerKey = '';
  const camPos = new T.Vector3(), camLook = new T.Vector3();
  const uni = { uTime: { value: 0 }, uPlayer: { value: new T.Vector3() }, uCut: { value: 0 } };
  const rnd = (a, b) => a + Math.random() * (b - a);
  function hash(x, y, k) { let h = (x * 374761393 + y * 668265263 + (k || 0) * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

  // ---------- vật liệu tô màu mềm (toon 4 bậc sáng) ----------
  const grad = (function () {
    const d = new Uint8Array([90, 90, 90, 255, 165, 165, 165, 255, 220, 220, 220, 255, 255, 255, 255, 255]);
    const t = new T.DataTexture(d, 4, 1, T.RGBAFormat); t.minFilter = t.magFilter = T.NearestFilter; t.needsUpdate = true; return t;
  })();
  const mats = {};
  // cut = true: tự "khoét" chỗ che khuất nhân vật (cây, nhà, tường đứng trước mặt sẽ trong suốt dạng chấm lưới)
  function toon(col, opt) {
    opt = opt || {};
    const k = col + JSON.stringify(opt);
    if (mats[k]) return mats[k];
    const m = new T.MeshToonMaterial(Object.assign({ color: col, gradientMap: grad }, opt.mat || {}));
    if (opt.vc) m.vertexColors = true;
    if (opt.cut || opt.wind) patch(m, opt);
    return (mats[k] = m);
  }
  function patch(m, opt) {
    m.onBeforeCompile = sh => {
      sh.uniforms.uTime = uni.uTime; sh.uniforms.uPlayer = uni.uPlayer; sh.uniforms.uCut = uni.uCut;
      sh.vertexShader = 'uniform float uTime;\nvarying vec3 vWPos;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + (opt.wind ?
        '#ifdef USE_INSTANCING\n vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);\n#else\n vec3 ip = vec3(0.0);\n#endif\n' +
        ' float sway = sin(uTime * 1.6 + ip.x * 0.55 + ip.z * 0.35) + 0.45 * sin(uTime * 3.1 + ip.x * 1.7);\n' +
        ' transformed.x += sway * ' + (opt.wind === 'grass' ? '0.11' : '0.035') + ' * max(position.y, 0.0);\n transformed.z += sway * 0.03 * max(position.y, 0.0);\n' : ''))
        .replace('#include <project_vertex>', '#include <project_vertex>\n#ifdef USE_INSTANCING\n vWPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;\n#else\n vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\n#endif\n');
      if (opt.cut) {
        sh.fragmentShader = 'uniform vec3 uPlayer;\nuniform float uCut;\nvarying vec3 vWPos;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n' +
          // đứng phía nam (gần máy quay hơn) nhân vật, trong vùng hình nón nhìn từ máy quay → trong suốt dạng lưới chấm
          ' if (uCut > 0.5) { vec2 d = vWPos.xz - uPlayer.xz; float south = vWPos.z - uPlayer.z;\n' +
          '  float r = length(vec2(d.x, (vWPos.y - 0.6) * 0.55));\n' +
          '  if (south > 0.15 && south < 4.5 && r < 1.7 && vWPos.y > 0.3) { float dd = mod(floor(gl_FragCoord.x) + floor(gl_FragCoord.y), 2.0); if (dd < 0.5 || r < 1.1) discard; } }\n');
      } else sh.fragmentShader = 'varying vec3 vWPos;\n' + sh.fragmentShader;
    };
    m.customProgramCacheKey = () => 'eq3d' + (opt.wind || '') + (opt.cut ? 'c' : '');
  }
  const lambert = (col, o) => new T.MeshLambertMaterial(Object.assign({ color: col }, o || {}));

  // ---------- khởi tạo ----------
  W3.init = function () {
    if (renderer || !W3.ok) return !!renderer;
    try {
      const app = document.getElementById('app'), hud = document.getElementById('hud');
      cv = document.createElement('canvas'); cv.id = 'game3d'; cv.width = 960; cv.height = 640;
      ov = document.createElement('canvas'); ov.id = 'game3dov'; ov.width = 960; ov.height = 640;
      app.insertBefore(cv, hud); app.insertBefore(ov, hud);
      octx = ov.getContext('2d');
      renderer = new T.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.setSize(960, 640, false);
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
      renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.95;
      renderer.outputColorSpace = T.SRGBColorSpace;
    } catch (err) {
      console.warn('Không bật được WebGL, dùng đồ họa 2D.', err);
      W3.ok = false; if (cv) cv.remove(); if (ov) ov.remove(); renderer = null; return false;
    }
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(38, 960 / 640, 0.1, 400);
    // ánh sáng: nắng vàng ấm + trời xanh dịu
    hemi = new T.HemisphereLight(0xcfe4ff, 0x5f7f30, 1.05); scene.add(hemi);
    sun = new T.DirectionalLight(0xffe7bf, 2.7);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera; sc.left = -16; sc.right = 16; sc.top = 16; sc.bottom = -16; sc.near = 1; sc.far = 80;
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 4;
    scene.add(sun); scene.add(sun.target);
    buildSky();
    // bắt chuột: bấm để đi / nói chuyện
    cv.addEventListener('click', onClick);
    return true;
  };

  // bầu trời chuyển màu + mây
  function buildSky() {
    const g = new T.SphereGeometry(220, 32, 16);
    const m = new T.ShaderMaterial({
      side: T.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new T.Color(0x3d8fdc) }, mid: { value: new T.Color(0x8fc6f0) }, bot: { value: new T.Color(0xfbf1d6) } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0.18 ? mix(mid, top, smoothstep(0.18, 0.7, h)) : mix(bot, mid, smoothstep(-0.05, 0.18, h)); gl_FragColor = vec4(c, 1.0); }'
    });
    sky = new T.Mesh(g, m); sky.renderOrder = -10; scene.add(sky);
    clouds = new T.Group();
    const cm = new T.MeshLambertMaterial({ color: 0xffffff, emissive: 0xdfe8f5, emissiveIntensity: 0.55, fog: false });
    const ball = new T.IcosahedronGeometry(1, 2);
    for (let i = 0; i < 16; i++) {
      const c = new T.Group();
      const n = 5 + Math.floor(Math.random() * 5);
      for (let k = 0; k < n; k++) {
        const b = new T.Mesh(ball, cm);
        const s = rnd(2.2, 4.4) * (1 - Math.abs(k - n / 2) / n * 0.6);
        b.scale.set(s, s * 0.8, s); b.position.set((k - n / 2) * 2.6 + rnd(-0.5, 0.5), rnd(0, 1.6) + s * 0.25, rnd(-1.2, 1.2));
        c.add(b);
      }
      const a = (i / 16) * Math.PI * 2 + rnd(-0.2, 0.2), r = rnd(70, 120);
      c.position.set(Math.cos(a) * r, rnd(22, 42), Math.sin(a) * r - 20);
      c.userData.a = a; c.userData.r = r;
      clouds.add(c);
    }
    scene.add(clouds);
    // bụi phấn hoa, hạt bồ công anh bay lơ lửng
    const N = 260, pos = new Float32Array(N * 3), seed = new Float32Array(N);
    for (let i = 0; i < N; i++) { pos[i * 3] = rnd(-14, 14); pos[i * 3 + 1] = rnd(0.3, 4); pos[i * 3 + 2] = rnd(-12, 10); seed[i] = Math.random() * 100; }
    const pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(pos, 3)); pg.setAttribute('seed', new T.BufferAttribute(seed, 1));
    const pm = new T.ShaderMaterial({
      transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      uniforms: { uTime: uni.uTime, uCenter: { value: new T.Vector3() } },
      vertexShader: 'attribute float seed; uniform float uTime; uniform vec3 uCenter; varying float vA;\n' +
        'void main(){ vec3 p = position; p.x += sin(uTime*0.3 + seed)*1.5 + uTime*0.25; p.y += sin(uTime*0.7 + seed*2.0)*0.4; p.z += cos(uTime*0.25 + seed)*1.2;\n' +
        ' p.x = mod(p.x + 14.0, 28.0) - 14.0; vec3 w = p + vec3(uCenter.x, 0.0, uCenter.z);\n' +
        ' vec4 mv = modelViewMatrix * vec4(w, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = (2.0 + mod(seed, 2.0)) * (22.0 / -mv.z) * 1.4; vA = 0.25 + 0.25 * sin(uTime*1.5 + seed*3.0); }',
      fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(1.0, 0.96, 0.75, vA * smoothstep(0.5, 0.0, d)); }'
    });
    motes = new T.Points(pg, pm); motes.frustumCulled = false; scene.add(motes);
  }

  // ---------- NỀN ĐẤT VẼ TAY ----------
  const PX = 48;
  const GROUND = {
    village: { grass: ['#86b950', '#93c35a', '#7aad47', '#a6cf63', '#6f9f40'], dirt: ['#d9b47a', '#cfa66a', '#e3c28e'], far: '#7fb04c' },
    forest: { grass: ['#5f9a46', '#6aa64e', '#548c3d', '#7cb35a', '#4a7f37'], dirt: ['#c9a46c', '#b8935d', '#d6b47c'], far: '#5a9242' },
    castle: { grass: ['#86b950', '#93c35a', '#7aad47', '#a6cf63', '#6f9f40'], dirt: ['#c9b9a6', '#b9a995', '#d8cab8'], far: '#7fb04c' },
    wild: { grass: ['#a4b65a', '#b3c266', '#96a84e', '#c4cc78', '#879944'], dirt: ['#d9b47a', '#cfa66a', '#e3c28e'], far: '#9fb258' }
  };
  const isGrassish = ch => '.,"gMTtABRFfrhd'.indexOf(ch) >= 0;
  function paintGround(rows, id) {
    const h = rows.length, w = rows[0].length, P = GROUND[id] || GROUND.village;
    const c = document.createElement('canvas'); c.width = w * PX; c.height = h * PX;
    const g = c.getContext('2d');
    g.fillStyle = P.grass[0]; g.fillRect(0, 0, c.width, c.height);
    const blob = (x, y, rx, ry, col, a) => { g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rnd(-0.6, 0.6), 0, 7); g.fill(); };
    // 1. lớp cỏ: rất nhiều nét cọ nhỏ nhiều sắc xanh
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      const gx = x * PX, gy = y * PX;
      if (isGrassish(ch) || ch === '~') {
        for (let k = 0; k < 16; k++) blob(gx + rnd(0, PX), gy + rnd(0, PX), rnd(5, 14), rnd(3, 7), P.grass[k % 5], rnd(0.35, 0.7));
        if (Math.random() < 0.25) blob(gx + rnd(0, PX), gy + rnd(0, PX), rnd(10, 20), rnd(6, 10), '#d8e48a', 0.18);
      }
    }
    // 2. đường đất & cát: vẽ một lớp liền mạch rồi làm nhòe mép cho mềm như màu nước
    const soft = (test, cols, spread) => {
      const L = document.createElement('canvas'); L.width = c.width; L.height = c.height; const q = L.getContext('2d');
      q.fillStyle = cols[0];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (!test(rows[y][x])) continue;
        const gx = x * PX + PX / 2, gy = y * PX + PX / 2;
        q.beginPath(); q.ellipse(gx, gy, PX * spread, PX * spread, 0, 0, 7); q.fill();
        if (x + 1 < w && test(rows[y][x + 1])) q.fillRect(gx, gy - PX * spread * 0.8, PX, PX * spread * 1.6);
        if (y + 1 < h && test(rows[y + 1][x])) q.fillRect(gx - PX * spread * 0.8, gy, PX * spread * 1.6, PX);
      }
      // vân màu bên trong
      q.globalCompositeOperation = 'source-atop';
      for (let k = 0; k < w * h * 0.8; k++) { q.globalAlpha = rnd(0.15, 0.45); q.fillStyle = cols[1 + (k % (cols.length - 1))]; q.beginPath(); q.ellipse(rnd(0, L.width), rnd(0, L.height), rnd(6, 16), rnd(4, 9), rnd(0, 3), 0, 7); q.fill(); }
      q.globalCompositeOperation = 'source-over'; q.globalAlpha = 1;
      g.save(); g.filter = 'blur(9px)'; g.drawImage(L, 0, 0); g.drawImage(L, 0, 0); g.filter = 'blur(3px)'; g.globalAlpha = 0.8; g.drawImage(L, 0, 0); g.restore();
    };
    soft(ch => ch === '=' || ch === 'b', P.dirt.concat(['#bf9762', '#ecd3a2']), 0.52);
    soft(ch => ch === 's', ['#f1dfa8', '#e8d295', '#f7e9bd', '#e0c788'], 0.6);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ch = rows[y][x], gx = x * PX + PX / 2, gy = y * PX + PX / 2;
      if (ch === '=') { for (let k = 0; k < 3; k++) blob(gx + rnd(-18, 18), gy + rnd(-18, 18), rnd(1.5, 2.6), rnd(1.2, 2), '#a5875e', 0.55); }
      else if (ch === 'S' || ch === 'W' || ch === 'w' || ch === 'P' || ch === 'K') {
        g.globalAlpha = 1; g.fillStyle = (x + y) % 2 ? '#c9c2d6' : '#bdb5cc'; g.fillRect(x * PX, y * PX, PX, PX);
        g.strokeStyle = 'rgba(90,80,110,.35)'; g.lineWidth = 2; g.strokeRect(x * PX + 1, y * PX + 1, PX - 2, PX - 2);
        for (let k = 0; k < 4; k++) blob(gx + rnd(-18, 18), gy + rnd(-18, 18), rnd(4, 10), rnd(3, 6), '#e2dcec', 0.35);
      } else if (ch === 'c') {
        g.globalAlpha = 1; g.fillStyle = '#b8323a'; g.fillRect(x * PX, y * PX, PX, PX);
        g.fillStyle = '#e0b04a'; g.fillRect(x * PX, y * PX + 3, PX, 3); g.fillRect(x * PX, y * PX + PX - 6, PX, 3);
      } else if (ch === ',') { // hoa dại vẽ lên nền
        for (let k = 0; k < 7; k++) blob(gx + rnd(-20, 20), gy + rnd(-20, 20), 2.6, 2.6, ['#ffffff', '#ffe066', '#ff9ec7', '#c9a7ff'][k % 4], 0.95);
      }
    }
    // 3. bóng nhẹ dưới tán cây
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if ('TtA'.indexOf(rows[y][x]) >= 0) blob(x * PX + PX / 2 + 6, y * PX + PX / 2 + 4, PX * 0.55, PX * 0.4, '#2f5a26', 0.25);
    g.globalAlpha = 1;
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 8;
    return tex;
  }

  // gạch đá vẽ tay cho tường lâu đài
  let _brick = null;
  function brickTex() {
    if (_brick) return _brick;
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    g.fillStyle = '#e8e4ee'; g.fillRect(0, 0, 128, 128);
    for (let r = 0; r < 8; r++) for (let k = 0; k < 4; k++) {
      const x = k * 32 + (r % 2) * 16, y = r * 16;
      g.fillStyle = ['#f4f1f7', '#e2dceb', '#ece7f2', '#d9d2e4'][(r * 3 + k) % 4];
      g.fillRect(x + 1, y + 1, 30, 14); g.fillRect(x - 127, y + 1, 30, 14);
    }
    g.strokeStyle = 'rgba(120,105,140,.25)'; g.lineWidth = 1;
    for (let i = 0; i < 40; i++) { g.beginPath(); g.moveTo(Math.random() * 128, Math.random() * 128); g.lineTo(Math.random() * 128, Math.random() * 128); g.globalAlpha = 0.15; g.stroke(); }
    _brick = new T.CanvasTexture(c); _brick.colorSpace = T.SRGBColorSpace; _brick.wrapS = _brick.wrapT = T.RepeatWrapping;
    return _brick;
  }

  // ---------- tiện ích hình khối ----------
  const geo = {
    blob: new T.IcosahedronGeometry(1, 2),
    blobLow: new T.IcosahedronGeometry(1, 1),
    cyl: new T.CylinderGeometry(1, 1, 1, 10),
    cone: new T.ConeGeometry(1, 1, 10),
    box: new T.BoxGeometry(1, 1, 1),
    sph: new T.SphereGeometry(1, 20, 14),
    rock: new T.DodecahedronGeometry(1, 0)
  };
  geo.cyl.translate(0, 0.5, 0); geo.cone.translate(0, 0.5, 0);
  // gom nhiều khối giống nhau thành 1 InstancedMesh (nhanh)
  function Inst(g, m, opt) { this.g = g; this.m = m; this.list = []; this.opt = opt || {}; }
  Inst.prototype.add = function (x, y, z, sx, sy, sz, col, ry) { this.list.push([x, y, z, sx, sy == null ? sx : sy, sz == null ? sx : sz, col, ry || 0]); };
  Inst.prototype.build = function (parent) {
    if (!this.list.length) return null;
    const im = new T.InstancedMesh(this.g, this.m, this.list.length);
    const o = new T.Object3D(), c = new T.Color();
    this.list.forEach((q, i) => {
      o.position.set(q[0], q[1], q[2]); o.scale.set(q[3], q[4], q[5]); o.rotation.set(0, q[7], 0); o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
      if (q[6] != null) im.setColorAt(i, c.set(q[6]));
    });
    im.castShadow = this.opt.cast !== false; im.receiveShadow = this.opt.recv !== false;
    parent.add(im); return im;
  };

  // ---------- DỰNG VÙNG ----------
  function buildRegion(id) {
    const rows = W.rows, h = rows.length, w = rows[0].length;
    const G3 = new T.Group();
    const P = GROUND[id] || GROUND.village;
    // nền vẽ tay
    const ground = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshLambertMaterial({ map: paintGround(rows, id) }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(w / 2, 0, h / 2); ground.receiveShadow = true; G3.add(ground);
    // đồng cỏ bên ngoài bản đồ (để không thấy khoảng trống)
    const far = new T.Mesh(new T.PlaneGeometry(400, 400), new T.MeshLambertMaterial({ color: P.far }));
    far.rotation.x = -Math.PI / 2; far.position.set(w / 2, -0.02, h / 2); far.receiveShadow = true; G3.add(far);

    const leafCols = id === 'forest' ? ['#3f7d3a', '#4b8f40', '#356b31', '#5a9c48'] : id === 'wild' ? ['#6f9a3c', '#7fa845', '#5f8a34', '#8db24f'] : ['#4f9a3e', '#5eab48', '#468a37', '#6fbb52'];
    const leaves = new Inst(geo.blob, toon('#ffffff', { cut: true, wind: 'tree' }));
    const trunks = new Inst(geo.cyl, toon('#7a5233', { cut: true }));
    const pines = new Inst(geo.cone, toon('#ffffff', { cut: true, wind: 'tree' }));
    const apples = new Inst(geo.sph, toon('#e2443b'), { cast: false });
    const rocks = new Inst(geo.rock, toon('#ffffff'));
    const wood = new Inst(geo.box, toon('#9b6a43'));
    const stone = new Inst(geo.box, toon('#ffffff', { cut: true, mat: { map: brickTex() } }));
    const caps = new Inst(geo.sph, toon('#ffffff'));
    const flowers = new Inst(geo.sph, toon('#ffffff'), { cast: false });
    const stems = new Inst(geo.cyl, toon('#4f8a35'), { cast: false });
    const water = [];
    const tree = (x, z, s, cols) => {
      const th = 0.9 * s;
      trunks.add(x, 0, z, 0.13 * s, th, 0.13 * s);
      const n = 4 + Math.floor(hash(x, z, 1) * 3);
      for (let k = 0; k < n; k++) {
        const a = k / n * Math.PI * 2 + hash(x, z, k) * 2, r = 0.35 * s;
        const sz = (0.55 + hash(z, x, k) * 0.25) * s;
        leaves.add(x + Math.cos(a) * r, th + 0.55 * s + hash(x, z, k + 9) * 0.5 * s, z + Math.sin(a) * r * 0.8, sz, sz * 0.88, sz, cols[(k + Math.floor(hash(x, z, 3) * 4)) % cols.length]);
      }
      leaves.add(x, th + 1.1 * s, z, 0.62 * s, 0.55 * s, 0.62 * s, cols[3]); // đỉnh tán sáng hơn
    };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ch = rows[y][x], cx = x + 0.5, cz = y + 0.5, j = hash(x, y, 7) - 0.5;
      if (ch === 'T') tree(cx + j * 0.3, cz + j * 0.2, 1 + hash(x, y, 2) * 0.45, leafCols);
      else if (ch === 't') {
        trunks.add(cx, 0, cz, 0.12, 0.6, 0.12);
        const s = 1 + hash(x, y, 2) * 0.4, pc = ['#2f6a4a', '#3a7a55', '#2a5e43'][Math.floor(hash(x, y, 4) * 3)];
        for (let k = 0; k < 3; k++) pines.add(cx, 0.45 + k * 0.62 * s, cz, (0.72 - k * 0.18) * s, 1.0 * s, (0.72 - k * 0.18) * s, pc);
      } else if (ch === 'A') {
        tree(cx, cz, 0.9, ['#5fae45', '#6dbb4f', '#56a03f', '#7cc85a']);
        for (let k = 0; k < 6; k++) apples.add(cx + Math.cos(k * 1.1) * 0.6, 1.5 + hash(x, y, k) * 0.7, cz + Math.sin(k * 1.1) * 0.5 + 0.2, 0.09);
      } else if (ch === 'B') {
        for (let k = 0; k < 3; k++) leaves.add(cx + (k - 1) * 0.25, 0.28, cz + hash(x, y, k) * 0.2 - 0.1, 0.38, 0.32, 0.36, leafCols[k]);
        if (hash(x, y, 5) < 0.5) for (let k = 0; k < 4; k++) flowers.add(cx + rnd(-0.35, 0.35), rnd(0.35, 0.6), cz + 0.25, 0.05, 0.05, 0.05, '#ff8fb8');
      } else if (ch === 'R') {
        rocks.add(cx + j * 0.2, 0.18, cz, 0.42, 0.32, 0.38, ['#a8a9b4', '#9b9caa', '#b6b4bf'][Math.floor(hash(x, y, 1) * 3)], hash(x, y, 3) * 6);
        rocks.add(cx + 0.3, 0.1, cz + 0.25, 0.18, 0.14, 0.16, '#8f909e', 1);
      } else if (ch === 'F') {
        wood.add(cx, 0.35, cz, 0.1, 0.7, 0.1);
        if ('Fhr'.indexOf(W.tile(x + 1, y)) >= 0 || W.tile(x + 1, y) === 'F') { wood.add(cx + 0.5, 0.48, cz, 1, 0.07, 0.05); wood.add(cx + 0.5, 0.25, cz, 1, 0.07, 0.05); }
        if (W.tile(x, y + 1) === 'F') { wood.add(cx, 0.48, cz + 0.5, 0.05, 0.07, 1); wood.add(cx, 0.25, cz + 0.5, 0.05, 0.07, 1); }
      } else if (ch === 'M') {
        stems.add(cx, 0, cz, 0.06, 0.25, 0.06); caps.add(cx, 0.27, cz, 0.2, 0.12, 0.2, '#d8453c');
        stems.add(cx + 0.25, 0, cz + 0.2, 0.04, 0.15, 0.04); caps.add(cx + 0.25, 0.16, cz + 0.2, 0.12, 0.08, 0.12, '#e9a23b');
      } else if (ch === '"') {
        // cỏ cao: thêm vài cây lau
        for (let k = 0; k < 3; k++) stems.add(cx + rnd(-0.4, 0.4), 0, cz + rnd(-0.4, 0.4), 0.015, rnd(0.5, 0.8), 0.015);
      } else if (ch === 'f') {
        stone.add(cx, 0.1, cz, 0.9, 0.2, 0.9, '#b9b1a3');
        for (let k = 0; k < 6; k++) { stems.add(cx + rnd(-0.3, 0.3), 0.2, cz + rnd(-0.3, 0.3), 0.02, 0.2, 0.02); flowers.add(cx + rnd(-0.3, 0.3), 0.42, cz + rnd(-0.3, 0.3), 0.07, 0.07, 0.07, ['#ff7aa8', '#ffd84d', '#ffffff', '#b48cff'][k % 4]); }
      } else if (ch === 'W' || ch === 'w') {
        stone.add(cx, 0.8, cz, 1.0, 1.6, 1.0, (x + y) % 2 ? '#d9d1e2' : '#cfc6da');
        // răng cưa trên đỉnh tường
        if ((x + y) % 2 === 0) stone.add(cx, 1.75, cz, 0.45, 0.3, 0.45, '#ddd6e6');
        if (ch === 'w') wood.add(cx, 1.0, cz + 0.51, 0.35, 0.45, 0.03);
      } else if (ch === 'P') {
        stone.add(cx, 0.9, cz, 0.42, 1.8, 0.42, '#d6d0e0'); stone.add(cx, 1.85, cz, 0.6, 0.15, 0.6, '#e4def0'); stone.add(cx, 0.06, cz, 0.6, 0.12, 0.6, '#c2bbcf');
      } else if (ch === 'K') {
        wood.add(cx, 0.8, cz, 0.95, 1.6, 0.5);
        for (let k = 0; k < 3; k++) for (let b = 0; b < 5; b++) flowers.add(cx - 0.35 + b * 0.17, 0.35 + k * 0.5, cz + 0.22, 0.06, 0.16, 0.04, ['#c0392b', '#2e86c1', '#27ae60', '#f1c40f', '#8e44ad'][(b + k) % 5]);
      } else if (ch === 'b') {
        for (let k = 0; k < 4; k++) wood.add(cx, 0.06, y + 0.12 + k * 0.25, 1.0, 0.06, 0.2);
      } else if (ch === '~') water.push([x, y]);
      // cỏ và hoa nhỏ trên nền cỏ
    }
    leaves.build(G3); trunks.build(G3); pines.build(G3); apples.build(G3); rocks.build(G3); wood.build(G3);
    stone.build(G3); caps.build(G3); flowers.build(G3); stems.build(G3);
    buildGrass(G3, rows, id);
    buildWater(G3, water);
    buildHouses(G3, rows);
    buildOuterForest(G3, w, h, leafCols);
    return G3;
  }

  // cỏ: hàng nghìn ngọn cỏ đung đưa
  function buildGrass(G3, rows, id) {
    const bg = new T.PlaneGeometry(0.06, 0.24, 1, 3);
    bg.translate(0, 0.12, 0);
    const pa = bg.attributes.position, cols = new Float32Array(pa.count * 3);
    for (let i = 0; i < pa.count; i++) {
      const y = pa.getY(i); const k = 0.82 + y * 0.9;
      cols[i * 3] = k; cols[i * 3 + 1] = k; cols[i * 3 + 2] = k;
      if (y > 0.2) pa.setX(i, 0); // đầu ngọn nhọn
    }
    bg.setAttribute('color', new T.BufferAttribute(cols, 3));
    const m = new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide });
    patch(m, { wind: 'grass' });
    const P = GROUND[id] || GROUND.village;
    const list = [];
    for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[0].length; x++) {
      const ch = rows[y][x];
      const n = ch === '"' ? 30 : (ch === '.' || ch === 'g' || ch === ',') ? 7 : 0;
      for (let k = 0; k < n; k++) list.push([x + Math.random(), y + Math.random(), ch === '"' ? rnd(1.4, 2.4) : rnd(0.5, 1.0), P.grass[(k + 1) % 5]]);
    }
    if (!list.length) return;
    const im = new T.InstancedMesh(bg, m, list.length);
    const o = new T.Object3D(), c = new T.Color();
    list.forEach((q, i) => { o.position.set(q[0], 0, q[1]); o.rotation.set(0, Math.random() * Math.PI, 0); o.scale.set(1, q[2], 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix); im.setColorAt(i, c.set(q[3]).offsetHSL(0, 0, rnd(-0.03, 0.08))); });
    im.receiveShadow = true;
    G3.add(im);
  }

  // hồ nước gợn sóng, lấp lánh
  function buildWater(G3, tiles) {
    if (!tiles.length) return;
    const pos = [], idx = [];
    tiles.forEach((t, i) => {
      const x = t[0], z = t[1], b = i * 4;
      pos.push(x, 0.04, z, x + 1, 0.04, z, x + 1, 0.04, z + 1, x, 0.04, z + 1);
      idx.push(b, b + 2, b + 1, b, b + 3, b + 2);
    });
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    const m = new T.ShaderMaterial({
      uniforms: { uTime: uni.uTime },
      vertexShader: 'varying vec2 vP; void main(){ vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform float uTime; varying vec2 vP;\n' +
        'float n(vec2 p){ return sin(p.x*1.7 + uTime*0.9) * sin(p.y*1.3 - uTime*0.7) + 0.5*sin((p.x+p.y)*3.1 + uTime*1.6); }\n' +
        'void main(){ float v = n(vP); vec3 deep = vec3(0.22, 0.52, 0.72), light = vec3(0.47, 0.78, 0.88);\n' +
        ' vec3 c = mix(deep, light, smoothstep(-1.0, 1.4, v));\n' +
        ' float s = smoothstep(1.25, 1.45, v + 0.35*sin(vP.x*9.0 + uTime*2.0)*sin(vP.y*8.0 - uTime*1.5));\n' +
        ' c += vec3(1.0, 0.98, 0.9) * s * 0.7; gl_FragColor = vec4(c, 1.0); }'
    });
    G3.add(new T.Mesh(g, m));
    // lá súng trên mặt hồ
    const pads = new Inst(new T.CylinderGeometry(1, 1, 0.02, 12), toon('#5b9c45'), { cast: false });
    tiles.forEach((t, i) => { if (hash(t[0], t[1], 11) < 0.12) pads.add(t[0] + 0.5, 0.06, t[1] + 0.5, 0.22, 1, 0.22); });
    pads.build(G3);
  }

  // nhà: gom các ô r/h/d liền nhau thành 1 căn nhà có tường vôi, mái ngói, cửa gỗ, cửa sổ
  function buildHouses(G3, rows) {
    const h = rows.length, w = rows[0].length, seen = new Uint8Array(w * h);
    const isH = (x, y) => x >= 0 && y >= 0 && x < w && y < h && 'rhd'.indexOf(rows[y][x]) >= 0;
    const roofCols = ['#c5523f', '#4f7fa8', '#b2683a', '#5f9a8a', '#9a4f6b'];
    let n = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!isH(x, y) || seen[y * w + x]) continue;
      const q = [[x, y]]; seen[y * w + x] = 1; let x0 = x, x1 = x, y0 = y, y1 = y; const doors = [];
      for (let i = 0; i < q.length; i++) {
        const [a, b] = q[i];
        x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, b); y1 = Math.max(y1, b);
        if (rows[b][a] === 'd') doors.push(a);
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(d => { const nx = a + d[0], ny = b + d[1]; if (isH(nx, ny) && !seen[ny * w + nx]) { seen[ny * w + nx] = 1; q.push([nx, ny]); } });
      }
      const hw = x1 - x0 + 1, hd = y1 - y0 + 1, cx = x0 + hw / 2, cz = y0 + hd / 2;
      const house = new T.Group();
      const wallH = 1.5;
      const body = new T.Mesh(geo.box, toon('#f3e6c8', { cut: true }));
      body.scale.set(hw - 0.1, wallH, hd - 0.15); body.position.set(cx, wallH / 2, cz); body.castShadow = body.receiveShadow = true; house.add(body);
      // khung gỗ kiểu nhà châu Âu trong phim Ghibli
      const beam = toon('#7b5236', { cut: true });
      [[x0 + 0.08, 0], [x1 + 0.92, 0]].forEach(p => { const b = new T.Mesh(geo.box, beam); b.scale.set(0.12, wallH, 0.12); b.position.set(p[0], wallH / 2, y1 + 0.95); house.add(b); });
      const lin = new T.Mesh(geo.box, beam); lin.scale.set(hw, 0.1, 0.1); lin.position.set(cx, wallH - 0.05, y1 + 0.95); house.add(lin);
      // mái ngói hình lăng trụ
      const rc = roofCols[n++ % roofCols.length];
      const sh = new T.Shape(); const rw = hd / 2 + 0.35, rh = 1.2;
      sh.moveTo(-rw, 0); sh.lineTo(0, rh); sh.lineTo(rw, 0); sh.lineTo(-rw, 0);
      const rg = new T.ExtrudeGeometry(sh, { depth: hw + 0.3, bevelEnabled: false }); rg.translate(0, 0, -(hw + 0.3) / 2);
      const roof = new T.Mesh(rg, toon(rc, { cut: true }));
      roof.rotation.y = Math.PI / 2; roof.position.set(cx, wallH, cz); roof.castShadow = roof.receiveShadow = true; house.add(roof);
      // ống khói
      const ch = new T.Mesh(geo.box, toon('#a3816a', { cut: true })); ch.scale.set(0.3, 0.8, 0.3); ch.position.set(x1 + 0.4, wallH + 0.9, cz - 0.3); ch.castShadow = true; house.add(ch);
      // cửa & cửa sổ (mặt nam)
      const fz = y1 + 1 - 0.07 + 0.005;
      doors.forEach(dx => {
        const d = new T.Mesh(geo.box, toon('#6b4226')); d.scale.set(0.5, 0.95, 0.05); d.position.set(dx + 0.5, 0.48, fz); house.add(d);
        const kn = new T.Mesh(geo.sph, toon('#e5c25a')); kn.scale.setScalar(0.035); kn.position.set(dx + 0.67, 0.5, fz + 0.04); house.add(kn);
      });
      for (let wx = x0; wx <= x1; wx++) {
        if (doors.indexOf(wx) >= 0 || (hw > 2 && (wx === x0 || wx === x1) && false)) continue;
        const win = new T.Mesh(geo.box, new T.MeshLambertMaterial({ color: 0xbfe3f5, emissive: 0x6c8fa0, emissiveIntensity: 0.25 }));
        win.scale.set(0.4, 0.38, 0.04); win.position.set(wx + 0.5, 0.95, fz); house.add(win);
        const fr = new T.Mesh(geo.box, beam); fr.scale.set(0.48, 0.05, 0.06); fr.position.set(wx + 0.5, 0.74, fz + 0.01); house.add(fr);
        const pot = new T.Mesh(geo.box, toon('#b5653f')); pot.scale.set(0.42, 0.1, 0.12); pot.position.set(wx + 0.5, 0.7, fz + 0.06); house.add(pot);
        for (let k = 0; k < 3; k++) { const fl = new T.Mesh(geo.sph, toon(['#ff6f91', '#ffd166', '#ffffff'][k])); fl.scale.setScalar(0.055); fl.position.set(wx + 0.38 + k * 0.12, 0.79, fz + 0.07); house.add(fl); }
      }
      G3.add(house);
    }
  }

  // rừng cây phía ngoài mép bản đồ cho cảnh có chiều sâu
  function buildOuterForest(G3, w, h, cols) {
    const leaves = new Inst(geo.blobLow, toon('#ffffff'), { cast: false });
    const trunks = new Inst(geo.cyl, toon('#6e4a2e'), { cast: false });
    for (let i = 0; i < 260; i++) {
      let x = rnd(-14, w + 14), z = rnd(-14, h + 10);
      if (x > -1 && x < w + 1 && z > -1 && z < h + 1) continue;
      const s = rnd(1.2, 2.0);
      trunks.add(x, 0, z, 0.15 * s, 1 * s, 0.15 * s);
      for (let k = 0; k < 3; k++) leaves.add(x + rnd(-0.4, 0.4) * s, 1.4 * s + k * 0.35 * s, z + rnd(-0.3, 0.3) * s, (0.8 - k * 0.15) * s, (0.7 - k * 0.12) * s, (0.8 - k * 0.15) * s, cols[k % cols.length]);
    }
    leaves.build(G3); trunks.build(G3);
  }

  // ---------- NHÂN VẬT & QUÁI: TRANH VẼ TAY DỰNG ĐỨNG (2.5D) ----------
  // Ảnh vẽ bằng EQ.paint (js/engine/paint.js), dán lên tấm "billboard" luôn quay về máy quay, có bóng tròn dưới chân.
  function mk(g, m, sx, sy, sz, x, y, z) { const o = new T.Mesh(g, m); o.scale.set(sx, sy, sz); o.position.set(x, y, z); o.castShadow = true; return o; }
  const texCache = new WeakMap();
  function texOf(cnv) {
    let t = texCache.get(cnv);
    if (!t) { t = new T.CanvasTexture(cnv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; texCache.set(cnv, t); }
    return t;
  }
  let _shTex = null;
  function blobShadow(r) {
    if (!_shTex) {
      const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
      const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(30,40,20,.42)'); gr.addColorStop(1, 'rgba(30,40,20,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64); _shTex = new T.CanvasTexture(c);
    }
    const m = new T.Mesh(new T.PlaneGeometry(r * 2, r * 1.3), new T.MeshBasicMaterial({ map: _shTex, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.025; return m;
  }
  function billboard(h, aspect) {
    const s = new T.Sprite(new T.SpriteMaterial({ transparent: true, alphaTest: 0.06 }));
    s.center.set(0.5, 0.03); s.scale.set(h * aspect, h, 1); return s;
  }
  function makeHuman(look) {
    const g = new T.Group(), s = billboard(1.55, 2 / 3);
    g.add(blobShadow(0.3)); g.add(s);
    g.userData = { spr: s, look, k: '' };
    setHuman(g, 'down', 0);
    return g;
  }
  function setHuman(o, dir, f) {
    const k = dir + f; if (o.userData.k === k) return;
    o.userData.k = k; o.userData.spr.material.map = texOf(EQ.paint.human(o.userData.look, dir, f)); o.userData.spr.material.needsUpdate = true;
  }
  function makeMonster(def, color, size) {
    const g = new T.Group(), s = billboard(size || 0.85, 1);
    g.add(blobShadow((size || 0.85) * 0.42)); g.add(s);
    g.userData = { spr: s, mdef: def, col: color || def.color, k: -1 };
    setMon(g, 0);
    return g;
  }
  function setMon(o, f) {
    if (o.userData.k === f) return;
    o.userData.k = f; o.userData.spr.material.map = texOf(EQ.paint.monster(o.userData.mdef, o.userData.col, f)); o.userData.spr.material.needsUpdate = true;
  }
  function crown(parent, y, col) {
    const m = toon(col, { mat: { emissive: new T.Color(col).multiplyScalar(0.25) } });
    parent.add(mk(geo.cyl, m, 0.15, 0.07, 0.15, 0, y, 0));
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; parent.add(mk(geo.cone, m, 0.035, 0.09, 0.035, Math.cos(a) * 0.13, y + 0.07, Math.sin(a) * 0.13)); }
  }

  // ---------- ĐỒ VẬT, QUẦY, CỔNG... ----------
  const emojiTex = {};
  function emojiSprite(e, size, gray) {
    const k = e + (gray ? 'g' : '');
    if (!emojiTex[k]) {
      const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
      g.font = '100px ' + (EQ.sprites.EMOJI_FONT || 'sans-serif'); g.textAlign = 'center'; g.textBaseline = 'middle';
      if (gray) g.filter = 'grayscale(1) brightness(1.1)';
      g.fillText(e, 64, 70);
      emojiTex[k] = new T.CanvasTexture(c); emojiTex[k].colorSpace = T.SRGBColorSpace;
    }
    const s = new T.Sprite(new T.SpriteMaterial({ map: emojiTex[k], transparent: true }));
    s.scale.set(size, size, 1); return s;
  }
  const imgTex = {};
  function imgSprite(key, size) {
    if (!EQ.MG_IMG || !EQ.MG_IMG[key]) return null;
    if (!imgTex[key]) { imgTex[key] = new T.TextureLoader().load(EQ.MG_IMG[key]); imgTex[key].colorSpace = T.SRGBColorSpace; }
    const s = new T.Sprite(new T.SpriteMaterial({ map: imgTex[key], transparent: true })); s.scale.set(size, size, 1); return s;
  }
  function stripes(col) {
    const c = document.createElement('canvas'); c.width = 64; c.height = 8; const g = c.getContext('2d');
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#fffaf0' : col; g.fillRect(i * 8, 0, 8, 8); }
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
  }
  function stall(col, top) {
    const g = new T.Group(), wd = toon('#8b5e3c');
    [[-0.42, -0.3], [0.42, -0.3], [-0.42, 0.3], [0.42, 0.3]].forEach(p => g.add(mk(geo.cyl, wd, 0.04, 1.2, 0.04, p[0], 0, p[1])));
    g.add(mk(geo.box, toon('#c49a6c'), 0.95, 0.45, 0.55, 0, 0.23, 0.1));
    const aw = new T.Mesh(new T.CylinderGeometry(0.6, 0.6, 1.05, 16, 1, false, 0, Math.PI), new T.MeshToonMaterial({ map: stripes(col), gradientMap: grad }));
    aw.rotation.z = Math.PI / 2; aw.scale.set(1, 1, 0.45); aw.position.set(0, 1.18, 0); aw.castShadow = true; g.add(aw);
    if (top) { top.position.set(0, 1.75, 0); g.add(top); }
    return g;
  }
  function makeDeco(kind, e) {
    const g = new T.Group(), wd = toon('#8b5e3c'), st = toon('#b8b2c4');
    if (kind === 'booth') return stall((e && e.col) || '#ec407a', imgSprite(e.icon, 0.7) || emojiSprite((EQ.arcade && EQ.arcade.GAMES[e.game] || {}).icon || '🎮', 0.6));
    if (kind === 'stall' || kind === 'jewelstall') return stall(kind === 'jewelstall' ? '#7e57c2' : '#e57373', e && e.e ? emojiSprite(e.e, 0.55) : null);
    if (kind === 'well') { g.add(mk(geo.cyl, st, 0.42, 0.55, 0.42, 0, 0, 0)); g.add(mk(geo.cyl, new T.MeshLambertMaterial({ color: 0x3f7fa8 }), 0.34, 0.56, 0.34, 0, 0, 0)); [-0.38, 0.38].forEach(x => g.add(mk(geo.cyl, wd, 0.04, 1.2, 0.04, x, 0, 0))); const r = mk(geo.cone, toon('#b5523f'), 0.6, 0.4, 0.45, 0, 1.15, 0); g.add(r); return g; }
    if (kind === 'fountain') {
      g.add(mk(geo.cyl, st, 0.55, 0.3, 0.55, 0, 0, 0)); g.add(mk(geo.cyl, new T.MeshLambertMaterial({ color: 0x6fc1e0, emissive: 0x1d5d7a, emissiveIntensity: 0.3 }), 0.47, 0.31, 0.47, 0, 0, 0));
      g.add(mk(geo.cyl, st, 0.1, 0.8, 0.1, 0, 0, 0)); g.add(mk(geo.cyl, st, 0.25, 0.08, 0.25, 0, 0.75, 0));
      const sp = mk(geo.sph, new T.MeshBasicMaterial({ color: 0xd8f3ff, transparent: true, opacity: 0.6 }), 0.12, 0.25, 0.12, 0, 0.95, 0); sp.userData.spray = true; g.add(sp); return g;
    }
    if (kind === 'lamp') { g.add(mk(geo.cyl, toon('#455a64'), 0.04, 1.4, 0.04, 0, 0, 0)); const l = mk(geo.sph, new T.MeshBasicMaterial({ color: 0xffe9a8 }), 0.12, 0.14, 0.12, 0, 1.45, 0); g.add(l); const glow = emojiSprite('✨', 0.4); glow.position.y = 1.45; g.add(glow); return g; }
    if (kind === 'banner') { g.add(mk(geo.cyl, toon('#5d4037'), 0.03, 1.8, 0.03, 0, 0, 0)); const f = mk(geo.box, toon('#c62828'), 0.5, 0.75, 0.02, 0.27, 1.35, 0); g.add(f); g.add(mk(geo.box, toon('#ffd54f'), 0.5, 0.06, 0.03, 0.27, 1.0, 0)); return g; }
    if (kind === 'barrel') { g.add(mk(geo.cyl, toon('#9a6a3e'), 0.3, 0.65, 0.3, 0, 0, 0)); g.add(mk(geo.cyl, toon('#5d4a3a'), 0.31, 0.05, 0.31, 0, 0.12, 0)); g.add(mk(geo.cyl, toon('#5d4a3a'), 0.31, 0.05, 0.31, 0, 0.48, 0)); return g; }
    if (kind === 'crate') { g.add(mk(geo.box, toon('#b07a45'), 0.6, 0.6, 0.6, 0, 0.3, 0)); return g; }
    if (kind === 'log') { const l = mk(geo.cyl, toon('#8a5a36'), 0.2, 1.0, 0.2, -0.5, 0.2, 0); l.rotation.z = -Math.PI / 2; g.add(l); return g; }
    if (kind === 'desk') { g.add(mk(geo.box, wd, 0.9, 0.08, 0.6, 0, 0.55, 0)); [[-0.4, -0.25], [0.4, -0.25], [-0.4, 0.25], [0.4, 0.25]].forEach(p => g.add(mk(geo.box, wd, 0.06, 0.55, 0.06, p[0], 0.27, p[1]))); g.add(mk(geo.box, toon('#f5f5f5'), 0.3, 0.02, 0.22, 0.1, 0.6, 0)); return g; }
    if (kind === 'throne') { g.add(mk(geo.box, toon('#8e24aa'), 0.7, 0.5, 0.6, 0, 0.25, 0)); g.add(mk(geo.box, toon('#ffca28'), 0.8, 1.3, 0.12, 0, 0.65, -0.3)); crown(g, 1.35, '#ffd54f'); return g; }
    if (kind === 'tower') { g.add(mk(geo.cyl, st, 0.55, 2.6, 0.55, 0, 0, 0)); g.add(mk(geo.cone, toon('#5c6bc0'), 0.7, 1.1, 0.7, 0, 2.6, 0)); g.add(mk(geo.box, toon('#4e342e'), 0.35, 0.6, 0.05, 0, 0.3, 0.55)); return g; }
    if (kind === 'jobboard' || kind === 'board') {
      [-0.4, 0.4].forEach(x => g.add(mk(geo.cyl, wd, 0.04, 1.1, 0.04, x, 0, 0)));
      g.add(mk(geo.box, toon('#c79a64'), 0.95, 0.65, 0.06, 0, 0.8, 0));
      for (let i = 0; i < 4; i++) g.add(mk(geo.box, toon(['#fff8e1', '#e3f2fd', '#fce4ec', '#f1f8e9'][i]), 0.18, 0.22, 0.01, -0.3 + i * 0.2, 0.82 + (i % 2) * 0.08, 0.04));
      if (e && e.e) { const s = emojiSprite(e.e, 0.4); s.position.y = 1.4; g.add(s); }
      return g;
    }
    if (kind === 'wboss') { const bossDef = EQ.wild && EQ.wild.def || { draw: 'golem', color: '#7e57c2', crown: true }; const b = makeMonster(bossDef, bossDef.color, 2.9); g.add(b); g.userData.boss = b; return g; }
    // không rõ loại: hộp gỗ nhỏ
    g.add(mk(geo.box, toon('#b07a45'), 0.5, 0.5, 0.5, 0, 0.25, 0));
    return g;
  }
  function makeEnt(e, p) {
    let o;
    if (e.kind === 'npc' && e.draw) o = makeDeco(e.draw, e);
    else if (e.kind === 'npc' && e.look) o = makeHuman(e.look);
    else if (e.kind === 'npc') {
      o = new T.Group();
      if (e.statue) { o.add(mk(geo.box, toon('#b0aebb'), 0.7, 0.35, 0.7, 0, 0.17, 0)); const s = emojiSprite(e.e, 1.0, true); s.position.y = 0.85; o.add(s); }
      else { const s = emojiSprite(e.e || '🙂', 0.95); s.position.y = 0.5; s.userData.bob = true; o.add(s); o.add(mk(geo.cyl, new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 }), 0.25, 0.01, 0.25, 0, 0.01, 0)); }
    } else if (e.kind === 'boss') { const d = EQ.BOSSES[e.boss]; o = new T.Group(); const b = makeMonster(d, d.color, 2.3); o.add(b); o.userData.boss = b; }
    else if (e.kind === 'chest') {
      o = new T.Group(); const open = !!p.flags['chest:' + e.id];
      o.add(mk(geo.box, toon('#9a5f2e'), 0.6, 0.35, 0.42, 0, 0.18, 0));
      o.add(mk(geo.box, toon('#e2b13c'), 0.62, 0.05, 0.44, 0, 0.3, 0));
      const lid = new T.Group(); lid.position.set(0, 0.35, -0.21);
      lid.add(mk(geo.box, toon('#a86a35'), 0.6, 0.14, 0.42, 0, 0.07, 0.21)); if (open) lid.rotation.x = -1.6; o.add(lid);
      if (!open && (e.secret || EQ.game.stageIs(p, e.quest, 'chest'))) { const s = emojiSprite('✨', 0.5); s.position.y = 0.75; s.userData.bob = true; o.add(s); }
    } else if (e.kind === 'gate') {
      o = new T.Group();
      [-0.45, 0.45].forEach(x => o.add(mk(geo.box, toon('#9e97b5'), 0.22, 1.6, 0.3, x, 0.8, 0)));
      const pl = new T.Mesh(new T.PlaneGeometry(0.7, 1.4), new T.MeshBasicMaterial({ color: e.style === 'magic' ? 0xb388ff : 0x80d8ff, transparent: true, opacity: 0.55, side: T.DoubleSide }));
      pl.position.y = 0.75; pl.userData.shimmer = true; o.add(pl);
    } else if (e.kind === 'portal') {
      o = new T.Group(); const open = !e.need || EQ.game.need(p, e.need);
      const ring = new T.Mesh(new T.TorusGeometry(0.42, 0.06, 10, 32), new T.MeshBasicMaterial({ color: open ? 0x8ee9ff : 0xff8a80 }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; o.add(ring);
      const disk = new T.Mesh(new T.CircleGeometry(0.4, 32), new T.MeshBasicMaterial({ color: open ? 0xb9f3ff : 0xffb3ab, transparent: true, opacity: 0.45 }));
      disk.rotation.x = -Math.PI / 2; disk.position.y = 0.04; disk.userData.spin = true; o.add(disk);
      const s = emojiSprite(open ? '✨' : '🔒', 0.5); s.position.y = 0.6; s.userData.bob = true; o.add(s);
    } else if (e.kind === 'sign') {
      o = new T.Group(); o.add(mk(geo.cyl, toon('#7b5236'), 0.04, 0.8, 0.04, 0, 0, 0)); o.add(mk(geo.box, toon('#c79a64'), 0.6, 0.32, 0.05, 0, 0.75, 0));
    } else if (e.kind === 'pickup') {
      o = new T.Group(); const s = emojiSprite(e.e || '⭐', 0.55, false); s.position.y = 0.45; s.userData.bob = true; o.add(s);
    } else if (e.kind === 'deco') {
      o = e.draw ? makeDeco(e.draw, e) : new T.Group();
      if (e.e) { const s = emojiSprite(e.e, e.draw ? 0.45 : 0.85); s.position.y = e.draw ? 1.1 : 0.45; o.add(s); }
    } else o = new T.Group();
    o.position.set(e.x + 0.5, 0, e.y + 0.6);
    o.userData.ent = e;
    o.traverse(c => { c.userData.entRoot = o; });
    return o;
  }

  // ---------- CẬP NHẬT MỖI KHUNG HÌNH ----------
  function syncEnts(p) {
    if (entsRef === W.ents && entGroup) return;
    if (entGroup) reg.remove(entGroup);
    entGroup = new T.Group(); entsRef = W.ents;
    W.ents.forEach(e => entGroup.add(makeEnt(e, p)));
    reg.add(entGroup);
  }
  function syncMonsters(t) {
    const live = new Set(W.monsters);
    monMap.forEach((o, m) => { if (!live.has(m)) { reg.remove(o); monMap.delete(m); } });
    W.monsters.forEach(m => {
      let o = monMap.get(m);
      if (!o) { o = makeMonster(m.def, m.color, m.elite ? 1.2 : 0.85); monMap.set(m, o); reg.add(o); }
      o.position.set(m.x / TS, 0, m.y / TS);
      setMon(o, Math.floor(t * 6 + (m.phase || 0) * 3) % 4);
    });
  }
  function syncPlayer(p, t) {
    const look = EQ.sprites.playerLook(p.avatar);
    const key = JSON.stringify(look);
    if (!player || key !== playerKey) { if (player) scene.remove(player); player = makeHuman(look); playerKey = key; scene.add(player); }
    const pl = W.player;
    player.position.set(pl.x / TS, 0, pl.y / TS);
    setHuman(player, pl.dir, pl.moving ? Math.floor(pl.anim) % 4 : 0);
  }

  function loadRegion(p) {
    if (reg) scene.remove(reg);
    monMap.forEach(o => reg && reg.remove(o)); monMap = new Map();
    reg = W3.cache[W.id] || (W3.cache[W.id] = buildRegion(W.id));
    scene.add(reg);
    entGroup && reg.remove(entGroup); entGroup = null; entsRef = null;
    reg.userData.id = W.id;
    const fogC = new T.Color(W.id === 'forest' ? 0xbfd9c9 : W.id === 'castle' ? 0xd6d2e6 : 0xe9efd9);
    scene.fog = new T.Fog(fogC, 22, 60);
    W3.loadedFor = W.id + ':' + W.rows.length;
    // vị trí máy quay ngay lập tức
    W3.snap = true;
  }

  // ---------- VẼ ----------
  // trình duyệt tự động (bot kiểm thử) dùng 2D cho nhanh, trừ khi bật W3.forceTest
  W3.enabled = () => W3.ok && EQ.store.settings().gfx3d !== false && !(navigator.webdriver && !W3.forceTest);
  W3.render = function (p, dt) {
    if (!W3.enabled() || !W.id) { W3.hide(); return false; }
    if (!renderer && !W3.init()) return false;
    if (!W3.active) { cv.style.display = ''; ov.style.display = ''; document.getElementById('game').style.visibility = 'hidden'; W3.active = true; }
    const t = W.t;
    uni.uTime.value = t;
    if (!reg || reg.userData.id !== W.id || W3.loadedFor !== W.id + ':' + W.rows.length) loadRegion(p);
    syncEnts(p);
    syncMonsters(t);
    syncPlayer(p, t);
    // hoạt ảnh đồ vật
    entGroup.children.forEach(o => {
      const e = o.userData.ent;
      if (e.kind === 'npc' && e.look) {
        // quay mặt về phía người chơi khi đứng gần
        let dir = 'down';
        if (W.target === e) { const dx = W.player.x / TS - o.position.x, dz = W.player.y / TS - o.position.z; dir = Math.abs(dx) > Math.abs(dz) ? (dx < 0 ? 'left' : 'right') : (dz < 0 ? 'up' : 'down'); }
        setHuman(o, dir, 0);
      }
      if (o.userData.boss) setMon(o.userData.boss, Math.floor(t * 5 + e.x) % 4);
      o.traverse(c => {
        if (c.userData.bob) c.position.y = (c.userData.y0 == null ? (c.userData.y0 = c.position.y) : c.userData.y0) + Math.sin(t * 3 + e.x) * 0.06;
        if (c.userData.spin) c.rotation.z = t * 1.5;
        if (c.userData.shimmer) c.material.opacity = 0.4 + Math.sin(t * 3) * 0.15;
        if (c.userData.spray) c.scale.y = 0.22 + Math.sin(t * 8) * 0.04;
      });
    });
    // máy quay theo sau, nhìn chếch xuống
    const px = W.player.x / TS, pz = W.player.y / TS;
    const tgt = new T.Vector3(px, 0.6, pz);
    const cpos = new T.Vector3(px, 9.5 * W3.zoom, pz + 10.5 * W3.zoom);
    if (W3.snap || camPos.distanceTo(cpos) > 8) { camPos.copy(cpos); camLook.copy(tgt); W3.snap = false; }
    camPos.lerp(cpos, Math.min(1, dt * 5)); camLook.lerp(tgt, Math.min(1, dt * 6));
    camera.position.copy(camPos); camera.lookAt(camLook);
    uni.uPlayer.value.set(px, 0, pz); uni.uCut.value = 1;
    // nắng & bóng đổ đi theo người chơi
    sun.position.set(px - 9, 16, pz + 6); sun.target.position.set(px, 0, pz);
    sky.position.set(px, 0, pz);
    clouds.position.set(px, 0, pz);
    clouds.children.forEach((c, i) => { const a = c.userData.a + t * 0.004; c.position.x = Math.cos(a) * c.userData.r; c.position.z = Math.sin(a) * c.userData.r - 20; });
    motes.material.uniforms.uCenter.value.set(px, 0, pz);
    renderer.render(scene, camera);
    drawOverlay(p, t);
    return true;
  };
  W3.hide = function () {
    if (!W3.active) return;
    W3.active = false;
    if (cv) { cv.style.display = 'none'; ov.style.display = 'none'; }
    document.getElementById('game').style.visibility = '';
  };

  // ---------- LỚP CHỮ 2D PHỦ TRÊN CẢNH 3D ----------
  const v3 = new T.Vector3();
  function proj(x, y, z) { v3.set(x, y, z).project(camera); return { x: (v3.x * 0.5 + 0.5) * 960, y: (-v3.y * 0.5 + 0.5) * 640, ok: v3.z < 1 }; }
  function drawOverlay(p, t) {
    const c = octx; c.clearRect(0, 0, 960, 640);
    const B = W.bubble, pl = W.player;
    W.ents.forEach(e => {
      if (['npc', 'boss', 'pickup', 'chest', 'gate', 'sign'].indexOf(e.kind) < 0) return;
      const hgt = e.kind === 'boss' ? 2.4 : e.draw === 'wboss' ? 2.3 : e.draw === 'booth' || e.draw === 'stall' || e.draw === 'jewelstall' ? 2.05 : e.draw === 'tower' ? 3.9 : e.kind === 'npc' ? 1.65 : 0.9;
      const s = proj(e.x + 0.5, hgt, e.y + 0.6); if (!s.ok) return;
      const near = W.target === e;
      const d = Math.hypot(pl.x / TS - e.x - 0.5, pl.y / TS - e.y - 0.6);
      if (e.kind === 'npc' || e.kind === 'boss') {
        const mk2 = EQ.game.marker(p, e);
        if (mk2) B(c, s.x, s.y - 26 + Math.sin(t * 5) * 3, mk2 === '!' ? '!' : '…', mk2 === '!' ? '#ffd54f' : '#80d8ff', '#3b2a00', 'bold 16px system-ui');
        if (e.name && (near || d < 11)) {
          c.save(); c.globalAlpha = near ? 1 : d < 6 ? 0.95 : Math.max(0, 0.95 - (d - 6) * 0.19);
          const shop = W.isShop(e);
          B(c, s.x, s.y, W.label(e), near ? 'rgba(30,25,60,.9)' : shop ? 'rgba(255,213,79,.92)' : 'rgba(30,25,60,.62)', near ? '#fff' : shop ? '#3b2a00' : '#fff', near ? 'bold 13px "Baloo 2", system-ui, sans-serif' : 'bold 11px "Baloo 2", system-ui, sans-serif');
          c.restore();
        }
      }
      if (e.kind === 'pickup' && near) B(c, s.x, s.y - 12, e.label, 'rgba(30,25,60,.85)', '#fff');
      if (near) B(c, s.x + 34, s.y + 24, 'E', '#ffffff', '#4527a0', 'bold 14px system-ui');
    });
    // nhãn sức mạnh quái
    const pw = EQ.rpg.power(p);
    W.monsters.forEach(m => {
      const s = proj(m.x / TS, m.elite ? 1.15 : 0.85, m.y / TS); if (!s.ok) return;
      const rec = m.def.rec || W.monsterRec(m.def), r = pw / rec, col = r >= 1.2 ? '#69f0ae' : r >= 0.85 ? '#ffd54f' : '#ff5252';
      B(c, s.x, s.y, (m.elite ? '⭐' : '') + '💪' + rec + ' • ' + EQ.rpg.hitsToKill(p, m.def.hp) + '⚔️', 'rgba(20,15,40,.8)', col, 'bold 10px "Baloo 2", system-ui, sans-serif');
    });
    // đường đi bằng chuột + vòng chỗ bấm
    if (W.path && W.path.length) { c.fillStyle = 'rgba(255,255,255,.75)'; W.path.forEach((n, i) => { if (i % 2) return; const s = proj(n[0] + 0.5, 0.05, n[1] + 0.75); c.beginPath(); c.arc(s.x, s.y, 3, 0, 7); c.fill(); }); }
    if (W.mark) { const k = W.mark.t / 0.9, s = proj(W.mark.x / TS, 0.05, W.mark.y / TS); c.strokeStyle = W.mark.ent ? 'rgba(255,235,59,' + k + ')' : 'rgba(255,255,255,' + k + ')'; c.lineWidth = 3; c.beginPath(); c.ellipse(s.x, s.y, 8 + (1 - k) * 14, 4 + (1 - k) * 7, 0, 0, 7); c.stroke(); }
    // mũi tên chỉ nhiệm vụ
    const tg = EQ.game.questTarget && EQ.game.questTarget(p);
    if (tg) {
      const tx = tg.x + 0.5, tz = tg.y + 0.5, d = Math.hypot(tx - pl.x / TS, tz - pl.y / TS);
      if (d > 1.6) {
        const s = proj(tx, 1.9 + Math.sin(t * 6) * 0.1, tz);
        if (s.ok && s.x > 0 && s.x < 960 && s.y > 0 && s.y < 640) { c.fillStyle = '#ffd54f'; c.strokeStyle = '#5d4300'; c.lineWidth = 2; c.beginPath(); c.moveTo(s.x - 9, s.y - 12); c.lineTo(s.x + 9, s.y - 12); c.lineTo(s.x, s.y + 2); c.closePath(); c.fill(); c.stroke(); }
        if (d > 3) {
          const a = proj(pl.x / TS, 0.1, pl.y / TS), b = proj(tx, 0.1, tz), ang = Math.atan2(b.y - a.y, b.x - a.x);
          c.save(); c.translate(a.x + Math.cos(ang) * 46, a.y + Math.sin(ang) * 46); c.rotate(ang); c.globalAlpha = 0.75 + Math.sin(t * 6) * 0.25;
          c.fillStyle = '#ffd54f'; c.strokeStyle = '#5d4300'; c.lineWidth = 2; c.beginPath(); c.moveTo(12, 0); c.lineTo(-7, -8); c.lineTo(-3, 0); c.lineTo(-7, 8); c.closePath(); c.fill(); c.stroke(); c.restore();
        }
      }
    }
    // hiệu ứng nổ hạt & chữ bay (tọa độ điểm ảnh 2D → chiếu sang 3D)
    W.particles.forEach(q => { const s = proj(q.x / TS, 0.9, q.y / TS + 0.9); c.globalAlpha = Math.min(1, q.life * 2); c.fillStyle = q.color; c.fillRect(s.x - q.size, s.y - q.size, q.size * 2, q.size * 2); });
    c.globalAlpha = 1;
    c.textAlign = 'center'; c.font = 'bold 20px "Baloo 2", system-ui, sans-serif';
    W.floaters.forEach(f => { const s = proj(f.x / TS, 1.5, f.y / TS + 1.4); c.globalAlpha = Math.min(1, f.life); c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.6)'; c.strokeText(f.text, s.x, s.y); c.fillStyle = f.color; c.fillText(f.text, s.x, s.y); });
    c.globalAlpha = 1;
    if (W.fade > 0) { c.fillStyle = 'rgba(10,8,30,' + W.fade + ')'; c.fillRect(0, 0, 960, 640); }
  }

  // ---------- BẤM CHUỘT TRONG 3D ----------
  const ray = new T.Raycaster(), mouse = new T.Vector2();
  function onClick(ev) {
    const G = EQ.game;
    if (!G || G.mode !== 'play' || EQ.ui.busy() || G.lock || !W3.active) return;
    const r = cv.getBoundingClientRect();
    mouse.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, camera);
    let wx, wy;
    // bấm trúng NPC / quầy / rương...
    const hits = entGroup ? ray.intersectObjects(entGroup.children, true) : [];
    const hit = hits.find(h => h.object.userData.entRoot);
    if (hit) { const e = hit.object.userData.entRoot.userData.ent; wx = (e.x + 0.5) * TS; wy = (e.y + 0.5) * TS; }
    else {
      const o = ray.ray.origin, d = ray.ray.direction;
      if (Math.abs(d.y) < 1e-4) return;
      const k = -o.y / d.y; if (k < 0) return;
      wx = (o.x + d.x * k) * TS; wy = (o.z + d.z * k) * TS;
    }
    if (W.clickWorld(wx, wy) === 'interact') G.interact();
  }

  W3.toggle = function () {
    const s = EQ.store.settings(); s.gfx3d = !(s.gfx3d !== false);
    if (EQ.store.save) EQ.store.save();
    if (!s.gfx3d) W3.hide();
    return s.gfx3d;
  };
  W3._cam = () => camera;
  EQ.world3d = W3;
})();
