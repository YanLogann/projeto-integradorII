# v2: diálogo Rodrigo x Yan (ElevenLabs v3). A chave é injetada pelo proxy da sessão.
import json, subprocess, sys, os
OUT=sys.argv[1]; os.makedirs(OUT,exist_ok=True); ONLY=sys.argv[2:]
V={'rodrigo':'MZgw9H58206lPCPSJ70K','yan':'RErzarHnuYCmTJynOmz2'}
L=[
 ('r1','rodrigo','[panicked] [out of breath] Yan! O Outlook caiu!',0.3),
 ('r2','rodrigo','[shouting] [desperate] Eu preciso mandar um orçamento agora!',0.3),
 ('y1','yan','[calmly] [sighs] Rodrigo... respira. Abre o WhatsApp.',0.5),
 ('r3','rodrigo','[whispering] [astonished] Chegou... três orçamentos.',0.3),
 ('r4','rodrigo','[confused] [hesitant] E o e-mail?',0.3),
 ('y2','yan','[deadpan] [amused] Que e-mail?',0.5),
 ('y3','yan','[warm] [confident] Seu cliente não precisa ficar sem te achar.',0.5),
]
for n,v,t,s in L:
    if ONLY and n not in ONLY: continue
    b={'text':t,'model_id':'eleven_v3','voice_settings':{'stability':s,'similarity_boost':.85,'style':.45,'use_speaker_boost':True}}
    f=f'{OUT}/{n}.mp3'
    r=subprocess.run(['curl','-sS','-w','%{http_code}','-o',f,'-X','POST',f'https://api.elevenlabs.io/v1/text-to-speech/{V[v]}?output_format=mp3_44100_128','-H','Content-Type: application/json','-d',json.dumps(b)],capture_output=True,text=True)
    tr=subprocess.run(['curl','-sS','-X','POST','https://api.elevenlabs.io/v1/speech-to-text','-F','model_id=scribe_v1','-F','timestamps_granularity=word','-F',f'file=@{f}'],capture_output=True,text=True).stdout
    try:
        d=json.loads(tr); w=[x for x in d['words'] if x['type']=='word']; txt=' '.join(x['text'] for x in w); a=w[0]['start']; e=w[-1]['end']
    except Exception: txt=tr[:60]; a=e=0
    du=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f],capture_output=True,text=True).stdout.strip()
    print(f'{n:3} http={r.stdout} dur={float(du):.2f} speech={a:.2f}-{e:.2f}  {txt}')
