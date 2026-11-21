"""Trilha + SFX da Codrian, sintetizados (sem amostras), seguindo 'Motion e som'.
Saída: public/audio/music.wav (trilha) e public/audio/sfx.wav (efeitos), 44,1 kHz estéreo, 27 s.
Os tempos batem com a linha do tempo do vídeo (30 fps)."""
import numpy as np, wave, os

SR = 44100
DUR = 27.0
N = int(SR * DUR)
t = np.arange(N) / SR
F = lambda frame: frame / 30.0  # quadro -> segundos
rng = np.random.default_rng(7)

IMPACT = F(465)
DECLARE = F(570)
LOOP = F(750)

def env(n, a, d, sustain=0.0, r=None):
    """envelope ataque/decay exponencial em amostras"""
    x = np.arange(n) / SR
    e = np.minimum(1, x / max(a, 1e-4)) * np.exp(-x / d)
    return e

def put(buf, start, sig):
    i = int(start * SR)
    if i >= len(buf):
        return
    sig = sig[: len(buf) - i]
    buf[i : i + len(sig)] += sig

def onepole_lp(x, cutoff):
    """passa-baixa de um polo com corte variável (array ou escalar)"""
    cutoff = np.broadcast_to(cutoff, x.shape)
    a = 1 - np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    s = 0.0
    for i in range(len(x)):
        s += a[i] * (x[i] - s)
        y[i] = s
    return y

def saw(f, tt):
    return 2 * ((f * tt) % 1) - 1

def reverb(x, secs=2.8, mix=0.45):
    n = int(secs * SR)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * (6.9 / secs))
    ir /= np.sqrt((ir ** 2).sum())
    L = len(x) + n
    nfft = 1 << (L - 1).bit_length()
    wet = np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]
    return x * (1 - mix) + wet * mix * 3

music = np.zeros(N)
sfx = np.zeros(N)

# ---- Base: pad grave 55 Hz (serra) + 27,5 Hz (seno), passa-baixa abrindo até o impacto
pad_raw = 0.5 * saw(55, t) + 0.5 * saw(55 * 1.004, t) + 0.8 * np.sin(2 * np.pi * 27.5 * t)
cut = np.where(t < IMPACT, 120 + 1400 * (t / IMPACT) ** 2, 1500 - 900 * np.clip((t - IMPACT) / 8, 0, 1))
pad = onepole_lp(pad_raw, cut) * 0.32
# respira no loop: entra e sai suave para emendar
pad *= np.clip(t / 0.25, 0, 1) * np.clip((DUR - t) / 0.4, 0, 1)
music += pad

# ---- Synthwave / lo-fi a 105 BPM
BPM = 105
beat = 60 / BPM
def drums_active(x):
    return (F(84) <= x < F(330)) or (F(476) <= x < LOOP + 0.3)

kick_n = int(0.35 * SR)
kx = np.arange(kick_n) / SR
kick = np.sin(2 * np.pi * (45 + 90 * np.exp(-kx * 30)) * kx) * np.exp(-kx * 9) * 0.9
snare = onepole_lp(rng.standard_normal(int(0.2 * SR)), 3500) * np.exp(-np.arange(int(0.2 * SR)) / SR * 22) * 0.45
hat = (rng.standard_normal(int(0.05 * SR)) - onepole_lp(rng.standard_normal(int(0.05 * SR)), 6000)) * np.exp(-np.arange(int(0.05 * SR)) / SR * 80) * 0.12

# baixo em lá menor: A1, A1, F1, G1 por compasso
bass_notes = [55.0, 55.0, 43.65, 49.0]
b = 0.0
k = 0
while b < DUR:
    if drums_active(b):
        put(music, b, kick if k % 4 in (0, 2) or k % 8 == 7 else kick * 0.0)
        if k % 4 in (1, 3):
            put(music, b, snare)
        for h in (0, 0.5):
            put(music, b + h * beat, hat * (1.0 if h else 0.7))
        bar = (k // 4) % 4
        f0 = bass_notes[bar]
        for h in (0, 0.5):
            n = int(beat * 0.5 * SR)
            xx = np.arange(n) / SR
            note = onepole_lp(saw(f0, xx) + 0.5 * saw(f0 * 2, xx), 700) * np.exp(-xx * 5) * 0.28
            put(music, b + h * beat, note)
    b += beat
    k += 1

# ---- Arpejo ascendente (triângulo) na revelação, a cada 200 ms, sobre a subida
arp = [440, 523.25, 659.25, 880, 1046.5, 1318.5]
tri = lambda f, xx: 2 * np.abs(2 * ((f * xx) % 1) - 1) - 1
x0 = F(336)
i = 0
while x0 < IMPACT - 0.1:
    n = int(0.35 * SR)
    xx = np.arange(n) / SR
    amp = 0.05 + 0.1 * (x0 - F(336)) / (IMPACT - F(336))
    put(music, x0, tri(arp[i % 6], xx) * np.exp(-xx * 9) * amp)
    x0 += 0.2
    i += 1
# sopro de ruído filtrado subindo até o impacto (riser)
rs, re = F(380), IMPACT
n = int((re - rs) * SR)
xx = np.arange(n) / SR
riser = onepole_lp(rng.standard_normal(n), 300 + 5000 * (xx / xx[-1]) ** 2) * (xx / xx[-1]) ** 2 * 0.35
put(sfx, rs, riser)

# ---- SFX: pings de conexão (seno suave) nos concorrentes e nós
pings = [(F(4), 1318.5), (F(16), 880), (F(28), 1174.7), (F(120), 1046.5), (F(190), 1568)]
for at, f in pings:
    n = int(1.2 * SR)
    xx = np.arange(n) / SR
    put(sfx, at, np.sin(2 * np.pi * f * xx) * env(n, 0.004, 0.35) * 0.18)

# ---- SFX: varredura do radar no gancho e feixes de transição (ruído filtrado)
def whoosh(dur, peak, amp):
    n = int(dur * SR)
    xx = np.arange(n) / SR
    shape = np.sin(np.pi * xx / dur) ** 2
    return onepole_lp(rng.standard_normal(n), 400 + peak * shape) * shape * amp

put(sfx, 0.0, whoosh(1.4, 3000, 0.35))
for fr in (90, 228, 330, 570):
    put(sfx, F(fr) - 0.3, whoosh(0.6, 4500, 0.4))

# ---- Batida de "sem radar": seno grave abafado quando o prédio aparece apagado
n = int(1.0 * SR)
xx = np.arange(n) / SR
put(sfx, F(262), np.sin(2 * np.pi * (60 - 20 * xx) * xx) * env(n, 0.01, 0.3) * 0.35)

# ---- Impacto: seno 70 -> 32 Hz em 1,2 s + estouro de ruído passa-baixa
n = int(1.6 * SR)
xx = np.arange(n) / SR
freq = 70 - 38 * np.clip(xx / 1.2, 0, 1)
phase = 2 * np.pi * np.cumsum(freq) / SR
boom = np.sin(phase) * np.exp(-xx * 2.2) * 0.95
burst = onepole_lp(rng.standard_normal(n), 1800) * np.exp(-xx * 7) * 0.6
put(sfx, IMPACT, boom + burst)

# ---- Assinatura sonora: quatro tons juntos (A5 E6 A6 E7) com reverb longa
sig = np.zeros(N)
n = int(2.5 * SR)
xx = np.arange(n) / SR
chord = sum(np.sin(2 * np.pi * f * xx) * a for f, a in [(880, 0.12), (1318.5, 0.09), (1760, 0.07), (2637, 0.04)])
put(sig, IMPACT + 0.05, chord * env(n, 0.005, 0.9))

# ---- Uma nota por letra (descendo), no ritmo das letras do logo
letters_start = F(570 + 8 + 6)
notes = [1318.5, 1174.7, 1046.5, 880, 783.99, 659.25, 587.33]
for j, f in enumerate(notes):
    n = int(0.9 * SR)
    xx = np.arange(n) / SR
    put(sig, letters_start + j * 0.085, np.sin(2 * np.pi * f * xx) * env(n, 0.003, 0.25) * 0.1)
# volta das letras para o ponto (subindo), fechando o loop
for j, f in enumerate(reversed(notes)):
    n = int(0.6 * SR)
    xx = np.arange(n) / SR
    put(sig, LOOP + j * 0.053, np.sin(2 * np.pi * f * xx) * env(n, 0.003, 0.15) * 0.06)
sfx += reverb(sig, 2.8, 0.5)

def write(path, mono, width=0.0):
    mono = mono / max(1e-9, np.max(np.abs(mono))) * 0.89
    # leve abertura estéreo com atraso curto
    d = int(0.011 * SR)
    r = np.concatenate([np.zeros(d), mono[:-d]])
    st = np.stack([mono, mono * (1 - width) + r * width], 1)
    pcm = (st * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())

os.makedirs('public/audio', exist_ok=True)
write('public/audio/music.wav', music, 0.35)
write('public/audio/sfx.wav', sfx, 0.25)
print('ok')
