# Gera as falas via ElevenLabs (a chave é injetada pelo proxy da sessão; nunca fica em arquivo)
import json, subprocess, sys, os
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
V = {'rodrigo':'MZgw9H58206lPCPSJ70K','yan':'RErzarHnuYCmTJynOmz2','suporte':'BKv4Uz2HPF6TFlDgFBKN','colega':'RGymW84CSmfVugnA5tvA'}
LINES = [
 ('chefe','rodrigo','Eu preciso mandar o orçamento!',dict(stability=.25,style=.7,speed=1.12)),
 ('colega1','colega','Não me deixa, monitor!',dict(stability=.25,style=.7,speed=1.1)),
 ('suporte','suporte','Sua ligação é muito importante…',dict(stability=.5,style=.2,speed=1.15)),
 ('calma','yan','Calma.',dict(stability=.6,style=.2,speed=.95)),
 ('cliente','yan','O cliente que tem site chama no WhatsApp.',dict(stability=.5,style=.3,speed=1.0)),
 ('email','colega','E o e-mail?',dict(stability=.35,style=.5,speed=1.1)),
 ('queemail','yan','Que e-mail?',dict(stability=.4,style=.5,speed=1.05)),
 ('fecha','yan','Seu e-mail pode cair. Seu cliente não precisa ficar sem te achar.',dict(stability=.55,style=.3,speed=1.08)),
]
for name,voice,text,vs in LINES:
    body={'text':text,'model_id':'eleven_multilingual_v2','language_code':'pt','voice_settings':{'stability':vs['stability'],'similarity_boost':.85,'style':vs['style'],'use_speaker_boost':True,'speed':vs['speed']}}
    f=f'{OUT}/{name}.mp3'
    r=subprocess.run(['curl','-sS','-w','%{http_code}','-o',f,'-X','POST',f'https://api.elevenlabs.io/v1/text-to-speech/{V[voice]}?output_format=mp3_44100_128','-H','Content-Type: application/json','-d',json.dumps(body)],capture_output=True,text=True)
    print(name,r.stdout,r.stderr[:100])
