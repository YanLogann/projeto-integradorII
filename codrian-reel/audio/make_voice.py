"""Gera a narração com a voz clonada "Yan v1" (ElevenLabs). Cache: se o arquivo da fala já existe
com o mesmo texto, não gera de novo. O proxy da sessão injeta a chave."""
import json, os, hashlib, urllib.request
VOICE = "RErzarHnuYCmTJynOmz2"  # Yan v1 (clonada)
MODEL = "eleven_multilingual_v2"
LINES = [
    "Agora mesmo, alguém procurou o que você vende.",
    "Achou três empresas perto. Nenhuma era a sua.",
    "Sem site, quem te procura não te encontra.",
    ("A Codrian cria o site da sua empresa.", 11),  # semente 11: "Codrian" com n claro
    "Pronto. Quem procura, encontra você.",
    "Codrian. Sites que colocam sua empresa no mapa.",
]
D = "public/audio/voice"
os.makedirs(D, exist_ok=True)
for i, item in enumerate(LINES, 1):
    text, seed = item if isinstance(item, tuple) else (item, None)
    h = hashlib.sha1((VOICE + MODEL + text + str(seed or "")).encode()).hexdigest()[:10]
    out = f"{D}/l{i}_{h}.mp3"
    if os.path.exists(out):
        print("cache", out); continue
    body = json.dumps({"text": text, "model_id": MODEL, "language_code": "pt", **({"seed": seed} if seed else {}),
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.85, "style": 0.2, "use_speaker_boost": True, "speed": 1.0}}).encode()
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128",
        data=body, headers={"xi-api-key": "dummy", "Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r:
        open(out, "wb").write(r.read())
    print("gerado", out)
