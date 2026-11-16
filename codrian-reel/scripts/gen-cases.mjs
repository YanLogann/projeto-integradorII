// Gera placeholders FICTÍCIOS antes/depois em public/cases (substitua por prints reais).
import fs from 'node:fs'
const cases = [
  { slug: 'navalha', name: 'navalha.barbearia', title: 'Barbearia Navalha', hero: 'Corte e barba com hora marcada', c: ['#3a3a3a', '#5a4632', '#2c2c2c', '#7a6248', '#444', '#5e5e5e'], accent: '#c8963e' },
  { slug: 'pettoca', name: 'pettoca', title: 'Pet Toca', hero: 'Banho e tosa no seu bairro', c: ['#9fc6e8', '#f2c4a0', '#c6e0b4', '#e8d18f', '#b8b0e0', '#f0a9a9'], accent: '#2f7dd1' },
  { slug: 'flordesal', name: 'atelie.flordesal', title: 'Ateliê Flor de Sal', hero: 'Cerâmica feita à mão', c: ['#d9c3a5', '#b98d6a', '#e9dccb', '#a5b09a', '#cfa98a', '#efe6da'], accent: '#a4553a' },
]
const W = 448, H = 600
const esc = (s) => s.replace(/&/g, '&amp;')
for (const k of cases) {
  const tiles = k.c.map((col, i) => `<rect x="${12 + (i % 3) * 144}" y="${150 + Math.floor(i / 3) * 144}" width="136" height="136" fill="${col}"/>`).join('')
  const before = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#000"/>
<circle cx="70" cy="76" r="44" fill="${k.c[1]}" stroke="#e8605b" stroke-width="5"/>
<text x="132" y="68" font-family="Arial" font-weight="700" font-size="24" fill="#fff">${esc(k.name)}</text>
<text x="132" y="100" font-family="Arial" font-size="19" fill="#999">pedidos por DM</text>
${tiles}
<rect x="12" y="450" width="424" height="120" rx="12" fill="#151515"/>
<text x="224" y="520" text-anchor="middle" font-family="Arial" font-size="22" fill="#777">só Instagram · sem site</text>
</svg>`
  const after = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#fbfaf7"/>
<rect width="${W}" height="44" fill="#ecebe6"/><rect x="104" y="10" width="240" height="24" rx="12" fill="#fff"/>
<circle cx="40" cy="80" r="18" fill="${k.accent}"/>
<text x="68" y="88" font-family="Arial" font-weight="700" font-size="22" fill="#151515">${esc(k.title)}</text>
<rect x="20" y="118" width="408" height="170" rx="14" fill="${k.c[1]}"/>
<text x="36" y="228" font-family="Arial" font-weight="800" font-size="30" fill="#fff">${esc(k.hero.split(' ').slice(0, 3).join(' '))}</text>
<text x="36" y="266" font-family="Arial" font-weight="800" font-size="30" fill="#fff">${esc(k.hero.split(' ').slice(3).join(' '))}</text>
<rect x="20" y="304" width="196" height="110" rx="12" fill="#efede7"/><rect x="232" y="304" width="196" height="110" rx="12" fill="#efede7"/>
<rect x="36" y="324" width="120" height="14" rx="7" fill="#c9c6bd"/><rect x="248" y="324" width="120" height="14" rx="7" fill="#c9c6bd"/>
<text x="36" y="390" font-family="Arial" font-size="20" fill="#f5a400">★★★★★</text>
<rect x="20" y="430" width="408" height="60" rx="12" fill="#e3efe0"/>
<rect x="20" y="512" width="408" height="64" rx="32" fill="#25d366"/>
<text x="224" y="553" text-anchor="middle" font-family="Arial" font-weight="700" font-size="24" fill="#062b13">WhatsApp</text>
</svg>`
  fs.writeFileSync(`public/cases/${k.slug}-antes.svg`, before)
  fs.writeFileSync(`public/cases/${k.slug}-depois.svg`, after)
}
console.log('cases ok')
