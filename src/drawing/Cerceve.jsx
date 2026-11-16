import { CIZGI, YAZI } from "./iso";

/**
 * ISO 5457 sayfa çerçevesi: çerçeve çizgisi, merkezleme çentikleri ve bölge
 * (referans) harf/rakamları. Bölge sayısı çift tutulur, böylece orta çentik
 * hiçbir bölge yazısının üstüne gelmez.
 */
export function Cerceve({ kagit, cerceve: c }) {
  const nx = Math.max(2, 2 * Math.round(c.w / 100));
  const ny = Math.max(2, 2 * Math.round(c.h / 100));
  const gx = (i) => c.x + (i * c.w) / nx;
  const gy = (j) => c.y + (j * c.h) / ny;
  const ince = 0.35;
  const yazi = { fontSize: 3, fontFamily: YAZI.font, fill: CIZGI.renk, textAnchor: "middle" };
  const e = [];

  for (let i = 1; i < nx; i++) {
    e.push(<line key={`tx${i}`} x1={gx(i)} y1={c.y - 4} x2={gx(i)} y2={c.y} stroke={CIZGI.renk} strokeWidth={ince} />);
    e.push(<line key={`bx${i}`} x1={gx(i)} y1={c.y + c.h} x2={gx(i)} y2={c.y + c.h + 4} stroke={CIZGI.renk} strokeWidth={ince} />);
  }
  for (let j = 1; j < ny; j++) {
    e.push(<line key={`ly${j}`} x1={c.x - 4} y1={gy(j)} x2={c.x} y2={gy(j)} stroke={CIZGI.renk} strokeWidth={ince} />);
    e.push(<line key={`ry${j}`} x1={c.x + c.w} y1={gy(j)} x2={c.x + c.w + 4} y2={gy(j)} stroke={CIZGI.renk} strokeWidth={ince} />);
  }
  for (let i = 0; i < nx; i++) {
    const x = (gx(i) + gx(i + 1)) / 2;
    e.push(<text key={`tn${i}`} x={x} y={c.y - 1.2} {...yazi}>{i + 1}</text>);
    e.push(<text key={`bn${i}`} x={x} y={c.y + c.h + 3.4} {...yazi}>{i + 1}</text>);
  }
  for (let j = 0; j < ny; j++) {
    const y = (gy(j) + gy(j + 1)) / 2 + 1;
    const harf = String.fromCharCode(65 + j);
    e.push(<text key={`ll${j}`} x={c.x - 2} y={y} {...yazi}>{harf}</text>);
    e.push(<text key={`rl${j}`} x={c.x + c.w + 2.2} y={y} {...yazi}>{harf}</text>);
  }

  // Merkezleme çentikleri: sayfa kenarından çerçevenin 5 mm içine (altta antet var: çerçeveye kadar)
  const m = { stroke: CIZGI.renk, strokeWidth: 0.5 };
  return (
    <g id="cerceve">
      <rect x={c.x} y={c.y} width={c.w} height={c.h} fill="none" stroke={CIZGI.renk} strokeWidth={0.7} />
      {e}
      <line x1={kagit.w / 2} y1={0} x2={kagit.w / 2} y2={c.y + 5} {...m} />
      <line x1={kagit.w / 2} y1={kagit.h} x2={kagit.w / 2} y2={c.y + c.h} {...m} />
      <line x1={0} y1={kagit.h / 2} x2={c.x + 5} y2={kagit.h / 2} {...m} />
      <line x1={kagit.w} y1={kagit.h / 2} x2={c.x + c.w - 5} y2={kagit.h / 2} {...m} />
    </g>
  );
}
