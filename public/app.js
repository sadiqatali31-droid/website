const STORE_WHATSAPP = "923302761265"; // Pakistan country code + number, without leading zero
const $ = s => document.querySelector(s);
let products=[], cart=JSON.parse(localStorage.getItem("ik_cart")||"[]"), wishlist=JSON.parse(localStorage.getItem("ik_wishlist")||"[]");
const money = n => "Rs. " + Number(n).toLocaleString("en-PK");
async function api(url, options={}) {
  const res=await fetch(url,{headers:{"Content-Type":"application/json",...(options.headers||{})},...options});
  const data=await res.json(); if(!res.ok) throw new Error(data.error||"Something went wrong"); return data;
}
function persist(){localStorage.setItem("ik_cart",JSON.stringify(cart));localStorage.setItem("ik_wishlist",JSON.stringify(wishlist));updateCounts();}
function updateCounts(){$("#cartCount").textContent=cart.reduce((s,x)=>s+x.quantity,0);$("#wishCount").textContent=wishlist.length;}
function productCard(p){return `<article class="product-card"><div class="product-image"><img src="${escapeHtml(p.image||"")}" alt="${escapeHtml(p.name)}" onerror="this.src='https://placehold.co/600x600/f4ead8/8c6936?text=Izzat+Khatoon'"><button class="wish" data-wish="${p.id}" aria-label="Add to wishlist">${wishlist.includes(p.id)?"♥":"♡"}</button></div><div class="product-info"><small>${escapeHtml(p.category)}</small><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.description||"")}</p><div class="product-bottom"><span class="price">${money(p.price)}</span><button class="add-btn" data-add="${p.id}">ADD TO BAG</button></div></div></article>`;}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function renderProducts(){
 const term=$("#search").value.toLowerCase(), cat=$("#category").value, sort=$("#sort").value;
 let list=products.filter(p=>(p.name+" "+p.category+" "+p.description).toLowerCase().includes(term)&&(!cat||p.category===cat));
 if(sort==="low")list.sort((a,b)=>a.price-b.price); if(sort==="high")list.sort((a,b)=>b.price-a.price);
 $("#products").innerHTML=list.length?list.map(productCard).join(""):'<p class="empty">No products found. Try another search.</p>';
}
function renderCart(){
 const area=$("#cartItems");
 if(!cart.length){area.innerHTML='<p class="empty">Your bag is waiting for something lovely.</p>';$("#cartTotal").textContent=money(0);return;}
 area.innerHTML=cart.map(item=>{const p=products.find(x=>x.id===item.id);if(!p)return "";return `<div class="cart-row"><img src="${escapeHtml(p.image)}" alt=""><div><b>${escapeHtml(p.name)}</b><div>${money(p.price)}</div><div class="qty"><button data-qty="${p.id}" data-delta="-1">−</button>${item.quantity}<button data-qty="${p.id}" data-delta="1">+</button></div></div><button class="close" data-remove="${p.id}">×</button></div>`}).join("");
 $("#cartTotal").textContent=money(cart.reduce((s,x)=>s+(products.find(p=>p.id===x.id)?.price||0)*x.quantity,0));
}
function openCart(){$("#cartDrawer").classList.add("open");$("#backdrop").classList.add("show");renderCart();}
function closeCart(){$("#cartDrawer").classList.remove("open");$("#backdrop").classList.remove("show");}
const ADDRESS_KEY="ik_address_book";
function loadAddressBook(){
 const book=JSON.parse(localStorage.getItem(ADDRESS_KEY)||"[]");
 $("#savedAddress").innerHTML='<option value="">Enter a new address</option>'+book.map((x,i)=>`<option value="${i}">${escapeHtml(x.label||("Saved address "+(i+1)))}</option>`).join("");
}
$("#savedAddress").addEventListener("change",()=>{
 const book=JSON.parse(localStorage.getItem(ADDRESS_KEY)||"[]"), item=book[Number($("#savedAddress").value)];
 if(item){$("#checkoutForm").elements.namedItem("name").value=item.name;$("#checkoutForm").elements.namedItem("phone").value=item.phone;$("#checkoutForm").elements.namedItem("address").value=item.address;}
});
$("#paymentMethod").addEventListener("change",()=>{
 const jazz=$("#paymentMethod").value==="JazzCash";
 $("#jazzcashInfo").classList.toggle("hidden",!jazz);
 $("#jazzcashInfo").querySelector('[name="paymentReference"]').required=jazz;
});
async function init(){
 $("#year").textContent=new Date().getFullYear();$("#contactNumber").href="https://wa.me/"+STORE_WHATSAPP;
 loadAddressBook();
 try{products=await api("/api/products");const cats=[...new Set(products.map(p=>p.category))];$("#category").innerHTML='<option value="">All categories</option>'+cats.map(c=>`<option>${escapeHtml(c)}</option>`).join("");renderProducts();}catch(e){$("#products").textContent=e.message;}
 updateCounts();
}
["search","category","sort"].forEach(id=>$("#"+id).addEventListener("input",renderProducts));
$("#products").addEventListener("click",e=>{
 const add=e.target.closest("[data-add]");const wish=e.target.closest("[data-wish]");
 if(add){const p=products.find(x=>x.id===add.dataset.add);if(!p)return;const found=cart.find(x=>x.id===p.id);if(found)found.quantity=Math.min(99,found.quantity+1);else cart.push({id:p.id,quantity:1});persist();add.textContent="ADDED";setTimeout(()=>add.textContent="ADD TO BAG",900);}
 if(wish){const id=wish.dataset.wish;wishlist=wishlist.includes(id)?wishlist.filter(x=>x!==id):[...wishlist,id];persist();renderProducts();}
});
$("#cartBtn").onclick=openCart;$("#closeCart").onclick=closeCart;$("#backdrop").onclick=closeCart;
$("#cartItems").addEventListener("click",e=>{
 const q=e.target.closest("[data-qty]"),r=e.target.closest("[data-remove]");
 if(q){const item=cart.find(x=>x.id===q.dataset.qty);item.quantity+=Number(q.dataset.delta);if(item.quantity<1)cart=cart.filter(x=>x!==item);persist();renderCart();}
 if(r){cart=cart.filter(x=>x.id!==r.dataset.remove);persist();renderCart();}
});
$("#wishlistBtn").onclick=()=>{const saved=products.filter(p=>wishlist.includes(p.id));$("#search").value="";$("#category").value="";$("#products").innerHTML=saved.length?saved.map(productCard).join(""):'<p class="empty">Your wishlist is empty.</p>';$("#shop").scrollIntoView();};
$("#checkoutBtn").onclick=()=>{if(!cart.length)return;$("#checkoutTotal").textContent=$("#cartTotal").textContent;$("#checkoutDialog").showModal();};
$("#closeCheckout").onclick=()=>$("#checkoutDialog").close();
$("#checkoutForm").addEventListener("submit",async e=>{
 e.preventDefault();const f=new FormData(e.currentTarget),items=cart.map(x=>({id:x.id,quantity:x.quantity}));
 const button=e.submitter;button.disabled=true;button.textContent="PLACING ORDER…";
 try{
  const customer={name:f.get("name"),phone:f.get("phone"),address:f.get("address")};
  if($("#saveAddress").checked){
    const book=JSON.parse(localStorage.getItem(ADDRESS_KEY)||"[]");
    const entry={...customer,label:customer.address.trim().slice(0,35)||"Saved address"};
    const existing=book.findIndex(x=>x.address===customer.address);
    if(existing>=0)book[existing]=entry;else book.unshift(entry);
    localStorage.setItem(ADDRESS_KEY,JSON.stringify(book.slice(0,10)));
  }
  const paymentMethod=f.get("paymentMethod"), paymentReference=f.get("paymentReference")||"";
  const result=await api("/api/orders",{method:"POST",body:JSON.stringify({customer,items,paymentMethod,paymentReference})});
  const o=result.order;const lines=o.items.map(x=>`• ${x.name} x${x.quantity} — ${money(x.price*x.quantity)}`).join("\n");
  const msg=`New order ${o.id}\nName: ${o.customer.name}\nPhone: ${o.customer.phone}\nAddress: ${o.customer.address}\nPayment: ${o.paymentMethod||"Cash on Delivery"}\nTransaction ID: ${o.paymentReference||"Not provided"}\n\n${lines}\n\nTotal: ${money(o.total)}`;
  cart=[];persist();closeCart();$("#checkoutDialog").close();e.currentTarget.reset();
  $("#trackId").value=o.id;$("#trackResult").textContent=`Order ${o.id} placed successfully. Your order is saved. WhatsApp will open so you can send the details to the store.`;
  window.open("https://wa.me/"+STORE_WHATSAPP+"?text="+encodeURIComponent(msg),"_blank");
  document.querySelector("#tracking").scrollIntoView({behavior:"smooth"});
 }catch(err){$("#checkoutMessage").textContent=err.message;}finally{button.disabled=false;button.textContent="PLACE ORDER";}
});
$("#trackForm").addEventListener("submit",async e=>{e.preventDefault();$("#trackResult").textContent="Checking…";try{const o=await api("/api/track?id="+encodeURIComponent($("#trackId").value));$("#trackResult").innerHTML=`<b>${escapeHtml(o.id)}</b> — Status: <b>${escapeHtml(o.status)}</b><br>Total: ${money(o.total)}<br>${o.items.map(x=>escapeHtml(x.name)+" × "+x.quantity).join(", ")}`;}catch(err){$("#trackResult").textContent=err.message;}});
init();
