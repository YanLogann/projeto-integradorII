import base64,io,re,sys
from PIL import Image,ImageFilter
src=open('index.src.html',encoding='utf-8').read()
def enc(m):
    im=Image.open(f'img/{m.group(1)}.jpg').convert('RGB')
    im=im.resize((im.width*2,im.height*2),Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.2,60,2))
    b=io.BytesIO();im.save(b,'JPEG',quality=80,optimize=True)
    return 'data:image/jpeg;base64,'+base64.b64encode(b.getvalue()).decode()
out=re.sub(r'\{\{img:(\w+)\}\}',enc,src)
open('Manura-Churrascaria-PREVIA.html','w',encoding='utf-8').write(out)
print(len(out)//1024,'KB')
