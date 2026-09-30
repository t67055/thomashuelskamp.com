// Content lives in content/projects.json and content/site.json — edit those, not this file.
async function readJSON(path) {
  const r = await fetch(path, { cache: "no-cache" });
  try { return await r.json(); }
  catch { throw new Error(path); }
}
let PROJECTS, SITE;
try {
  [PROJECTS, SITE] = await Promise.all([readJSON("content/projects.json"), readJSON("content/site.json")]);
} catch (e) {
  document.getElementById("app").innerHTML = `<p class="muted">Couldn't read ${e.message}. Check it for a missing comma, quote or bracket.</p>`;
  throw e;
}
const ABOUT = SITE.about, CONTACT = SITE.contact;

const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const root = document.documentElement;
const app = $("#app");
let disposeViewer = null;

function carousel(p) {
  return `
  <div class="carousel" data-n="${p.photos.length}">
    <div class="track" tabindex="0" aria-label="${esc(p.title)} photos">
      ${p.photos.map((src, i) => `<figure class="slide">${src
        ? `<img src="${esc(src)}" alt="${esc(p.title)}, photo ${i + 1}" loading="lazy">`
        : `<div class="ph">Photo ${i + 1}</div>`}</figure>`).join("")}
    </div>
    <button class="arrow prev" type="button" aria-label="Previous photo"><svg width="12" height="12" viewBox="0 0 12 12"><path d="M8 1 3 6l5 5" fill="none" stroke="currentColor"/></svg></button>
    <button class="arrow next" type="button" aria-label="Next photo"><svg width="12" height="12" viewBox="0 0 12 12"><path d="m4 1 5 5-5 5" fill="none" stroke="currentColor"/></svg></button>
    <div class="dots">${p.photos.map((_, i) => `<button class="dot" type="button" aria-label="Photo ${i + 1}" data-i="${i}"></button>`).join("")}</div>
  </div>`;
}
function wireCarousels() {
  app.querySelectorAll(".carousel").forEach(c => {
    const track = $(".track", c), n = +c.dataset.n, dots = [...c.querySelectorAll(".dot")];
    const prev = $(".prev", c), next = $(".next", c);
    let idx = 0;
    const go = i => track.scrollTo({ left: Math.max(0, Math.min(n - 1, i)) * track.clientWidth });
    const sync = () => {
      idx = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      dots.forEach((d, i) => d.setAttribute("aria-current", i === idx));
      prev.disabled = idx === 0; next.disabled = idx === n - 1;
    };
    prev.onclick = () => go(idx - 1);
    next.onclick = () => go(idx + 1);
    dots.forEach(d => d.onclick = () => go(+d.dataset.i));
    track.addEventListener("scroll", () => requestAnimationFrame(sync), { passive: true });
    track.addEventListener("keydown", e => {
      if (e.key === "ArrowRight") { e.preventDefault(); go(idx + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(idx - 1); }
    });
    sync();
  });
}

function viewWork() {
  app.innerHTML = `
  <div class="view">
    <div class="grid">${PROJECTS.map(p => `
      <article class="card">
        ${carousel(p)}
        <div class="card-head"><h2><a href="#p-${p.id}">${esc(p.title)}</a></h2><span class="muted num">${esc(p.year)}</span></div>
        <p>${esc(p.summary)}</p>
        <a class="more" href="#p-${p.id}">Read more →</a>
      </article>`).join("")}
    </div>
  </div>`;
  wireCarousels();
}

function viewProject(p) {
  app.innerHTML = `
  <article class="view">
    <a class="back" href="#work">← All work</a>
    <div class="col">
      <header class="p-head">
        <h1 class="heading">${esc(p.title)}</h1>
        <span class="muted num">${esc(p.year)}</span>
      </header>
      ${carousel(p)}
      <div class="prose">
        <section><h2 class="heading">Overview</h2><p>${esc(p.overview)}</p></section>
        <section><h2 class="heading">Process</h2><p>${esc(p.process)}</p></section>
        <section><h2 class="heading">Results</h2><p>${esc(p.results)}</p></section>
      </div>
      ${p.model ? `
      <section>
        <div class="viewer" id="viewer"><div class="v-msg" id="vmsg">Loading model…</div></div>
        <div class="v-foot">
          <span>3D model · drag to rotate, scroll to zoom</span>
          <label class="file-btn">Preview an .stl<input type="file" id="stlIn" accept=".stl"></label>
        </div>
      </section>` : ""}
    </div>
  </article>`;
  wireCarousels();
  if (p.model) mountViewer(p.model);
}

function viewAbout() {
  app.innerHTML = `
  <div class="view">
    <div class="about">
      <div class="portrait">${ABOUT.portrait ? `<img src="${esc(ABOUT.portrait)}" alt="Portrait of Thomas Huelskamp">` : `<div class="ph">Portrait</div>`}</div>
      <div class="about-text"><p class="lead">${esc(ABOUT.lead)}</p><p>${esc(ABOUT.body)}</p></div>
    </div>
  </div>`;
}

function viewContact() {
  app.innerHTML = `
  <div class="view contact">
    <span class="email" id="email">${esc(CONTACT.email)}</span>
    <button class="copy" type="button" id="copyBtn">Copy email</button>
    <div class="links">${CONTACT.links.map(l => l.href
      ? `<a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`
      : `<span class="muted">${esc(l.label)}</span>`).join("")}</div>
  </div>`;
  $("#copyBtn").onclick = async e => {
    const b = e.currentTarget;
    try { await navigator.clipboard.writeText(CONTACT.email); b.textContent = "Copied"; }
    catch { const r = document.createRange(); r.selectNodeContents($("#email")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = "Selected, press Ctrl+C"; }
    setTimeout(() => b.textContent = "Copy email", 2200);
  };
}

/* 3D viewer, loaded only on pages with a model */
async function mountViewer(model) {
  const box = $("#viewer"), msg = $("#vmsg");
  let THREE, OrbitControls, STLLoader;
  try {
    THREE = await import("three");
    ({ OrbitControls } = await import("three/addons/controls/OrbitControls.js"));
    ({ STLLoader } = await import("three/addons/loaders/STLLoader.js"));
  } catch { msg.textContent = "The 3D viewer couldn't load. Reload the page to try again."; return; }
  if (!document.body.contains(box)) return;
  const css = n => getComputedStyle(root).getPropertyValue(n).trim();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  box.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 10000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.autoRotate = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  controls.autoRotateSpeed = 1.2;
  controls.addEventListener("start", () => controls.autoRotate = false);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(1, 2, 1.5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.8); rim.position.set(-2, 0.5, -1); scene.add(rim);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide, flatShading: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const lineMat = new THREE.LineBasicMaterial({ transparent: true });
  const grid = new THREE.GridHelper(1, 20); scene.add(grid);
  let mesh = null, edges = null;

  const paint = () => {
    const light = css("--bg").toUpperCase() === "#FDFDFC";
    mat.color.set(light ? "#D9D9D5" : "#C9C9C6");
    lineMat.color.set(css("--fg")); lineMat.opacity = light ? 0.45 : 0.35;
    grid.material.color = new THREE.Color(css("--line")); grid.material.vertexColors = false; grid.material.needsUpdate = true;
  };
  paint();
  const mo = new MutationObserver(paint); mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  const mq = matchMedia("(prefers-color-scheme: light)"); mq.addEventListener("change", paint);

  function load(buf) {
    let geo;
    try { geo = new STLLoader().parse(buf); } catch { msg.textContent = "That file isn't a readable STL."; msg.hidden = false; return; }
    if (mesh) { scene.remove(mesh, edges); mesh.geometry.dispose(); edges.geometry.dispose(); }
    geo.rotateX(-Math.PI / 2);
    geo.computeBoundingBox();
    const bb = geo.boundingBox, size = new THREE.Vector3(), c = new THREE.Vector3();
    bb.getSize(size); bb.getCenter(c);
    geo.translate(-c.x, -bb.min.y, -c.z);
    mesh = new THREE.Mesh(geo, mat);
    edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), lineMat);
    scene.add(mesh, edges);
    const r = size.length() / 2;
    grid.scale.setScalar(Math.max(size.x, size.z) * 1.8);
    controls.target.set(0, size.y / 2, 0);
    camera.position.set(r * 1.9, size.y / 2 + r, r * 2.3);
    camera.near = r / 100; camera.far = r * 100; camera.updateProjectionMatrix();
    controls.update();
    msg.hidden = true;
  }

  const resize = () => { const w = box.clientWidth, h = box.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(resize); ro.observe(box); resize();
  let raf, alive = true;
  const tick = () => { if (!alive) return; controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(tick); };
  tick();

  const readFile = f => { if (!f) return; msg.textContent = "Loading " + f.name + "…"; msg.hidden = false; f.arrayBuffer().then(load); };
  $("#stlIn").onchange = e => readFile(e.target.files[0]);
  box.addEventListener("dragover", e => { e.preventDefault(); box.classList.add("drag"); });
  box.addEventListener("dragleave", () => box.classList.remove("drag"));
  box.addEventListener("drop", e => { e.preventDefault(); box.classList.remove("drag"); readFile(e.dataTransfer.files[0]); });
  fetch(model)
    .then(r => { if (!r.ok) throw new Error(); return r.arrayBuffer(); })
    .then(load)
    .catch(() => { msg.textContent = "Couldn't find " + model + ". Check the path in projects.json."; });

  disposeViewer = () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); mo.disconnect(); mq.removeEventListener("change", paint); controls.dispose(); renderer.dispose(); };
}

/* router: #work, #about, #contact, #p-<id> */
function route() {
  if (disposeViewer) { disposeViewer(); disposeViewer = null; }
  const h = location.hash.slice(1) || "work";
  let section = "work";
  const p = h.startsWith("p-") && PROJECTS.find(x => x.id === h.slice(2));
  if (p) viewProject(p);
  else if (h === "about") { viewAbout(); section = "about"; }
  else if (h === "contact") { viewContact(); section = "contact"; }
  else viewWork();
  document.querySelectorAll("[data-nav]").forEach(a => {
    if (a.dataset.nav === section) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  window.scrollTo({ top: 0, behavior: "instant" });
}
addEventListener("hashchange", route);
$("#yr").textContent = new Date().getFullYear();
route();
