/* We Build For Good hero machine (v2, founder ruling 2026-10-22). Plays on a 10.4s loop, pauses off-screen,
   shows a still frame under prefers-reduced-motion, and fades out as the page scrolls. External file so the
   CSP needs no new inline hash. */
(() => {
  if (!document.getElementById("mh-machine")) return;
  const NS = "http://www.w3.org/2000/svg";
  const $ = (id) => document.getElementById("mh-" + id);

  function gearPath(r, teeth, depth) {
    const pts = [];
    const step = (Math.PI * 2) / teeth;
    for (let i = 0; i < teeth; i++) {
      const a = i * step;
      const seq = [[a, r - depth], [a + step * 0.18, r], [a + step * 0.5, r], [a + step * 0.68, r - depth]];
      for (const [ang, rad] of seq) pts.push([Math.cos(ang) * rad, Math.sin(ang) * rad]);
    }
    return "M" + pts.map((p) => p[0].toFixed(2) + " " + p[1].toFixed(2)).join(" L") + " Z";
  }
  $("gearAPath").setAttribute("d", gearPath(27, 14, 4));
  $("gearBPath").setAttribute("d", gearPath(21, 11, 4));
  $("gearCPath").setAttribute("d", gearPath(13, 7, 3.5));

  const track = $("trackPath");
  const D = track.getAttribute("d");
  document.querySelectorAll("#mh-rails .t").forEach((p) => p.setAttribute("d", D));
  let gh = "";
  for (let x = 12; x <= 356; x += 18) gh += `M${x} 330 l-6 8 `;
  $("groundHatch").setAttribute("d", gh);
  // louvres over the bottom run: the ball flickers between the slats
  const lv = $("louvres");
  for (let x = 98; x <= 168; x += 10) {
    const r = document.createElementNS(NS, "rect");
    r.setAttribute("x", x); r.setAttribute("y", 112); r.setAttribute("width", 5); r.setAttribute("height", 30); r.setAttribute("rx", 1);
    lv.appendChild(r);
  }
  const L = track.getTotalLength();

  // where along the track the ball brushes the paddle wheel
  let dNear = 0, best = 1e9;
  for (let d = 0; d <= L; d += 2) {
    const p = track.getPointAtLength(d);
    const q = (p.x - 54) ** 2 + (p.y - 104) ** 2;
    if (q < best) { best = q; dNear = d; }
  }


  const BX = 247, BY0 = 140, DROP = 100;  // bucket rope end at rest, and how far it descends
  const PULLEY_R = 18, GA = 27, GB = 21, GC = 13;
  const RUN = 4.2;                        // seconds through the maze
  const T = 10.4;
  const LIP = { x: BX - 31.5, y: BY0 + DROP + 19.5 };  // left lip of the tipped bucket
  const BOX = { x: 214, y: 320 };

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const easeIn = (x) => x * x;
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const easeInOut = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
  const easeOutBack = (x) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };

  function render(t) {
    // distance along the maze: a little slow off the start, then rolling
    const k0 = seg(t, 0, RUN);
    const dist = L * (0.25 * easeIn(k0) + 0.75 * k0);

    // paddle wheel gets one full flick as the ball goes past
    const spin = 360 * easeOut(clamp((dist - (dNear - 10)) / 60));
    $("spinner").setAttribute("transform", `translate(54 104) rotate(${spin})`);

    // bucket descent (and the return in the reset)
    const A = RUN + 0.35;
    const down = easeInOut(seg(t, A + 0.3, A + 2.0));
    const up = easeInOut(seg(t, 9.0, 10.1));
    const dy = DROP * (down - up);
    const jiggle = t > A && t < A + 0.3 ? Math.sin((t - A) * 40) * 2.2 * (1 - seg(t, A, A + 0.3)) : 0;
    const by = BY0 + dy + jiggle;

    // tip the bucket to the LEFT at the bottom, right it again in the reset
    const tipAt = A + 2.05;
    const tip = -68 * (easeInOut(seg(t, tipAt, tipAt + 0.35)) - easeInOut(seg(t, 8.6, 8.95)));
    $("bucket").setAttribute("transform", `translate(${BX} ${by}) rotate(${tip} -10 25)`);
    $("ropeL").setAttribute("y2", by);

    // pulley + gear A turn with the rope; gear B the other way; gear C back again
    const thetaA = -(dy / PULLEY_R) * (180 / Math.PI);
    const thetaB = -thetaA * (GA / GB) + 360 / 22;
    const thetaC = -thetaB * (GB / GC) + 360 / 14;
    $("pulley").setAttribute("transform", `translate(265 52) rotate(${thetaA})`);
    $("gearA").setAttribute("transform", `translate(265 52) rotate(${thetaA})`);
    $("gearB").setAttribute("transform", `translate(313 52) rotate(${thetaB})`);
    $("gearC").setAttribute("transform", `translate(313 84) rotate(${thetaC})`);

    // counterweight rises as the bucket falls
    const wy = 210 - dy;
    $("weight").setAttribute("transform", `translate(283 ${wy})`);
    $("ropeR").setAttribute("y2", wy);

    // lid closes after the ball lands, opens in the reset
    const fallAt = tipAt + 0.15, landAt = fallAt + 0.6;
    const lidClose = easeOutBack(seg(t, landAt + 0.05, landAt + 0.55)) - easeInOut(seg(t, 8.5, 8.9));
    const lidAngle = -112 * (1 - lidClose);
    const rad = (lidAngle * Math.PI) / 180;
    $("lid").setAttribute("x2", 190 + Math.cos(rad) * 48);
    $("lid").setAttribute("y2", 298 + Math.sin(rad) * 48);


    // ball
    const ball = $("ball");
    let bx, bY, op = 1;
    if (t < RUN) {
      const p = track.getPointAtLength(dist);
      bx = p.x; bY = p.y;
    } else if (t < A) {
      const k = seg(t, RUN, A);
      bx = 228 + (BX - 228) * k;
      bY = 137 + (BY0 + 16 - 137) * k - Math.sin(k * Math.PI) * 10;
    } else if (t < fallAt) {
      const k = easeIn(seg(t, tipAt, fallAt));
      bx = BX + (LIP.x + 4 - BX) * k; bY = by + 16 + (LIP.y - 4 - by - 16) * k;
    } else if (t < landAt) {
      const k = seg(t, fallAt, landAt);
      bx = LIP.x + 4 + (BOX.x - LIP.x - 4) * k;
      bY = LIP.y - 4 + (BOX.y - LIP.y + 4) * easeIn(k);
    } else {
      bx = BOX.x; bY = BOX.y;
      op = 1 - seg(t, landAt + 0.4, landAt + 0.5);   // hidden once the lid is shut
    }
    ball.setAttribute("transform", `translate(${bx.toFixed(2)} ${bY.toFixed(2)})`);
    ball.style.opacity = op;
  }

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const machine = $("machine");
  const headline = document.getElementById("hero-headline-block");

  // The headline opens lower down the page and glides up into place. The machine
  // stays hidden until that glide has finished (and again whenever the opening
  // replays), so the two never overlap. Under reduced motion the headline never
  // moves, so the machine shows at once.
  const GLIDE_MS = 1500;
  let ready = reduce || !headline;
  let start = null, visible = true, raf = 0, readyTimer = 0;

  const fade = () => {
    const k = clamp((window.scrollY - 10) / (window.innerHeight * 0.4));
    machine.style.opacity = ready ? (1 - k).toFixed(3) : "0";
    machine.style.visibility = ready ? "" : "hidden";
    machine.style.transform = `translateY(${(-k * 16).toFixed(1)}px)`;
  };

  if (reduce) {
    render(8.1); // still drawing: ball delivered, lid shut (the success)
  } else {
    render(0);
    const loop = (now) => {
      if (start === null) start = now;
      render(((now - start) / 1000) % T);
      raf = visible && ready ? requestAnimationFrame(loop) : 0;
    };
    const run = () => { if (!raf && visible && ready) { start = null; raf = requestAnimationFrame(loop); } };
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; run(); }).observe(machine);
    if (headline) {
      const sync = () => {
        clearTimeout(readyTimer);
        if (headline.classList.contains("is-lifted")) {
          readyTimer = setTimeout(() => {
            ready = true;
            machine.style.transition = "opacity 0.6s ease";
            fade(); run();
            setTimeout(() => { machine.style.transition = ""; }, 650);
          }, GLIDE_MS);
        } else {
          ready = false; render(0); fade();
        }
      };
      new MutationObserver(sync).observe(headline, { attributes: true, attributeFilter: ["class"] });
      sync();
    }
    run();
  }

  window.addEventListener("scroll", fade, { passive: true });
  fade();
})();
