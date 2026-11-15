// Shaders das cenas. Saída: rgb HDR linear, a = círculo de confusão (DOF, 0..1)
'use strict';
const COMMON = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform vec2 uRes; uniform float uT, uG; uniform vec4 uA, uB, uC, uD;
#define PI 3.14159265
#define VOID vec3(.0063,.0042,.0118)
#define VIOLET vec3(.141,.036,.807)
#define VIOLETHI vec3(.258,.150,1.)
#define LIME vec3(.474,1.,.068)
#define CRIMSON vec3(1.,.045,.035)
float h11(float p){ p = fract(p*.1031); p *= p+33.33; p *= p+p; return fract(p); }
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*.1031); p3 += dot(p3, p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
vec2 h22(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*vec3(.1031,.1030,.0973)); p3 += dot(p3, p3.yzx+33.33); return fract((p3.xx+p3.yz)*p3.zy); }
float h31(vec3 p3){ p3 = fract(p3*.1031); p3 += dot(p3, p3.zyx+31.32); return fract((p3.x+p3.y)*p3.z); }
float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
float n3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(mix(h31(i), h31(i+vec3(1,0,0)), f.x), mix(h31(i+vec3(0,1,0)), h31(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i+vec3(0,0,1)), h31(i+vec3(1,0,1)), f.x), mix(h31(i+vec3(0,1,1)), h31(i+vec3(1,1,1)), f.x), f.y), f.z); }
float fbm2(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 6; i++){ s += a*n2(p); p = mat2(1.6,1.2,-1.2,1.6)*p; a *= .5; } return s; }
float fbm3(vec3 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++){ s += a*n3(p); p = p*2.03 + vec3(1.7,9.2,3.1); a *= .5; } return s; }
float fbm3l(vec3 p){ float s = 0., a = .5; for (int i = 0; i < 3; i++){ s += a*n3(p); p = p*2.03 + vec3(1.7,9.2,3.1); a *= .5; } return s; }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c,-s,s,c); }
mat3 lookAt(vec3 ro, vec3 ta, float roll){ vec3 f = normalize(ta-ro); vec3 r = normalize(cross(f, vec3(sin(roll),cos(roll),0))); vec3 u = cross(r,f); return mat3(r,u,f); }
vec2 sphI(vec3 ro, vec3 rd, float r){ float b = dot(ro,rd); float c = dot(ro,ro)-r*r; float h = b*b-c; if (h < 0.) return vec2(-1); h = sqrt(h); return vec2(-b-h, -b+h); }
vec3 stars(vec3 rd, float dens){
  vec3 c = vec3(0);
  for (int l = 0; l < 3; l++){
    float sc = 180. + float(l)*140.;
    vec3 p = rd*sc; vec3 i = floor(p); vec3 f = fract(p)-.5;
    float r = h31(i + float(l)*17.);
    if (r > 1.-dens*(.012+.01*float(l))) {
      vec3 jit = vec3(h31(i+1.), h31(i+2.), h31(i+3.))-.5;
      float d = length(f - jit*.6);
      float b = pow(r, 30.)*2. + .25;
      vec3 tint = mix(vec3(.7,.75,1.), vec3(1.,.85,.7), h31(i+5.));
      c += tint*b*smoothstep(.09, 0., d);
    }
  }
  return c;
}
vec3 nebula(vec3 rd){
  float n = fbm3(rd*2.2 + vec3(0,0,uG*.01));
  float m = fbm3(rd*4.5 + 7.);
  return (VIOLET*.05*pow(n, 3.)*3. + vec3(.02,.01,.04)*m) * smoothstep(.2,.9,n);
}
`;

// ---------------------------------------------------------------- ESPAÇO: Terra + anomalia
const FS_SPACE = COMMON + `
// uA: camPos.xyz, fov   uB: camTarget.xyz, roll
// uC: x=cityLights(0..1) y=blackout wave (−1..1.2) z=restoration (0..1) w=sun
// uD: anomaly pos.xyz , anomaly size (0 = none)
vec3 sunDir = normalize(vec3(-.62,.42,-.66));
float landMask(vec3 p){
  float c = fbm3(p*1.7 + vec3(3.1,1.2,.4));
  c += .25*fbm3(p*5.);
  return smoothstep(.56, .6, c);
}
vec3 anomaly(vec3 ro, vec3 rd, out float alpha){
  alpha = 0.;
  if (uD.w <= 0.) return vec3(0);
  vec3 cpos = uD.xyz; vec3 nrm = normalize(ro - cpos);
  float t = dot(cpos - ro, nrm) / dot(rd, nrm);
  if (t < 0.) return vec3(0);
  vec3 hp = ro + rd*t - cpos;
  vec3 ax = normalize(cross(nrm, vec3(0,1,0))); vec3 ay = cross(ax, nrm);
  vec2 q = vec2(dot(hp, ax), dot(hp, ay)) / uD.w;
  q.y *= 1.25;
  float r = length(q); float a = atan(q.y, q.x);
  float sw = a + 2.2/(r+.15) - uG*.6;
  float lr = log(r+.05);
  float f = fbm3(vec3(cos(sw)*1.4, sin(sw)*1.4, lr*3. - uG*.5));
  float f2 = fbm3(vec3(cos(sw)*2.8+4., sin(sw)*2.8, lr*6. - uG*.9));
  float disk = smoothstep(1.05, .25, r) * smoothstep(.12, .3, r);
  float bands = pow(f, 2.2)*2.2 + pow(f2, 4.)*1.5;
  vec3 col = mix(CRIMSON*.9, vec3(1.,.3,.2), pow(f2,2.)) * bands * disk * .9 * smoothstep(.25,.6,f);
  col += VIOLETHI*.6*pow(max(0., 1.-abs(r-.95)/.25), 3.)*f;           // borda violeta
  float ring = exp(-pow((r-.36)/.03, 2.));                              // horizonte brilhante
  col += vec3(1.,.45,.38)*ring*1.4;
  // relâmpagos
  float lt = 1. - abs(fbm3(vec3(cos(a)*2., sin(a)*2., r*4. + floor(uG*8.)*3.1))*2. - 1.);
  col += vec3(1.,.6,.7)*pow(lt, 30.)*disk*2.5*step(.6, h11(floor(uG*8.)));
  float core = smoothstep(.37, .31, r);
  alpha = max(core, 0.);
  col *= (1.-core);
  col += CRIMSON*.18*exp(-r*1.6);                                       // halo
  return col * smoothstep(1.6, .9, r*.8+.2);
}
void main(){
  vec2 uv = (vUv-.5)*vec2(uRes.x/uRes.y, 1.)*2.;
  vec3 ro = uA.xyz; mat3 cm = lookAt(ro, uB.xyz, uB.w);
  vec3 rd = normalize(cm*vec3(uv, uA.w));
  vec3 col = stars(rd, 1.) + nebula(rd);
  float aa; vec3 an = anomaly(ro, rd, aa);
  vec2 hit = sphI(ro, rd, 1.);
  // atmosfera (dispersão aproximada)
  float b = dot(-ro, rd); vec3 cp = ro + rd*max(b,0.); float hgt = length(cp) - 1.;
  float tAnom = dot(uD.xyz - ro, rd);
  bool anomBehind = hit.x < 0. || (tAnom > 0. && tAnom < hit.x);
  if (hit.x < 0.) col = col*(1.-aa) + an; // anomalia só no céu
  if (hit.x > 0.) {
    vec3 p = ro + rd*hit.x; vec3 n = normalize(p);
    // rotação lenta da Terra
    vec3 pr = p; pr.xz *= rot(uG*.012);
    float land = landMask(pr);
    float sd = dot(n, sunDir);
    float day = smoothstep(-.08, .35, sd);
    vec3 ocean = vec3(.003,.012,.045);
    vec3 ground = mix(vec3(.03,.045,.02), vec3(.09,.07,.05), fbm3(pr*9.));
    vec3 alb = mix(ocean, ground, land);
    float cl = smoothstep(.56, .8, fbm3(pr*3.1 + vec3(uG*.004,0,0)));
    alb = mix(alb, vec3(.3,.3,.34), cl*.8);
    vec3 c = alb*day*.9;
    vec3 h = normalize(sunDir - rd);
    c += vec3(1.,.8,.6)*pow(max(dot(n,h),0.), 80.)*(1.-land)*(1.-cl)*day*.6;
    // luzes das cidades (lado noturno)
    float night = smoothstep(.15, -.2, sd);
    float cityN = smoothstep(.45, .8, n3(pr*18.)) * smoothstep(.3,.7,n3(pr*5.+2.));
    float sparkle = pow(h31(floor(pr*420.)), 14.)*1.5 + smoothstep(.55,.95,n3(pr*90.));
    float lights = land*cityN*sparkle*(1.-cl*.8);
    // onda de apagão: avança a partir da direção da anomalia
    vec3 aDir = normalize(uD.xyz);
    float wave = dot(n, aDir);                  // 1 perto da anomalia
    float off = smoothstep(uC.y - .06, uC.y + .06, wave); // apagado quando wave > frente
    float restored = uC.z;
    vec3 warm = vec3(1.,.62,.28);
    vec3 newc = mix(VIOLETHI, vec3(.85,.9,1.), .35);
    vec3 lc = mix(warm*(1.-off), newc*1.3, restored);
    c += lc*lights*night*uC.x*3.;
    // brilho de aviso das cidades quando a frente passa
    c += CRIMSON*lights*night*exp(-pow((wave-uC.y)/.03,2.))*3.*(1.-restored)*step(-.99,uC.y);
    // reflexo da anomalia no oceano/nuvens
    c += CRIMSON*.06*max(dot(n, aDir),0.)*smoothstep(.0,1.,uD.w)*(1.-restored);
    // atmosfera na superfície (fresnel)
    float fr = pow(1.-max(dot(n,-rd),0.), 3.);
    vec3 atm = mix(vec3(.12,.25,.9), VIOLETHI, .45);
    c += atm*fr*(day*.8 + .06);
    col = c;
    if (tAnom > 0. && tAnom < hit.x) col = col*(1.-aa) + an;
  }
  // halo atmosférico no limbo
  float rim = exp(-max(hgt,0.)/.035) * smoothstep(-.02,.0,hgt) ;
  float sunSide = pow(max(dot(normalize(cp), sunDir),0.), .7);
  vec3 atmC = mix(vec3(.15,.3,1.), VIOLETHI, .5);
  col += atmC*rim*(.15 + sunSide*2.2) * step(0., b);
  // nascer do sol no limbo
  float sunGlow = pow(max(dot(rd, sunDir),0.), 900.)*30. + pow(max(dot(rd,sunDir),0.), 30.)*.4;
  col += vec3(1.,.82,.65)*sunGlow*uC.w * (hit.x < 0. ? 1. : 0.);
  col += vec3(1.,.8,.6)*exp(-max(hgt,0.)/.012)*smoothstep(-.012,0.,hgt)*sunSide*3.*uC.w*step(0.,b);
  o = vec4(col, 0.);
}`;

// ---------------------------------------------------------------- CIDADE (vista aérea noturna)
const FS_CITY = COMMON + `
// uA: cam pos xyz, fov  uB: target xyz, roll
// uC: x=blackout radius, y=restore radius, z=edge, w=fog   uD: center xz, xy=center, z = flicker, w = dof focus
float bh(vec2 cell){ float r = h21(cell); float cen = length(cell)*.02; return (.15 + pow(r, 3.)*1.6) * (1.2 - smoothstep(0., 2.5, cen)*.6); }
float map(vec3 p, out vec2 cell){
  vec2 c = floor(p.xz); cell = c; vec2 f = fract(p.xz)-.5;
  float hgt = bh(c);
  if (h21(c+7.) < .12) hgt = .02; // praças
  vec2 hs = vec2(.36 + .06*h21(c+3.), .36 + .06*h21(c+4.));
  vec2 q = abs(f) - hs; float dxz = length(max(q,0.)) + min(max(q.x,q.y),0.);
  float dy = p.y - hgt;
  float d = max(dxz, dy);
  return min(d, p.y);
}
void main(){
  vec2 uv = (vUv-.5)*vec2(uRes.x/uRes.y, 1.)*2.;
  vec3 ro = uA.xyz; mat3 cm = lookAt(ro, uB.xyz, uB.w);
  vec3 rd = normalize(cm*vec3(uv, uA.w));
  float t = 0.; vec2 cell; bool hitB = false; vec3 p;
  // pular até o teto dos prédios
  if (ro.y > 2.) t = (ro.y - 2.) / max(-rd.y, 1e-3);
  for (int i = 0; i < 90; i++){
    p = ro + rd*t; float d = map(p, cell);
    if (d < .002*t) { hitB = true; break; }
    t += min(d, .45)*.9; if (t > 120.) break;
  }
  vec3 col = vec3(0);
  vec2 ctr = uD.xy;
  float distC = length(p.xz - ctr);
  // lightOn = 1 fora do raio do apagão; 0 dentro
  float lightOn = uC.x <= 0. ? 1. : smoothstep(uC.x - uC.z, uC.x, distC);
  float rest = 1.-smoothstep(uC.y - uC.z, uC.y, distC); // 1 = restaurado
  if (uC.y <= 0.) rest = 0.;
  if (hitB) {
    vec2 e = vec2(.002,0); vec2 cc;
    vec3 n = normalize(vec3(map(p+e.xyy,cc)-map(p-e.xyy,cc), map(p+e.yxy,cc)-map(p-e.yxy,cc), map(p+e.yyx,cc)-map(p-e.yyx,cc)));
    float hgt = bh(cell);
    vec3 warm = vec3(1.,.65,.32), cool = vec3(.6,.75,1.);
    vec3 winC = mix(warm, cool, step(.7, h21(cell+11.)));
    vec3 newC = mix(VIOLETHI*1.3, vec3(.9,.9,1.), h21(cell+13.)*.4);
    if (p.y < .003) {
      // ruas: grade de luzes
      vec2 f = fract(p.xz) - .5; float street = smoothstep(.43,.47, max(abs(f.x),abs(f.y)));
      float lamps = smoothstep(.06, .0, length(fract(p.xz*4.)-.5)) * street;
      float traffic = street * smoothstep(.97, 1., n2(vec2(p.x*3. + uG*2.5, floor(p.z))) ) * 3.;
      vec3 sc = (vec3(1.,.62,.3)*(street*.35 + lamps*1.6) + vec3(1.,.3,.2)*traffic*.5);
      col = sc*lightOn*(1.-rest) + (VIOLETHI*(street*.45+lamps*1.8) + vec3(.8,.85,1.)*traffic*.3)*rest;
      col += vec3(.01,.008,.02);
    } else if (n.y > .5) {
      col = vec3(.012,.01,.02) + (h21(cell+5.) > .8 ? vec3(1.,.2,.15)*smoothstep(.06,.0,length(fract(p.xz)-.5-.25))*2.*lightOn*(1.-rest) : vec3(0));
    } else {
      // janelas nas fachadas
      vec2 fu = vec2(n.x != 0. ? p.z : p.x, p.y);
      vec2 wv = fu*vec2(9., 13.); vec2 wi = floor(wv); vec2 wf = fract(wv);
      float win = step(.25, wf.x)*step(wf.x,.8)*step(.3,wf.y)*step(wf.y,.8);
      float on = step(.72, h21(wi + cell*31.));
      // apagão janela a janela com cintilação
      float flick = step(.5, h21(wi + floor(uG*14.)));
      float lit = win*on;
      float edge = smoothstep(uC.x - uC.z*1.5, uC.x, distC);
      float alive = uC.x <= 0. ? 1. : mix(edge, edge*flick, smoothstep(.2,.8, edge)*(1.-edge)*4.);
      col = vec3(.01,.008,.018) + winC*lit*.9*alive*(1.-rest) + newC*lit*1.3*rest*step(.3, h21(wi+cell));
      col *= .55 + .45*smoothstep(0., hgt, p.y);
    }
    // frente do apagão: linha vermelha de falha / frente da restauração: violeta
    col += CRIMSON*exp(-pow((distC-uC.x)/.25,2.))*.25*step(.01,uC.x)*(1.-rest);
    col += VIOLETHI*exp(-pow((distC-uC.y)/.35,2.))*.9*step(.01,uC.y);
  }
  // neblina/atmosfera
  float fog = 1.-exp(-t*uC.w);
  vec3 fogC = mix(vec3(.02,.015,.04), vec3(.04,.02,.09), rest) + CRIMSON*.01*(1.-lightOn);
  col = mix(col, fogC, fog);
  // horizonte
  if (!hitB) col = fogC + vec3(.03,.02,.07)*pow(max(0., 1.-abs(rd.y)*4.),3.);
  float coc = clamp(abs(t - uD.w)/max(uD.w,1.)*1.2, 0., 1.);
  o = vec4(col, coc);
}`;

// ---------------------------------------------------------------- SERVIDORES (corredor)
const FS_SERVERS = COMMON + `
// uA: cam z, sway, fov, failure(0..1)  uB: x=emergency light, y=ceiling on
float sdBox(vec3 p, vec3 b){ vec3 q = abs(p)-b; return length(max(q,0.)) + min(max(q.x,max(q.y,q.z)),0.); }
float map(vec3 p, out float id){
  float rz = floor(p.z/1.1); vec3 q = p; q.z = mod(p.z, 1.1) - .55;
  q.x = abs(q.x);
  float rack = sdBox(q - vec3(1.45,1.1,0), vec3(.45,1.1,.52));
  float floorD = p.y;
  float ceil = 2.6 - p.y;
  float wall = 2.2 - abs(p.x);
  id = rz + (p.x > 0. ? 500. : 0.);
  float d = min(rack, min(floorD, min(ceil, wall)));
  return d;
}
void main(){
  vec2 uv = (vUv-.5)*vec2(uRes.x/uRes.y, 1.)*2.;
  float fail = uA.w;
  vec3 ro = vec3(sin(uG*.7)*.06*uA.y, 1.25, uA.x);
  vec3 ta = ro + vec3(.02, -.05, -1.);
  mat3 cm = lookAt(ro, ta, sin(uG*.5)*.02);
  vec3 rd = normalize(cm*vec3(uv, uA.z));
  float t = 0., id; vec3 p;
  for (int i = 0; i < 110; i++){ p = ro + rd*t; float d = map(p, id); if (d < .001) break; t += d*.9; if (t > 40.) break; }
  vec3 col = vec3(.01,.012,.02);
  vec2 e = vec2(.002,0); float dd;
  vec3 n = normalize(vec3(map(p+e.xyy,dd)-map(p-e.xyy,dd), map(p+e.yxy,dd)-map(p-e.yxy,dd), map(p+e.yyx,dd)-map(p-e.yyx,dd)));
  float zc = p.z;
  // falha se propaga do fundo para a câmera
  float local = clamp(fail*1.3 - .25 - (ro.z - zc)*.05, 0., 1.);
  if (abs(n.x) > .9 && abs(p.x) < 1.05) {
    // frente do rack: LEDs
    vec2 g = vec2(p.z*22., p.y*40.); vec2 gi = floor(g); vec2 gf = fract(g)-.5;
    float led = smoothstep(.22,.08,length(gf*vec2(1.,1.4)));
    float r = h21(gi + id*13.);
    float blink = step(.5, h21(gi + floor(uG*(6.+r*10.))));
    float exists = step(.45, r) * step(.15, fract(p.y*3.3)) ;
    vec3 ok = mix(vec3(.15,1.,.55), vec3(.25,.45,1.), step(.8, h21(gi+3.)));
    float st = h21(gi + id*7.1);
    float dead = step(st, local);             // apagado
    float warn = step(st, local + .25)*(1.-dead);  // vermelho antes de morrer
    vec3 lc = ok*(1.-warn) + CRIMSON*1.3*warn*blink;
    col = vec3(.02,.022,.035)*(1.+step(.9,fract(p.z/1.1*2.))*2.) + lc*led*exists*(1.-dead)*(.7+.8*blink)*3.5;
    // painéis/fendas
    col += vec3(.02)*step(.96, fract(p.y*3.3));
  } else if (n.y < -.9) {
    // teto: faixas de luz
    float strip = smoothstep(.06,.0,abs(abs(p.x)-.6))*step(.3, fract(p.z*.5));
    float fl = step(.35, h21(vec2(floor(p.z*.5), floor(uG*12.))));
    float alive = 1.-step(h21(vec2(floor(p.z*.5),9.)), local*1.2);
    col = vec3(.85,.9,1.)*strip*2.5*uB.y*mix(1., fl, smoothstep(.0,.6,local))*alive;
  } else if (n.y > .9) {
    col = vec3(.006,.006,.012);
  } else col = vec3(.006,.006,.012);
  // luz de emergência giratória
  float em = pow(max(0., sin(uG*6. + p.z*.3)), 6.);
  col += CRIMSON*.08*em*uB.x*(.5 + .5*max(n.y,0.));
  // reflexo fake no chão (piso polido)
  if (n.y > .9) {
    vec3 rr = reflect(rd, n); float tt = .05; vec3 pp;
    for (int i = 0; i < 40; i++){ pp = p + rr*tt; float d = map(pp, id); if (d < .002) break; tt += d; if (tt > 12.) break; }
    vec2 g = vec2(pp.z*34., pp.y*60.); vec2 gi = floor(g);
    float rr2 = h21(gi + id*13.); float st = h21(gi + id*7.1);
    float loc2 = clamp(fail*1.6 - (ro.z - pp.z)*.04, 0., 1.);
    float on = step(.62, rr2)*(1.-step(st, loc2));
    col += vec3(.1,.6,.4)*on*.12*exp(-tt*.2) + CRIMSON*.02*em*uB.x;
    float strip = smoothstep(.1,.0,abs(abs(pp.x)-.6))*step(.3, fract(pp.z*.5))*step(2.5, pp.y);
    col += vec3(.6,.65,.8)*strip*.25*uB.y*(1.-local);
  }
  float fog = 1.-exp(-t*.07);
  col = mix(col, vec3(.01,.008,.02) + CRIMSON*.01*uB.x, fog);
  o = vec4(col, clamp(abs(t-3.)/8., 0., 1.));
}`;

// ---------------------------------------------------------------- VAZIO da marca (fundo para painéis, rede e logo)
const FS_VOID = COMMON + `
// uA: glow center xy, glow radius, glow intensity  uB: grid amount, grid speed, tint mix(0 violeta 1 carmim), smoke
// uC: camera tilt, horizon, lime spark xy(z,w)
void main(){
  vec2 uv = vUv; vec2 asp = vec2(uRes.x/uRes.y, 1.);
  vec2 q = (uv - uA.xy)*asp;
  float r = length(q);
  vec3 tint = mix(vec3(.2,.045,.72), CRIMSON*.6, uB.z);
  vec3 col = VOID*1.2;
  col += tint*uA.w*exp(-r*r/(uA.z*uA.z))*.6;
  col += tint*uA.w*.15*exp(-r/(uA.z*2.));
  // fumaça
  float sm = fbm2(uv*vec2(2.,3.5) + vec2(uG*.03, -uG*.05));
  float sm2 = fbm2(uv*vec2(5.,7.) - vec2(uG*.05, uG*.02) + sm);
  col += tint*.10*pow(sm2, 2.)*uB.w*(.4+uA.w);
  // chão em grade de perspectiva
  float hz = uC.y;
  if (uB.x > 0. && uv.y < hz) {
    float y = (hz - uv.y); float z = .25/max(y, .001);
    float x = (uv.x - .5)*z*asp.x*1.8;
    float gz = z + uG*uB.y;
    float lx = smoothstep(.02, 0., abs(fract(x)-.5)-.485);
    float lz = smoothstep(.03, 0., abs(fract(gz)-.5)-.48);
    float g = max(lx, lz*smoothstep(4.,1.5,z)) * exp(-z*.35) * smoothstep(0., .02, y);
    col += VIOLETHI*g*uB.x*.6;
  }
  // faísca lima
  if (uC.z > 0.) { vec2 sq = (uv - uC.zw)*asp; col += LIME*exp(-length(sq)*60.)*2.; }
  o = vec4(col, 0.);
}`;

window.SHADERS = { COMMON, FS_SPACE, FS_CITY, FS_SERVERS, FS_VOID };

// ---------------------------------------------------------------- ANTAGONISTA (SDF raymarched)
SHADERS.FS_MASK = SHADERS.COMMON + `
// uA: cam pos xyz, fov  uB: target xyz, roll
// uC: x=olhos, y=varredura de luz (-1..1), z=relâmpago, w=recorte
// uD: x=dissolução, y=fumaça, z=contraluz carmim, w=foco DOF
float sdBox(vec3 p, vec3 b){ vec3 q = abs(p)-b; return length(max(q,0.)) + min(max(q.x,max(q.y,q.z)),0.); }
float sdEll(vec3 p, vec3 r){ float k0 = length(p/r); float k1 = length(p/(r*r)); return k0*(k0-1.)/k1; }
float smin(float a, float b, float k){ float h = clamp(.5+.5*(b-a)/k, 0., 1.); return mix(b,a,h) - k*h*(1.-h); }
float sdCap(vec3 p, vec3 a, vec3 b, float r){ vec3 pa = p-a, ba = b-a; float h = clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h)-r; }
float gEye = 1e3; // distância às fendas (para brilho volumétrico)
float head(vec3 p){
  vec3 q = vec3(abs(p.x), p.y, p.z);
  // casco: elipsoide estreito, facetado em planos (máscara angular)
  float d = sdEll(p - vec3(0,.04,-.08), vec3(.68,.82,.8));
  d = max(d, dot(q, normalize(vec3(.9,.0,.45))) - .58);
  d = max(d, dot(q, normalize(vec3(.62,-.55,.56))) - .55);
  d = max(d, dot(p, normalize(vec3(0,-1.,.32))) - .74);
  // placa facial sobreposta (camada de armadura)
  float face = sdEll(p - vec3(0,-.02,.08), vec3(.56,.74,.74));
  face = max(face, dot(q, normalize(vec3(.8,.0,.6))) - .62);
  face = max(face, dot(q, normalize(vec3(.5,-.6,.62))) - .58);
  face = max(face, -(p.z - .18));
  face = max(face, p.y - .42 + q.x*.55);       // topo em V (testa em ponta)
  d = min(d, face);
  // sobrancelha pesada em chevron
  vec3 b = q - vec3(0.,.25,.67); b.xy *= rot(-.42);
  d = smin(d, sdBox(b, vec3(.36,.04,.11)) - .004, .03);
  // fendas dos olhos: finas, inclinadas para o centro
  vec3 e = q - vec3(.2,.13,.72); e.xy *= rot(-.42);
  float eye = sdBox(e, vec3(.12,.017,.28));
  gEye = min(gEye, sdBox(e - vec3(0,0,-.08), vec3(.1,.006,.02)));
  d = max(d, -eye);
  // aresta central
  d = smin(d, sdBox(p - vec3(0,-.02,.755), vec3(.018,.26,.04)), .015);
  // grade vertical da boca
  vec3 m = p - vec3(0,-.42,.66);
  float mb = sdBox(m, vec3(.16,.09,.2));
  vec3 mm = m; mm.x = mod(mm.x+.025,.05)-.025;
  d = max(d, -max(sdBox(mm, vec3(.009,.08,.3)), mb));
  // sulcos limitados à superfície
  float g1 = abs(p.y - .46 + q.x*.5) - .005;
  d = max(d, -max(g1, -(d+.02)));
  // crista
  float fin = sdBox(p - vec3(0,.6,-.25), vec3(.028,.32,.6));
  fin = max(fin, length(p - vec3(0,-.25,-.15)) - 1.12);
  d = smin(d, fin, .025);
  // aletas laterais varridas para trás (presas ao crânio)
  vec3 h = q - vec3(.5,.28,-.25); h.xz *= rot(.5); h.yz *= rot(-.35);
  float al = sdBox(h, vec3(.06,.1,.42));
  al = max(al, length(p - vec3(0,.1,-.2)) - 1.05);
  d = smin(d, al, .05);
  return d;
}
float body(vec3 p){
  vec3 q = vec3(abs(p.x), p.y, p.z);
  // gola alta que esconde o pescoço
  float g = length(p.xz - vec2(0,-.15)) - mix(.66, .5, clamp((p.y + 1.35)/.75, 0., 1.));
  g = max(g, abs(p.y + .95) - .42);
  g = max(g, -(length(p.xz - vec2(0,-.15)) - mix(.56,.4, clamp((p.y + 1.35)/.75, 0., 1.))));
  g = max(g, dot(p, normalize(vec3(0,.6,.8))) - .05);
  float d = g;
  d = min(d, sdCap(p, vec3(0,-.55,-.15), vec3(0,-1.4,-.15), .36));
  // tronco em V: ombros largos
  float tor = sdBox(p - vec3(0,-2.35,-.2), vec3(1.2,1.0,.55)) - .06;
  tor = max(tor, dot(q - vec3(1.3,-1.4,0), normalize(vec3(.92,-.38,0))));
  tor = max(tor, dot(p - vec3(0,-1.5,.2), normalize(vec3(0,.55,.83))));
  float plate = sdBox(q - vec3(.45,-1.95,.28), vec3(.42,.38,.08)) - .02;
  plate = max(plate, dot(q - vec3(.85,-1.6,0), normalize(vec3(.7,.7,0))));
  d = min(d, min(tor, plate));
  // ombreiras em camadas
  vec3 s = q - vec3(1.2,-1.3,-.15); s.xy *= rot(-.5);
  float pa = max(sdEll(s, vec3(.8,.42,.72)), -s.y - .1);
  vec3 s2 = s - vec3(.16,-.24,0);
  float pb = max(sdEll(s2, vec3(.84,.44,.74)), -s2.y - .08);
  vec3 s3 = s - vec3(.3,-.46,0);
  pb = min(pb, max(sdEll(s3, vec3(.84,.44,.74)), -s3.y - .08));
  d = min(d, min(pa, pb));
  // capa
  float cw = .08*sin(p.x*2.3 + uG*.8) + .05*sin(p.y*1.7 - uG*.6);
  float cape = max(abs(p.z + .95 + cw + (q.x*q.x)*.1) - .035, max(q.x - 2.1 - (-p.y-1.4)*.25, p.y + 1.15));
  d = min(d, cape);
  return d;
}
float mapS(vec3 p){
  float d = min(head(p), body(p));
  if (uD.x > 0.) {
    float nd = fbm3l(p*3.2 + vec3(0, uG*.2, 0)) + (p.y+.2)*.12;
    d = max(d, (uD.x*1.15 - nd)*.35);
  }
  return d;
}
vec3 nrm(vec3 p){ vec2 e = vec2(.0015,0); return normalize(vec3(mapS(p+e.xyy)-mapS(p-e.xyy), mapS(p+e.yxy)-mapS(p-e.yxy), mapS(p+e.yyx)-mapS(p-e.yyx))); }
float ao(vec3 p, vec3 n){ float o = 0., s = 1.; for (int i = 1; i <= 4; i++){ float h = .04*float(i); o += (h - mapS(p+n*h))*s; s *= .6; } return clamp(1.-o*3., 0., 1.); }
vec3 sky(vec3 rd, vec2 uv){
  vec3 lp = normalize(vec3(.35, .55, -1.));     // contraluz atrás e acima
  float c = max(dot(rd, lp), 0.);
  vec3 col = VOID*.8;
  col += CRIMSON*uD.z*(pow(c, 18.)*.9 + pow(c, 4.)*.12);
  col += VIOLET*.10*uC.w*pow(max(rd.y*.5+.5,0.),2.);
  // raios crepusculares falsos
  vec3 v = rd - lp; float ang = atan(v.y, v.x);
  float rays = pow(fbm2(vec2(ang*7., uG*.15)), 3.)*2.5 * pow(c, 3.);
  col += mix(CRIMSON, vec3(1.,.4,.3), .2)*rays*uD.z*.35;
  // fumaça
  float sm = fbm2(rd.xy*3. + vec2(uG*.05, -uG*.04));
  float sm2 = fbm2(rd.xy*7. + sm*1.5 - vec2(uG*.07, 0));
  col = mix(col, col*.4 + CRIMSON*.06*uD.z + VIOLET*.04, smoothstep(.35,.85, sm2)*uD.y);
  col += vec3(.7,.75,1.)*uC.z*.35*(1.-c);
  return col;
}
void main(){
  vec2 uv = (vUv-.5)*vec2(uRes.x/uRes.y, 1.)*2.;
  vec3 ro = uA.xyz; mat3 cm = lookAt(ro, uB.xyz, uB.w);
  vec3 rd = normalize(cm*vec3(uv, uA.w));
  float t = 0.; bool hit = false; vec3 p; float glow = 0.;
  vec2 bnd = sphI(ro - vec3(0,-1.6,-.2), rd, 3.4);
  if (bnd.y > 0.) {
    t = max(bnd.x, 0.);
    for (int i = 0; i < 120; i++){
      p = ro + rd*t; gEye = 1e3; float d = mapS(p);
      glow += exp(-gEye*45.)*.035 + exp(-gEye*12.)*.008;
      if (d < .0008*t) { hit = true; break; }
      t += d*.85; if (t > bnd.y) break;
    }
  }
  vec3 col = sky(rd, uv);
  float coc;
  if (hit) {
    vec3 n = nrm(p);
    float a = ao(p, n);
    float scr = fbm3(p*40.);                     // arranhões
    float rough = mix(.25, .7, scr);
    vec3 base = vec3(.018,.018,.024) * (.7 + .6*fbm3(p*6.));
    vec3 c = vec3(0);
    float fres = pow(1. - max(dot(n,-rd),0.), 4.);
    // luz de recorte violeta (esquerda/trás) e fria (direita/trás)
    vec3 L1 = normalize(vec3(-.8, .35, -.6)), L2 = normalize(vec3(.85, .25, -.55));
    c += VIOLETHI*1.1*uC.w*pow(max(dot(n, L1),0.), 3.)*(.06+fres*3.5);
    c += vec3(.6,.68,1.)*.8*uC.w*pow(max(dot(n, L2),0.), 3.)*(.06+fres*3.5);
    // contraluz carmim
    vec3 L3 = normalize(vec3(.3,.5,-1.));
    c += CRIMSON*uD.z*.8*pow(max(dot(n, L3),0.),3.)*(.04+fres*4.);
    // luz de varredura (revelação)
    vec3 Ls = normalize(vec3(uC.y*1.4, .35, .6));
    vec3 hs = normalize(Ls - rd);
    float spec = pow(max(dot(n,hs),0.), mix(90., 12., rough));
    float swp = smoothstep(.0, .4, 1.-abs(dot(n, normalize(vec3(1,0,.2))) - uC.y*.9));
    c += vec3(.9,.92,1.)*(base*max(dot(n,Ls),0.)*5. + spec*1.2*(1.-rough*.6))*swp*step(-1.5,uC.y);
    // relâmpago
    vec3 Lf = normalize(vec3(-.4,.9,.5));
    c += vec3(.75,.8,1.)*uC.z*(max(dot(n,Lf),0.)*base*5. + pow(max(dot(n, normalize(Lf-rd)),0.),60.)*2.5 + fres*.4);
    // luz dos olhos sobre o rosto
    vec3 ep = vec3(sign(p.x)*.2,.13,.82);
    float ed = length(p - ep);
    c += CRIMSON*uC.x*max(dot(n, normalize(ep-p)),0.)*.12/(ed*ed*8.+.05);
    // reflexo do ambiente
    vec3 r = reflect(rd, n);
    vec3 env = VOID*.5 + CRIMSON*uD.z*.25*pow(max(dot(r, L3),0.),6.) + VIOLETHI*.06*uC.w*pow(max(r.y,0.),2.);
    c += env*(.25 + fres*1.2)*(1.-rough*.5);
    c *= a;
    // borda da dissolução: energia violeta + lima
    if (uD.x > 0.) {
      float nd = fbm3l(p*3.2 + vec3(0, uG*.2, 0)) + (p.y+.2)*.12;
      float dd = nd - uD.x*1.15;
      float edge = 1. - smoothstep(0., .06, dd);
      c += VIOLETHI*1.6*edge + LIME*.7*(1. - smoothstep(0., .008, dd));
    }
    col = c;
    coc = clamp(abs(t - uD.w)*.45, 0., 1.);
  } else coc = 1.;
  if (hit) { gEye = 1e3; head(p); col += mix(CRIMSON, vec3(1.,.5,.4), .3)*uC.x*7.*exp(-gEye*55.); }
  col += CRIMSON*glow*uC.x*1.6;
  o = vec4(col, coc);
}`;

// ---------------------------------------------------------------- EXPLOSÃO DE ENERGIA
SHADERS.FS_BLAST = SHADERS.COMMON + `
// uA: x=progresso explosão (0..1), y=implosão (0..1), z=intensidade, w=onda de choque raio
void main(){
  vec2 asp = vec2(uRes.x/uRes.y, 1.);
  vec2 q = (vUv - vec2(.5,.55))*asp*2.;
  float r = length(q); float a = atan(q.y, q.x);
  float ex = uA.x, im = uA.y;
  float scale = mix(.05, 1.6, pow(ex, .5)) * (1. - im*.97);
  float rr = r/max(scale, .001);
  // plasma: fbm em coordenadas polares com distorção
  vec2 pq = vec2(a*2.5, log(rr+.1)*2. - uG*1.8);
  float w = fbm2(pq + fbm2(pq*1.7 + uG*.4)*1.6);
  float w2 = fbm2(vec2(a*6., rr*3. - uG*2.5));
  float body = exp(-rr*rr*1.4) * (.4 + w*1.3);
  float tendr = pow(max(0., 1.-abs(w2*2.-1.)), 6.)*exp(-rr*.9);
  vec3 col = VOID;
  col += vec3(.2,.045,.72)*body*1.6*uA.z + VIOLETHI*tendr*1.3*uA.z;
  col += mix(vec3(1.), LIME, .6)*exp(-rr*rr*30.)*1.4*uA.z;                // núcleo lima-branco
  col += LIME*.6*pow(max(0.,1.-abs(w-.62)*6.),4.)*exp(-rr*1.5)*uA.z;     // filamentos lima
  // onda de choque
  float sw = uA.w; float ring = exp(-pow((r - sw)/(.02 + sw*.04), 2.));
  col += (VIOLETHI*2.2 + vec3(.6))*ring*(1.-smoothstep(.6, 2.2, sw))*step(.001, sw);
  // raios estelares
  float spikes = pow(abs(cos(a*3.)), 60.) + pow(abs(sin(a*3.+.5)), 80.);
  col += vec3(.8,.75,1.)*spikes*exp(-r*3.5/max(scale,.05))*uA.z*.4;
  // implosão: tudo converge num ponto
  col *= 1. - smoothstep(.6, 1., im)*.92;
  o = vec4(col, 0.);
}`;
