// Kontur parçası yapıcıları (profil.js ve ozel.js ortak kullanır).
export const cizgi = (x1, y1, x2, y2) => ({ t: "L", x1, y1, x2, y2 });
export const yay = (cx, cy, r, a1, a2) => ({ t: "A", cx, cy, r, a1, a2 });
