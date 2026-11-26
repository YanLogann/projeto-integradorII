import json, base64, urllib.request, sys, os
VOICE="MZgw9H58206lPCPSJ70K"
LINES=[
 ("hook","Seu negócio não existe no Google."),
 ("zero","Então a gente cria. Do zero."),
 ("grid","Primeiro, a estrutura."),
 ("type","Depois, as letras com a cara do seu negócio."),
 ("color","As cores da sua marca acendem."),
 ("photo","A foto da sua loja entra no lugar. E um botão pro cliente te chamar."),
 ("ready","Pronto. Sites que vendem para quem é daqui."),
 ("cta","Segue a Codrian. Toda semana, um site nasce aqui."),
]
out={}
for i,(k,t) in enumerate(LINES):
    body={"text":t,"model_id":"eleven_multilingual_v2",
      "voice_settings":{"stability":0.5,"similarity_boost":0.8,"style":0.3,"use_speaker_boost":True,"speed":1.08},
      "previous_text":LINES[i-1][1] if i else None,"next_text":LINES[i+1][1] if i+1<len(LINES) else None}
    req=urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
      data=json.dumps(body).encode(),headers={"Content-Type":"application/json","xi-api-key":"dummy"})
    d=json.load(urllib.request.urlopen(req,timeout=120))
    open(f"public/audio/vo/{k}.mp3","wb").write(base64.b64decode(d["audio_base64"]))
    a=d["alignment"]; out[k]={"text":t,"chars":a["characters"],"start":a["character_start_times_seconds"],"end":a["character_end_times_seconds"]}
    print(k, round(a["character_end_times_seconds"][-1],2))
json.dump(out,open("tools/vo_alignment.json","w"),ensure_ascii=False)
