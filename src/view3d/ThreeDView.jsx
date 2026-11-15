import { useEffect, useRef } from "react";
import * as THREE from "three";
import { TOOL_TYPES } from "../constants";
import { takimProfili } from "../geometry/profil";

// ─── 3D PREVIEW — Gerçekçi Freze Geometrisi ─────────────
function ThreeDView({ params }) {
  const mountRef = useRef(null);
  const stateRef = useRef({});

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const T = THREE;
    const scene = new T.Scene();
    scene.background = new T.Color("#dde2e8");
    const camera = new T.PerspectiveCamera(32, el.clientWidth / el.clientHeight, 0.01, 100);
    const renderer = new T.WebGLRenderer({ antialias: true });
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    scene.add(new T.AmbientLight("#e8ecf0", 0.5));
    const dl1 = new T.DirectionalLight("#fff", 0.9); dl1.position.set(4,6,5); dl1.castShadow = true; scene.add(dl1);
    const dl2 = new T.DirectionalLight("#b0c8e0", 0.4); dl2.position.set(-3,-2,5); scene.add(dl2);
    const dl3 = new T.DirectionalLight("#e0d0b0", 0.3); dl3.position.set(0,-5,-3); scene.add(dl3);

    const grid = new T.GridHelper(8, 40, "#a0a8b0", "#c8ced4");
    grid.rotation.x = Math.PI / 2; grid.position.z = -1.2; scene.add(grid);

    const toolGroup = new T.Group(); scene.add(toolGroup);
    stateRef.current = { scene, camera, renderer, toolGroup, el, T };

    let isDrag=false, pX=0, pY=0, rX=-0.15, rY=0.6, dist=4.2;
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
    const onRz=()=>{if(!el.clientWidth)return;camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight);};
    window.addEventListener("resize",onRz);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",onRz);
      cv.removeEventListener("mousedown",onD);cv.removeEventListener("mousemove",onM);cv.removeEventListener("mouseup",onU);cv.removeEventListener("mouseleave",onU);
      cv.removeEventListener("touchstart",onD);cv.removeEventListener("touchmove",onM);cv.removeEventListener("touchend",onU);cv.removeEventListener("wheel",onW);
      renderer.dispose();if(el.contains(cv))el.removeChild(cv);};
  }, []);

  useEffect(() => {
    const { toolGroup, T } = stateRef.current;
    if (!toolGroup || !T) return;
    while(toolGroup.children.length){const c=toolGroup.children[0];if(c.geometry)c.geometry.dispose();if(c.material){if(Array.isArray(c.material))c.material.forEach(m=>m.dispose());else c.material.dispose();}toolGroup.remove(c);}

    // Ölçüler geometri modelinden (src/geometry/profil.js)
    const g = takimProfili(params);
    const { D, d, L, l1, l2 } = g;
    const { z, helix, toolType, dCore, rCorner, chamferSize, pointAngle } = params;
    const sc = 3/L;
    const hD=D/2*sc, hd=d/2*sc, tL=L*sc, cL=l1*sc, nL=l2*sc;
    const hN=g.nD/2*sc;
    const cR=Math.min(dCore/2*sc, hD*0.65);
    const transDx=g.gecisBoyu*sc;
    const sL=g.sapBoyu*sc;
    const hRad=(helix||30)*Math.PI/180;
    const nF=z||4;
    const aSeg=96;

    const hC=(hex)=>new T.Color(hex);
    const matS=new T.MeshStandardMaterial({color:hC(params.colShank),metalness:0.75,roughness:0.22});
    const matN=new T.MeshStandardMaterial({color:hC(params.colNeck),metalness:0.7,roughness:0.28});
    const matC=new T.MeshStandardMaterial({color:hC(params.colCut),metalness:0.82,roughness:0.18,side:T.DoubleSide});
    const matT=new T.MeshStandardMaterial({color:hC(params.colTip),metalness:0.85,roughness:0.15,side:T.DoubleSide});

    // Gerçekçi kesit profili — her diş için:
    // Kesici kenar → birincil margin → birincil relief → kanal dibi → arka duvar → topuk
    function profileR(angle, oR, iR, numF) {
      const tooth = (Math.PI*2)/numF;
      let a = ((angle % tooth) + tooth) % tooth;
      const n = a / tooth;
      if (n < 0.04) return oR;
      if (n < 0.14) return oR * 0.998;
      if (n < 0.20) { const t=(n-0.14)/0.06; return oR*(0.998 - t*0.12); }
      if (n < 0.28) { const t=(n-0.20)/0.08; return oR*0.878 + (iR - oR*0.878)*t; }
      if (n < 0.75) { const t=(n-0.28)/0.47; return iR*(1 - 0.08*Math.sin(t*Math.PI)); }
      if (n < 0.92) { const t=(n-0.75)/0.17; const e=t*t*(3-2*t); return iR + (oR*0.96-iR)*e; }
      const t=(n-0.92)/0.08; return oR*(0.96 + 0.04*t);
    }

    // Helisel kanallı gövde mesh
    function buildFluted(oR, iR, len, numF, hAng, yS) {
      const axS = Math.max(Math.round(len*120/tL), 40);
      const verts=[], norms=[], uvs=[], idx=[];
      for (let yi=0; yi<=axS; yi++) {
        const t=yi/axS, y=yS+t*len;
        const ho = hAng>0 ? (t*len)/Math.tan(hAng)/oR : 0;
        for (let ai=0; ai<aSeg; ai++) {
          const ba=(ai/aSeg)*Math.PI*2;
          const a = ba + ho;
          const r = profileR(a, oR, iR, numF);
          verts.push(r*Math.cos(ba+ho), y, r*Math.sin(ba+ho));
          norms.push(Math.cos(ba+ho), 0, Math.sin(ba+ho));
          uvs.push(ai/aSeg, t);
        }
      }
      for (let yi=0; yi<axS; yi++) {
        for (let ai=0; ai<aSeg; ai++) {
          const c=yi*aSeg+ai, n2=yi*aSeg+(ai+1)%aSeg;
          const cu=(yi+1)*aSeg+ai, nu=(yi+1)*aSeg+(ai+1)%aSeg;
          idx.push(c,n2,cu, n2,nu,cu);
        }
      }
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.Float32BufferAttribute(verts,3));
      geo.setAttribute("normal", new T.Float32BufferAttribute(norms,3));
      geo.setAttribute("uv", new T.Float32BufferAttribute(uvs,2));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      return geo;
    }

    // Uç alın yüzeyi — gash ve kesici kenarlarla
    function buildEndFace(oR, iR, numF, yP, hAng, bLen) {
      const g = new T.Group();
      const ho = hAng>0 ? bLen/Math.tan(hAng)/oR : 0;
      const pts=180;
      const sh = new T.Shape();
      for (let i=0; i<=pts; i++) {
        const ba=(i/pts)*Math.PI*2, a=ba+ho;
        const r = profileR(a, oR, iR, numF);
        const x=r*Math.cos(ba+ho), zz=r*Math.sin(ba+ho);
        if(i===0) sh.moveTo(x,zz); else sh.lineTo(x,zz);
      }
      const fm = new T.Mesh(new T.ShapeGeometry(sh), matT);
      fm.rotation.x=-Math.PI/2; fm.position.y=yP; g.add(fm);

      const gM = new T.LineBasicMaterial({color:0x1a1a1a});
      for (let fi=0; fi<numF; fi++) {
        const a=(fi/numF)*Math.PI*2+ho;
        const p1=[new T.Vector3(iR*0.15*Math.cos(a+0.15),yP+0.003,iR*0.15*Math.sin(a+0.15)),
          new T.Vector3(oR*0.98*Math.cos(a),yP+0.003,oR*0.98*Math.sin(a))];
        g.add(new T.Line(new T.BufferGeometry().setFromPoints(p1),gM));
        const ga=a+Math.PI*2/numF*0.12;
        const p2=[new T.Vector3(iR*0.1*Math.cos(a+0.3),yP+0.003,iR*0.1*Math.sin(a+0.3)),
          new T.Vector3(oR*0.55*Math.cos(ga),yP+0.003,oR*0.55*Math.sin(ga))];
        g.add(new T.Line(new T.BufferGeometry().setFromPoints(p2),new T.LineBasicMaterial({color:0x444444})));
      }
      const wm=new T.Mesh(new T.RingGeometry(0,iR*0.2,24),new T.MeshStandardMaterial({color:hC(params.colFlute),metalness:0.5,roughness:0.6,side:T.DoubleSide}));
      wm.rotation.x=-Math.PI/2; wm.position.y=yP+0.002; g.add(wm);
      return g;
    }

    let curY = 0;

    // Sap
    if (sL>0.002) {
      toolGroup.add(new T.Mesh(new T.CylinderGeometry(hd,hd,sL,aSeg),matS)).position.y=curY+sL/2;
      const cap=new T.Mesh(new T.CircleGeometry(hd,aSeg),matS); cap.rotation.x=Math.PI/2; cap.position.y=curY; toolGroup.add(cap);
      curY+=sL;
    }
    // Geçiş
    if (transDx>0.002) { toolGroup.add(new T.Mesh(new T.CylinderGeometry(hN,hd,transDx,aSeg),matN)).position.y=curY+transDx/2; curY+=transDx; }
    // Boyun
    if (nL>0.002) { toolGroup.add(new T.Mesh(new T.CylinderGeometry(hN,hN,nL,aSeg),matN)).position.y=curY+nL/2; curY+=nL; }

    const cutStart = curY;

    if (toolType === "stepdrill") {
      const stps=params.steps||[];
      let cy=cutStart;
      for (let i=stps.length-1; i>=0; i--) {
        const st=stps[i], hr=st.dia/2*sc, cr=Math.min(cR,hr*0.6), stepLen=st.len*sc;
        toolGroup.add(new T.Mesh(buildFluted(hr,cr,stepLen,nF,hRad,cy), i===0?matT:matC));
        cy+=stepLen;
      }
      if (stps.length>0) { const st0=stps[0],hr0=st0.dia/2*sc,ptA=(st0.angle||140)*Math.PI/180,tipH=hr0/Math.tan(ptA/2);
        toolGroup.add(new T.Mesh(new T.ConeGeometry(hr0,tipH,aSeg),matT)).position.y=cy+tipH/2; }
    } else if (toolType === "drill") {
      const ptA=(pointAngle||140)*Math.PI/180, tipH=hD/Math.tan(ptA/2), bodyLen=Math.max(cL-tipH,0.01);
      toolGroup.add(new T.Mesh(buildFluted(hD,cR,bodyLen,nF,hRad,cutStart),matC));
      toolGroup.add(new T.Mesh(new T.ConeGeometry(hD,tipH,aSeg),matT)).position.y=cutStart+bodyLen+tipH/2;
    } else if (toolType === "ballnose") {
      const bodyLen=Math.max(cL-hD,0.01);
      toolGroup.add(new T.Mesh(buildFluted(hD,cR,bodyLen,nF,hRad,cutStart),matC));
      const sm=new T.Mesh(new T.SphereGeometry(hD,aSeg,aSeg/2,0,Math.PI*2,0,Math.PI/2),matT);
      sm.position.y=cutStart+bodyLen; toolGroup.add(sm);
    } else {
      let tipH=0;
      if (toolType==="chamfer"&&chamferSize>0) tipH=chamferSize*sc;
      else if (toolType==="bullnose"&&rCorner>0) tipH=rCorner*sc;
      const bodyLen=Math.max(cL-tipH,0.01);
      toolGroup.add(new T.Mesh(buildFluted(hD,cR,bodyLen,nF,hRad,cutStart),matC));
      toolGroup.add(buildEndFace(hD,cR,nF,cutStart+bodyLen,hRad,bodyLen));
      if (toolType==="chamfer"&&chamferSize>0) {
        const cs=chamferSize*sc;
        toolGroup.add(new T.Mesh(new T.CylinderGeometry(hD-cs,hD,cs,aSeg),matT)).position.y=cutStart+bodyLen+cs/2;
        const cap=new T.Mesh(new T.CircleGeometry(hD-cs,aSeg),matT); cap.rotation.x=-Math.PI/2; cap.position.y=cutStart+bodyLen+cs; toolGroup.add(cap);
      } else if (toolType==="bullnose"&&rCorner>0) {
        const rC=rCorner*sc;
        toolGroup.add(new T.Mesh(new T.CylinderGeometry(hD-rC,hD,rC*2,aSeg),matT)).position.y=cutStart+bodyLen+rC;
        const cap=new T.Mesh(new T.CircleGeometry(hD-rC,aSeg),matT); cap.rotation.x=-Math.PI/2; cap.position.y=cutStart+bodyLen+rC*2; toolGroup.add(cap);
      }
    }

    // Merkez + Konum
    const cOff=tL/2;
    toolGroup.children.forEach(c=>{c.position.y-=cOff;});
    toolGroup.rotation.z=-Math.PI/2;
    toolGroup.add(new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0,-cOff-0.15,0),new T.Vector3(0,cOff+0.15,0)]),new T.LineBasicMaterial({color:0xcc2222})));

  }, [params]);

  return (
    <div ref={mountRef} style={{width:"100%",height:"100%",borderRadius:4,overflow:"hidden",position:"relative",cursor:"grab"}}>
      <div style={{position:"absolute",top:8,left:8,fontSize:10,color:"#4a5a6a",fontFamily:"'IBM Plex Mono',monospace",background:"rgba(255,255,255,0.88)",padding:"4px 10px",borderRadius:3,pointerEvents:"none",fontWeight:600}}>
        ⌀{params.D}×{params.L}mm · {params.z}Z · {TOOL_TYPES[params.toolType]}
      </div>
      <div style={{position:"absolute",bottom:8,left:8,fontSize:9,color:"#8a9aaa",fontFamily:"'IBM Plex Mono',monospace",background:"rgba(255,255,255,0.7)",padding:"2px 7px",borderRadius:3,pointerEvents:"none"}}>
        Sürükle: Döndür · Scroll: Yakınlaştır
      </div>
    </div>
  );
}

export { ThreeDView };
