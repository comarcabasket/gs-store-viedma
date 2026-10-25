export const $ = (s,r=document) => r.querySelector(s);
export const $$ = (s,r=document) => Array.from(r.querySelectorAll(s));
export function escapeHTML(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export const categories={iphone:'iPhone',importados:'Importados',accesorios:'Accesorios'};
export function normalizePhone(number=''){ const s=String(number).replace(/\D/g,''); return s.length>=10&&s.length<=15?s:''; }
export function linkWhatsApp(number,text){ const n=normalizePhone(number); return n?`https://wa.me/${n}?text=${encodeURIComponent(text)}`:null; }
export function fmtPrice(value,currency='ARS'){const n=Number(value); if(!Number.isFinite(n)||n<=0)return '';return currency==='USD'?`USD ${n.toLocaleString('es-AR',{maximumFractionDigits:2})}`:`$ ${n.toLocaleString('es-AR',{maximumFractionDigits:0})}`;}
export function getCTA(product){if(product.category==='iphone')return product.showPrice&&Number(product.price)>0?fmtPrice(product.price,product.currency):'Consultá precio';if(product.category==='importados')return 'Consultá stock';return fmtPrice(product.price,product.currency)||'Consultanos';}
export function productMessage(p){const title=[p.name,p.subtitle].filter(Boolean).join(' · ');return `¡Hola, GS Store! 👋 Quisiera consultar por ${title}. ${p.category==='importados'?'¿Tienen stock disponible?':'¿Me brindan más información?'} ¡Gracias!`;}
export async function fetchJSON(path,fallback){try{let r=await fetch(path,{cache:'no-store'});if(!r.ok)throw Error('Error de conexión');return await r.json();}catch{return fallback;}}
export function toast(text){let e=$('#toast');if(!e)return;e.textContent=text;e.classList.add('show');clearTimeout(window.__toastTimeout);window.__toastTimeout=setTimeout(()=>e.classList.remove('show'),3600);}
