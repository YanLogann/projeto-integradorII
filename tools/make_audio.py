# Gera trilha + efeitos sonoros 100% sintéticos (sem samples de terceiros) em public/audio.wav
import numpy as np, wave, sys
SR=44100; DUR=26.0
N=int(SR*DUR); mix=np.zeros(N)
rng=np.random.default_rng(7)
def add(t0,sig,g=1.0):
    i=int(t0*SR); j=min(N,i+len(sig))
    if i<N: mix[i:j]+=g*sig[:j-i]
def tt(d): return np.arange(int(d*SR))/SR
def env(d,a=.005,r=.1):
    t=tt(d); e=np.minimum(1,t/max(a,1e-4))*np.exp(-t/max(r,1e-4)); return e
def tone(f,d,a=.005,r=.1,kind='sin'):
    t=tt(d); ph=2*np.pi*f*t
    w={'sin':np.sin(ph),'tri':2/np.pi*np.arcsin(np.sin(ph)),'sq':np.sign(np.sin(ph))*.6,'saw':2*((f*t)%1)-1}[kind]
    return w*env(d,a,r)
def lp(x,k):  # média móvel simples (passa-baixa)
    c=np.cumsum(np.insert(x,0,0)); y=(c[k:]-c[:-k])/k; return np.concatenate([np.zeros(k),y])[:len(x)]
def noise(d): return rng.standard_normal(int(d*SR))
def whoosh(t0,d=.35,g=.5):
    n=noise(d); t=tt(d); s=lp(n,8)*np.sin(np.pi*t/d)**2; add(t0,s*g*2.2)
def pop(t0,g=.5,f=700):
    t=tt(.12); ph=2*np.pi*np.cumsum(f*np.exp(-t*18)+250)/SR; add(t0,np.sin(ph)*np.exp(-t*30)*g)
def boom(t0,g=.9):
    t=tt(.9); ph=2*np.pi*np.cumsum(120*np.exp(-t*5)+35)/SR; add(t0,np.sin(ph)*np.exp(-t*4)*g); add(t0,lp(noise(.5),30)*np.exp(-tt(.5)*9)*g*3)
def buzz(t0,g=.5):
    add(t0,tone(180,.18,.002,1,'sq')*g); add(t0+.2,tone(140,.3,.002,1,'sq')*g)
def siren(t0,t1,g=.13):
    d=t1-t0; t=tt(d); f=700+220*np.sign(np.sin(2*np.pi*1.6*t))  # alterna 2 tons
    ph=2*np.pi*np.cumsum(f)/SR; s=(np.sign(np.sin(ph))*.5+np.sin(ph)*.5)
    add(t0,s*np.minimum(1,t*20)*np.minimum(1,(d-t)*60)*g)
def rustle(t0,t1,g=.12):
    t=t0
    while t<t1:
        d=rng.uniform(.04,.12); add(t,lp(noise(d),3)*np.hanning(int(d*SR))*g*2); t+=rng.uniform(.05,.22)
def scratch(t0,g=.5):
    d=.45; t=tt(d); f=1800*np.exp(-t*5)+100; ph=2*np.pi*np.cumsum(f)/SR
    add(t0,(np.sign(np.sin(ph))*.4+lp(noise(d),2)*.8)*np.exp(-t*4)*g)
def midi(n): return 440*2**((n-69)/12)
def hold_music(t0,t1,g=.18):
    notes=[72,76,79,76,74,77,81,77]
    t=t0;i=0
    while t<t1:
        add(t,tone(midi(notes[i%8]),.2,.003,.12,'sq')*g); t+=.19;i+=1
def lofi(t0,t1,g=.22):
    bpm=88; beat=60/bpm
    chords=[[57,60,64,67],[53,57,60,64],[60,64,67,71],[55,59,62,65]]
    bass=[45,41,48,43]
    t=t0; bar=0
    while t<t1-.01:
        ch=chords[bar%4]
        for n in ch:  # pad suave
            add(t,tone(midi(n),beat*4,.08,beat*2.5,'tri')*g*.35)
        for k in range(4):
            bt=t+k*beat
            add(bt,tone(midi(bass[bar%4]),beat*.9,.01,.35,'sin')*g*1.0)
            if k%2==0: # kick
                tk=tt(.2); add(bt,np.sin(2*np.pi*np.cumsum(110*np.exp(-tk*25)+45)/SR)*np.exp(-tk*14)*g*1.6)
            add(bt+beat/2,lp(noise(.05),1)*np.exp(-tt(.05)*70)*g*.5)  # hat
            add(bt+beat*.5*0, tone(midi(ch[k%4]+12),beat*.5,.005,.18,'sin')*g*.45)  # arpejo
        t+=beat*4; bar+=1
def footsteps(t0,n=6,dt=.2):
    for i in range(n):
        tk=tt(.1); add(t0+i*dt,np.sin(2*np.pi*70*tk)*np.exp(-tk*40)*.35)
def sip(t0,g=.3):
    d=.5; t=tt(d); s=lp(noise(d),6)*np.sin(np.pi*t/d)*(1+np.sin(2*np.pi*14*t))*.5; add(t0,s*g*2)
def click(t0): tk=tt(.03); add(t0,np.sin(2*np.pi*1800*tk)*np.exp(-tk*200)*.5)
def ding(t0,g=.4):
    add(t0,tone(1319,.5,.002,.18,'sin')*g); add(t0+.12,tone(1760,.7,.002,.3,'sin')*g)
def crickets(t0,t1,g=.1):
    t=t0
    while t<t1:
        for k in range(3): add(t+k*.06,tone(4200,.04,.002,.03,'sin')*g)
        t+=.5
def boing(t0,g=.4):
    d=.5;t=tt(d); f=300+120*np.sin(2*np.pi*9*t)*np.exp(-t*4)+200*np.exp(-t*3); add(t0,np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*5)*g)
def sparkle(t0,g=.3):
    for i,n in enumerate([76,79,83,88,91]): add(t0+i*.07,tone(midi(n),.6,.003,.25,'sin')*g)
def tada(t0,g=.35):
    for n in [60,64,67,72]: add(t0,tone(midi(n),1.2,.01,.6,'tri')*g*.5)
    for n in [72,76,79,84]: add(t0+.18,tone(midi(n),1.4,.01,.7,'tri')*g*.5)

def riser(t0,d,g=.35):
    t=tt(d); f=200*np.exp(t/d*2.3); ph=2*np.pi*np.cumsum(f)/SR
    add(t0,(np.sin(ph)*.5+lp(noise(d),3)*.8)*(t/d)**2*g)
def brandsig(t0,g=.3):  # assinatura sonora da marca: A5 E6 A6 E7 + escala descendente
    for f in [880,1318.5,1760,2637]: add(t0,tone(f,2.2,.004,.9,'sin')*g*.45)
    for i,f in enumerate([1318.5,1174.7,1046.5,880,783.99,659.25,587.33]): add(t0+.05+i*.11,tone(f,.5,.003,.18,'sin')*g*.5)

# ---- linha do tempo (segundos), alinhada às cenas do vídeo ----
for c in [1.6,3.0,5.5,7.5,12.0,15.0,21.8]: whoosh(c-.12)
for c in [0.9,3.0,5.5,7.5,10.3,12.0,15.0,17.4,18.5,19.8,20.8,22.3,23.3]: pop(c,.4)
buzz(1.4); siren(1.6,9.0,.12)
t=1.6
while t<9.0: add(t,tone(55,.2,.005,.12,'sin')*.5); t+=.5
boom(0.9,.8); boom(3.0); rustle(3.0,9.0); boing(5.5); hold_music(7.5,9.0,.14)
scratch(9.0); footsteps(9.3,7,.25); lofi(9.6,21.8,.2); sip(12.1)
click(16.73); ding(17.47); crickets(18.55,19.8); boing(19.8,.3); ding(20.8,.3)
riser(20.5,1.3); brandsig(21.8); boom(21.8,.6); lofi(22.2,26.0,.2); ding(24.4,.3)
# ---- narração (ElevenLabs) com ducking da trilha ----
import os, subprocess
VD=sys.argv[2] if len(sys.argv)>2 else None
if VD and os.path.isdir(VD):
    VO=[('chefe',3.10,1.0,1.0),('colega1',5.70,1.0,1.0),('suporte',7.45,1.3,.9),('calma',10.40,1.0,1.0),('cliente',12.20,1.0,1.0),('email',19.90,1.0,1.0),('queemail',20.85,1.08,1.0),('fecha',22.35,1.0,.95)]
    vo=np.zeros(N)
    for name,t0,tempo,g in VO:
        raw=subprocess.run(['ffmpeg','-loglevel','error','-i',f'{VD}/{name}.mp3','-af',f'atempo={tempo},silenceremove=start_periods=1:start_threshold=-45dB','-f','s16le','-ac','1','-ar',str(SR),'-'],capture_output=True).stdout
        x=np.frombuffer(raw,dtype=np.int16).astype(float)/32768
        x=x/ max(1e-6,np.max(np.abs(x)))*.9*g
        i=int(t0*SR); j=min(N,i+len(x)); vo[i:j]+=x[:j-i]
    act=lp(np.abs(vo),int(.12*SR)); act=np.clip(act*9,0,1); act=lp(act,int(.08*SR))
    mix=mix/(np.max(np.abs(mix))/0.85)*(1-.62*act)*.8
    mix=mix+vo
# fade out e normalização
fo=int(.4*SR); mix[-fo:]*=np.linspace(1,0,fo)
mix/= (np.max(np.abs(mix))/0.85)
pcm=(mix*32767).astype(np.int16)
with wave.open(sys.argv[1],'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
