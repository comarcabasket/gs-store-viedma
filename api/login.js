const {json,configured,safeEqual,sessionCookie,isAuthenticated,sameOrigin,parseBody}=require('../lib/server.cjs');
const attempts=new Map();
module.exports=async function handler(req,res){
 if(req.method==='GET')return json(res,200,{configured:configured(),authenticated:isAuthenticated(req)});
 if(req.method==='DELETE'){res.setHeader('Set-Cookie',sessionCookie(req,true));return json(res,200,{ok:true});}
 if(req.method!=='POST')return json(res,405,{error:'Método no permitido'});
 if(!sameOrigin(req))return json(res,403,{error:'Origen no permitido'});
 if(!configured())return json(res,503,{error:'Falta configurar ADMIN_PASSWORD, SESSION_SECRET, GITHUB_TOKEN o GITHUB_REPO en Vercel.'});
 const ip=String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'anon').split(',')[0].slice(0,80);const now=Date.now();const stat=attempts.get(ip)||{count:0,until:now+900000};if(stat.until<now){stat.count=0;stat.until=now+900000;}if(stat.count>=10)return json(res,429,{error:'Demasiados intentos. Volvé a intentarlo más tarde.'});
 try{const {password}=await parseBody(req);if(!safeEqual(String(password||''),String(process.env.ADMIN_PASSWORD))){stat.count++;attempts.set(ip,stat);return json(res,401,{error:'Contraseña incorrecta.'});}attempts.delete(ip);res.setHeader('Set-Cookie',sessionCookie(req));return json(res,200,{ok:true});}catch(e){return json(res,400,{error:e.message});}
};
