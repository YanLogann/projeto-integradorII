import base64,io,re,os
from PIL import Image,ImageFilter,ImageEnhance
src=open('index.src.html',encoding='utf-8').read()
WAPATH="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
import numpy as np, cv2
_cache={}
def graded(name):
    if name in _cache:return _cache[name]
    p=f'src_img/sr/{name}.jpg'
    s=cv2.imread(p if os.path.exists(p) else f'img/{name}.jpg')
    d=cv2.fastNlMeansDenoisingColored(s,None,5,5,7,21)   # tira o ruído/blocos do JPEG do Instagram
    d=cv2.bilateralFilter(d,7,28,7)
    im=Image.fromarray(cv2.cvtColor(d,cv2.COLOR_BGR2RGB))
    im=ImageEnhance.Contrast(im).enhance(1.07);im=ImageEnhance.Color(im).enhance(1.08)
    _cache[name]=im;return im
def encode(im,w,q,grain):
    if im.width>w: im=im.resize((w,round(im.height*w/im.width)),Image.LANCZOS)
    im=im.filter(ImageFilter.UnsharpMask(1.3,65,3))
    a=np.array(im).astype(np.float32);a+=np.random.default_rng(7).normal(0,grain,a.shape[:2])[...,None]   # grão fino de filme
    im=Image.fromarray(np.clip(a,0,255).astype(np.uint8))
    b=io.BytesIO();im.save(b,'JPEG',quality=q,optimize=True,progressive=True)
    return 'data:image/jpeg;base64,'+base64.b64encode(b.getvalue()).decode()
def photo(name): return encode(graded(name),1100,80,4.0)
def thumb(name): return encode(graded(name),420,80,2.5)
def old_photo(name):
    p=f'src_img/sr/{name}.jpg'
    im=Image.open(p if os.path.exists(p) else f'img/{name}.jpg').convert('RGB')
    if im.width>1100: im=im.resize((1100,round(im.height*1100/im.width)),Image.LANCZOS)
    im=ImageEnhance.Contrast(im).enhance(1.05);im=ImageEnhance.Color(im).enhance(1.06)
    im=im.filter(ImageFilter.UnsharpMask(1.0,45,2))
    b=io.BytesIO();im.save(b,'JPEG',quality=80,optimize=True,progressive=True)
    return 'data:image/jpeg;base64,'+base64.b64encode(b.getvalue()).decode()
def png(name):
    return 'data:image/png;base64,'+base64.b64encode(open(f'img/{name}.png','rb').read()).decode()
out=re.sub(r'\{\{img:(\w+)\}\}',lambda m:photo(m.group(1)),src)
out=re.sub(r'\{\{thumb:(\w+)\}\}',lambda m:thumb(m.group(1)),out)
out=out.replace('{{WA}}',WAPATH)
lw,lh,*_=open('img/logo-path.txt').read().split('\n')[0].split()
lp=open('img/logo-path.txt').read().split('\n',1)[1]
font='data:font/woff2;base64,'+base64.b64encode(open('fonts/bricolage.woff2','rb').read()).decode()
out=out.replace('{{LW}}',lw).replace('{{LH}}',lh).replace('{{LPATH}}',lp).replace('{{font}}',font)
open('Manura-Churrascaria-PREVIA.html','w',encoding='utf-8').write(out)
print(len(out)//1024,'KB')
