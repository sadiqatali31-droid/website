const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "izzatkahtoon110";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "amjadbaba78780";
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, "public");
const DATA = path.join(ROOT, "data");
const ORDERS_FILE = path.join(DATA, "orders.json");
const PRODUCTS_FILE = path.join(DATA, "products.json");
const sessions = new Set();

if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, "[]");
if (!fs.existsSync(PRODUCTS_FILE)) {
  const seed = [
    {id:"p1",name:"Elegant Handbag",category:"Bags",price:3499,stock:12,description:"A timeless everyday handbag with a polished finish.",image:"https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=900"},
    {id:"p2",name:"Classic Ladies Watch",category:"Accessories",price:4299,stock:8,description:"A refined watch for everyday style.",image:"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900"},
    {id:"p3",name:"Premium Sunglasses",category:"Accessories",price:1999,stock:20,description:"A stylish finishing touch for sunny days.",image:"https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=900"},
    {id:"p4",name:"Luxury Gift Set",category:"Gifts",price:2799,stock:10,description:"A thoughtful gift, beautifully presented.",image:"https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=900"}
  ];
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(seed, null, 2));
}
function read(file) { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return []; } }
function write(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }
function send(res, code, data, headers={}) {
  res.writeHead(code, {"Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store", ...headers});
  res.end(JSON.stringify(data));
}
function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || "").split(";").filter(Boolean).map(v => {
    const i=v.indexOf("="); return [v.slice(0,i).trim(), decodeURIComponent(v.slice(i+1).trim())];
  }));
}
function body(req) {
  return new Promise((resolve,reject) => {
    let raw=""; req.on("data", c => { raw += c; if(raw.length > 1e6) req.destroy(); });
    req.on("end", () => { try { resolve(JSON.parse(raw || "{}")); } catch(e) { reject(e); } });
    req.on("error", reject);
  });
}
function isAdmin(req) { const token=parseCookies(req).ik_session; return !!token && sessions.has(token); }
function safeEqual(a,b) {
  const x=Buffer.from(String(a)), y=Buffer.from(String(b));
  return x.length===y.length && crypto.timingSafeEqual(x,y);
}
const server = http.createServer(async (req,res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      if (req.method==="GET" && url.pathname==="/api/products") return send(res,200,read(PRODUCTS_FILE));
      if (req.method==="POST" && url.pathname==="/api/orders") {
        const b=await body(req);
        if (!b.customer || !b.customer.name || !b.customer.phone || !Array.isArray(b.items) || !b.items.length)
          return send(res,400,{error:"Please provide your name, phone and at least one item."});
        const products=read(PRODUCTS_FILE);
        const items=[];
        for (const item of b.items) {
          const p=products.find(x=>x.id===item.id);
          const qty=Math.max(1,Math.min(99,Number(item.quantity)||1));
          if (!p) return send(res,400,{error:"A product in your cart is no longer available."});
          if (p.stock < qty) return send(res,400,{error:`Only ${p.stock} item(s) left for ${p.name}.`});
          items.push({id:p.id,name:p.name,price:p.price,quantity:qty});
        }
        const total=items.reduce((s,x)=>s+x.price*x.quantity,0);
        const orders=read(ORDERS_FILE);
        const order={id:"IK"+Date.now().toString().slice(-8),createdAt:new Date().toISOString(),
          customer:{name:String(b.customer.name).slice(0,100),phone:String(b.customer.phone).slice(0,30),address:String(b.customer.address||"").slice(0,500)},
          paymentMethod:["JazzCash","Cash on Delivery"].includes(b.paymentMethod) ? b.paymentMethod : "Cash on Delivery",
          paymentReference:String(b.paymentReference||"").slice(0,100),
          items,total,status:"Pending"};
        orders.unshift(order); write(ORDERS_FILE,orders);
        for (const item of items) { const p=products.find(x=>x.id===item.id); p.stock-=item.quantity; }
        write(PRODUCTS_FILE,products);
        return send(res,201,{order});
      }
      if (req.method==="GET" && url.pathname==="/api/track") {
        const id=(url.searchParams.get("id")||"").trim().toUpperCase();
        const order=read(ORDERS_FILE).find(o=>o.id.toUpperCase()===id);
        return order ? send(res,200,{id:order.id,status:order.status,createdAt:order.createdAt,items:order.items,total:order.total})
                     : send(res,404,{error:"Order not found. Check the order ID and try again."});
      }
      if (req.method==="POST" && url.pathname==="/api/admin/login") {
        const b=await body(req);
        if (b.username!==ADMIN_USERNAME || !safeEqual(b.password,ADMIN_PASSWORD)) return send(res,401,{error:"Incorrect username or password."});
        const token=crypto.randomBytes(32).toString("hex"); sessions.add(token);
        return send(res,200,{ok:true},{ "Set-Cookie":`ik_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800` });
      }
      if (req.method==="POST" && url.pathname==="/api/admin/logout") {
        const token=parseCookies(req).ik_session; if(token) sessions.delete(token);
        return send(res,200,{ok:true},{ "Set-Cookie":"ik_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0" });
      }
      if (!isAdmin(req)) return send(res,401,{error:"Please log in as admin."});
      if (req.method==="GET" && url.pathname==="/api/admin/orders") return send(res,200,read(ORDERS_FILE));
      if (req.method==="PATCH" && url.pathname.startsWith("/api/admin/orders/")) {
        const id=decodeURIComponent(url.pathname.split("/").pop());
        const b=await body(req), orders=read(ORDERS_FILE), order=orders.find(o=>o.id===id);
        if(!order) return send(res,404,{error:"Order not found."});
        if(!["Pending","Confirmed","Processing","Shipped","Delivered","Cancelled"].includes(b.status)) return send(res,400,{error:"Invalid status."});
        order.status=b.status; write(ORDERS_FILE,orders); return send(res,200,{order});
      }
      if (url.pathname==="/api/admin/products" && req.method==="POST") {
        const b=await body(req), products=read(PRODUCTS_FILE);
        const product={id:b.id||"p"+crypto.randomBytes(5).toString("hex"),name:String(b.name||"").slice(0,100),
          category:String(b.category||"General").slice(0,60),price:Math.max(0,Number(b.price)||0),
          stock:Math.max(0,Math.floor(Number(b.stock)||0)),description:String(b.description||"").slice(0,1000),
          image:String(b.image||"").slice(0,1000)};
        if(!product.name || !product.price) return send(res,400,{error:"Product name and price are required."});
        const idx=products.findIndex(x=>x.id===product.id);
        if(idx>=0) products[idx]=product; else products.unshift(product);
        write(PRODUCTS_FILE,products); return send(res,200,{product});
      }
      if (url.pathname.startsWith("/api/admin/products/") && req.method==="DELETE") {
        const id=decodeURIComponent(url.pathname.split("/").pop());
        write(PRODUCTS_FILE,read(PRODUCTS_FILE).filter(p=>p.id!==id)); return send(res,200,{ok:true});
      }
      return send(res,404,{error:"API route not found."});
    }
    let file=url.pathname==="/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
    const full=path.resolve(PUBLIC,file);
    if(!full.startsWith(PUBLIC+path.sep) && full!==path.join(PUBLIC,"index.html")) return send(res,403,{error:"Forbidden"});
    fs.readFile(full,(err,data)=>{
      if(err) { res.writeHead(404,{"Content-Type":"text/plain"}); return res.end("Page not found"); }
      const ext=path.extname(full);
      const types={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".png":"image/png",".jpg":"image/jpeg",".svg":"image/svg+xml"};
      res.writeHead(200,{"Content-Type":types[ext]||"application/octet-stream"}); res.end(data);
    });
  } catch(e) { send(res,500,{error:"Server error. Please try again."}); }
});
server.listen(PORT,()=>console.log(`Izzat Khatoon store running at http://localhost:${PORT}`));
