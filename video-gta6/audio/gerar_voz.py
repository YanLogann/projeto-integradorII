# Gera as falas com a voz "Yan v1" (ElevenLabs). A autenticação é injetada pelo proxy.
import json, subprocess, sys, os
VOICE = "RErzarHnuYCmTJynOmz2"
LINES = [
 ("01", 0.3, 3.6, "O mundo inteiro tá de olho no GTA 6."),
 ("02", 4.4, 6.4, "Mas se o cliente não te acha, ele acha o concorrente."),
 ("03", 6.8, 8.2, "E o seu negócio?"),
 ("04", 11.2, 12.8, "Codrian. Estar no radar."),
 ("05", 13.0, 14.8, "A gente coloca o seu negócio no mapa."),
 ("06", 16.0, 18.2, "Seu site. Seu radar. Seus clientes."),
 ("07", 18.6, 23.4, "Com endereço no mapa, avaliações no Google e um botão direto pro seu WhatsApp."),
 ("08", 24.4, 27.8, "O GTA 6 já chegou. O seu site não precisa esperar."),
 ("09", 29.4, 30.2, "Codrian."),
 ("10", 30.6, 31.8, "Chame no WhatsApp."),
]
only = sys.argv[1:]
for i, a, b, text in LINES:
    if only and i not in only: continue
    body = json.dumps({"text": text, "model_id": "eleven_multilingual_v2", "language_code": "pt",
        "voice_settings": {"stability": 0.35, "similarity_boost": 0.85, "style": 0.45, "use_speaker_boost": True}}).encode()
    code = subprocess.run(["curl", "-s", "-X", "POST", f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128",
        "-H", "xi-api-key: dummy", "-H", "Content-Type: application/json", "--data-binary", "@-", "-o", f"voz/{i}.mp3", "-w", "%{http_code}"],
        input=body, capture_output=True).stdout.decode()
    if code != "200": sys.exit(f"{i}: HTTP {code} " + open(f"voz/{i}.mp3", errors="ignore").read()[:300])
    print(i, "ok")
json.dump([dict(id=i, a=a, b=b, text=t) for i, a, b, t in LINES], open("voz/linhas.json", "w"), ensure_ascii=False, indent=1)
