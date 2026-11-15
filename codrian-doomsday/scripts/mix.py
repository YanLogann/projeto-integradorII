"""Mixagem: trilha com automação (ducking sob a voz, silêncio dramático), narração, efeitos; loudness -14 LUFS / -1,5 dBTP."""
import json, subprocess, os, numpy as np
R = os.path.join(os.path.dirname(__file__), '..'); SR = 48000; DUR = 60.0
def load(f):
    raw = subprocess.run(['ffmpeg','-v','quiet','-i',f,'-ac','2','-ar',str(SR),'-f','f32le','-'],capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
db = lambda x: 10 ** (x / 20)
N = int(SR * DUR); bus_m = np.zeros((N, 2)); bus_v = np.zeros((N, 2)); bus_s = np.zeros((N, 2))
def place(bus, x, t, g=1.0):
    i = int(t * SR); x = x[:max(0, N - i)]; bus[i:i + len(x)] += x * g
# trilha
mus = load(f'{R}/audio/music/score_a.mp3')[:N]; place(bus_m, mus, 0)
# narração (normalizada por RMS de fala)
cues = json.load(open(f'{R}/audio/cues.json'))
for c in cues:
    v = load(f"{R}/{c['file']}"); rms = np.sqrt((v[np.abs(v).max(1) > .02] ** 2).mean())
    g = db(-17) / rms
    if 'vo08' in c['file']: g *= db(2)  # "Codrian." com mais presença
    place(bus_v, v, c['start'], g)
# efeitos
SFX = [('boom',.17,-3),('riser',4.3,-11),('whoosh',7.8,-8),('blackout',8.3,-8),('servers',9.5,-9),('glitch',10.75,-11),('glitch',12.5,-8),
       ('glitch',13.75,-11),('blackout',13.9,-13),('land',15.98,-2),('drone',18.5,-15),('servo',24.0,-9),('drone',27.9,-9),('eyes',29.6,-5),
       ('awaken',31.2,-7),('whoosh',33.6,-11),('ui',35.6,-14),('blast',39.18,-4),('whoosh',40.15,-12),('whoosh',41.15,-12),('whoosh',42.15,-12),
       ('whoosh',43.15,-12),('riser',44.5,-10),('blast',48.48,-4),('logo',51.78,-3),('drone',55.8,-17),('ui',57.3,-15)]
cache = {}
for k, t, g in SFX:
    if k not in cache: cache[k] = load(f'{R}/audio/sfx/{k}.mp3')
    x = cache[k].copy(); fade = int(.05 * SR); x[-fade:] *= np.linspace(1, 0, fade)[:, None]
    place(bus_s, x, t, db(g))
# automação da trilha
t = np.arange(N) / SR; gm = np.full(N, db(-3.0))
voice = np.zeros(N)
for c in cues:
    a, b = c['speech_on'] - .12, c['speech_off'] + .25
    voice = np.maximum(voice, np.clip((t - a) / .15, 0, 1) * np.clip((b + .4 - t) / .4, 0, 1))
gm *= db(-9) ** voice                      # ducking de ~9 dB sob a voz
sil = np.clip((t - 27.6) / .6, 0, 1) * np.clip((31.19 - t) / .02, 0, 1)   # silêncio dramático 28,2–31,19
gm *= (1 - sil * .985)
gm *= np.clip((60 - t) / .5, 0, 1)
bus_m *= gm[:, None]
mix = bus_m + bus_v + bus_s
mix /= max(1, np.abs(mix).max() / .95)
tmp = f'{R}/audio/mix_pre.wav'
subprocess.run(['ffmpeg','-y','-v','quiet','-f','f32le','-ar',str(SR),'-ac','2','-i','-',tmp], input=mix.astype(np.float32).tobytes())
# loudnorm 2 passadas
r = subprocess.run(['ffmpeg','-i',tmp,'-af','loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True).stderr
m = json.loads(r[r.rindex('{'):r.rindex('}')+1])
af = f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
subprocess.run(['ffmpeg','-y','-v','quiet','-i',tmp,'-af',af,'-ar','48000',f'{R}/audio/mix_final.wav'])
r = subprocess.run(['ffmpeg','-i',f'{R}/audio/mix_final.wav','-af','loudnorm=I=-14:TP=-1.5:print_format=json','-f','null','-'],capture_output=True,text=True).stderr
m2 = json.loads(r[r.rindex('{'):r.rindex('}')+1]); print('final: I', m2['input_i'], 'LUFS  TP', m2['input_tp'], 'dBTP  LRA', m2['input_lra'])
