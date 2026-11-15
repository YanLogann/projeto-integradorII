// CODRIAN DOOMSDAY — núcleo de render (WebGL2, HDR, pós-processamento cinematográfico)
'use strict';
const W = 1080, H = 1920;
const canvas = document.getElementById('out');
canvas.width = W; canvas.height = H;
const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false });
if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('sem EXT_color_buffer_float');
gl.getExtension('OES_texture_float_linear');

const VS = `#version 300 es
in vec2 p; out vec2 vUv; void main(){ vUv = p*.5+.5; gl_Position = vec4(p,0,1); }`;

function compile(fsSrc, name) {
  const mk = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh); console.error(name, log); throw new Error(name + ': ' + log); }
    return sh; };
  const pr = gl.createProgram();
  gl.attachShader(pr, mk(gl.VERTEX_SHADER, VS));
  gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, fsSrc));
  gl.bindAttribLocation(pr, 0, 'p'); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(name + ' link: ' + gl.getProgramInfoLog(pr));
  pr.u = {}; const n = gl.getProgramParameter(pr, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(pr, i); pr.u[info.name.replace('[0]', '')] = gl.getUniformLocation(pr, info.name); }
  pr.name = name; return pr;
}
const quad = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quad);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

function makeTarget(w, h, fmt = 'f16') {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  if (fmt === 'f16') gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
  else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  return { tex, fb, w, h };
}
function canvasTexture() {
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}
function upload(tex, cv) {
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
}
function draw(prog, target, uniforms = {}, textures = {}) {
  gl.useProgram(prog);
  if (target) { gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb); gl.viewport(0, 0, target.w, target.h); }
  else { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H); }
  let unit = 0;
  for (const k in textures) {
    gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, textures[k]);
    if (prog.u[k] != null) gl.uniform1i(prog.u[k], unit); unit++;
  }
  for (const k in uniforms) {
    const loc = prog.u[k]; if (loc == null) continue; const v = uniforms[k];
    if (typeof v === 'number') gl.uniform1f(loc, v);
    else if (v.length === 2) gl.uniform2fv(loc, v);
    else if (v.length === 3) gl.uniform3fv(loc, v);
    else if (v.length === 4) gl.uniform4fv(loc, v);
    else if (v.length === 16) gl.uniformMatrix4fv(loc, false, v);
    else gl.uniform4fv(loc, v);
  }
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// ---------- 2D layers ----------
function mk2d() { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; }
const cvAdd = mk2d(), cvOver = mk2d(), cvTop = mk2d();
const ctxAdd = cvAdd.getContext('2d'), ctxOver = cvOver.getContext('2d'), ctxTop = cvTop.getContext('2d');
const texAdd = canvasTexture(), texOver = canvasTexture(), texTop = canvasTexture();

// ---------- post programs ----------
const P = {};
P.combine = compile(`#version 300 es
precision highp float; in vec2 vUv; out vec4 o;
uniform sampler2D uScene, uAdd, uOver, uAcc; uniform float uW, uFirst, uAddGain;
void main(){
  vec4 s = texture(uScene, vUv);
  vec4 ov = texture(uOver, vUv); vec4 ad = texture(uAdd, vUv);
  vec3 c = s.rgb*(1.-ov.a) + ov.rgb*1.0;
  c += ad.rgb*uAddGain;
  float coc = max(s.a*(1.-ov.a), 0.);
  vec4 cur = vec4(c, coc);
  vec4 prev = uFirst > .5 ? vec4(0) : texture(uAcc, vUv);
  o = prev + cur*uW;
}`, 'combine');
P.copy = compile(`#version 300 es
precision highp float; in vec2 vUv; out vec4 o; uniform sampler2D uT; void main(){ o = texture(uT, vUv); }`, 'copy');
P.down = compile(`#version 300 es
precision highp float; in vec2 vUv; out vec4 o; uniform sampler2D uT; uniform vec2 uTexel; uniform float uThr;
vec3 pre(vec3 c){ float b = max(c.r,max(c.g,c.b)); float k = max(b-uThr,0.)/max(b,1e-4); return c*k; }
void main(){
  vec2 d = uTexel;
  vec3 a = texture(uT, vUv+d*vec2(-1,-1)).rgb + texture(uT, vUv+d*vec2(1,-1)).rgb + texture(uT, vUv+d*vec2(-1,1)).rgb + texture(uT, vUv+d*vec2(1,1)).rgb;
  vec3 b = texture(uT, vUv).rgb;
  vec3 c = (a*.125 + b*.5);
  o = vec4(uThr > 0. ? pre(c) : c, 1);
}`, 'down');
P.up = compile(`#version 300 es
precision highp float; in vec2 vUv; out vec4 o; uniform sampler2D uT, uBase; uniform vec2 uTexel; uniform float uMix;
void main(){
  vec2 d = uTexel;
  vec3 c = texture(uT, vUv+d*vec2(-1,0)).rgb + texture(uT, vUv+d*vec2(1,0)).rgb + texture(uT, vUv+d*vec2(0,-1)).rgb + texture(uT, vUv+d*vec2(0,1)).rgb;
  c = c*.15 + texture(uT, vUv).rgb*.4;
  o = vec4(texture(uBase, vUv).rgb + c*uMix, 1);
}`, 'up');
P.final = compile(`#version 300 es
precision highp float; in vec2 vUv; out vec4 o;
uniform sampler2D uAcc, uBlur, uBloom, uTop; uniform float uT, uExposure, uBloomAmt, uCA, uGrain, uVig, uFlash, uFade, uGlitch, uShakeX, uShakeY, uDOF, uZoom, uSat, uSeed;
uniform vec3 uFlashCol, uTint;
float h21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.); }
vec3 samp(vec2 uv){
  vec4 a = texture(uAcc, uv); vec3 b = texture(uBlur, uv).rgb;
  float coc = clamp(a.a*uDOF, 0., 1.);
  return mix(a.rgb, b, smoothstep(0.,1.,coc));
}
void main(){
  vec2 uv = vUv;
  uv = (uv-.5)/uZoom + .5 + vec2(uShakeX, uShakeY);
  // glitch: deslocamento em blocos horizontais
  if (uGlitch > 0.) {
    float row = floor(uv.y*48.); float r = h21(vec2(row, floor(uT*24.)+uSeed));
    if (r < uGlitch*.55) uv.x += (h21(vec2(row*1.7, floor(uT*30.))) - .5)*.18*uGlitch;
    float blk = h21(floor(uv*vec2(8.,22.)) + floor(uT*12.));
    if (blk < uGlitch*.12) uv += (vec2(h21(vec2(blk,1.)),h21(vec2(blk,2.)))-.5)*.06;
  }
  vec2 dc = uv-.5; float ca = uCA*(.4 + dot(dc,dc)*3.) + uGlitch*.012;
  vec3 c;
  c.r = samp(uv + dc*ca).r; c.g = samp(uv).g; c.b = samp(uv - dc*ca).b;
  vec3 bl = texture(uBloom, uv).rgb;
  c += bl*uBloomAmt;
  c *= uExposure;
  c *= uTint;
  c = aces(c);
  float l = dot(c, vec3(.2126,.7152,.0722)); c = mix(vec3(l), c, uSat);
  // vinheta anamórfica
  vec2 vv = (vUv-.5)*vec2(1.15,.9); c *= mix(1., smoothstep(.85,.15,length(vv)), uVig);
  c = mix(c, uFlashCol, clamp(uFlash,0.,1.));
  c *= 1.-uFade;
  // legendas e topo (sem pós)
  vec4 tp = texture(uTop, vUv); c = c*(1.-tp.a) + tp.rgb;
  // grão de filme
  float g = h21(vUv*vec2(1080.,1920.) + fract(uT*7.13)*100.) - .5;
  c += g*uGrain*(1.-l*.5);
  // scanline sutil durante glitch
  c *= 1. - uGlitch*.25*step(.5, fract(vUv.y*480.));
  o = vec4(pow(max(c,0.), vec3(1.)), 1);
}`, 'final');

// targets
const T = {
  scene: makeTarget(W, H), sceneHalf: makeTarget(W / 2, H / 2),
  accA: makeTarget(W, H), accB: makeTarget(W, H),
  blur1: makeTarget(W / 2, H / 2), blur2: makeTarget(W / 4, H / 4), blurUp: makeTarget(W / 2, H / 2),
};
const bloomDown = [], bloomUp = [];
for (let i = 1; i <= 6; i++) bloomDown.push(makeTarget(Math.ceil(W / 2 ** i), Math.ceil(H / 2 ** i)));
for (let i = 0; i < 5; i++) bloomUp.push(makeTarget(bloomDown[i].w, bloomDown[i].h));

const clear2d = (c) => { c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none'; c.clearRect(0, 0, W, H); };

window.ENGINE = { W, H, gl, compile, draw, makeTarget, P, T, ctxAdd, ctxOver, ctxTop, cvAdd, cvOver, cvTop, texAdd, texOver, texTop, upload, clear2d, bloomDown, bloomUp };

// render de um quadro final: shot = { scene(prog), uniforms(t), fx(ctxs,t), post(t) , sub, half }
ENGINE.renderFrame = function (tFrame, frameDur, getShot, subs) {
  let acc = T.accA, accOther = T.accB;
  const shot0 = getShot(tFrame);
  const N = shot0.subframes || 1;
  for (let i = 0; i < N; i++) {
    const t = Math.min(Math.max(tFrame + (N > 1 ? (i / N - 0.5) * frameDur * (shot0.shutter ?? 0.5) * 2 : 0), shot0.start), shot0.end - 1e-4);
    const sh = getShot(t);
    const tgt = sh.half ? T.sceneHalf : T.scene;
    draw(sh.prog, tgt, sh.uniforms(sh.lt, t, tgt), sh.textures || {});
    clear2d(ctxAdd); clear2d(ctxOver);
    if (sh.fx) sh.fx(ctxAdd, ctxOver, sh.lt, t);
    upload(texAdd, cvAdd); upload(texOver, cvOver);
    draw(P.combine, accOther, { uW: 1 / N, uFirst: i === 0 ? 1 : 0, uAddGain: sh.addGain ?? 1 }, { uScene: tgt.tex, uAdd: texAdd, uOver: texOver, uAcc: acc.tex });
    [acc, accOther] = [accOther, acc];
  }
  const post = Object.assign({ exposure: 1, bloom: .9, thr: 1.0, ca: .0025, grain: .07, vig: .65, flash: 0, flashCol: [1, 1, 1], fade: 0, glitch: 0, shake: [0, 0], dof: 0, zoom: 1, sat: 1, tint: [1, 1, 1] }, shot0.post ? shot0.post(shot0.lt, tFrame) : {});
  // DOF blur chain
  draw(P.down, T.blur1, { uTexel: [1 / W, 1 / H], uThr: 0 }, { uT: acc.tex });
  draw(P.down, T.blur2, { uTexel: [2 / W, 2 / H], uThr: 0 }, { uT: T.blur1.tex });
  draw(P.up, T.blurUp, { uTexel: [4 / W, 4 / H], uMix: 1.4 }, { uT: T.blur2.tex, uBase: T.blur1.tex });
  // bloom chain
  let src = acc;
  for (let i = 0; i < bloomDown.length; i++) {
    draw(P.down, bloomDown[i], { uTexel: [1 / src.w, 1 / src.h], uThr: i === 0 ? post.thr : 0 }, { uT: src.tex });
    src = bloomDown[i];
  }
  let up = bloomDown[5];
  for (let i = 4; i >= 0; i--) {
    draw(P.up, bloomUp[i], { uTexel: [1 / up.w, 1 / up.h], uMix: 1 }, { uT: up.tex, uBase: bloomDown[i].tex });
    up = bloomUp[i];
  }
  clear2d(ctxTop);
  if (subs) subs(ctxTop, tFrame);
  if (shot0.top) shot0.top(ctxTop, shot0.lt, tFrame);
  upload(texTop, cvTop);
  draw(P.final, null, {
    uT: tFrame, uExposure: post.exposure, uBloomAmt: post.bloom, uCA: post.ca, uGrain: post.grain, uVig: post.vig,
    uFlash: post.flash, uFlashCol: post.flashCol, uFade: post.fade, uGlitch: post.glitch, uShakeX: post.shake[0], uShakeY: post.shake[1],
    uDOF: post.dof, uZoom: post.zoom, uSat: post.sat, uTint: post.tint, uSeed: post.seed || 0,
  }, { uAcc: acc.tex, uBlur: T.blurUp.tex, uBloom: bloomUp[0].tex, uTop: texTop });
  gl.finish();
};
