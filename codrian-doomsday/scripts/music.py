"""Gera trilha original (Eleven Music) com seções cronometradas para as 5 cenas."""
import json, urllib.request, os, sys
OUT = os.path.join(os.path.dirname(__file__), '..', 'audio', 'music')
NEG = ["vocals with lyrics", "rap", "pop", "edm drop", "guitar solo", "lo-fi", "cheerful", "copyrighted melody"]
plan = {
 "positive_global_styles": ["original epic cinematic trailer score", "dark sci-fi apocalyptic", "hybrid orchestral",
   "deep sub bass", "orchestral strings", "epic wordless choir", "trailer percussion", "massive braams", "D minor", "film soundtrack mix"],
 "negative_global_styles": NEG,
 "sections": [
  {"section_name": "Omen", "duration_ms": 8000,
   "positive_local_styles": ["opens instantly with one huge cinematic boom hit", "ominous low drone", "cello tremolo", "distant female choir whisper", "sparse", "space ambience"],
   "negative_local_styles": ["drums groove", "melody"], "lines": []},
  {"section_name": "Collapse", "duration_ms": 10000,
   "positive_local_styles": ["urgent pulsing staccato string ostinato", "ticking clock pulse", "building toms", "dissonant brass stabs", "glitchy electronic textures", "tension rising"],
   "negative_local_styles": ["resolution", "major key"], "lines": []},
  {"section_name": "Arrival", "duration_ms": 11000,
   "positive_local_styles": ["slow menacing heavy brass braams", "huge metallic impacts", "low male choir chant", "villain theme", "dark and heavy", "ends abruptly into total silence"],
   "negative_local_styles": ["fast tempo", "hopeful"], "lines": []},
  {"section_name": "Awakening", "duration_ms": 16000,
   "positive_local_styles": ["starts from silence with a single rising synth pulse", "heroic rising string ostinato", "driving epic trailer drums", "full choir swelling", "hopeful heroic modulation", "relentless crescendo", "riser into climax"],
   "negative_local_styles": ["sad", "slow"], "lines": []},
  {"section_name": "Revelation", "duration_ms": 15000,
   "positive_local_styles": ["colossal climax hit", "full orchestra and choir triumphant chord", "final massive impact then long reverb tail", "resolving sustained chord", "fade to quiet shimmering ending"],
   "negative_local_styles": ["new melody", "busy drums at the end"], "lines": []},
 ]}
body = {"composition_plan": plan, "model_id": "music_v1"}
req = urllib.request.Request("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128", data=json.dumps(body).encode(),
                             headers={"Content-Type": "application/json"})
try:
    r = urllib.request.urlopen(req, timeout=600)
    data = r.read(); name = sys.argv[1] if len(sys.argv) > 1 else 'score'
    open(f"{OUT}/{name}.mp3", "wb").write(data); print('ok', len(data))
except urllib.error.HTTPError as e:
    print(e.code, e.read()[:800])
