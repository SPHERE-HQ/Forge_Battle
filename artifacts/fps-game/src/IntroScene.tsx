import { useEffect, useRef } from "react";

function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }
function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }
function invLerp(a: number, b: number, v: number) { return clamp((v - a) / (b - a), 0, 1); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function range(v: number, a: number, b: number, c: number, d: number) {
  return lerp(c, d, invLerp(a, b, v));
}

/* ─────────────────────────────────────────────────────────────
   CSS-ONLY FALLBACK (no WebGL)
   Used when the browser / preview cannot create a WebGL context.
───────────────────────────────────────────────────────────── */
function CSSFallbackIntro({ onComplete }: { onComplete?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current!;

    const style = document.createElement("style");
    style.textContent = `
      @keyframes fa-particles {
        0%   { transform: scale(0) rotate(0deg); opacity: 0; }
        40%  { opacity: 1; }
        100% { transform: scale(1.4) rotate(720deg); opacity: 0.85; }
      }
      @keyframes fa-sphere-pulse {
        0%,100% { box-shadow: 0 0 60px 20px #00ccff88, 0 0 120px 60px #0044ff33; transform: scale(1); }
        50%     { box-shadow: 0 0 80px 30px #00eeffaa, 0 0 160px 80px #0066ff44; transform: scale(1.07); }
      }
      @keyframes fa-ring-spin {
        from { transform: rotateX(60deg) rotateZ(0deg); }
        to   { transform: rotateX(60deg) rotateZ(360deg); }
      }
      @keyframes fa-ring2-spin {
        from { transform: rotateX(30deg) rotateY(0deg); }
        to   { transform: rotateX(30deg) rotateY(-360deg); }
      }
      @keyframes fa-fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes fa-slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes fa-zoomIn  { from { opacity: 0; transform: scale(2.8); } to { opacity: 1; transform: scale(1); } }
      @keyframes fa-flash   { 0% { opacity: 0; } 15% { opacity: 0.9; } 80% { opacity: 0; } 100% { opacity: 0; } }
      @keyframes fa-fire-rise { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(-60px); opacity: 0; } }
      @keyframes fa-extend-line { from { scaleX: 0; } to { scaleX: 1; } }
    `;
    el.appendChild(style);

    // ── Phase 1: SPHERE HQ ──────────────────────────────────────
    el.innerHTML = "";
    el.appendChild(style);

    const p1 = document.createElement("div");
    p1.style.cssText = "position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;";

    // Particle ring
    for (let i = 0; i < 32; i++) {
      const p = document.createElement("div");
      const angle = (i / 32) * 360;
      const radius = 110 + Math.random() * 50;
      const hue = [190, 210, 270][i % 3];
      p.style.cssText = `
        position:absolute;width:${3 + Math.random()*4}px;height:${3 + Math.random()*4}px;
        border-radius:50%;background:hsl(${hue},100%,70%);
        left:calc(50% + ${Math.cos(angle*Math.PI/180)*radius}px);
        top:calc(50% + ${Math.sin(angle*Math.PI/180)*radius}px);
        animation:fa-particles ${1.2+Math.random()*0.8}s ease-out ${Math.random()*0.4}s both;
        box-shadow:0 0 8px 2px hsl(${hue},100%,70%);
      `;
      p1.appendChild(p);
    }

    // Sphere
    const sphere = document.createElement("div");
    sphere.style.cssText = `
      width:90px;height:90px;border-radius:50%;
      background:radial-gradient(circle at 35% 35%, #00eeff, #0033cc);
      animation:fa-sphere-pulse 1.5s ease-in-out infinite, fa-fadeIn 0.5s ease 0.3s both;
      position:relative;z-index:2;
    `;

    // Rings
    const ringWrap = document.createElement("div");
    ringWrap.style.cssText = "position:absolute;width:200px;height:200px;left:calc(50%-100px);top:calc(50%-100px);";
    const r1 = document.createElement("div");
    r1.style.cssText = "position:absolute;inset:-5px;border-radius:50%;border:2px solid #00d4ff66;animation:fa-ring-spin 3s linear infinite;";
    const r2 = document.createElement("div");
    r2.style.cssText = "position:absolute;inset:10px;border-radius:50%;border:1.5px solid #4488ff55;animation:fa-ring2-spin 4s linear infinite;";
    const r3 = document.createElement("div");
    r3.style.cssText = "position:absolute;inset:-25px;border-radius:50%;border:1px solid #8844ff44;animation:fa-ring-spin 5s linear infinite reverse;";
    ringWrap.appendChild(r1); ringWrap.appendChild(r2); ringWrap.appendChild(r3);

    const title = document.createElement("div");
    title.textContent = "SPHERE  HQ";
    title.style.cssText = `
      font:900 clamp(28px,6vw,52px) 'Arial Black',Arial,sans-serif;
      color:#fff;letter-spacing:0.18em;margin-top:24px;
      text-shadow:0 0 24px #00ccff,0 0 60px #0066ff,0 0 4px #fff;
      animation:fa-fadeIn 0.7s ease 1.5s both;position:relative;z-index:2;
    `;
    const presents = document.createElement("div");
    presents.textContent = "— PRESENTS —";
    presents.style.cssText = `
      font:300 clamp(12px,2.5vw,18px) Arial,sans-serif;
      color:#88ccff;letter-spacing:0.3em;margin-top:10px;
      text-shadow:0 0 16px #0066ff;
      animation:fa-fadeIn 0.5s ease 2s both;position:relative;z-index:2;
    `;

    p1.appendChild(ringWrap);
    p1.appendChild(sphere);
    p1.appendChild(title);
    p1.appendChild(presents);
    el.appendChild(p1);

    // ── Phase 2: FORGE ARENA ────────────────────────────────────
    const timer1 = setTimeout(() => {
      el.innerHTML = "";
      el.appendChild(style);

      // Flash overlay
      const flash = document.createElement("div");
      flash.style.cssText = "position:absolute;inset:0;background:#ff5500;animation:fa-flash 0.6s ease forwards;z-index:10;pointer-events:none;";
      el.appendChild(flash);

      const p2 = document.createElement("div");
      p2.style.cssText = "position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;";

      // Fire particles (CSS)
      for (let i = 0; i < 40; i++) {
        const f = document.createElement("div");
        const size = 4 + Math.random() * 8;
        const x = 50 + (Math.random() - 0.5) * 80;
        const delay = Math.random() * 1.5;
        const hue = Math.random() < 0.5 ? 20 : 40;
        f.style.cssText = `
          position:absolute;
          left:${x}%;bottom:${10 + Math.random()*30}%;
          width:${size}px;height:${size}px;border-radius:50%;
          background:hsl(${hue},100%,60%);
          box-shadow:0 0 ${size*2}px ${size}px hsl(${hue},100%,50%);
          animation:fa-fire-rise ${0.8+Math.random()*1.2}s ease-in ${delay}s infinite;
          opacity:0;
        `;
        p2.appendChild(f);
      }

      const forge = document.createElement("div");
      forge.textContent = "FORGE";
      forge.style.cssText = `
        font:900 clamp(52px,14vw,120px) Impact,'Arial Black',sans-serif;
        color:#ff8800;letter-spacing:0.06em;line-height:1;
        text-shadow:0 0 30px #ff2200,0 0 80px #ff4400,0 0 6px #ffaa00;
        animation:fa-zoomIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s both;
        position:relative;z-index:2;
      `;

      const arena = document.createElement("div");
      arena.textContent = "ARENA";
      arena.style.cssText = `
        font:900 clamp(42px,12vw,100px) Impact,'Arial Black',sans-serif;
        color:#ffd700;letter-spacing:0.12em;line-height:1;
        text-shadow:0 0 20px #ff6600,0 0 60px #ff8800,0 0 4px #ffee00;
        animation:fa-slideUp 0.65s cubic-bezier(0.22,1,0.36,1) 0.65s both;
        position:relative;z-index:2;
      `;

      // Extending lines
      const linesWrap = document.createElement("div");
      linesWrap.style.cssText = "position:relative;width:80vw;max-width:600px;height:2px;margin:12px 0;display:flex;align-items:center;z-index:2;";
      const ll = document.createElement("div");
      ll.style.cssText = "flex:1;height:2px;background:linear-gradient(to left,#ff6600,transparent);animation:fa-fadeIn 0.5s ease 1.1s both;opacity:0;";
      const lr = document.createElement("div");
      lr.style.cssText = "flex:1;height:2px;background:linear-gradient(to right,#ff6600,transparent);animation:fa-fadeIn 0.5s ease 1.1s both;opacity:0;";
      const dot = document.createElement("div");
      dot.style.cssText = "width:6px;height:6px;border-radius:50%;background:#ff6600;margin:0 8px;box-shadow:0 0 10px 4px #ff660088;";
      linesWrap.appendChild(ll); linesWrap.appendChild(dot); linesWrap.appendChild(lr);

      p2.appendChild(forge);
      p2.appendChild(linesWrap);
      p2.appendChild(arena);
      el.appendChild(p2);

      onComplete?.();
    }, 3000);

    return () => {
      clearTimeout(timer1);
    };
  }, [onComplete]);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        background: "#000",
        overflow: "hidden",
        cursor: "none",
        touchAction: "none",
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   WEBGL (THREE.JS) INTRO  — full cinematic version
   Lazy-imported so parse errors don't break the CSS fallback.
───────────────────────────────────────────────────────────── */
async function runThreeIntro(
  container: HTMLDivElement,
  onComplete?: () => void,
  signal?: AbortSignal
) {
  const THREE   = await import("three");
  const { EffectComposer } = await import("three/examples/jsm/postprocessing/EffectComposer.js");
  const { RenderPass }     = await import("three/examples/jsm/postprocessing/RenderPass.js");
  const { UnrealBloomPass }= await import("three/examples/jsm/postprocessing/UnrealBloomPass.js");

  if (signal?.aborted) return;

  const W = container.clientWidth  || window.innerWidth;
  const H = container.clientHeight || window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.setClearColor(0x000000);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 200);
  camera.position.set(0, 0, 7);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 2.2, 0.45, 0.08);
  composer.addPass(bloom);

  function makeGlowText(opts: { text: string; font: string; color: string; glow: string; cw: number; ch: number; layers?: number; shadowBlur?: number }): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = opts.cw; canvas.height = opts.ch;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, opts.cw, opts.ch);
    ctx.font = opts.font; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const layers = opts.layers ?? 10;
    const blur   = opts.shadowBlur ?? 30;
    for (let i = layers; i >= 1; i--) {
      ctx.globalAlpha = 0.12 + (layers - i) * 0.01;
      ctx.shadowColor = opts.glow; ctx.shadowBlur = (i / layers) * blur * 2.5;
      ctx.fillStyle = opts.glow; ctx.fillText(opts.text, opts.cw / 2, opts.ch / 2);
    }
    ctx.globalAlpha = 0.6; ctx.shadowColor = opts.color; ctx.shadowBlur = 20;
    ctx.fillStyle = opts.color; ctx.fillText(opts.text, opts.cw / 2, opts.ch / 2);
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    ctx.fillStyle = opts.color; ctx.fillText(opts.text, opts.cw / 2, opts.ch / 2);
    return new THREE.CanvasTexture(canvas);
  }

  const SPHERE_R = 2.2, N_PARTS = 1400;
  const partStart = new Float32Array(N_PARTS * 3);
  const partEnd   = new Float32Array(N_PARTS * 3);
  const partPhase = new Float32Array(N_PARTS);
  const partColor = new Float32Array(N_PARTS * 3);

  for (let i = 0; i < N_PARTS; i++) {
    const sr = 7 + Math.random() * 5;
    const sth = Math.random() * Math.PI * 2;
    const sph = Math.acos(2 * Math.random() - 1);
    partStart[i*3]   = sr * Math.sin(sph) * Math.cos(sth);
    partStart[i*3+1] = sr * Math.sin(sph) * Math.sin(sth);
    partStart[i*3+2] = sr * Math.cos(sph);
    const eth = Math.random() * Math.PI * 2;
    const eph = Math.acos(2 * Math.random() - 1);
    partEnd[i*3]   = SPHERE_R * Math.sin(eph) * Math.cos(eth);
    partEnd[i*3+1] = SPHERE_R * Math.sin(eph) * Math.sin(eth);
    partEnd[i*3+2] = SPHERE_R * Math.cos(eph);
    partPhase[i] = Math.random() * Math.PI * 2;
    const pick = Math.random();
    if (pick < 0.35) { partColor[i*3]=0.0; partColor[i*3+1]=0.9; partColor[i*3+2]=1.0; }
    else if (pick < 0.65) { partColor[i*3]=0.1; partColor[i*3+1]=0.45; partColor[i*3+2]=1.0; }
    else { partColor[i*3]=0.55; partColor[i*3+1]=0.1; partColor[i*3+2]=1.0; }
  }

  const partGeo    = new THREE.BufferGeometry();
  const partPosArr = new Float32Array(N_PARTS * 3);
  const partPosAttr= new THREE.BufferAttribute(partPosArr, 3);
  partGeo.setAttribute("position", partPosAttr);
  partGeo.setAttribute("color", new THREE.BufferAttribute(partColor, 3));
  const partMat  = new THREE.PointsMaterial({ size:0.04, vertexColors:true, blending:THREE.AdditiveBlending, transparent:true, depthWrite:false, opacity:0 });
  const partMesh = new THREE.Points(partGeo, partMat);
  scene.add(partMesh);

  const orbMat  = new THREE.MeshBasicMaterial({ color:0x00eeff, transparent:true, opacity:0 });
  const orb     = new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 32), orbMat);
  const haloMat = new THREE.MeshBasicMaterial({ color:0x0055ff, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false });
  const halo    = new THREE.Mesh(new THREE.SphereGeometry(0.6, 32, 32), haloMat);
  scene.add(orb, halo);

  const ringDefs = [
    { r:SPHERE_R,        tube:0.013, color:0x00d4ff, speed: 0.25 },
    { r:SPHERE_R*0.93,   tube:0.009, color:0x4488ff, speed:-0.35 },
    { r:SPHERE_R*1.07,   tube:0.008, color:0x8844ff, speed: 0.18 },
    { r:SPHERE_R*0.82,   tube:0.005, color:0x00ffcc, speed:-0.28 },
  ];
  const rings = ringDefs.map((d, idx) => {
    const mat  = new THREE.MeshBasicMaterial({ color:d.color, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false });
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(d.r, d.tube, 16, 128), mat);
    mesh.rotation.x = Math.PI / 2 + idx * 0.35;
    scene.add(mesh);
    return { mesh, mat, speed:d.speed };
  });

  const sphereHQTex  = makeGlowText({ text:"SPHERE  HQ", font:"bold 88px 'Arial Black',Arial,sans-serif", color:"#ffffff", glow:"#00ccff", cw:1024, ch:200, layers:12 });
  const sphereHQMat  = new THREE.MeshBasicMaterial({ map:sphereHQTex, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false });
  const sphereHQMesh = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 1.15), sphereHQMat);
  sphereHQMesh.position.set(0, -3.1, 0);

  const presentsTex  = makeGlowText({ text:"— PRESENTS —", font:"300 36px Arial,sans-serif", color:"#88ccff", glow:"#003366", cw:512, ch:80, layers:6 });
  const presentsMat  = new THREE.MeshBasicMaterial({ map:presentsTex, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false });
  const presentsMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.5), presentsMat);
  presentsMesh.position.set(0, -3.8, 0);
  scene.add(sphereHQMesh, presentsMesh);

  const N_FIRE = 900;
  const firePosArr = new Float32Array(N_FIRE * 3);
  const fireVel    = new Float32Array(N_FIRE * 3);
  const fireCol    = new Float32Array(N_FIRE * 3);
  for (let i = 0; i < N_FIRE; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * 4;
    firePosArr[i*3]  = Math.cos(a)*r; firePosArr[i*3+1] = -10 - Math.random()*3; firePosArr[i*3+2] = Math.sin(a)*r*0.3;
    fireVel[i*3]     = (Math.random()-0.5)*0.018; fireVel[i*3+1] = 0.028+Math.random()*0.05; fireVel[i*3+2] = (Math.random()-0.5)*0.01;
    const h = Math.pow(Math.random(), 0.4);
    fireCol[i*3]=1.0; fireCol[i*3+1]=h*0.38; fireCol[i*3+2]=0;
  }
  const fireGeo      = new THREE.BufferGeometry();
  const firePosAttr  = new THREE.BufferAttribute(firePosArr, 3);
  fireGeo.setAttribute("position", firePosAttr);
  fireGeo.setAttribute("color", new THREE.BufferAttribute(fireCol, 3));
  const fireMat  = new THREE.PointsMaterial({ size:0.07, vertexColors:true, blending:THREE.AdditiveBlending, transparent:true, depthWrite:false, opacity:0 });
  const fireMesh = new THREE.Points(fireGeo, fireMat);
  scene.add(fireMesh);

  const forgeTex  = makeGlowText({ text:"FORGE", font:"900 128px Impact,'Arial Black',sans-serif", color:"#ff8800", glow:"#ff2200", cw:1024, ch:280, layers:14, shadowBlur:50 });
  const forgeMat  = new THREE.MeshBasicMaterial({ map:forgeTex, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false });
  const forgeMesh = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 1.52), forgeMat);
  forgeMesh.position.set(0, 0.7, 0); forgeMesh.scale.set(2.8, 2.8, 1);

  const arenaTex  = makeGlowText({ text:"ARENA", font:"900 108px Impact,'Arial Black',sans-serif", color:"#ffd700", glow:"#ff6600", cw:1024, ch:240, layers:12, shadowBlur:45 });
  const arenaMat  = new THREE.MeshBasicMaterial({ map:arenaTex, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false });
  const arenaMesh = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 1.32), arenaMat);
  arenaMesh.position.set(0, -0.95, 0);
  scene.add(forgeMesh, arenaMesh);

  const lineMatL  = new THREE.MeshBasicMaterial({ color:0xff6600, transparent:true, opacity:0, blending:THREE.AdditiveBlending });
  const lineMatR  = new THREE.MeshBasicMaterial({ color:0xff6600, transparent:true, opacity:0, blending:THREE.AdditiveBlending });
  const lineGeo   = new THREE.PlaneGeometry(3.8, 0.007);
  const lineL     = new THREE.Mesh(lineGeo, lineMatL);
  const lineR     = new THREE.Mesh(lineGeo, lineMatR);
  lineL.position.set(-3.8, -0.06, 0); lineR.position.set(3.8, -0.06, 0);
  lineL.scale.set(0,1,1); lineR.scale.set(0,1,1);
  scene.add(lineL, lineR);

  const flashMat  = new THREE.MeshBasicMaterial({ color:0xff5500, transparent:true, opacity:0 });
  const flashMesh = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), flashMat);
  flashMesh.position.z = 6;
  scene.add(flashMesh);

  const T1 = 3000, T2 = 5000;
  let elapsed = 0, rafId = 0, done = false, lastTime = performance.now();

  function animateFire() {
    for (let i = 0; i < N_FIRE; i++) {
      firePosArr[i*3]   += fireVel[i*3];
      firePosArr[i*3+1] += fireVel[i*3+1];
      firePosArr[i*3+2] += fireVel[i*3+2];
      if (firePosArr[i*3+1] > 6) {
        const a = Math.random()*Math.PI*2, r = Math.random()*4;
        firePosArr[i*3]=Math.cos(a)*r; firePosArr[i*3+1]=-4+Math.random(); firePosArr[i*3+2]=Math.sin(a)*r*0.3;
      }
    }
    firePosAttr.needsUpdate = true;
  }

  function tick(now: number) {
    if (signal?.aborted) { cancelAnimationFrame(rafId); return; }
    rafId = requestAnimationFrame(tick);
    const dt = Math.min(now - lastTime, 50);
    lastTime = now; elapsed += dt;
    const t = elapsed;

    if (t <= T1) {
      fireMat.opacity=0; forgeMat.opacity=0; arenaMat.opacity=0;
      lineMatL.opacity=0; lineMatR.opacity=0; flashMat.opacity=0;

      partMat.opacity = clamp(easeOut(invLerp(0,500,t))*0.95, 0, 0.95);
      for (let i = 0; i < N_PARTS; i++) {
        const delay = (partPhase[i]/(Math.PI*2))*700;
        const p = easeOut(invLerp(200+delay, 1700, t));
        partPosArr[i*3]   = lerp(partStart[i*3],   partEnd[i*3],   p);
        partPosArr[i*3+1] = lerp(partStart[i*3+1], partEnd[i*3+1], p);
        partPosArr[i*3+2] = lerp(partStart[i*3+2], partEnd[i*3+2], p);
        if (p >= 0.98) {
          const ex=partEnd[i*3], ey=partEnd[i*3+1], ez=partEnd[i*3+2];
          const phi = Math.acos(clamp(ez/SPHERE_R,-1,1));
          const oa  = Math.atan2(ey,ex) + t*0.00028 + partPhase[i]*0.1;
          partPosArr[i*3]   = SPHERE_R*Math.sin(phi)*Math.cos(oa);
          partPosArr[i*3+1] = SPHERE_R*Math.sin(phi)*Math.sin(oa);
          partPosArr[i*3+2] = ez + Math.sin(t*0.0012+partPhase[i])*0.04;
        }
      }
      partPosAttr.needsUpdate = true;

      const op = easeOut(invLerp(600,1400,t));
      orbMat.opacity  = op*0.92; haloMat.opacity = op*0.32;
      const pulse = 1+Math.sin(t*0.0042)*0.13;
      orb.scale.setScalar(pulse); halo.scale.setScalar(pulse*1.15);

      rings.forEach(({mesh,mat,speed},ri) => {
        mat.opacity = easeOut(invLerp(650+ri*130,1500+ri*110,t))*(0.62-ri*0.1);
        mesh.rotation.y += speed*0.00028*dt;
        mesh.rotation.z  = Math.sin(t*0.0009+ri)*0.18;
      });

      sphereHQMat.opacity = easeOut(invLerp(1800,2500,t));
      presentsMat.opacity = easeOut(invLerp(2200,2800,t))*0.75;
      bloom.strength = range(t, 0, 1600, 0.5, 2.9);

    } else {
      const ft = t - T1;

      partMat.opacity     = clamp(1-invLerp(0,300,ft),0,1)*0.95;
      orbMat.opacity      = 0; haloMat.opacity = 0;
      rings.forEach(({mat}) => { mat.opacity=0; });
      sphereHQMat.opacity = clamp(1-invLerp(0,300,ft),0,1);
      presentsMat.opacity = 0;

      const fv = ft<150 ? invLerp(0,150,ft) : 1-invLerp(150,550,ft);
      flashMat.opacity = clamp(fv*0.9, 0, 0.9);

      if (ft < 220) {
        const s = (1-ft/220)*0.08;
        camera.position.x = (Math.random()-0.5)*s;
        camera.position.y = (Math.random()-0.5)*s;
      } else {
        camera.position.x *= 0.85; camera.position.y *= 0.85;
      }

      animateFire();
      fireMat.opacity = easeOut(invLerp(80,900,ft))*0.9;

      const fp = easeOut(invLerp(60,750,ft));
      forgeMat.opacity = fp;
      forgeMesh.scale.set(lerp(2.8,1,fp), lerp(2.8,1,fp), 1);

      arenaMat.opacity    = easeOut(invLerp(650,1350,ft));
      arenaMesh.position.y= lerp(-2.2,-0.95,easeOut(invLerp(650,1350,ft)));

      const lp = easeOut(invLerp(1050,1700,ft));
      lineMatL.opacity = lp*0.9; lineMatR.opacity = lp*0.9;
      lineL.scale.x = lp; lineR.scale.x = lp;

      bloom.strength = lerp(4.5,2.2,easeOut(invLerp(0,900,ft)));

      if (t >= T2 && !done) { done=true; onComplete?.(); }
      if (done) {
        animateFire();
        forgeMat.opacity=1; arenaMat.opacity=1; fireMat.opacity=0.9; bloom.strength=2.2;
      }
    }
    composer.render();
  }

  rafId = requestAnimationFrame(tick);

  const onResize = () => {
    const w = container.clientWidth, h = container.clientHeight;
    camera.aspect = w/h; camera.updateProjectionMatrix();
    renderer.setSize(w, h); composer.setSize(w, h);
  };
  window.addEventListener("resize", onResize);

  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener("resize", onResize);
    composer.dispose(); renderer.dispose();
    if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
  };
}

/* ─────────────────────────────────────────────────────────────
   MAIN EXPORT — tries WebGL, falls back to CSS automatically
───────────────────────────────────────────────────────────── */
interface IntroSceneProps {
  onComplete?: () => void;
}

export default function IntroScene({ onComplete }: IntroSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const cssFallback = useRef(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Quick WebGL capability check before loading Three.js
    const testCanvas = document.createElement("canvas");
    const gl = testCanvas.getContext("webgl2") || testCanvas.getContext("webgl");
    if (!gl) {
      cssFallback.current = true;
      return; // let the JSX branch below handle rendering
    }

    const ac = new AbortController();
    let cleanup: (() => void) | undefined;

    runThreeIntro(container, onComplete, ac.signal)
      .then(fn => { cleanup = fn; })
      .catch(() => {
        // If Three.js fails at runtime, the CSS fallback is already rendered
        // (cssFallback.current was set true by the WebGL check above failing, or
        //  the component has already mounted the CSS branch)
        cssFallback.current = true;
      });

    return () => {
      ac.abort();
      cleanup?.();
    };
  }, [onComplete]);

  // If WebGL is not available, render the CSS fallback directly
  if (typeof document !== "undefined") {
    const testCanvas = document.createElement("canvas");
    const gl = testCanvas.getContext("webgl2") || testCanvas.getContext("webgl");
    if (!gl) {
      return <CSSFallbackIntro onComplete={onComplete} />;
    }
  }

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        background: "#000",
        overflow: "hidden",
        cursor: "none",
        touchAction: "none",
      }}
    />
  );
}
