import { useEffect, useRef } from "react";
import * as THREE from "three";
import { TOOL_TYPES } from "../constants";
import { takimProfili, yaricapAt, parcaNoktalari } from "../geometry/profil";
import { kaplamaRengi, ton } from "../drawing/stil";

// ─── 3D PREVIEW — Gerçekçi Freze Geometrisi ─────────────
function ThreeDView({ params }) {
  const mountRef = useRef(null);
  const stateRef = useRef({});

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const T = THREE;
    const scene = new T.Scene();
    scene.background = new T.Color("#1b2128");
    const camera = new T.PerspectiveCamera(32, el.clientWidth / el.clientHeight, 0.01, 100);
    const renderer = new T.WebGLRenderer({ antialias: true });
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    scene.add(new T.AmbientLight("#e8ecf0", 0.85));
    const dl1 = new T.DirectionalLight("#fff", 0.9); dl1.position.set(4,6,5); dl1.castShadow = true; scene.add(dl1);
    const dl2 = new T.DirectionalLight("#b0c8e0", 0.4); dl2.position.set(-3,-2,5); scene.add(dl2);
    const dl3 = new T.DirectionalLight("#e0d0b0", 0.3); dl3.position.set(0,-5,-3); scene.add(dl3);

    const grid = new T.GridHelper(8, 40, "#46515f", "#2b333d");
    grid.rotation.x = Math.PI / 2; grid.position.z = -1.2; scene.add(grid);

    const toolGroup = new T.Group(); scene.add(toolGroup);
    stateRef.current = { scene, camera, renderer, toolGroup, el, T };

    let isDrag=false, pX=0, pY=0, rX=-0.2, rY=0.45;
    // Takım yatay yatar (boy 3): kadraj genişliğe göre; yakın uç perspektifle büyüdüğü için pay bırakılır
    const kadraj=()=>Math.max(4.8, 2.3/(Math.tan(16*Math.PI/180)*Math.max(0.6, el.clientWidth/Math.max(el.clientHeight,1))));
    let dist=kadraj();
    const onD=(e)=>{isDrag=true;const p=e.touches?e.touches[0]:e;pX=p.clientX;pY=p.clientY;};
    const onM=(e)=>{if(!isDrag)return;e.preventDefault();const p=e.touches?e.touches[0]:e;rY+=(p.clientX-pX)*0.007;rX+=(p.clientY-pY)*0.007;rX=Math.max(-1.5,Math.min(1.5,rX));pX=p.clientX;pY=p.clientY;};
    const onU=()=>{isDrag=false;};
    const onW=(e)=>{e.preventDefault();dist=Math.max(1,Math.min(12,dist+e.deltaY*0.004));};
    const cv = renderer.domElement;
    cv.addEventListener("mousedown",onD); cv.addEventListener("mousemove",onM); cv.addEventListener("mouseup",onU); cv.addEventListener("mouseleave",onU);
    cv.addEventListener("touchstart",onD,{passive:false}); cv.addEventListener("touchmove",onM,{passive:false}); cv.addEventListener("touchend",onU);
    cv.addEventListener("wheel",onW,{passive:false});

    let raf;
    const anim=()=>{raf=requestAnimationFrame(anim);camera.position.set(dist*Math.sin(rY)*Math.cos(rX),dist*Math.sin(rX),dist*Math.cos(rY)*Math.cos(rX));camera.lookAt(0,0,0);renderer.render(scene,camera);};
    anim();
    const onRz=()=>{if(!el.clientWidth)return;dist=Math.max(dist,kadraj());camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight);};
    window.addEventListener("resize",onRz);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",onRz);
      cv.removeEventListener("mousedown",onD);cv.removeEventListener("mousemove",onM);cv.removeEventListener("mouseup",onU);cv.removeEventListener("mouseleave",onU);
      cv.removeEventListener("touchstart",onD);cv.removeEventListener("touchmove",onM);cv.removeEventListener("touchend",onU);cv.removeEventListener("wheel",onW);
      renderer.dispose();if(el.contains(cv))el.removeChild(cv);};
  }, []);

  useEffect(() => {
    const { toolGroup, T } = stateRef.current;
    if (!toolGroup || !T) return;
    toolGroup.traverse((c) => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) (Array.isArray(c.material) ? c.material : [c.material]).forEach((m) => m.dispose());
    });
    while (toolGroup.children.length) toolGroup.remove(toolGroup.children[0]);

    // Tüm ölçüler geometri modelinden (src/geometry/profil.js); eksen = 3B'de +Y
    const g = takimProfili(params);
    if (!(g.D > 0) || !(g.d > 0) || !(g.L > 0)) return;
    const { z, helix, helixHand, dCore } = params;
    const TL = 3;                       // takım boyu, 3B birim
    const sc = TL / g.L;                // mm → 3B birim
    const aSeg = 96;
    const nF = Math.max(1, Math.round(z || 4));
    const x0 = g.x.boyunSonu;           // kanallı bölümün başı (mm)
    const hRad = (helix || 0) * Math.PI / 180;
    // Helis: tan(β) = π·D / hatve → dönüş açısı = x · tan β / R (β eksenle yapılan açı)
    const k = hRad > 0 ? Math.tan(hRad) / (g.D / 2) : 0;
    const yon = helixHand === "Sol" ? 1 : -1; // sağ helis: ucu sağa bakan takımda görünen yüzde "\" (vida kuralı)

    const hC = (hex) => new T.Color(hex);
    const mat = (renk, metal, pürüz) => new T.MeshStandardMaterial({ color: hC(renk), metalness: metal, roughness: pürüz, side: T.DoubleSide });
    const renkK = kaplamaRengi(params.coating, params.colCut); // çizimdeki kaplama rengiyle aynı
    const matS = mat(ton(params.colShank, 10), 0.6, 0.3);
    const matN = mat(ton(params.colNeck, 10), 0.6, 0.32);
    const matC = mat(ton(renkK, 12), 0.55, 0.32);
    const matT = mat(ton(renkK, 42), 0.6, 0.28);

    // Kesit profili — her diş: kesici kenar → margin → relief → kanal dibi → arka duvar → topuk
    function profileR(angle, oR, iR, numF) {
      const tooth = (Math.PI * 2) / numF;
      const a = ((angle % tooth) + tooth) % tooth;
      const n = a / tooth;
      if (n < 0.04) return oR;
      if (n < 0.14) return oR * 0.998;
      if (n < 0.20) { const t = (n - 0.14) / 0.06; return oR * (0.998 - t * 0.12); }
      if (n < 0.28) { const t = (n - 0.20) / 0.08; return oR * 0.878 + (iR - oR * 0.878) * t; }
      if (n < 0.75) { const t = (n - 0.28) / 0.47; return iR * (1 - 0.08 * Math.sin(t * Math.PI)); }
      if (n < 0.92) { const t = (n - 0.75) / 0.17; const e = t * t * (3 - 2 * t); return iR + (oR * 0.96 - iR) * e; }
      const t = (n - 0.92) / 0.08; return oR * (0.96 + 0.04 * t);
    }
    const capRadius = (R) => (dCore > 0 ? Math.min((dCore / 2) * sc, R * 0.65) : R * 0.5);

    const govde = new T.Group();       // eksen boyunca ortalanır
    govde.position.y = -TL / 2;
    toolGroup.add(govde);

    // 1) Dönel parçalar: sap, geçiş, boğaz, basamak yüzleri. Her kontur parçası ayrı lathe,
    //    böylece keskin kenarlarda gölgeleme yumuşamaz.
    for (const s of g.ustAlt || g.ust) { // sap düzlüğü 3B'de gösterilmez
      const pts = parcaNoktalari(s);
      if (Math.max(...pts.map((q) => q[0])) > x0 + 1e-9) continue; // kanallı bölgeye girenler aşağıda
      if (pts.length === 2 && Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]) < 1e-9) continue;
      const sapMi = Math.max(...pts.map((q) => q[0])) <= g.x.sapSonu + 1e-9;
      const geo = new T.LatheGeometry(pts.map(([x, r]) => new T.Vector2(Math.max(r, 0) * sc, x * sc)), aSeg);
      govde.add(new T.Mesh(geo, sapMi ? matS : matN));
    }

    // 2) Kanallı bölüm: dış yarıçap konturu izler (düz, küre, radyüs, pah, matkap ucu, kademeler)
    const len = g.L - x0;
    if (len > 1e-6) {
      const axS = Math.min(420, Math.max(90, Math.round(len * 6)));
      const verts = [], idx = [];
      for (let yi = 0; yi <= axS; yi++) {
        const t = yi / axS;
        const xm = x0 + len * (1 - (1 - t) * (1 - t));        // uca doğru sıklaşan örnekleme
        const R = yaricapAt(g, xm) * sc;
        const iR = capRadius(R);
        const ho = yon * k * (xm - x0);
        for (let ai = 0; ai < aSeg; ai++) {
          const ba = (ai / aSeg) * Math.PI * 2;
          const r = profileR(ba - ho, R, iR, nF);              // profil eksen boyunca döner
          verts.push(r * Math.cos(ba), xm * sc, r * Math.sin(ba));
        }
      }
      for (let yi = 0; yi < axS; yi++) {
        for (let ai = 0; ai < aSeg; ai++) {
          const c = yi * aSeg + ai, n2 = yi * aSeg + ((ai + 1) % aSeg);
          const cu = (yi + 1) * aSeg + ai, nu = (yi + 1) * aSeg + ((ai + 1) % aSeg);
          idx.push(c, n2, cu, n2, nu, cu);
        }
      }
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.Float32BufferAttribute(verts, 3));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      govde.add(new T.Mesh(geo, matC));

      // Alın yüzü: ucun yarıçapı sıfırdan büyükse (düz, radyüs, pah)
      const RL = yaricapAt(g, g.L) * sc;
      if (RL > 0.002) {
        const iR = capRadius(RL);
        const ho = yon * k * len;
        const sh = new T.Shape();
        const pts = 180;
        for (let i = 0; i <= pts; i++) {
          const ba = (i / pts) * Math.PI * 2;
          const r = profileR(ba - ho, RL, iR, nF);
          const px = r * Math.cos(ba), pz = r * Math.sin(ba);
          // Shape +Y'si, X ekseni etrafında -90° dönünce -Z olur: gövdeyle aynı yöne getirmek için -pz
          if (i === 0) sh.moveTo(px, -pz); else sh.lineTo(px, -pz);
        }
        const yP = g.L * sc;
        const yuz = new T.Mesh(new T.ShapeGeometry(sh), matT);
        yuz.rotation.x = -Math.PI / 2; yuz.position.y = yP;
        govde.add(yuz);

        const cizgiMat = new T.LineBasicMaterial({ color: 0x1a1a1a });
        for (let fi = 0; fi < nF; fi++) {
          const a = (fi / nF) * Math.PI * 2 + ho;
          const p1 = [new T.Vector3(iR * 0.15 * Math.cos(a + 0.15), yP + 0.003, iR * 0.15 * Math.sin(a + 0.15)),
            new T.Vector3(RL * 0.98 * Math.cos(a), yP + 0.003, RL * 0.98 * Math.sin(a))];
          govde.add(new T.Line(new T.BufferGeometry().setFromPoints(p1), cizgiMat));
        }
        const merkez = new T.Mesh(new T.RingGeometry(0, iR * 0.2, 24), new T.MeshStandardMaterial({ color: hC(params.colFlute), metalness: 0.5, roughness: 0.6, side: T.DoubleSide }));
        merkez.rotation.x = -Math.PI / 2; merkez.position.y = yP + 0.002;
        govde.add(merkez);
      }
    }

    // Merkez ekseni (kırmızı) ve yön: eksen +X'e bakar
    toolGroup.add(new T.Line(
      new T.BufferGeometry().setFromPoints([new T.Vector3(0, -TL / 2 - 0.15, 0), new T.Vector3(0, TL / 2 + 0.15, 0)]),
      new T.LineBasicMaterial({ color: 0xcc2222 })
    ));
    toolGroup.rotation.z = -Math.PI / 2;
  }, [params]);

  return (
    <div ref={mountRef} style={{width:"100%",height:"100%",borderRadius:4,overflow:"hidden",position:"relative",cursor:"grab"}}>
      <div style={{position:"absolute",top:8,left:8,fontSize:10,color:"#c4cfdd",fontFamily:"'IBM Plex Mono',monospace",background:"rgba(14,19,27,0.82)",padding:"4px 10px",borderRadius:3,pointerEvents:"none",fontWeight:600}}>
        ⌀{params.D}×{params.L}mm · {params.z}Z · {TOOL_TYPES[params.toolType]}
      </div>
      <div style={{position:"absolute",bottom:8,left:8,fontSize:9,color:"#8d9bb0",fontFamily:"'IBM Plex Mono',monospace",background:"rgba(14,19,27,0.7)",padding:"2px 7px",borderRadius:3,pointerEvents:"none"}}>
        Sürükle: Döndür · Scroll: Yakınlaştır
      </div>
    </div>
  );
}

export { ThreeDView };
