import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement as h } from "react";
import { katalogIzgara, katalogSayfalari, KatalogSayfasi } from "../src/drawing/Katalog.jsx";
import { tipDegistir } from "../src/geometry/tipler.js";
import { DEFAULT_PARAMS } from "../src/constants.js";
import { FIRMA } from "../src/config.js";

const takim = (ad, ek = {}) => ({ ...DEFAULT_PARAMS, toolName: ad, ...ek });
const render = (p) => renderToStaticMarkup(h(KatalogSayfasi, p));
const liste = (n) => Array.from({ length: n }, (_, i) => takim(`MHK-${i + 1}`, { D: 4 + i, d: 6 + i, L: 50 + 5 * i, drawingNo: `C-${i + 1}` }));

describe("katalog ızgarası ve sayfalama", () => {
  it("sütun 2-4 arasında sınırlanır; 4 sütunda 4 satır", () => {
    expect(katalogIzgara(1).sutun).toBe(2);
    expect(katalogIzgara(9).sutun).toBe(4);
    expect(katalogIzgara(3)).toMatchObject({ sutun: 3, satir: 3, adet: 9 });
    expect(katalogIzgara(4)).toMatchObject({ sutun: 4, satir: 4, adet: 16 });
  });
  it("hücreler sayfaya sığar (kenar + bant payları içinde)", () => {
    const iz = katalogIzgara(3);
    expect(iz.sutun * iz.hucreW + (iz.sutun - 1) * 3).toBeCloseTo(297 - 24, 6);
    expect(iz.hucreW).toBeGreaterThan(60);
    expect(iz.hucreH).toBeGreaterThan(30);
  });
  it("takımlar sayfalara bölünür; boş liste tek boş sayfa verir", () => {
    expect(katalogSayfalari([], 3).map((s) => s.length)).toEqual([0]);
    expect(katalogSayfalari(liste(9), 3).map((s) => s.length)).toEqual([9]);
    expect(katalogSayfalari(liste(10), 3).map((s) => s.length)).toEqual([9, 1]);
    expect(katalogSayfalari(liste(20), 4).map((s) => s.length)).toEqual([16, 4]);
  });
});

describe("katalog sayfası", () => {
  const p = { takimlar: liste(4), sayfa: 1, sayfaSayisi: 2, baslik: "Freze Serisi", sutun: 3, dil: "tr", tarih: "2026-11-16" };
  it("başlık, takım adları, ölçüler, çizim no, iletişim ve sayfa numarası yazılır", () => {
    const svg = render(p);
    expect(svg).toContain(">Freze Serisi<");
    for (let i = 1; i <= 4; i++) expect(svg).toContain(`>MHK-${i}<`);
    expect(svg).toContain(">⌀4 × 50 mm<");
    expect(svg).toContain(">Çizim no: C-1<");
    expect(svg).toContain(">Sayfa 1 / 2<");
    expect(svg).toContain(FIRMA.tel);
    expect(svg).toContain(FIRMA.web);
    expect(svg).toContain(">16.11.2026<");
    expect(svg).not.toMatch(/NaN|undefined/);
  });
  it("başlık boşsa varsayılan başlık; İngilizce dil", () => {
    expect(render({ ...p, baslik: "" })).toContain(">Takım Kataloğu<");
    const en = render({ ...p, baslik: "", dil: "en" });
    expect(en).toContain(">Tool Catalog<");
    expect(en).toContain(">Page 1 / 2<");
    expect(en).toContain("Drawing no: C-1");
    expect(en).toContain("flutes");
    expect(en).not.toContain("Çizim no");
  });
  it("her tipten takım çökmeden çizilir; hatalı geometri çizgiyle geçilir", () => {
    const hepsi = ["flat", "ballnose", "bullnose", "chamfer", "drill", "stepdrill", "reamer", "taperreamer", "tslot", "custom"].map((t) => tipDegistir(takim(`T-${t}`), t));
    expect(() => render({ ...p, takimlar: hepsi })).not.toThrow();
    const bozuk = render({ ...p, takimlar: [takim("BOZUK", { L: 0 })] });
    expect(bozuk).toContain(">BOZUK<");
    expect(bozuk).toContain(">—<");
  });
  it("svg kimliği verilebilir (çok sayfalı önizleme)", () => {
    expect(render({ ...p, id: "katalog-svg-3" })).toContain('id="katalog-svg-3"');
    expect(render(p)).toContain('id="katalog-svg"');
  });
  it("boş katalog sayfası da çizilir (başlık + alt bant)", () => {
    const svg = render({ ...p, takimlar: [] });
    expect(svg).toContain(">Freze Serisi<");
    expect(svg).toContain(">Sayfa 1 / 2<");
  });
});
