"""Gera a narração (ElevenLabs) frase a frase, com timestamps por caractere.
Uso: python3 scripts/tts.py   (proxy injeta a credencial)"""
import json, base64, urllib.request, os, sys, time
VOICE = os.environ.get('VOICE', 'CnEjAO8AoeKlqOCv9Ink')  # Miguel - Deep, Emotional & Cinematic (pt-BR)
OUT = os.path.join(os.path.dirname(__file__), '..', 'audio', 'vo')
os.makedirs(OUT, exist_ok=True)
LINES = [
 "Toda civilização acredita que está preparada para o futuro… até ele chegar.",
 "Sistemas falham.",
 "Negócios desaparecem.",
 "E quem não evolui… fica para trás.",
 "Mas existe algo mais perigoso do que o fim do mundo…",
 "É continuar vivendo no passado.",
 "O futuro não espera.",
 "Ele é construído por quem decide agir.",
 "Codrian.",
 "Tecnologia para quem não nasceu para ficar parado.",
]
only = set(int(a) for a in sys.argv[1:]) if len(sys.argv) > 1 else None
for i, line in enumerate(LINES):
    if only is not None and i not in only: continue
    body = {"text": line, "model_id": "eleven_multilingual_v2", "language_code": "pt",
            "previous_text": " ".join(LINES[:i])[-300:] or None,
            "next_text": " ".join(LINES[i+1:])[:300] or None,
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.8, "style": 0.45, "use_speaker_boost": True}}
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
                                 data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    for attempt in range(4):
        try:
            d = json.load(urllib.request.urlopen(req)); break
        except Exception as e:
            print('retry', i, e); time.sleep(3 * (attempt + 1))
    open(f"{OUT}/vo{i:02d}.mp3", "wb").write(base64.b64decode(d["audio_base64"]))
    json.dump({"text": line, "alignment": d["alignment"]}, open(f"{OUT}/vo{i:02d}.json", "w"), ensure_ascii=False)
    a = d["alignment"]; print(i, round(a["character_end_times_seconds"][-1], 2), line)
