// Çizimde kullanılan gömülü görseller (derlemede tek dosyaya gömülür)
import LOGO_IMG from "./logo.png";
import { FIRMA } from "../config";

/** Kullanılacak logo: Firma ayarlarında yüklenen varsa o, yoksa yerleşik MİHENK logosu. */
const logoAl = () => FIRMA.logo || LOGO_IMG;

export { LOGO_IMG, logoAl };
