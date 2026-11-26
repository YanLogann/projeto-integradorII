"""Builds src/timeline.json (single source of truth for picture, captions and SFX)
and public/audio/mix.wav (VO + ducked music + synthesized SFX), all on the same clock.
Run from the project root: python3 tools/build_audio.py
"""
import json, subprocess, numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 48000
DUR = 27.5
rng = np.random.default_rng(7)

# ---------- schedule (seconds) ----------
VO_AT = {"hook": 0.12, "zero": 2.3, "grid": 4.75, "type": 6.45, "color": 10.15,
         "photo": 12.5, "ready": 18.1, "cta": 22.25}
STAGES = {
    "hookEnd": 2.0,       # hard cut to black
    "blackEnd": 2.25,
    "grid": 4.45, "type": 6.3, "color": 9.95, "photo": 12.3,
    "pullback": 17.2, "reveal": 17.95, "cta": 22.0, "end": DUR,
}
_al = json.load(open("tools/vo_alignment.json"))
def word_at(key, word):
    d = _al[key]; txt = "".join(d["chars"]); i = txt.index(word)
    return VO_AT[key] + d["start"][i]
G, T, Co, P = STAGES["grid"], STAGES["type"], STAGES["color"], STAGES["photo"]
GRID_LINES = [round(G + 0.15 + i * 0.2, 3) for i in range(8)]
TYPE_ITEMS = [T + 0.3, T + 0.8, T + 1.4, T + 2.0]   # brand, headline, sub, nav/cards
COLOR_ITEMS = [Co + 0.3, Co + 0.7, Co + 1.1, Co + 1.55]  # bg, cards, headline tint, accent ignite
PHOTO_SNAP = round(word_at("photo", "foto") + 0.25, 3)
BUTTON_IN = round(word_at("photo", "botão") - 0.05, 3)
PULSES = [round(BUTTON_IN + 0.6 + i * 0.75, 3) for i in range(3)]

SFX = (
    [("whoosh", t, 0.9) for t in [STAGES["grid"] - 0.1, STAGES["type"] - 0.1, STAGES["color"] - 0.1,
                                   STAGES["photo"] - 0.1, STAGES["cta"] - 0.15]]
    + [("cutHit", STAGES["hookEnd"] - 0.02, 1.0)]
    + [("whooshLong", STAGES["pullback"], 1.0)]
    + [("click", t, 0.8) for t in GRID_LINES]
    + [("click", t, 1.0) for t in TYPE_ITEMS]
    + [("click", t, 1.0) for t in COLOR_ITEMS[:-1]] + [("shimmer", COLOR_ITEMS[-1], 1.0)]
    + [("snap", PHOTO_SNAP, 1.0), ("click", BUTTON_IN, 1.0)]
    + [("tick", t, 0.7) for t in PULSES]
    + [("sub", STAGES["reveal"], 1.0), ("sub", 0.12, 0.55), ("click", STAGES["cta"] + 0.35, 0.9)]
)

# ---------- helpers ----------
def load(path):
    out = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(out, dtype=np.float32).copy()

def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(t / max(a, 1e-4), 1) * np.exp(-t / d)

def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], btype="band", fs=SR, output="sos"), x)

def click():
    n = int(0.06 * SR); t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * 1850 * t) * env(n, 0.0005, 0.012)
    noise = bp(rng.standard_normal(n), 2500, 9000) * env(n, 0.0002, 0.004)
    return 0.09 * tone + 0.12 * noise

def tick():
    n = int(0.08 * SR); t = np.arange(n) / SR
    return 0.07 * np.sin(2 * np.pi * 980 * t) * env(n, 0.001, 0.02)

def snap():
    n = int(0.25 * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * (180 * np.exp(-t * 18) + 70) * t) * env(n, 0.001, 0.06)
    c = click(); return 0.25 * body + 1.6 * np.pad(c, (0, n - len(c)))

def whoosh(length=0.55, peak=0.65, lo=300, hi=5000):
    n = int(length * SR); x = rng.standard_normal(n)
    # time-varying band: sweep centre up then down (sliding-window filtering)
    out = np.zeros(n); blk = 1024
    for i in range(0, n, blk):
        p = i / n
        r = p / peak if p < peak else 1 - 0.6 * (p - peak) / (1 - peak)
        c = lo + (hi - lo) * r
        seg = x[max(0, i - 2048): i + blk]
        y = bp(seg, max(80, c * 0.5), min(SR / 2 - 100, c * 1.6))
        out[i:i + blk] = y[-len(x[i:i + blk]):]
    t = np.arange(n) / n
    e = np.where(t < peak, (t / peak) ** 2, ((1 - t) / (1 - peak)) ** 1.5)
    return 0.22 * out * e

def sub():
    n = int(1.4 * SR); t = np.arange(n) / SR
    f = 38 + 50 * np.exp(-t * 9)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * env(n, 0.004, 0.45)
    s = np.tanh(2.2 * s) / np.tanh(2.2)
    air = bp(rng.standard_normal(n), 60, 400) * env(n, 0.002, 0.12) * 0.25
    return 0.55 * (s + air)

def cut_hit():
    n = int(0.35 * SR); t = np.arange(n) / SR
    low = np.sin(2 * np.pi * (60 + 90 * np.exp(-t * 30)) * t) * env(n, 0.001, 0.09)
    noise = bp(rng.standard_normal(n), 800, 7000) * env(n, 0.0005, 0.03)
    return 0.4 * low + 0.18 * noise

def shimmer():
    n = int(0.9 * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * t) * (0.6 ** k) for k, f in enumerate([1318.5, 1975.5, 2637.0]))
    return 0.045 * s * env(n, 0.01, 0.28)

GEN = {"click": click, "tick": tick, "snap": snap, "whoosh": lambda: whoosh(),
       "whooshLong": lambda: whoosh(1.0, 0.75, 200, 3500) * 1.1, "sub": sub,
       "cutHit": cut_hit, "shimmer": shimmer}

# ---------- build ----------
N = int(DUR * SR)
vo = np.zeros(N); sfx = np.zeros(N); music = np.zeros(N)

def place(buf, sig, at, gain=1.0):
    i = int(round(at * SR)); j = min(N, i + len(sig))
    if i < N: buf[i:j] += gain * sig[: j - i]

for k, at in VO_AT.items():
    place(vo, load(f"public/audio/vo/{k}.wav"), at)
for name, at, g in SFX:
    place(sfx, GEN[name](), at, g)

m = load("public/audio/music.mp3")
mstart = STAGES["blackEnd"]
place(music, m, mstart)
t = np.arange(N) / SR
fade = np.clip((t - mstart) / 0.6, 0, 1) * np.clip((DUR - t) / 1.6, 0, 1)
# sidechain-style ducking driven by the VO envelope
vabs = np.abs(vo)
k = int(0.03 * SR); venv = np.convolve(vabs, np.ones(k) / k, mode="same")
att = np.convolve((venv > 0.01).astype(float), np.ones(int(0.25 * SR)) / int(0.25 * SR), mode="same")
duck = 1 - 0.45 * np.clip(att, 0, 1)
lift = 1 + 0.35 * np.clip((t - STAGES["reveal"]) / 0.4, 0, 1) * np.clip((STAGES["cta"] - t) / 0.5, 0, 1)
music *= fade * duck * lift * 0.22

mix = vo * 1.0 + sfx + music
mix /= max(1e-6, np.abs(mix).max()) / 0.9
wavfile.write("public/audio/mix_raw.wav", SR, (mix * 32767).astype(np.int16))
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", "public/audio/mix_raw.wav", "-af",
                "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", str(SR), "public/audio/mix.wav"], check=True)

# ---------- word timings for captions ----------
al = json.load(open("tools/vo_alignment.json"))
words = {}
for key, d in al.items():
    ws, cur, st = [], "", None
    for ch, s, e in zip(d["chars"], d["start"], d["end"]):
        if ch == " ":
            if cur: ws.append({"w": cur, "s": round(VO_AT[key] + st, 3), "e": round(VO_AT[key] + last, 3)})
            cur, st = "", None
        else:
            if st is None: st = s
            cur += ch; last = e
    if cur: ws.append({"w": cur, "s": round(VO_AT[key] + st, 3), "e": round(VO_AT[key] + last, 3)})
    words[key] = ws

json.dump({"duration": DUR, "vo": VO_AT, "stages": STAGES, "gridLines": GRID_LINES, "typeItems": TYPE_ITEMS,
           "colorItems": COLOR_ITEMS, "photoSnap": PHOTO_SNAP, "buttonIn": BUTTON_IN, "pulses": PULSES,
           "words": words, "sfx": [{"type": n, "t": a} for n, a, _ in SFX]},
          open("src/timeline.json", "w"), ensure_ascii=False, indent=1)
print("ok", {k: (v[0]["s"], v[-1]["e"]) for k, v in words.items()})
