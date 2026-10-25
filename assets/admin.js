import {$,$$,escapeHTML,categories,fetchJSON,toast} from './shared.js';
let products=[],site={},selectedId=null,dirty=false,uploading=false;
const photoPreviews=new Map();
function productPhotos(p){const images=Array.isArray(p.images)?p.images.filter(Boolean):[];if(!images.length&&p.imageUrl)images.push(p.imageUrl);return images.slice(0,8);}
function setProductPhotos(p,images){p.images=[...new Set(images)].slice(0,8);p.imageUrl=p.images[0]||'';setDirty();}
function feedback(selector,message,isError=false){const e=$(selector);e.textContent=message;e.classList.toggle('error',isError);}
function setDirty(value=true){dirty=value;$('#dirtyMessage').textContent=value?'Tenés cambios sin guardar':'Todos los cambios están guardados';}
async function state(){const result=await fetchJSON('/api/login',{configured:false,authenticated:false});if(!result.configured){$('#setupMessage').hidden=false;$('#setupMessage').textContent='Antes de ingresar, configurá las variables ADMIN_PASSWORD, SESSION_SECRET, GITHUB_TOKEN y GITHUB_REPO en Vercel y volvé a desplegar el proyecto.';$('#loginForm').hidden=true;}if(result.authenticated)showDashboard();}
async function showDashboard(){$('#loginView').hidden=true;$('#dashboard').hidden=false;const [p,s]=await Promise.all([fetchJSON('/api/content?type=products',[]),fetchJSON('/api/content?type=site',{})]);products=Array.isArray(p)?p:[];site=s||{};setDirty(false);renderList();fillSite();}
function renderList(){const q=$('#adminSearch').value.toLowerCase().trim();$('#productTotal').textContent=products.length;const sorted=[...products].sort((a,b)=>(a.sortOrder||0)-(b.sortOrder||0));$('#adminList').innerHTML=sorted.filter(p=>(p.name+' '+p.category).toLowerCase().includes(q)).map(p=>`<button class="admin-item ${selectedId===p.id?'selected':''}" data-edit="${escapeHTML(p.id)}"><span class="admin-thumb">${p.imageUrl?`<img src="${escapeHTML(p.imageUrl)}" onerror="this.remove()" alt=""/>`:'GS'}</span><span class="admin-item-main"><strong>${escapeHTML(p.name||'Sin nombre')}</strong><small>${categories[p.category]||'iPhone'} ${p.published===false?'<span class="draft-badge">BORRADOR</span>':''}</small></span></button>`).join('')||'<div style="padding:25px;color:#8797ac;font-size:12px;text-align:center">Todavía no hay productos.</div>';$$('[data-edit]').forEach(b=>b.addEventListener('click',()=>selectProduct(b.dataset.edit)));}
function selectProduct(id){if(uploading){toast('Esperá a que termine la carga de las fotografías.');return;}const p=products.find(x=>x.id===id);if(!p)return;selectedId=id;$('#productForm').hidden=false;$('#noProduct').hidden=true;$('#editorTitle').textContent='Editar producto';$('#editorStatus').textContent=p.published===false?'Borrador':'Publicado';$('#pName').value=p.name||'';$('#pCategory').value=p.category||'iphone';$('#pSubtitle').value=p.subtitle||'';$('#pDescription').value=p.description||'';$('#pImageNew').value='';$('#pImageFile').value='';$('#uploadFeedback').textContent='';$('#pFeatures').value=(p.features||[]).join('\n');$('#pPrice').value=p.price||'';$('#pCurrency').value=p.currency||'ARS';$('#pBadge').value=p.badge||'';$('#pSort').value=p.sortOrder??0;$('#pPublished').checked=p.published!==false;$('#pShowPrice').checked=!!p.showPrice;renderImageGallery();categoryHint();renderList();}
function renderImageGallery(){
 const product=products.find(p=>p.id===selectedId);const images=product?productPhotos(product):[];
 $('#adminImageGallery').innerHTML=images.length?images.map((src,i)=>`<div class="admin-gallery-photo"><div class="admin-gallery-frame"><img src="${escapeHTML(photoPreviews.get(src)||src)}" alt="Foto ${i+1}"/></div><span class="admin-photo-label">${i===0?'Foto de portada':`Foto ${i+1}`}</span><div class="admin-photo-actions">${i>0?`<button type="button" data-photo-action="cover" data-photo-index="${i}">Hacer portada</button>`:''}<button type="button" data-photo-action="remove" data-photo-index="${i}" aria-label="Quitar foto ${i+1}">Quitar</button></div></div>`).join(''):'<div class="admin-gallery-empty">Todavía no agregaste fotografías. Podés cargar hasta 8.</div>';
}
function addImageUrl(){
 const p=products.find(x=>x.id===selectedId);if(!p)return;
 const raw=$('#pImageNew').value.trim();
 let url;try{url=new URL(raw);if(!['https:','http:'].includes(url.protocol))throw Error('invalid');}catch{feedback('#productsFeedback','Ingresá un enlace de imagen válido que empiece con https://',true);return;}
 const photos=productPhotos(p);if(photos.length>=8){feedback('#productsFeedback','Máximo 8 fotos por producto.',true);return;}
 if(photos.includes(raw)){feedback('#productsFeedback','Esta imagen ya está agregada.',true);return;}
 setProductPhotos(p,[...photos,raw]);$('#pImageNew').value='';renderImageGallery();renderList();toast('Foto agregada. Guardá el catálogo para publicar el cambio.');
}
function manageImage(event){
 const button=event.target.closest('[data-photo-action]');if(!button||uploading)return;
 const p=products.find(x=>x.id===selectedId);if(!p)return;
 const images=productPhotos(p);const index=Number(button.dataset.photoIndex);if(index<0||index>=images.length)return;
 if(button.dataset.photoAction==='cover'){const [selected]=images.splice(index,1);images.unshift(selected);}
 else if(button.dataset.photoAction==='remove'){images.splice(index,1);}
 setProductPhotos(p,images);renderImageGallery();renderList();
}
function categoryHint(){const c=$('#pCategory').value;$('#showPriceRow').hidden=c!=='iphone';$('#categoryHelp').textContent=c==='iphone'?'En iPhone el botón muestra “Consultá precio” por defecto. Podés activar “Mostrar precio” cuando quieras.':c==='importados'?'Los importados siempre muestran “Consultá stock” en el botón público, aunque cargues un precio para control interno.':'Los accesorios muestran su precio normal. Si no completás un precio, aparecerá “Consultanos”.';}
async function uploadProductImages(files){
 if(uploading||!files?.length||!selectedId)return;
 const selected=selectedId;const p=products.find(x=>x.id===selected);if(!p)return;
 const available=8-productPhotos(p).length;
 if(available<=0){feedback('#productsFeedback','Este producto ya tiene 8 fotografías. Quitá alguna para agregar otra.',true);$('#pImageFile').value='';return;}
 if(files.length>available)feedback('#productsFeedback',`Se cargarán las primeras ${available} fotos; el máximo es 8.`,true);
 const notice=$('#uploadFeedback');const btn=$('#saveProducts');const add=$('#newProduct');uploading=true;btn.disabled=true;add.disabled=true;
 let success=0;
 try{
  for(const file of files.slice(0,available)){
   if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>12000000){feedback('#productsFeedback',`No se pudo cargar ${file.name}: formato inválido o supera 12 MB.`,true);continue;}
   notice.textContent=`Preparando foto ${success+1}...`;
   try{
    const picture=await createImageBitmap(file);const maxSize=1400;const scale=Math.min(1,maxSize/Math.max(picture.width,picture.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(picture.width*scale));canvas.height=Math.max(1,Math.round(picture.height*scale));canvas.getContext('2d').drawImage(picture,0,0,canvas.width,canvas.height);picture.close();
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',0.84));if(!blob||blob.size>3000000)throw Error('No se pudo optimizar la foto.');
    const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error('No se pudo leer la imagen'));reader.readAsDataURL(blob);});
    notice.textContent=`Subiendo fotografía ${success+1} de ${Math.min(files.length,available)}...`;
    const response=await fetch('/api/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image:dataUrl.split(',')[1]})});const result=await response.json();if(!response.ok)throw Error(result.error||'No se pudo subir la foto');
    const photoList=productPhotos(p);if(photoList.length<8){setProductPhotos(p,[...photoList,result.url]);photoPreviews.set(result.url,dataUrl);success++;renderImageGallery();renderList();}
   }catch(e){feedback('#productsFeedback',`Error al subir ${file.name}: ${e.message}`,true);}
  }
  notice.textContent=success?`✓ ${success} foto${success===1?'':'s'} subida${success===1?'':'s'}. Guardá el catálogo en GitHub.`:'No se pudo subir ninguna fotografía.';
  if(success)toast(`${success} foto${success===1?'':'s'} cargada${success===1?'':'s'} correctamente.`);
 }finally{uploading=false;btn.disabled=false;add.disabled=false;$('#pImageFile').value='';}
}

function draftNew(){if(uploading)return;const id='p_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);const p={id,name:'Nuevo producto',category:'iphone',subtitle:'',description:'',imageUrl:'',images:[],features:[],badge:'',price:0,currency:'ARS',showPrice:false,published:false,sortOrder:products.length};products.push(p);setDirty();selectProduct(id);$('#pName').select();}
function applyProduct(e){e.preventDefault();if(!e.target.reportValidity())return;const p=products.find(x=>x.id===selectedId);if(!p)return;p.name=$('#pName').value.trim();p.category=$('#pCategory').value;p.subtitle=$('#pSubtitle').value.trim();p.description=$('#pDescription').value.trim();p.images=productPhotos(p);p.imageUrl=p.images[0]||'';p.features=$('#pFeatures').value.split('\n').map(x=>x.trim()).filter(Boolean);p.price=Math.max(0,Number($('#pPrice').value)||0);p.currency=$('#pCurrency').value;p.badge=$('#pBadge').value.trim();p.sortOrder=Number($('#pSort').value)||0;p.published=$('#pPublished').checked;p.showPrice=$('#pShowPrice').checked;setDirty();selectProduct(p.id);toast('Cambios aplicados. Guardá el catálogo en GitHub.');}
async function saveProducts(){if(uploading){feedback('#productsFeedback','Esperá a que terminen de subir las fotos.',true);return;}if(selectedId&&!$('#productForm').hidden){if(!$('#productForm').reportValidity()){feedback('#productsFeedback','Revisá los datos del producto antes de guardar.',true);return;}$('#productForm').requestSubmit();}

 if(products.some(p=>!p.name.trim())){feedback('#productsFeedback','Hay productos sin nombre.',true);return;}
 const btn=$('#saveProducts');btn.disabled=true;btn.textContent='Guardando...';try{const r=await fetch('/api/content?type=products',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(products)});const j=await r.json();if(!r.ok)throw Error(j.error||'Error al guardar');setDirty(false);feedback('#productsFeedback','✓ Catálogo guardado en GitHub. Los cambios se verán en la web al actualizar.');toast('Catálogo guardado correctamente.');}catch(e){feedback('#productsFeedback',e.message,true);}finally{btn.disabled=false;btn.textContent='Guardar catálogo en GitHub';}}
function fillSite(){$('#sWhatsApp').value=site.whatsappNumber||'';$('#sIGHandle').value=site.instagramHandle||'';$('#sIGUrl').value=site.instagramUrl||'';$('#sAnnouncement').value=site.announcement||'';$('#sTitle').value=site.heroTitle||'';$('#sDescription').value=site.heroDescription||'';$('#sTradeActive').checked=site.planCanjeActive!==false;}
async function saveSite(e){e.preventDefault();const updated={...site,whatsappNumber:$('#sWhatsApp').value,instagramHandle:$('#sIGHandle').value,instagramUrl:$('#sIGUrl').value,announcement:$('#sAnnouncement').value,heroTitle:$('#sTitle').value,heroDescription:$('#sDescription').value,planCanjeActive:$('#sTradeActive').checked};const btn=e.submitter;btn.disabled=true;btn.textContent='Guardando...';try{const r=await fetch('/api/content?type=site',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(updated)});const j=await r.json();if(!r.ok)throw Error(j.error||'Error al guardar');site=updated;feedback('#siteFeedback','✓ Configuración guardada correctamente.');toast('Datos del sitio actualizados.');}catch(error){feedback('#siteFeedback',error.message,true);}finally{btn.disabled=false;btn.textContent='Guardar configuración en GitHub →';}}
function backup(){const blob=new Blob([JSON.stringify(products,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`gs-store-productos-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);}
function setupEvents(){
 $('#loginForm').addEventListener('submit',async e=>{e.preventDefault();feedback('#loginError','');const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:$('#loginPassword').value})});const j=await r.json();if(r.ok)showDashboard();else feedback('#loginError',j.error||'No se pudo ingresar',true);});
 $('#logout').addEventListener('click',async()=>{await fetch('/api/login',{method:'DELETE'});location.reload();});
 $$('.adm-tab').forEach(b=>b.addEventListener('click',()=>{$$('.adm-tab').forEach(x=>x.classList.toggle('active',x===b));$('#productsView').hidden=b.dataset.tab!=='products';$('#contactView').hidden=b.dataset.tab!=='contact';}));
 $('#newProduct').addEventListener('click',draftNew);$('#adminSearch').addEventListener('input',renderList);$('#pImageFile').addEventListener('change',e=>uploadProductImages(Array.from(e.target.files||[])));$('#addImageUrl').addEventListener('click',addImageUrl);$('#adminImageGallery').addEventListener('click',manageImage);$('#pCategory').addEventListener('change',categoryHint);$('#productForm').addEventListener('submit',applyProduct);
 $('#deleteProduct').addEventListener('click',()=>{if(uploading)return;if(!selectedId||!confirm('¿Eliminar este producto del catálogo? Tendrás que guardar para confirmar la eliminación.'))return;products=products.filter(p=>p.id!==selectedId);selectedId=null;$('#productForm').hidden=true;$('#noProduct').hidden=false;$('#editorTitle').textContent='Seleccioná un producto';setDirty();renderList();});
 $('#saveProducts').addEventListener('click',saveProducts);$('#downloadBackup').addEventListener('click',backup);$('#siteForm').addEventListener('submit',saveSite);
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
}
setupEvents();state();
