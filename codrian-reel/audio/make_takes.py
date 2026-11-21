"""Narração em tomada única (entonação contínua), três variantes para comparar. Cache por arquivo."""
import json, os, urllib.request
VOICE = "RErzarHnuYCmTJynOmz2"  # Yan v1
TEXT = ("Agora mesmo, alguém procurou o que você vende... Achou três empresas perto. Nenhuma era a sua... "
        "Sem site, quem te procura não te encontra... A Codrian cria o site da sua empresa... "
        "Pronto. Quem procura, encontra você... Codrian. Sites que colocam sua empresa no mapa.")
VARIANTS = {
  "A_v2_solto": {"model_id": "eleven_multilingual_v2", "voice_settings": {"stability": 0.32, "similarity_boost": 0.8, "style": 0.45, "use_speaker_boost": True, "speed": 1.03}},
  "B_v3": {"model_id": "eleven_v3", "voice_settings": {"stability": 0.5, "similarity_boost": 0.8}},
  "C_v4": {"model_id": "eleven_v4", "voice_settings": {"stability": 0.5, "similarity_boost": 0.8}},
}
os.makedirs("public/audio/takes", exist_ok=True)
for name, cfg in VARIANTS.items():
    out = f"public/audio/takes/{name}.mp3"
    if os.path.exists(out):
        print("cache", out); continue
    body = json.dumps({"text": TEXT, "language_code": "pt", "seed": 11, **cfg}).encode()
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128",
        data=body, headers={"xi-api-key": "dummy", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as r:
            open(out, "wb").write(r.read()); print("gerado", out)
    except urllib.error.HTTPError as e:
        print(name, "ERRO", e.code, e.read()[:300])
