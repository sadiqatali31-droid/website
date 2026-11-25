const $=s=>document.querySelector(s), money=n=>"Rs. "+Number(n).toLocaleString("en-PK");
async function api(url,options={}){const r=await fetch(url,{headers:{"Content-Type":"application/json",...(options.headers||{})},...options});const d=await r.json();if(!r.ok)throw new Error(d.error||"Request failed");return d;}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function load(){
 const [products,orders]=await Promise.all([api("/api/products"),api("/api/admin/orders")]);
 $("#statOrders").textContent=orders.length;$("#statSales").textContent=money(orders.reduce((s,o)=>s+o.total,0));$("#statProducts").textContent=products.length;
 $("#productRows").innerHTML=products.map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(p.category)}</td><td>${money(p.price)}</td><td>${p.stock}</td><td><button class="secondary" data-edit="${p.id}">Edit</button> <button class="danger" data-delete="${p.id}">Delete</button></td></tr>`).join("")||'<tr><td colspan="5">No products yet.</td></tr>';
 $("#orderRows").innerHTML=orders.map(o=>`<tr><td><b>${esc(o.id)}</b><br><small>${new Date(o.createdAt).toLocaleString()}</small></td><td>${esc(o.customer.name)}<br>${esc(o.customer.phone)}<br>${esc(o.customer.address)}</td><td>${o.items.map(i=>esc(i.name)+" × "+i.quantity).join("<br>")}</td><td>${money(o.total)}<br><small>Payment: ${esc(o.paymentMethod||"Cash on Delivery")}<br>Transaction ID: ${esc(o.paymentReference||"—")}</small></td><td><select data-status="${esc(o.id)}">${["Pending","Confirmed","Processing","Shipped","Delivered","Cancelled"].map(s=>`<option ${s===o.status?"selected":""}>${s}</option>`).join("")}</select></td></tr>`).join("")||'<tr><td colspan="5">No orders yet.</td></tr>';
}
async function showDashboard(){await load();$("#loginPanel").classList.add("hidden");$("#dashboard").classList.remove("hidden");}
$("#loginForm").addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{await api("/api/admin/login",{method:"POST",body:JSON.stringify({username:f.get("username"),password:f.get("password")})});await showDashboard();}catch(err){$("#loginError").textContent=err.message;}});
$("#logout").onclick=async()=>{await api("/api/admin/logout",{method:"POST",body:"{}"});$("#dashboard").classList.add("hidden");$("#loginPanel").classList.remove("hidden");};
$("#productForm").addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const obj=Object.fromEntries(f.entries());obj.price=Number(obj.price);obj.stock=Number(obj.stock);try{await api("/api/admin/products",{method:"POST",body:JSON.stringify(obj)});e.currentTarget.reset();await load();}catch(err){alert(err.message);}});
$("#productRows").addEventListener("click",async e=>{
 const edit=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]");
 if(edit){const p=(await api("/api/products")).find(x=>x.id===edit.dataset.edit);if(!p)return;for(const [k,v] of Object.entries(p)){const el=$("#productForm").elements.namedItem(k);if(el)el.value=v;}window.scrollTo({top:0,behavior:"smooth"});}
 if(del&&confirm("Delete this product?")){try{await api("/api/admin/products/"+encodeURIComponent(del.dataset.delete),{method:"DELETE"});await load();}catch(err){alert(err.message);}}
});
$("#orderRows").addEventListener("change",async e=>{const s=e.target.closest("[data-status]");if(!s)return;try{await api("/api/admin/orders/"+encodeURIComponent(s.dataset.status),{method:"PATCH",body:JSON.stringify({status:s.value})});}catch(err){alert(err.message);}});
$("#clearProduct").onclick=()=>$("#productForm").reset();
