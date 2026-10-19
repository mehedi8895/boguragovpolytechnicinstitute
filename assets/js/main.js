import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from "./config.js";
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const menu = $("#primary-nav"), menuToggle = $("#menu-toggle");
menuToggle?.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "মেনু বন্ধ করুন" : "মেনু খুলুন");
});
$$(".primary-nav a").forEach(a => a.addEventListener("click", () => {
  menu?.classList.remove("open"); menuToggle?.setAttribute("aria-expanded","false");
}));
const themeButton = $("#theme-toggle");
const savedTheme = (() => { try { return localStorage.getItem("bgpi-theme"); } catch { return null; } })();
const systemDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
function setTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  themeButton.textContent = theme === "dark" ? "☀" : "☾";
  themeButton.setAttribute("aria-label", theme === "dark" ? "লাইট মোড চালু করুন" : "ডার্ক মোড চালু করুন");
  try { localStorage.setItem("bgpi-theme", theme); } catch {}
}
setTheme(savedTheme || (systemDark ? "dark" : "light"));
themeButton?.addEventListener("click", () => setTheme(document.body.classList.contains("dark") ? "light" : "dark"));
$("#year").textContent = new Date().getFullYear();
const dialog = $("#dept-dialog");
let deptLabels = {
  "Civil Technology":["সিভিল টেকনোলজি","নির্মাণ, অবকাঠামো ও জরিপ-সম্পর্কিত কারিগরি শিক্ষার ক্ষেত্র। নির্দিষ্ট পাঠ্যক্রম ও সুবিধার তথ্য অফিসিয়াল সূত্রে যাচাই করে যুক্ত করা হবে।"],
  "Electrical Technology":["ইলেকট্রিক্যাল টেকনোলজি","বিদ্যুৎ ও বৈদ্যুতিক ব্যবস্থাসংশ্লিষ্ট প্রযুক্তিশিক্ষার ক্ষেত্র। বিস্তারিত তথ্য যাচাইসাপেক্ষে যুক্ত হবে।"],
  "Computer Science Technology":["কম্পিউটার সায়েন্স টেকনোলজি","কম্পিউটিং ও ডিজিটাল প্রযুক্তির সঙ্গে সম্পর্কিত শিক্ষাক্ষেত্র। নির্দিষ্ট কোর্সের তথ্য যাচাইসাপেক্ষে যুক্ত হবে।"],
  "Mechanical Technology":["মেকানিক্যাল টেকনোলজি","যন্ত্র, উৎপাদন ও যান্ত্রিক ব্যবস্থার সঙ্গে সম্পর্কিত প্রযুক্তিশিক্ষার ক্ষেত্র। বিস্তারিত তথ্য যাচাইসাপেক্ষে যুক্ত হবে।"],
  "Electronics Technology":["ইলেকট্রনিক্স টেকনোলজি","ইলেকট্রনিক সার্কিট ও সংশ্লিষ্ট প্রযুক্তির শিক্ষাক্ষেত্র। বিস্তারিত তথ্য যাচাইসাপেক্ষে যুক্ত হবে।"],
  "Power Technology":["পাওয়ার টেকনোলজি","শক্তি উৎপাদন ও পাওয়ার-সম্পর্কিত প্রযুক্তিশিক্ষার ক্ষেত্র। বিস্তারিত তথ্য যাচাইসাপেক্ষে যুক্ত হবে।"],
  "Refrigeration and Air Conditioning (RAC) Technology":["রেফ্রিজারেশন অ্যান্ড এয়ার কন্ডিশনিং (RAC)","শীতলীকরণ ও এয়ার কন্ডিশনিং ব্যবস্থার প্রযুক্তিশিক্ষার ক্ষেত্র। বিস্তারিত তথ্য যাচাইসাপেক্ষে যুক্ত হবে।"],
  "Tourism and Hospitality Management":["ট্যুরিজম অ্যান্ড হসপিটালিটি ম্যানেজমেন্ট","পর্যটন ও আতিথেয়তা ব্যবস্থাপনা-সম্পর্কিত শিক্ষাক্ষেত্র। বিস্তারিত তথ্য যাচাইসাপেক্ষে যুক্ত হবে।"],
  "Mining and Mine Survey Technology":["মাইনিং অ্যান্ড মাইন সার্ভে টেকনোলজি","খনি ও খনি-জরিপ সম্পর্কিত প্রযুক্তিশিক্ষার ক্ষেত্র। বিস্তারিত তথ্য যাচাইসাপেক্ষে যুক্ত হবে।"]
};
function bindDepartmentButtons() {
  $(".dept-more").forEach(button => button.addEventListener("click", () => {
    const item = deptLabels[button.dataset.dept] || [button.dataset.title || "বিভাগের তথ্য","বিভাগের বিস্তারিত তথ্য যাচাই করে পর্যায়ক্রমে যুক্ত করা হবে।"];
    $("#dialog-title").textContent = item[0]; $("#dialog-body").textContent = item[1];
    if (dialog?.showModal) dialog.showModal(); else window.alert(item[0] + "\n" + item[1]);
  }));
}
bindDepartmentButtons();
$("#dialog-close")?.addEventListener("click", () => dialog.close());
dialog?.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function noticeDate(value) {
  if (!value) return {day:"—", month:"তারিখ নেই", full:"তারিখ উল্লেখ নেই"};
  const d = new Date(value + (String(value).length === 10 ? "T00:00:00" : ""));
  if (Number.isNaN(d.getTime())) return {day:"—",month:"তারিখ নেই",full:"তারিখ উল্লেখ নেই"};
  return {day:new Intl.DateTimeFormat("bn-BD",{day:"2-digit"}).format(d),month:new Intl.DateTimeFormat("bn-BD",{month:"short",year:"numeric"}).format(d),full:new Intl.DateTimeFormat("bn-BD",{day:"numeric",month:"long",year:"numeric"}).format(d)};
}
function renderNoticeEmpty(title, detail) {
  $("#notice-list").innerHTML = '<div class="empty-state"><span class="empty-icon">▤</span><h3>'+escapeHtml(title)+'</h3><p>'+escapeHtml(detail)+'</p></div>';
}
async function loadPublicData() {
  if (!isSupabaseConfigured()) {
    renderNoticeEmpty("নোটিশ ডেটাবেজ সংযুক্ত হয়নি","Supabase project URL ও public key কনফিগার করার পর প্রকাশিত নোটিশ এখানে দেখা যাবে।");
    return;
  }
  try {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    try {
      const { data: departments, error: departmentError } = await supabase.from("bgpi_departments").select("name_bn,name_en,description,image_or_icon,display_order").eq("published",true).order("display_order",{ascending:true});
      if (!departmentError && departments?.length) {
        const grid = $("#department-grid");
        deptLabels = Object.fromEntries(departments.map(d => [d.name_en, [d.name_bn, d.description || "বিভাগের বিস্তারিত তথ্য যাচাই করে পর্যায়ক্রমে যুক্ত করা হবে।"]]));
        grid.innerHTML = departments.map((d,i) => '<article class="dept-card"><span class="dept-number">'+String(i+1).padStart(2,"0")+'</span><span class="dept-symbol">'+escapeHtml(d.image_or_icon || "⌘")+'</span><h3>'+escapeHtml(d.name_bn)+'</h3><p>'+escapeHtml(d.name_en)+'</p><button class="dept-more" data-dept="'+escapeHtml(d.name_en)+'" data-title="'+escapeHtml(d.name_bn)+'">বিস্তারিত <span>↗</span></button></article>').join("");
        bindDepartmentButtons();
      }
    } catch (departmentLoadError) { console.warn("BGPI departments could not load; using static fallback.", departmentLoadError); }
    const { data, error } = await supabase.from("bgpi_notices").select("id,title,description,category,publication_date,attachment_url").eq("published",true).order("publication_date",{ascending:false}).limit(8);
    if (error) throw error;
    if (!data?.length) { renderNoticeEmpty("এখনো কোনো নোটিশ প্রকাশিত হয়নি","নতুন নোটিশ প্রকাশিত হলে এখানে দেখা যাবে।"); return; }
    $("#notice-list").innerHTML = data.map(n => {
      const d = noticeDate(n.publication_date);
      const safeUrl = (() => { try { const u = new URL(n.attachment_url); return ["https:","http:"].includes(u.protocol) ? u.href : ""; } catch { return ""; } })();
      return '<article class="notice-row"><div class="notice-date"><b>'+escapeHtml(d.day)+'</b>'+escapeHtml(d.month)+'</div><div><div class="notice-meta">'+escapeHtml(n.category || "সাধারণ নোটিশ")+' · '+escapeHtml(d.full)+'</div><div class="notice-title">'+escapeHtml(n.title)+'</div>'+(n.description?'<div class="muted">'+escapeHtml(n.description)+'</div>':"")+'</div><div class="notice-actions">'+(safeUrl?'<a href="'+escapeHtml(safeUrl)+'" target="_blank" rel="noopener noreferrer">দেখুন ↗</a>':"")+(safeUrl?'<a href="'+escapeHtml(safeUrl)+'" download>ডাউনলোড ↓</a>':"")+'</div></article>';
    }).join("");
  } catch (error) {
    console.error("BGPI notices could not load:", error);
    renderNoticeEmpty("নোটিশ লোড করা যায়নি","সংযোগে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন অথবা অফিসিয়াল নোটিশ আর্কাইভ দেখুন।");
  }
}
loadPublicData();