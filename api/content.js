const {json,configured,isAuthenticated,sameOrigin,parseBody,localRead,githubRead,githubWrite,sanitize}=require('../lib/server.cjs');
module.exports=async function handler(req,res){
 const type=String(req.query?.type||new URL(req.url,'http://localhost').searchParams.get('type')||'');
 if(!['site','products'].includes(type))return json(res,400,{error:'Tipo inválido.'});
 if(req.method==='GET'){
  try{if(process.env.GITHUB_TOKEN&&process.env.GITHUB_REPO){try{return json(res,200,(await githubRead(type)).data);}catch(e){console.error('GitHub read:',e.message);}}
   return json(res,200,localRead(type));}catch(e){return json(res,500,{error:'No se pudo leer el catálogo.'});}
 }
 if(req.method!=='POST')return json(res,405,{error:'Método no permitido.'});
 if(!sameOrigin(req))return json(res,403,{error:'Origen no permitido.'});
 if(!configured()||!isAuthenticated(req))return json(res,401,{error:'Iniciá sesión como administrador.'});
 try{const body=await parseBody(req);const cleaned=sanitize(type,body);await githubWrite(type,cleaned);return json(res,200,{ok:true,count:Array.isArray(cleaned)?cleaned.length:undefined,message:'Cambios guardados en GitHub. Vercel actualizará la versión publicada.'});}
 catch(e){console.error(e.message);return json(res,400,{error:e.message||'No se pudo guardar.'});}
};
