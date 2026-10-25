const crypto=require('node:crypto');
const {json,configured,isAuthenticated,sameOrigin,parseBody}=require('../lib/server.cjs');
module.exports=async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Método no permitido.'});
 if(!sameOrigin(req))return json(res,403,{error:'Origen no permitido.'});
 if(!configured()||!isAuthenticated(req))return json(res,401,{error:'Iniciá sesión como administrador.'});
 try{
  const {image}=await parseBody(req,4600000);if(typeof image!=='string'||!/^[A-Za-z0-9+/]+={0,2}$/.test(image)||image.length>4500000)throw Error('Imagen inválida o demasiado grande');
  const binary=Buffer.from(image,'base64');if(binary.length<64||binary.length>3000000)throw Error('La foto debe pesar menos de 3 MB');
  // WebP RIFF magic bytes, produced by the browser-side image optimizer.
  if(binary.toString('ascii',0,4)!=='RIFF'||binary.toString('ascii',8,12)!=='WEBP')throw Error('Formato inválido: se espera imagen WebP');
  const repo=String(process.env.GITHUB_REPO||'');if(!/^[\w.-]+\/[\w.-]+$/.test(repo))throw Error('Repositorio inválido');
  const branch=process.env.GITHUB_BRANCH||'main';const file=`media/producto-${Date.now()}-${crypto.randomBytes(5).toString('hex')}.webp`;
  const result=await fetch(`https://api.github.com/repos/${repo}/contents/${file}`,{method:'PUT',headers:{'Accept':'application/vnd.github+json','Authorization':`Bearer ${process.env.GITHUB_TOKEN}`,'Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'},body:JSON.stringify({message:'GS Store: agregar foto de producto',content:image,branch})});
  if(!result.ok)throw Error(`GitHub rechazó la imagen (${result.status}).`);
  return json(res,200,{ok:true,url:`/${file}`});
 }catch(e){console.error(e.message);return json(res,400,{error:e.message||'No se pudo subir la foto.'});}
};
