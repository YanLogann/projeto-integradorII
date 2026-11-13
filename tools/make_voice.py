# Gera as falas via ElevenLabs v3 (com direção de emoção). A chave é injetada pelo proxy da sessão.
import json, subprocess, sys, os
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
V = {'rodrigo':'MZgw9H58206lPCPSJ70K','yan':'RErzarHnuYCmTJynOmz2','suporte':'BKv4Uz2HPF6TFlDgFBKN','colega':'RGymW84CSmfVugnA5tvA','narrador':'CstacWqMhJQlnfLPxRG4'}
LINES = [
 ('n_hook','narrador','[dramatic] [deep voice] O Outlook... [pause] caiu.',.5),
 ('chefe','rodrigo','[shouting] [furious] Eu preciso mandar o orçamento!',0.0),
 ('colega1','colega','[panicked] [trembling voice] Não me deixa, monitor!',0.0),
 ('suporte','suporte','[cheerfully] Sua ligação é muito importante...',.5),
 ('n_chegou','narrador','[dramatic] [deep voice] Até que... ele.',.5),
 ('calma','yan','[calmly] [exhales] Calma.',.5),
 ('cliente','yan','[confident] [relaxed] O cliente que tem site chama no WhatsApp.',.5),
 ('n_toque','narrador','[deep voice] Um toque no botão do site...',.5),
 ('n_cliente','narrador','[excited] [deep voice] Chegou cliente!',.5),
 ('n_silencio','narrador','[deep voice] [whispers] O silêncio foi ensurdecedor.',.5),
 ('email','colega','[confused] [hesitant] E o e-mail?',0.0),
 ('queemail','yan','[amused] [casual] Que e-mail?',.5),
 ('fecha','yan','[warm] [confident] Seu cliente não precisa ficar sem te achar.',.5),
]
ONLY=sys.argv[2:]
for name,voice,text,stab in LINES:
    if ONLY and name not in ONLY: continue
    body={'text':text,'model_id':'eleven_v3','language_code':'pt','voice_settings':{'stability':stab,'similarity_boost':.85,'style':.6,'use_speaker_boost':True}}
    f=f'{OUT}/{name}.mp3'
    r=subprocess.run(['curl','-sS','-w','%{http_code}','-o',f,'-X','POST',f'https://api.elevenlabs.io/v1/text-to-speech/{V[voice]}?output_format=mp3_44100_128','-H','Content-Type: application/json','-d',json.dumps(body)],capture_output=True,text=True)
    t=subprocess.run(['curl','-sS','-X','POST','https://api.elevenlabs.io/v1/speech-to-text','-F','model_id=scribe_v1','-F','language_code=por','-F',f'file=@{f}'],capture_output=True,text=True).stdout
    try: tr=json.loads(t).get('text','?')
    except Exception: tr=t[:80]
    d=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f],capture_output=True,text=True).stdout.strip()
    print(f'{name:11} http={r.stdout} {float(d):.2f}s  STT: {tr}')
