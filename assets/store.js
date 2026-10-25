import {ico} from './icons.js';
import {$,$$,escapeHTML,categories,linkWhatsApp,normalizePhone,getCTA,productMessage,fetchJSON,toast} from './shared.js';
let site={},allProducts=[],activeCategory='todos',searchQuery='';
const validCategories=new Set(['todos','iphone','accesorios','importados']);
const catalogDetails={
 todos:{eyebrow:'/ 01 — CATÁLOGO',title:'Descubrí nuestra <span class="soft-text">selección.</span>',description:'Consultá disponibilidad y detalles de cada producto directamente con nosotros.'},
 iphone:{eyebrow:'/ 01 — IPHONE',title:'Encontrá tu <span class="soft-text">próximo iPhone.</span>',description:'Explorá los equipos disponibles y consultanos por precio y características.'},
 importados:{eyebrow:'/ 01 — IMPORTADOS',title:'Traemos lo que <span class="soft-text">estás buscando.</span>',description:'Productos a pedido y tecnología seleccionada. Consultanos por disponibilidad.'},
 accesorios:{eyebrow:'/ 01 — ACCESORIOS',title:'Los detalles <span class="soft-text">hacen la diferencia.</span>',description:'Fundas, cargadores, auriculares y accesorios para acompañar tu iPhone.'}
};
function closeMobileNav(){
 $('#navLinks').classList.remove('open');$('#menuToggle').setAttribute('aria-expanded','false');
 closeCatalogDropdown();
}
function closeCatalogDropdown(){
 $('#catalogDropdown').classList.remove('open');$('#catalogDropdownToggle').setAttribute('aria-expanded','false');
}
function getRoute(){
 const hash=decodeURIComponent(location.hash.slice(1)).toLowerCase().replace(/\/$/,'');
 if(hash==='canje'&&site.planCanjeActive!==false)return {page:'canje'};
 if(hash==='contacto')return {page:'contacto'};
 if(hash==='catalogo')return {page:'catalogo',category:'todos'};
 const match=/^catalogo\/(iphone|importados|accesorios)$/.exec(hash);
 if(match)return {page:'catalogo',category:match[1]};
 return {page:'inicio'};
}
function showRoute(){
 const route=getRoute();
 $$('.page-view').forEach(view=>{view.hidden=view.dataset.page!==route.page;});
 $$('.nav-page-link').forEach(link=>{
   const selected=link.getAttribute('href')==='#'+route.page;
   link.classList.toggle('is-active',selected);
   if(selected)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
 });
 const catalogActive=route.page==='catalogo';
 $('#catalogDropdownToggle').classList.toggle('is-active',catalogActive);
 $$('#catalogDropdownMenu a').forEach(link=>{
   const selected=catalogActive&&link.dataset.catalogMenu===(route.category||'todos');
   link.classList.toggle('is-active',selected);
   if(selected)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
 });
 if(catalogActive){
   const category=validCategories.has(route.category)?route.category:'todos';
   if(activeCategory!==category)setCategory(category);
   const details=catalogDetails[category];
   $('#catalogEyebrow').textContent=details.eyebrow;
   $('#catalogHeading').innerHTML=details.title;
   $('#catalogDescription').textContent=details.description;
 }
 closeMobileNav();
 document.title=route.page==='catalogo'?`${route.category==='todos'?'Catálogo':categories[route.category]} | GS Store Viedma`:route.page==='canje'?'Plan canje | GS Store Viedma':route.page==='contacto'?'Contacto | GS Store Viedma':'GS Store Viedma — Tu próximo iPhone empieza acá';
 window.scrollTo(0,0);
}

const logo='https://i.ibb.co/Q7RyKNvF/Chat-GPT-Image-29-ago-2026-06-11-09-p-m.png';
function icons(){ $$('[data-icon]').forEach(el=>{el.innerHTML=ico(el.dataset.icon);}); }
function renderSite(){
 $('#announcement').textContent=site.announcement||'Catálogo de tecnología · Consultas personalizadas';
 $('#heroTitle').textContent='';const title=site.heroTitle||'Tu próximo iPhone empieza acá.'; const marker=title.lastIndexOf(' ');const plain=marker>0?title.slice(0,marker):title;const accent=marker>0?title.slice(marker+1):''; $('#heroTitle').innerHTML=`${escapeHTML(plain)} <em>${escapeHTML(accent)}</em>`;
 $('#heroDescription').textContent=site.heroDescription||'';
 const number=normalizePhone(site.whatsappNumber);const wa=linkWhatsApp(number,'¡Hola, GS Store! 👋 Quisiera hacer una consulta.');
 const contact=$('#contactWhatsapp');const nav=$('#navWhatsapp');
 if(wa){contact.href=wa;contact.target='_blank';contact.rel='noopener noreferrer';nav.href=wa;nav.target='_blank';nav.rel='noopener noreferrer';}
 else{contact.href='#contacto';nav.href='#contacto';}
 $('#contactWhatsappDetail').textContent=number?`+${number}`:'Canal a configurar';
 let ig=String(site.instagramUrl||'').trim();if(/^https:\/\/(www\.)?(instagram\.com|instagr\.am)\//i.test(ig)){$('#contactInstagram').href=ig;$('#contactInstagram').target='_blank';$('#contactInstagram').rel='noopener noreferrer';}
 $('#contactInstagramDetail').textContent=site.instagramHandle||'Canal a configurar';
 $('#year').textContent=new Date().getFullYear();
 if(site.planCanjeActive===false){$$('a[href="#canje"]').forEach(a=>a.style.display='none');}
}
function setCategory(next){activeCategory=next;$$('.tab').forEach(t=>{const selected=t.dataset.category===next;t.classList.toggle('active',selected);t.setAttribute('aria-selected',selected?'true':'false');});renderProducts();}
function renderProducts(){
 const published=allProducts.filter(p=>p.published!==false);
 const items=published.filter(p=>(activeCategory==='todos'||p.category===activeCategory)&&`${p.name} ${p.subtitle||''} ${p.description||''}`.toLowerCase().includes(searchQuery));
 $('#catalogCount').textContent=items.length===1?'1 producto':`${items.length} productos`;
 if(!items.length){const noProducts=published.length===0;$('#productGrid').innerHTML=`<div class="empty-state"><div class="empty-icon">${ico(noProducts?'bag':'search',23)}</div><h3>${noProducts?'Estamos preparando nuestro catálogo.':'No encontramos coincidencias.'}</h3><p>${noProducts?'Muy pronto vas a poder explorar nuestros productos. Mientras tanto, podés consultarnos directamente.':'Probá con otra palabra o seleccioná una categoría diferente.'}</p><a class="btn btn-primary" href="#contacto">${noProducts?'Hacer una consulta':'Contactanos'} ${ico('arrow',15)}</a></div>`;return;}
 $('#productGrid').innerHTML=items.map(p=>`<article class="product-card"><div class="product-image">${p.imageUrl?`<img loading="lazy" src="${escapeHTML(p.imageUrl)}" alt="${escapeHTML(p.name)}" onerror="this.remove()"/>`:`<div class="product-fallback">GS</div>`}${p.badge?`<span class="product-badge">${escapeHTML(p.badge)}</span>`:''}</div><div class="product-body"><div class="product-category">${escapeHTML(categories[p.category]||p.category)}</div><h3>${escapeHTML(p.name)}</h3><p>${escapeHTML(p.subtitle||'')}</p><div class="product-bottom"><span class="product-price">${escapeHTML(getCTA(p))}</span><button class="product-more" data-product="${escapeHTML(p.id)}" aria-label="Ver detalles de ${escapeHTML(p.name)}">${ico('northeast',18)}</button></div></div></article>`).join('');
 $$('[data-product]').forEach(b=>b.addEventListener('click',()=>showProduct(b.dataset.product)));
}
function showProduct(id){const p=allProducts.find(p=>p.id===id);if(!p)return;$('#dialogCategory').textContent=categories[p.category]||'PRODUCTO';$('#dialogTitle').textContent=p.name;$('#dialogSubtitle').textContent=p.subtitle||'';$('#dialogDescription').textContent=p.description||'';$('#dialogPrice').textContent=getCTA(p);$('#dialogImage').innerHTML=p.imageUrl?`<img src="${escapeHTML(p.imageUrl)}" alt="${escapeHTML(p.name)}"/>`:'GS';const features=Array.isArray(p.features)?p.features:[];$('#dialogSpecs').innerHTML=features.filter(Boolean).map(f=>`<div>${ico('check',16)}${escapeHTML(f)}</div>`).join('');const btn=$('#dialogCTA');let wa=linkWhatsApp(site.whatsappNumber,productMessage(p));btn.href=wa||'#contacto';btn.target=wa?'_blank':'_self';btn.rel=wa?'noopener noreferrer':'';btn.textContent='';btn.innerHTML=`${p.category==='importados'?'Consultar stock':p.category==='iphone'?'Consultar equipo':'Consultar producto'} ${ico('northeast',16)}`;$('#productDialog').showModal();}
function makeTradeMessage(){const model=$('#tradeModel').value;const storage=$('#tradeStorage').value;const battery=$('#tradeBattery').value;const condition=$('#tradeCondition').value;const details=$('#tradeDetails').value.trim();const wanted=$('#tradeWanted').value.trim();return `¡Hola, GS Store! 👋 Quiero cotizar mi iPhone para el *plan canje*.\n\n📱 *Modelo:* ${model}\n💾 *Almacenamiento:* ${storage}\n🔋 *Salud de batería:* ${battery}%\n✨ *Estado general:* ${condition}\n🔎 *Detalles:* ${details||'No informados'}${wanted?`\n🛍️ *Me interesa:* ${wanted}`:''}\n\n¿Podrían ayudarme con una cotización? ¡Gracias!`;}
function fillModels(){const models=['iPhone 18 Pro Max','iPhone 18 Pro','iPhone 18','iPhone 17 Pro Max','iPhone 17 Pro','iPhone 17 Air','iPhone 17','iPhone 16 Pro Max','iPhone 16 Pro','iPhone 16 Plus','iPhone 16','iPhone 16e','iPhone 15 Pro Max','iPhone 15 Pro','iPhone 15 Plus','iPhone 15','iPhone 14 Pro Max','iPhone 14 Pro','iPhone 14 Plus','iPhone 14','iPhone 13 Pro Max','iPhone 13 Pro','iPhone 13 mini','iPhone 13','iPhone 12 Pro Max','iPhone 12 Pro','iPhone 12 mini','iPhone 12','iPhone 11 Pro Max','iPhone 11 Pro','iPhone 11','iPhone SE','iPhone XS Max','iPhone XS','iPhone XR','iPhone X'];$('#modelOptions').innerHTML=models.map(x=>`<option value="${escapeHTML(x)}"></option>`).join('');}

function setupEvents(){
 icons();fillModels();
 $$('.tab').forEach(b=>b.addEventListener('click',()=>{
   const category=b.dataset.category;
   const next=category==='todos'?'#catalogo':`#catalogo/${category}`;
   if(location.hash===next){setCategory(category);showRoute();}else location.hash=next;
 }));
 $('#catalogDropdownToggle').addEventListener('click',()=>{
   const dropdown=$('#catalogDropdown');const open=dropdown.classList.toggle('open');
   $('#catalogDropdownToggle').setAttribute('aria-expanded',String(open));
 });
 document.addEventListener('click',event=>{if(!$('#catalogDropdown').contains(event.target))closeCatalogDropdown();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape')closeCatalogDropdown();});
 window.addEventListener('hashchange',()=>{if($('#productDialog').open)$('#productDialog').close();showRoute();});
 $('#productSearch').addEventListener('input',e=>{searchQuery=e.target.value.toLowerCase().trim();renderProducts();});
 $('#menuToggle').addEventListener('click',()=>{let open=$('#navLinks').classList.toggle('open');$('#menuToggle').setAttribute('aria-expanded',String(open));});
 $$('.nav-links a').forEach(a=>a.addEventListener('click',()=>closeMobileNav()));
 $('#dialogClose').addEventListener('click',()=>$('#productDialog').close());
 $('#productDialog').addEventListener('click',e=>{if(e.target===$('#productDialog'))$('#productDialog').close();});
 $('#tradeForm').addEventListener('submit',e=>{e.preventDefault();if(!e.target.reportValidity())return;const url=linkWhatsApp(site.whatsappNumber,makeTradeMessage());if(!url){$('#tradeStatus').textContent='El número de WhatsApp todavía no está configurado. Podés copiar el mensaje y enviarlo por otro medio.';return;}$('#tradeStatus').textContent='Se abrió WhatsApp. Revisá el mensaje y presioná enviar.';window.open(url,'_blank','noopener,noreferrer');});
 $('#copyTrade').addEventListener('click',async()=>{if(!$('#tradeForm').reportValidity())return;try{await navigator.clipboard.writeText(makeTradeMessage());toast('Mensaje copiado.');}catch{toast('No se pudo copiar automáticamente.');}});
}
async function init(){setupEvents();const [siteResult,productResult]=await Promise.all([fetchJSON('/api/content?type=site',{}),fetchJSON('/api/content?type=products',[])]);site=siteResult&&typeof siteResult==='object'&&!Array.isArray(siteResult)?siteResult:{};allProducts=Array.isArray(productResult)?productResult:[];renderSite();renderProducts();showRoute();}
init();
