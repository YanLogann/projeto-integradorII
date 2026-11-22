# Trilha e efeitos sintetizados (sem amostras), seguindo "Motion e som" do brand book,
# mais a voz do Yan posicionada no tempo e a trilha abaixando sob a fala.
import json, subprocess, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
DUR = 32.0
N = int(SR * DUR)
rng = np.random.default_rng(20261119)
t_all = np.arange(N) / SR

def env_ad(n, a, d):  # ataque/decay exponencial
    e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    e[na:] = np.exp(-np.arange(n - na) / (d * SR)); return e
def place(buf, sig, at, gain=1.0):
    i = int(at * SR); j = min(len(buf), i + len(sig))
    if j > i: buf[i:j] += sig[:j - i] * gain
def lp(x, f, order=2): return sosfilt(butter(order, min(f, SR / 2 - 100), 'low', fs=SR, output='sos'), x)
def hp(x, f, order=2): return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
def saw(f, n, ph=0.0): tt = np.arange(n) / SR; return 2 * ((tt * f + ph) % 1) - 1
def sine(f, n): return np.sin(2 * np.pi * f * np.arange(n) / SR)
def sweep_lp(x, f0, f1, block=1024):  # filtro passa-baixa variando no tempo
    out = np.zeros_like(x); fs = np.geomspace(f0, f1, len(x) // block + 1); zi = None
    for k in range(0, len(x), block):
        sos = butter(2, fs[k // block], 'low', fs=SR, output='sos')
        from scipy.signal import sosfilt_zi
        if zi is None: zi = sosfilt_zi(sos) * 0
        out[k:k + block], zi = sosfilt(sos, x[k:k + block], zi=zi)
    return out
IR = rng.standard_normal(int(SR * 2.6)) * np.exp(-np.arange(int(SR * 2.6)) / (SR * 0.55))
IR = lp(IR, 6000); IR /= np.abs(IR).sum() ** 0.5 * 6
def reverb(x, wet=0.35): return x + fftconvolve(x, IR)[:len(x)] * wet

BPM = 105; BEAT = 60 / BPM
music = np.zeros(N); sfx = np.zeros(N)
T_IMPACT, END_IMPACT = 10.4, 29.35

# ---------- base: pad grave 55 / 27,5 Hz, filtro abrindo até o impacto ----------
n = int(SR * T_IMPACT)
pad = 0.5 * (saw(55, n) + saw(55.3, n, .3)) + 0.6 * sine(27.5, n)
pad = sweep_lp(pad, 120, 1800) * np.linspace(0.15, 0.55, n)
pad[:int(SR * 0.8)] *= np.linspace(0, 1, int(SR * 0.8))
music[:n] += pad * 0.5

# ---------- acordes synthwave depois do impacto (Am – F – C – G) ----------
chords = [[220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [261.63, 329.63, 392.0], [196.0, 246.94, 293.66]]
bar = BEAT * 4
t0 = T_IMPACT
k = 0
while t0 < 32:
    c = chords[k % 4]; dur = min(bar, 32 - t0); m = int(SR * dur)
    s = sum(0.5 * (saw(f, m) + saw(f * 1.006, m, .2)) for f in c) / 3
    s = lp(s, 1400) * np.minimum(1, np.arange(m) / (SR * 0.25)) * np.minimum(1, (m - np.arange(m)) / (SR * 0.1))
    gain = 0.22 if not (28.4 < t0 + dur / 2 < END_IMPACT) else 0.1
    place(music, s, t0, gain)
    # baixo em colcheias na fundamental
    for q in range(int(dur / (BEAT / 2))):
        bn = int(SR * BEAT / 2 * 0.9); f = c[0] / 4 * (2 if q % 2 else 1)
        b = lp(saw(f, bn), 500) * env_ad(bn, 0.005, 0.18)
        place(music, b, t0 + q * BEAT / 2, 0.32)
    t0 += bar; k += 1

# ---------- bateria ----------
def kick():
    m = int(SR * 0.45); tt = np.arange(m) / SR
    f = 45 + 110 * np.exp(-tt * 28); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-tt * 7) + 0.3 * lp(rng.standard_normal(m), 2000) * np.exp(-tt * 80)
def snare():
    m = int(SR * 0.3); tt = np.arange(m) / SR
    return bp(rng.standard_normal(m), 900, 7000) * np.exp(-tt * 16) * 0.8 + sine(190, m) * np.exp(-tt * 25) * 0.5
def hat():
    m = int(SR * 0.08); return hp(rng.standard_normal(m), 7000) * np.exp(-np.arange(m) / (SR * 0.018))
K, S, Hh = kick(), snare(), hat()
def beat_section(a, b, kick_on=True, snare_on=True, hats=True, g=1.0):
    q = 0; tt = a
    while tt < b - 1e-6:
        if kick_on and q % 2 == 0: place(music, K, tt, 0.75 * g)
        if snare_on and q % 4 == 2: place(music, reverb(np.pad(S, (0, SR)), .25), tt, 0.42 * g)
        if hats: place(music, Hh, tt, 0.16 * g * (1.0 if q % 2 else 0.6))
        tt += BEAT / 2; q += 1
beat_section(0.0, 4.0, snare_on=False, g=0.8)     # cena 1: pulso
beat_section(4.0, 6.6, kick_on=True, snare_on=False, hats=False, g=0.5)  # cena 2 esvazia
beat_section(11.2, 28.2)                           # depois do impacto: batida cheia
beat_section(30.6, 32.0, snare_on=False, g=0.6)

# ---------- efeitos ----------
def whoosh(dur=0.5, up=True):
    m = int(SR * dur); x = rng.standard_normal(m)
    x = sweep_lp(x, 300, 6000) if up else sweep_lp(x, 6000, 300)
    return x * np.sin(np.linspace(0, np.pi, m)) ** 2
for c in [1.5, 2.7, 4.0, 9.0, 15.0, 19.5, 24.0]: place(sfx, whoosh(0.5), c - 0.25, 0.35)
place(sfx, whoosh(0.7, False), 12.4 - 0.2, 0.25)
# batida seca no zoom de "E o seu negócio?"
place(sfx, reverb(np.pad(K, (0, SR)), .4), 7.25, 0.9)
# queda do logo: subida de ruído
m = int(SR * 1.4); riser = sweep_lp(rng.standard_normal(m), 200, 9000) * np.linspace(0, 1, m) ** 2
place(sfx, riser, 9.0, 0.35)
# IMPACTO: seno 70 -> 32 Hz em 1,2 s + estouro de ruído passa-baixa
def impact():
    m = int(SR * 1.6); tt = np.arange(m) / SR
    f = 32 + 38 * np.exp(-tt / 0.4); ph = 2 * np.pi * np.cumsum(f) / SR
    boom = np.sin(ph) * np.exp(-tt * 2.2)
    burst = lp(rng.standard_normal(m), 900) * np.exp(-tt * 9)
    return reverb(boom * 1.0 + burst * 0.9, 0.3)
place(sfx, impact(), T_IMPACT, 0.95)
# arpejo ascendente (triângulo) acompanhando a onda de cor
def tri(f, m): return 2 * np.abs(2 * ((np.arange(m) / SR * f) % 1) - 1) - 1
arp = [440, 523.25, 659.25, 880, 1046.5, 1318.5]
for i in range(14):
    f = arp[i % 6]; m = int(SR * 0.35)
    place(sfx, reverb(np.pad(tri(f, m) * env_ad(m, 0.004, 0.09), (0, SR)), 0.3), 10.7 + i * 0.2, 0.09)
# sopro de ruído filtrado
m = int(SR * 2.4); place(sfx, bp(rng.standard_normal(m), 2000, 6000) * np.sin(np.linspace(0, np.pi, m)), 10.6, 0.05)
# bip de radar
def bip(f=1318.5, g=1.0):
    m = int(SR * 0.16); s = sine(f, m) * env_ad(m, 0.002, 0.04)
    return reverb(np.pad(s, (0, int(SR * 0.6))), 0.25) * g
place(sfx, bip(), 12.6, 0.35)
place(sfx, bip(1568), 13.0, 0.2)
# toques suaves quando os ícones aparecem
for i, f in enumerate([1318.5, 880, 1174.7, 1046.5, 1568]):
    m = int(SR * 0.5); place(sfx, reverb(np.pad(sine(f, m) * env_ad(m, 0.003, 0.15), (0, SR)), 0.35), [17.6, 17.72, 17.84, 18.6, 19.2][i], 0.12)
# bips dos pontos lima
for i in range(11): place(sfx, bip([1318.5, 1568, 1760][i % 3], 1.0), 24.5 + i * 0.32, 0.18)
# encerramento: subida até o ponto + impacto + assinatura sonora
m = int(SR * 0.9); place(sfx, sweep_lp(rng.standard_normal(m), 300, 7000) * np.linspace(0, 1, m) ** 2, END_IMPACT - 0.9, 0.25)
place(sfx, impact(), END_IMPACT, 0.75)
m = int(SR * 2.6); chord = sum(sine(f, m) for f in [880, 1318.5, 1760, 2637]) / 4 * env_ad(m, 0.01, 0.9)
place(sfx, reverb(np.pad(chord, (0, SR * 2)), 0.6), END_IMPACT + 0.02, 0.4)
for i, f in enumerate([1318.5, 1174.7, 1046.5, 880, 783.99, 659.25, 587.33]):
    m = int(SR * 0.4); place(sfx, reverb(np.pad(sine(f, m) * env_ad(m, 0.003, 0.1), (0, SR)), 0.4), END_IMPACT + 0.08 + i * 0.085, 0.13)

# ---------- voz ----------
LINES = json.load(open('voz/linhas.json'))
voice = np.zeros(N); speaking = np.zeros(N)
def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-af',
        'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse',
        '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)
cursor = 0.0; plan = []
for l in LINES:
    v = load(f"voz/{l['id']}.mp3")
    at = max(l['a'], cursor + 0.12)
    if l['id'] == '02': at = 3.95
    if l['id'] == '09': at = END_IMPACT + 0.05
    plan.append((l['id'], round(at, 2), round(at + len(v) / SR, 2), l['text']))
    place(voice, v, at); i = int(at * SR); speaking[i:i + len(v)] = 1
    cursor = at + len(v) / SR
json.dump(plan, open('voz/plano.json', 'w'), ensure_ascii=False, indent=1)
for p in plan: print(p)

# ---------- mix: a música baixa sob a fala ----------
k = int(SR * 0.25); sm = np.convolve(speaking, np.ones(k) / k, mode='same')
duck = 1 - 0.62 * np.clip(sm * 1.5, 0, 1)
music *= duck; sfx *= (1 - 0.3 * np.clip(sm * 1.5, 0, 1))
fade = np.ones(N); fade[-int(SR * 0.6):] = np.linspace(1, 0, int(SR * 0.6))
bed = (music * 0.55 + sfx * 0.8) * fade
vo = voice / (np.abs(voice).max() + 1e-9) * 0.9
mix_l = bed + vo; mix_r = bed + vo
# leve largura estéreo na trilha
d = int(SR * 0.012); mix_r[d:] = bed[:-d] * 0.9 + bed[d:] * 0.1 + vo[d:]
st = np.stack([mix_l, mix_r], 1); st /= np.abs(st).max() / 0.95
st.astype(np.float32).tofile('mix.f32')
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', 'mix.f32',
                '-af', 'loudnorm=I=-14:TP=-1.0:LRA=11,alimiter=limit=0.89:level=false', '-ar', str(SR), '-c:a', 'pcm_s24le', 'mix.wav'], check=True)
print('ok mix.wav')
