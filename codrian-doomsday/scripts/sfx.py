"""Gera efeitos sonoros originais (ElevenLabs Sound Effects)."""
import json, urllib.request, os, time, sys
OUT = os.path.join(os.path.dirname(__file__), '..', 'audio', 'sfx')
SFX = {
 "boom":      ("massive deep cinematic trailer boom impact, sub bass hit with long dark reverb tail", 5),
 "blackout":  ("city power grid shutting down, huge electrical power down whine descending, transformers failing, buzzing then silence", 5),
 "servers":   ("server room failing, electrical sparks crackling, hard drives clicking and dying, digital error beeps, glitch", 6),
 "glitch":    ("short harsh digital glitch stutter, data corruption noise burst", 1.5),
 "land":      ("giant armored metal being lands on concrete, huge heavy metallic impact with debris and rubble falling, shockwave", 4),
 "servo":     ("heavy mechanical armor mask plates sliding and locking into place, hydraulic hiss, metallic servo clicks", 4),
 "drone":     ("very low ominous dark drone, distant wind, eerie silence room tone", 6),
 "eyes":      ("sci-fi energy charging hum, menacing electric ignition of glowing eyes, low growl", 2.5),
 "riser":     ("cinematic tension riser building fast into impact, reversed cymbal and synth swell", 4),
 "whoosh":    ("fast deep cinematic whoosh swoosh transition", 1.2),
 "awaken":    ("futuristic technology powering up, digital network activating, bright synth shimmer rising, data pulses", 4),
 "blast":     ("enormous sci-fi energy explosion shockwave, plasma blast with deep bass, wind rush", 5),
 "logo":      ("elegant powerful cinematic logo reveal impact hit with shimmering metallic sparkle tail", 4),
 "ui":        ("subtle futuristic hologram interface beeps and data blips", 3),
}
only = sys.argv[1:]
for k, (prompt, dur) in SFX.items():
    if only and k not in only: continue
    if os.path.exists(f"{OUT}/{k}.mp3") and not only: continue
    body = {"text": prompt, "duration_seconds": dur, "prompt_influence": 0.6}
    req = urllib.request.Request("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128",
                                 data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    for a in range(4):
        try:
            open(f"{OUT}/{k}.mp3", "wb").write(urllib.request.urlopen(req, timeout=180).read()); print('ok', k); break
        except Exception as e:
            print('retry', k, e); time.sleep(4 * (a + 1))
