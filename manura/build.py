import base64,io,re,os
from PIL import Image,ImageFilter,ImageEnhance
src=open('index.src.html',encoding='utf-8').read()
def photo(name):
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
lw,lh,*_=open('img/logo-path.txt').read().split('\n')[0].split()
lp=open('img/logo-path.txt').read().split('\n',1)[1]
font='data:font/woff2;base64,'+base64.b64encode(open('fonts/bricolage.woff2','rb').read()).decode()
out=out.replace('{{LW}}',lw).replace('{{LH}}',lh).replace('{{LPATH}}',lp).replace('{{font}}',font)
open('Manura-Churrascaria-PREVIA.html','w',encoding='utf-8').write(out)
print(len(out)//1024,'KB')
