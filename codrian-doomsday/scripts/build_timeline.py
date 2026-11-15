"""Gera engine/data.js (legendas palavra a palavra + logo) e audio/cues.json a partir da narração real."""
import json, subprocess, re, os, numpy as np
R = os.path.join(os.path.dirname(__file__), '..')
# Início (s) de cada fala na linha do tempo do trailer — alinhado aos golpes da trilha
START = [1.20, 8.60, 10.80, 12.60, 21.90, 28.40, 32.20, 35.60, 52.30, 54.00]
SUBS_OFF = {8, 9}  # no cartão final o texto já está na tela (logo + assinatura)
def onset(f):
    x = np.frombuffer(subprocess.run(['ffmpeg','-v','quiet','-i',f,'-ac','1','-ar','16000','-f','f32le','-'],capture_output=True).stdout, np.float32)
    w = 160; e = np.array([np.sqrt((x[i:i+w]**2).mean()) for i in range(0, len(x)-w, w)])
    i = np.argmax(e > e.max()*0.08); j = len(e) - np.argmax(e[::-1] > e.max()*0.05)
    return i*w/16000, j*w/16000
cues, subs = [], []
for k, st in enumerate(START):
    f = f'{R}/audio/vo/vo{k:02d}.mp3'
    d = json.load(open(f'{R}/audio/vo/vo{k:02d}.json')); a = d['alignment']
    on, off = onset(f)
    chars, cs, ce = a['characters'], a['character_start_times_seconds'], a['character_end_times_seconds']
    words, cur, ws = [], '', None
    for c, s, e in zip(chars, cs, ce):
        if c == ' ':
            if cur: words.append([cur, ws, we]); cur = ''
            continue
        if not cur: ws = s
        cur += c; we = e
    if cur: words.append([cur, ws, we])
    words = [[w, round(st+s, 3), round(st+e, 3)] for w, s, e in words]
    cues.append({'file': f'audio/vo/vo{k:02d}.mp3', 'start': st, 'speech_on': round(st+on, 3), 'speech_off': round(st+off, 3)})
    if k not in SUBS_OFF:
        subs.append({'text': d['text'], 'start': round(st+on-0.08, 3), 'end': round(st+off+0.45, 3), 'words': words})
# legenda some antes da próxima entrar
for i in range(len(subs)-1): subs[i]['end'] = min(subs[i]['end'], subs[i+1]['start'] - 0.05)
svg = open(f'{R}/assets/logo/codrian-logo-negativo.svg').read()
pd = re.search(r'<path d="([^"]+)"', svg).group(1)
vb = re.search(r'viewBox="([^"]+)"', svg).group(1)
dot = re.search(r'<circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)" fill="([^"]+)"', svg).groups()
json.dump(cues, open(f'{R}/audio/cues.json', 'w'), indent=1)
open(f'{R}/engine/data.js', 'w').write('window.DATA=' + json.dumps({'subs': subs, 'vo': cues, 'logo': {'d': pd, 'viewBox': vb, 'dot': dot}}, ensure_ascii=False) + ';\n')
for s in subs: print(s['start'], s['end'], s['text'])
for c in cues: print(c)
