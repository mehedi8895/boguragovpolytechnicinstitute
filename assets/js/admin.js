import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from "./config.js";
const $ = (s, root=document) => root.querySelector(s);
const escapeHtml = v => String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const warning = $("#setup-warning");
let supabase, currentUser, currentTab="notices", records=[];
const configReady = isSupabaseConfigured();
if (!configReady) {
  warning.hidden=false;
  warning.textContent="Supabase এখনও কনফিগার করা হয়নি। আগে README.md-এর নির্দেশনা অনুযায়ী সঠিক BGPI Supabase project তৈরি/যাচাই করে assets/js/config.js-এ project URL এবং publishable/anon key বসান। বিদ্যমান Gadgets BD project এই প্রতিষ্ঠানের জন্য যাচাই করা হয়নি—সেটি ব্যবহার করবেন না।";
}
async function init() {
  if (!configReady) return;
  try {
    const {createClient}=await import("https://esm.sh/@supabase/supabase-js@2");
    supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
    const {data:{session}}=await supabase.auth.getSession();
    if(session) await authorize(session.user);
    supabase.auth.onAuthStateChange((_event,session)=> {
      if(!session){currentUser=null;$("#dashboard").hidden=true;$("#login-panel").hidden=false;}
    });
  } catch(e) { setMessage($("#login-message"),"Supabase SDK লোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।",true); }
}
function setMessage(el,text,error=false){el.textContent=text;el.classList.toggle("error",error);el.classList.toggle("success",!error&&Boolean(text));}
async function authorize(user) {
  const {data,error}=await supabase.from("bgpi_admin_users").select("role,active").eq("user_id",user.id).maybeSingle();
  if(error||!data||data.active!==true){
    await supabase.auth.signOut();
    $("#login-panel").hidden=false;$("#dashboard").hidden=true;
    setMessage($("#login-message"),"এই অ্যাকাউন্টের প্রশাসনিক অনুমতি নেই। অনুমোদিত অ্যাডমিনের সঙ্গে যোগাযোগ করুন।",true);return;
  }
  currentUser=user;$("#login-panel").hidden=true;$("#dashboard").hidden=false;$("#signed-in-as").textContent="লগইন: "+user.email+" · ভূমিকা: "+data.role;
  await loadRecords();
}
$("#login-form").addEventListener("submit",async e=>{
  e.preventDefault();if(!supabase){setMessage($("#login-message"),"Supabase configuration প্রয়োজন।",true);return;}
  const btn=e.submitter;btn.disabled=true;setMessage($("#login-message"),"লগইন যাচাই হচ্ছে…");
  try{const {data,error}=await supabase.auth.signInWithPassword({email:$("#login-email").value.trim(),password:$("#login-password").value});if(error)throw error;await authorize(data.user);}
  catch(err){setMessage($("#login-message"),"লগইন হয়নি। ইমেইল/পাসওয়ার্ড যাচাই করুন অথবা Supabase Auth সেটিংস পরীক্ষা করুন।",true);}
  finally{btn.disabled=false;}
});
$("#logout-button").addEventListener("click",async()=>{if(supabase)await supabase.auth.signOut();currentUser=null;$("#dashboard").hidden=true;$("#login-panel").hidden=false;$("#login-password").value="";});
const definitions={
 notices:{title:"নোটিশ ব্যবস্থাপনা",table:"bgpi_notices",fields:[
  {name:"title",label:"নোটিশের শিরোনাম",required:true,full:true},
  {name:"description",label:"বিবরণ",type:"textarea",full:true},
  {name:"category",label:"ক্যাটাগরি",placeholder:"যেমন: একাডেমিক / পরীক্ষা"},
  {name:"publication_date",label:"প্রকাশের তারিখ",type:"date"},
  {name:"attachment_url",label:"PDF/ফাইল URL",placeholder:"https://…"},
  {name:"attachment_file",label:"PDF আপলোড",type:"file",accept:".pdf,application/pdf",hint:"ঐচ্ছিক; আপলোড করলে URL স্বয়ংক্রিয়ভাবে যুক্ত হবে।"},
  {name:"published",label:"প্রকাশিত",type:"checkbox"}],select:"id,title,description,category,publication_date,attachment_url,published,created_at",summary:r=>r.category||"নোটিশ",title:r=>r.title},
 faculty:{title:"শিক্ষকবৃন্দ ব্যবস্থাপনা",table:"bgpi_faculty",fields:[
  {name:"name_bn",label:"বাংলা নাম",required:true},{name:"name_en",label:"English name"},
  {name:"designation_bn",label:"বাংলা পদবি",required:true},{name:"designation_en",label:"English designation"},
  {name:"department",label:"বিভাগ/টেকনোলজি",required:true},{name:"email",label:"ইমেইল",type:"email"},
  {name:"phone",label:"ফোন"},{name:"photo_url",label:"ছবির URL"},
  {name:"photo_file",label:"ছবি আপলোড",type:"file",accept:"image/png,image/jpeg,image/webp",hint:"ঐচ্ছিক; ছবি আপলোড করলে URL যুক্ত হবে।"},
  {name:"sort_order",label:"ক্রম",type:"number",default:"0"},{name:"published",label:"প্রকাশিত",type:"checkbox"}],
  select:"id,name_bn,name_en,designation_bn,designation_en,department,email,phone,photo_url,sort_order,published,created_at",summary:r=>r.department||"বিভাগ উল্লেখ নেই",title:r=>r.name_bn},
 departments:{title:"বিভাগ ব্যবস্থাপনা",table:"bgpi_departments",fields:[
  {name:"name_bn",label:"বাংলা নাম",required:true},{name:"name_en",label:"English name",required:true},
  {name:"description",label:"বর্ণনা",type:"textarea",full:true},{name:"image_or_icon",label:"ছবি URL বা আইকন"},
  {name:"display_order",label:"প্রদর্শন ক্রম",type:"number",default:"0"},{name:"published",label:"প্রকাশিত",type:"checkbox"}],
  select:"id,name_bn,name_en,description,image_or_icon,display_order,published,created_at",summary:r=>r.name_en||"",title:r=>r.name_bn}
};
function renderForm(record={}) {
 const def=definitions[currentTab];$("#record-id").value=record.id||"";
 $("#dynamic-fields").innerHTML=def.fields.map(f=>{
   const value=record[f.name]??f.default??"";
   const full=f.full?" full":"";
   if(f.type==="file")return '<div class="form-field'+full+'"><label for="field-'+f.name+'">'+f.label+'</label><input id="field-'+f.name+'" name="'+f.name+'" type="file" accept="'+f.accept+'"><small>'+escapeHtml(f.hint||"")+'</small></div>';
   if(f.type==="checkbox")return '<div class="form-field'+full+'"><label><input id="field-'+f.name+'" name="'+f.name+'" type="checkbox" style="width:auto;margin-right:8px" '+(record[f.name]===true?'checked':(!record.id&&f.default==="true"?'checked':""))+'> '+f.label+'</label></div>';
   if(f.type==="textarea")return '<div class="form-field'+full+'"><label for="field-'+f.name+'">'+f.label+'</label><textarea id="field-'+f.name+'" name="'+f.name+'">'+escapeHtml(value)+'</textarea></div>';
   return '<div class="form-field'+full+'"><label for="field-'+f.name+'">'+f.label+(f.required?' *':'')+'</label><input id="field-'+f.name+'" name="'+f.name+'" type="'+(f.type||"text")+'" '+(f.required?'required':"")+' '+(f.placeholder?'placeholder="'+escapeHtml(f.placeholder)+'"':"")+' value="'+escapeHtml(value)+'"></div>';
 }).join("");
 $("#editor-title").textContent=record.id?"রেকর্ড সম্পাদনা":"নতুন রেকর্ড যোগ করুন";
 $("#save-message").textContent="";
}
function switchTab(tab) {
 currentTab=tab;const def=definitions[tab];
 document.querySelectorAll(".admin-tab").forEach(b=>{const active=b.dataset.tab===tab;b.classList.toggle("active",active);b.setAttribute("aria-selected",String(active));});
 $("#editor-title").textContent=def.title;renderForm();renderRecords();
}
document.querySelectorAll(".admin-tab").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.tab)));
$("#reset-form").addEventListener("click",()=>renderForm());
$("#cancel-edit").addEventListener("click",()=>renderForm());
async function loadRecords(){
 if(!supabase||!currentUser)return;
 for(const [tab,def] of Object.entries(definitions)){
  const {count,error}=await supabase.from(def.table).select("id",{count:"exact",head:true});
  if(!error){const target=tab==="notices"?"stat-notices":tab==="faculty"?"stat-faculty":"stat-departments";$( "#"+target).textContent=count??0;}
 }
 const def=definitions[currentTab];
 const {data,error}=await supabase.from(def.table).select(def.select).order(currentTab==="notices"?"publication_date":currentTab==="faculty"?"sort_order":"display_order",{ascending:false}).limit(200);
 if(error){$("#records-list").innerHTML='<p class="form-message error">রেকর্ড লোড করা যায়নি: '+escapeHtml(error.message)+'</p>';return;}
 records=data||[];renderRecords();
}
function renderRecords(){
 const term=$("#record-search").value.trim().toLocaleLowerCase();
 const def=definitions[currentTab],list=records.filter(r=>JSON.stringify(r).toLocaleLowerCase().includes(term));
 if(!list.length){$("#records-list").innerHTML='<p class="muted">কোনো রেকর্ড পাওয়া যায়নি। শিক্ষক তথ্য না থাকলে যাচাইকৃত তথ্য পাওয়ার পর নতুন রেকর্ড যোগ করুন।</p>';return;}
 $("#records-list").innerHTML=list.map(r=>'<article class="record-item"><div class="record-main"><strong>'+escapeHtml(def.title(r))+'</strong><small>'+escapeHtml(def.summary(r))+'</small><span class="record-status '+(r.published?"":"draft")+'">'+(r.published?"প্রকাশিত":"খসড়া / অপ্রকাশিত")+'</span></div><div class="record-actions"><button type="button" data-edit="'+escapeHtml(r.id)+'">সম্পাদনা</button><button type="button" class="delete" data-delete="'+escapeHtml(r.id)+'">মুছুন</button></div></article>').join("");
 $("#records-list").querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>{const rec=records.find(r=>String(r.id)===b.dataset.edit);renderForm(rec);$("#content-form").scrollIntoView({behavior:"smooth",block:"start"});}));
 $("#records-list").querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>deleteRecord(b.dataset.delete)));
}
$("#record-search").addEventListener("input",renderRecords);
async function uploadIfSelected(fieldName,recordId) {
 const file=$("#field-"+fieldName)?.files?.[0];if(!file)return null;
 if(file.size>10*1024*1024)throw new Error("ফাইল ১০ MB-এর চেয়ে ছোট হতে হবে।");
 const allowed=fieldName==="attachment_file"?file.type==="application/pdf":["image/jpeg","image/png","image/webp"].includes(file.type);
 if(!allowed)throw new Error(fieldName==="attachment_file"?"শুধু PDF ফাইল আপলোড করুন।":"শুধু JPG, PNG বা WebP ছবি আপলোড করুন।");
 const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
 const path=currentTab+"/"+recordId+"/"+Date.now()+"-"+safeName;
 const {error}=await supabase.storage.from("bgpi-public-files").upload(path,file,{upsert:false,contentType:file.type});
 if(error)throw error;
 const {data}=supabase.storage.from("bgpi-public-files").getPublicUrl(path);
 return data.publicUrl;
}
$("#content-form").addEventListener("submit",async e=>{
 e.preventDefault();if(!supabase||!currentUser)return;
 const def=definitions[currentTab],id=$("#record-id").value,button=$("#save-record");button.disabled=true;setMessage($("#save-message"),"সংরক্ষণ হচ্ছে…");
 try{
  const payload={};
  for(const f of def.fields){if(f.type==="file")continue;const el=$("#field-"+f.name);if(!el)continue;payload[f.name]=f.type==="checkbox"?el.checked:el.value.trim();}
  if(currentTab==="notices"&&payload.publication_date==="")payload.publication_date=null;
  if(currentTab==="faculty"){if(payload.email==="")payload.email=null;if(payload.phone==="")payload.phone=null;if(payload.name_en==="")payload.name_en=null;if(payload.designation_en==="")payload.designation_en=null;if(payload.sort_order==="")payload.sort_order=0;else payload.sort_order=Number(payload.sort_order);}
  if(currentTab==="departments"){if(payload.display_order==="")payload.display_order=0;else payload.display_order=Number(payload.display_order);}
  if(id){const url=await uploadIfSelected(currentTab==="notices"?"attachment_file":"photo_file",id);if(url)payload[currentTab==="notices"?"attachment_url":"photo_url"]=url;
    const {error}=await supabase.from(def.table).update(payload).eq("id",id);if(error)throw error;
  }else{
    const {data,error}=await supabase.from(def.table).insert(payload).select("id").single();if(error)throw error;
    const url=await uploadIfSelected(currentTab==="notices"?"attachment_file":"photo_file",data.id);
    if(url){const col=currentTab==="notices"?"attachment_url":"photo_url";const {error:updateError}=await supabase.from(def.table).update({[col]:url}).eq("id",data.id);if(updateError)throw updateError;}
  }
  setMessage($("#save-message"),"রেকর্ড সফলভাবে সংরক্ষিত হয়েছে।");renderForm();await loadRecords();
 }catch(err){setMessage($("#save-message"),"সংরক্ষণ করা যায়নি: "+(err.message||"অজানা সমস্যা"),true);}
 finally{button.disabled=false;}
});
async function deleteRecord(id){
 const def=definitions[currentTab];if(!confirm("এই রেকর্ডটি স্থায়ীভাবে মুছে ফেলতে চান?"))return;
 const {error}=await supabase.from(def.table).delete().eq("id",id);
 if(error){alert("মুছে ফেলা যায়নি: "+error.message);return;}
 await loadRecords();
}
init();