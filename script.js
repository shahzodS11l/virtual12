const products = [
  { id: "uz-rent", country: "Uzbekistan", type: "rent", duration: "7 kun", price: 8, stock: 12, note: "Biznes uchun ijara raqam" },
  { id: "us-one",  country: "USA",        type: "one",  duration: "1 martalik", price: 2, stock: 45, note: "Bir martalik (legal)" },
  { id: "uk-rent", country: "UK",         type: "rent", duration: "30 kun", price: 15, stock: 8, note: "Ijara raqam" },
  { id: "tr-one",  country: "Turkey",     type: "one",  duration: "1 martalik", price: 2.5, stock: 30, note: "Bir martalik" },
  { id: "kz-rent", country: "Kazakhstan", type: "rent", duration: "14 kun", price: 9, stock: 10, note: "Ijara raqam" },
  { id: "de-one",  country: "Germany",    type: "one",  duration: "1 martalik", price: 3, stock: 20, note: "Bir martalik" },
];

const $ = (s) => document.querySelector(s);
const grid = $("#productGrid");
const search = $("#search");
const filterType = $("#filterType");
const cartCount = $("#cartCount");
const cartModal = $("#cartModal");
const checkoutModal = $("#checkoutModal");
const policyModal = $("#policyModal");
const cartItems = $("#cartItems");
const cartTotal = $("#cartTotal");
const toast = $("#toast");

const cart = new Map(); // id -> qty

function money(n){ return `$${Number(n).toFixed(2)}`; }
function typeLabel(t){ return t === "rent" ? "Ijara" : "Bir martalik"; }

function renderDeal(){
  const deal = products[Math.floor(Math.random()*products.length)];
  $("#dealText").textContent = `${deal.country} • ${typeLabel(deal.type)} • ${money(deal.price)}`;
}

function renderProducts(){
  const q = search.value.trim().toLowerCase();
  const ft = filterType.value;

  const list = products.filter(p => {
    const okQ = !q || `${p.country} ${p.note} ${p.duration}`.toLowerCase().includes(q);
    const okT = ft === "all" || p.type === ft;
    return okQ && okT;
  });

  grid.innerHTML = list.map(p => `
    <article class="product">
      <div class="tag">🌍 ${p.country} • ${typeLabel(p.type)}</div>
      <div class="pName">${p.country} raqam</div>
      <div class="pMeta">
        <span>⏳ ${p.duration}</span>
        <span>📦 Mavjud: ${p.stock}</span>
      </div>
      <div class="small" style="margin-top:8px;">${p.note}</div>

      <div class="priceRow">
        <div>
          <div class="price">${money(p.price)}</div>
          <div class="small">Narx namuna</div>
        </div>
        <button class="btn" data-add="${p.id}">Savatga</button>
      </div>
    </article>
  `).join("");

  grid.querySelectorAll("[data-add]").forEach(btn => {
    btn.addEventListener("click", () => addToCart(btn.dataset.add));
  });
}

function addToCart(id){
  const p = products.find(x => x.id === id);
  if(!p) return;
  const current = cart.get(id) || 0;
  if(current >= p.stock){
    showToast("Kechirasiz, zaxira tugadi yoki limitga yetdi.");
    return;
  }
  cart.set(id, current + 1);
  updateCartUI();
  showToast("Savatga qo‘shildi ✅");
}

function updateCartUI(){
  const count = Array.from(cart.values()).reduce((a,b)=>a+b,0);
  cartCount.textContent = String(count);

  const items = Array.from(cart.entries()).map(([id, qty]) => {
    const p = products.find(x => x.id === id);
    return { ...p, qty, line: p.price * qty };
  });

  if(items.length === 0){
    cartItems.innerHTML = `<div class="muted">Savat bo‘sh.</div>`;
    cartTotal.textContent = "$0";
    return;
  }

  cartItems.innerHTML = items.map(it => `
    <div class="cartItem">
      <div class="cartLeft">
        <div class="cartTitle">${it.country} • ${typeLabel(it.type)}</div>
        <div class="cartSub">${it.duration} • ${money(it.price)} x ${it.qty} = ${money(it.line)}</div>
      </div>
      <div class="cartRight">
        <button class="qtyBtn" data-dec="${it.id}">−</button>
        <div style="min-width:22px; text-align:center; font-weight:800;">${it.qty}</div>
        <button class="qtyBtn" data-inc="${it.id}">+</button>
      </div>
    </div>
  `).join("");

  const total = items.reduce((s,it)=>s+it.line,0);
  cartTotal.textContent = money(total);

  cartItems.querySelectorAll("[data-inc]").forEach(b => b.addEventListener("click", ()=> addToCart(b.dataset.inc)));
  cartItems.querySelectorAll("[data-dec]").forEach(b => b.addEventListener("click", ()=> decFromCart(b.dataset.dec)));
}

function decFromCart(id){
  const current = cart.get(id) || 0;
  if(current <= 1) cart.delete(id);
  else cart.set(id, current - 1);
  updateCartUI();
}

function clearCart(){
  cart.clear();
  updateCartUI();
}

function openModal(el){ el.classList.add("show"); el.setAttribute("aria-hidden","false"); }
function closeModal(el){ el.classList.remove("show"); el.setAttribute("aria-hidden","true"); }

function showToast(text){
  toast.hidden = false;
  toast.textContent = text;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> toast.hidden = true, 5200);
}

function buildOrderText(formData){
  const items = Array.from(cart.entries()).map(([id, qty]) => {
    const p = products.find(x => x.id === id);
    return `- ${p.country} • ${typeLabel(p.type)} • ${p.duration} x${qty} = ${money(p.price*qty)}`;
  }).join("\n");

  const total = Array.from(cart.entries()).reduce((sum,[id,qty])=>{
    const p = products.find(x => x.id === id);
    return sum + p.price * qty;
  },0);

  return [
    "🧾 BUYURTMA",
    `Ism: ${formData.get("name")}`,
    `Kontakt: ${formData.get("contact")}`,
    `Maqsad: ${formData.get("purpose")}`,
    `Izoh: ${formData.get("note") || "-"}`,
    "",
    "📦 Tanlanganlar:",
    items || "-",
    "",
    `Jami: ${money(total)}`,
    "",
    "⚠️ Eslatma: Faqat qonuniy foydalanish. Zarurat bo‘lsa KYC talab qilinishi mumkin."
  ].join("\n");
}

// EVENTS
$("#btnCart").addEventListener("click", ()=> openModal(cartModal));
$("#closeCart").addEventListener("click", ()=> closeModal(cartModal));
$("#clearCart").addEventListener("click", clearCart);

$("#checkout").addEventListener("click", ()=>{
  if(cart.size === 0){
    showToast("Avval savatga mahsulot qo‘shing.");
    return;
  }
  closeModal(cartModal);
  openModal(checkoutModal);
});

$("#closeCheckout").addEventListener("click", ()=> closeModal(checkoutModal));
$("#backToCart").addEventListener("click", ()=>{
  closeModal(checkoutModal);
  openModal(cartModal);
});

$("#btnPolicy").addEventListener("click", ()=> openModal(policyModal));
$("#closePolicy").addEventListener("click", ()=> closeModal(policyModal));
$("#okPolicy").addEventListener("click", ()=> closeModal(policyModal));

search.addEventListener("input", renderProducts);
filterType.addEventListener("change", renderProducts);

$("#orderForm").addEventListener("submit", (e)=>{
  e.preventDefault();
  if(cart.size === 0){
    showToast("Savat bo‘sh. Buyurtma yuborib bo‘lmaydi.");
    return;
  }
  const fd = new FormData(e.target);
  const text = buildOrderText(fd);

  // Bu demo: server yo‘q. Matnni foydalanuvchiga chiqaramiz.
  closeModal(checkoutModal);
  openModal(cartModal);
  showToast(text);

  // xohlasangiz: avtomatik copy
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(()=>{});
  }
});

// close modals by clicking outside
[cartModal, checkoutModal, policyModal].forEach(m => {
  m.addEventListener("click", (e)=>{
    if(e.target === m) closeModal(m);
  });
});

// INIT
renderDeal();
renderProducts();
updateCartUI();