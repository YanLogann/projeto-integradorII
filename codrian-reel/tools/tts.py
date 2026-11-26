"""One continuous take (natural intonation), then cut per line at sentence boundaries."""
import json, base64, urllib.request, subprocess, numpy as np
from scipy.io import wavfile
VOICE = "MZgw9H58206lPCPSJ70K"
SR = 48000
LINES = [
 ("hook", "Seu negócio não existe no Google."),
 ("zero", "Então a gente cria. Do zero."),
 ("grid", "Primeiro, a estrutura."),
 ("type", "Depois, as letras com a cara do seu negócio."),
 ("color", "Agora, as cores da sua marca."),
 ("photo", "A foto da sua loja entra no lugar. E um botão pro cliente te chamar."),
 ("ready", "Pronto. Sites que trabalham pelo seu negócio."),
 ("cta", "Segue a Codrian. Seu negócio merece ser encontrado."),
]
full = " ".join(t for _, t in LINES)
body = {"text": full, "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.6, "similarity_boost": 0.75, "style": 0.0, "use_speaker_boost": True, "speed": 1.0}}
req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
    data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "xi-api-key": "dummy"})
d = json.load(urllib.request.urlopen(req, timeout=180))
open("public/audio/vo/take.mp3", "wb").write(base64.b64decode(d["audio_base64"]))
a = d["alignment"]; ch, st, en = a["characters"], a["character_start_times_seconds"], a["character_end_times_seconds"]
pcm = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", "public/audio/vo/take.mp3", "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                                   capture_output=True, check=True).stdout, dtype=np.float32)
out, pos = {}, 0
for i, (k, t) in enumerate(LINES):
    i0 = "".join(ch).index(t, pos); i1 = i0 + len(t) - 1; pos = i1 + 1
    s0 = max(0, st[i0] - 0.06)
    nxt = st[i1 + 2] if i1 + 2 < len(st) else len(pcm) / SR
    s1 = min(en[i1] + 0.25, nxt - 0.03)
    seg = pcm[int(s0 * SR): int(s1 * SR)].copy()
    f = int(0.02 * SR); seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    wavfile.write(f"public/audio/vo/{k}.wav", SR, (seg * 32767).astype(np.int16))
    out[k] = {"text": t, "chars": ch[i0:i1 + 1], "start": [x - s0 for x in st[i0:i1 + 1]], "end": [x - s0 for x in en[i0:i1 + 1]]}
    print(k, "dur", round(s1 - s0, 2), "speech", round(en[i1] - st[i0], 2), "gap_after", round(nxt - en[i1], 2))
json.dump(out, open("tools/vo_alignment.json", "w"), ensure_ascii=False)
