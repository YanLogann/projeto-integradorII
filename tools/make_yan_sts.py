# Yan com sotaque brasileiro: base TTS em voz pt-BR verificada (Davi Leão) -> speech-to-speech para o clone do Yan.
import json, subprocess, sys, os
OUT=sys.argv[1]; BASE=sys.argv[2]; os.makedirs(OUT,exist_ok=True); os.makedirs(BASE,exist_ok=True)
DAVI='6PhbMr9YjdeOaTNz9y24'; YAN='RErzarHnuYCmTJynOmz2'
L=[('y1','[calmly] [sighs] Rodrigo... respira. Abre o WhatsApp.'),('y2','[deadpan] [amused] Que e-mail?'),('y3','[warm] [confident] Seu cliente não precisa ficar sem te achar.')]
for n,t in L:
    b={'text':t,'model_id':'eleven_v3','voice_settings':{'stability':.5,'similarity_boost':.85,'style':.45,'use_speaker_boost':True}}
    f=f'{BASE}/{n}.mp3'
    subprocess.run(['curl','-sS','-o',f,'-X','POST',f'https://api.elevenlabs.io/v1/text-to-speech/{DAVI}?output_format=mp3_44100_128','-H','Content-Type: application/json','-d',json.dumps(b)])
    o=f'{OUT}/{n}.mp3'
    r=subprocess.run(['curl','-sS','-w','%{http_code}','-o',o,'-X','POST',f'https://api.elevenlabs.io/v1/speech-to-speech/{YAN}?output_format=mp3_44100_128','-F','model_id=eleven_multilingual_sts_v2','-F',f'audio=@{f}','-F','voice_settings='+json.dumps({'stability':.5,'similarity_boost':.9,'style':.3,'use_speaker_boost':True})],capture_output=True,text=True)
    tr=subprocess.run(['curl','-sS','-X','POST','https://api.elevenlabs.io/v1/speech-to-text','-F','model_id=scribe_v1','-F','language_code=por','-F','timestamps_granularity=word','-F',f'file=@{o}'],capture_output=True,text=True).stdout
    try: d=json.loads(tr); w=[x for x in d['words'] if x['type']=='word']; txt=' '.join(f"{x['text']}[{x['start']:.2f}]" for x in w)
    except Exception: txt=tr[:100]
    du=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',o],capture_output=True,text=True).stdout.strip()
    print(n,'http',r.stdout,du,txt)
