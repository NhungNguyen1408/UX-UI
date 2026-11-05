import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, ShoppingBag, Heart, UserRound, House, LayoutGrid, ArrowLeft, Minus, Plus, Trash2, ChevronRight, Package, LogOut, ShieldCheck, MapPin, CheckCircle2, SlidersHorizontal } from 'lucide-react';
import { request, VND } from './api.js';
import './styles.css';

const S = ({ children, className = '' }) => <section className={className}>{children}</section>;
const categoriesEmoji = ['✨','💄','☀️','🧴'];
const productSymbol = id => ({1:'💧',2:'🧪',3:'🫧',4:'🍊',5:'🌸',6:'☀️'}[id] || '🧴');

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('beautyglow_token') || '');
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('home');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [priceBand, setPriceBand] = useState('all');
  const [detail, setDetail] = useState(null);
  const [cart, setCart] = useState({ items: [], subtotal_vnd: 0 });
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [chosenOrder, setChosenOrder] = useState(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [registerMode, setRegisterMode] = useState(false);
  const [authForm, setAuthForm] = useState({ full_name: '', email: '', password: '' });
  const [newAddress, setNewAddress] = useState({ recipient_name: '', phone: '', street_address: '', ward: '', city: '' });
  const [chosenAddressId, setChosenAddressId] = useState('');
  const [payment, setPayment] = useState('COD');
  const [coupon, setCoupon] = useState('');
  const [lastOrder, setLastOrder] = useState(null);
  const [error, setError] = useState('');

  const call = (path, options = {}) => request(path, { ...options, token });
  const success = msg => { setNotice(msg); setError(''); };
  const failure = e => { setError(e.message || String(e)); setNotice(''); };
  async function refreshPrivate(t = token) {
    if (!t) return;
    const load = (p, cb) => request(p, { token: t }).then(cb).catch(failure);
    await Promise.all([load('/cart', setCart), load('/addresses', a => { setAddresses(a); setChosenAddressId(prev => prev || String(a[0]?.id || '')); }), load('/orders', setOrders), load('/favorites', setFavorites)]);
  }
  useEffect(() => {
    request('/categories').then(setCategories).catch(failure);
  }, []);
  useEffect(() => {
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    if (category) query.set('category_id', category);
    if (priceBand !== 'all') { query.set('min_price','200000'); query.set('max_price','500000'); }
    request('/products?' + query.toString()).then(setProducts).catch(failure);
  }, [search, category, priceBand]);
  useEffect(() => {
    if (!token) { setUser(null); setCart({ items:[],subtotal_vnd:0 }); setOrders([]); setAddresses([]); setFavorites([]); return; }
    request('/auth/me', { token }).then(setUser).catch(() => { localStorage.removeItem('beautyglow_token'); setToken(''); });
    refreshPrivate(token);
  }, [token]);

  function go(next) { setDetail(null); setChosenOrder(null); setTab(next); setNotice(''); setError(''); if (token && ['cart','orders','checkout','favorites','account'].includes(next)) refreshPrivate(); }
  function requireLogin(action) { if (!token) { setTab('login'); success('Vui lòng đăng nhập để sử dụng chức năng này.'); return false; } return true; }
  async function authSubmit(ev) {
    ev.preventDefault();setBusy(true);setError('');
    try {
      const path = registerMode ? '/auth/register' : '/auth/login';
      const data = await request(path, { method:'POST', body:authForm });
      localStorage.setItem('beautyglow_token',data.token); setToken(data.token); setUser(data.user); setTab('home');
      success(`Xin chào ${data.user.full_name}!`);
    } catch(e){failure(e)}finally{setBusy(false)}
  }
  async function addCart(product) {
    if (!requireLogin()) return;
    try { await call('/cart', { method:'POST', body:{ product_id:product.id,quantity:1 }}); await refreshPrivate(); success(`Đã thêm ${product.name} vào giỏ hàng.`); }
    catch(e){failure(e)}
  }
  async function changeQty(item, delta) {
    try {
      if (item.quantity + delta <= 0) await call(`/cart/${item.product_id}`,{method:'DELETE'});
      else await call(`/cart/${item.product_id}`,{method:'PATCH',body:{quantity:item.quantity+delta}});
      await refreshPrivate();
    } catch(e){failure(e)}
  }
  async function saveAddress(e) {
    e.preventDefault();setBusy(true);
    try { const data=await call('/addresses',{method:'POST',body:newAddress}); await refreshPrivate();setChosenAddressId(String(data.id));success('Đã lưu địa chỉ giao hàng.'); }
    catch(e){failure(e)}finally{setBusy(false)}
  }
  async function placeOrder(e) {
    e.preventDefault();if(!chosenAddressId)return failure(new Error('Hãy thêm địa chỉ nhận hàng trước.'));
    setBusy(true);
    try {
      const order=await call('/orders',{method:'POST',body:{address_id:Number(chosenAddressId),payment_method:payment,coupon_code:coupon}});
      setLastOrder(order);setTab('success');await refreshPrivate();success('Đặt hàng thành công!');
    } catch(e){failure(e)}finally{setBusy(false)}
  }
  async function viewOrder(id) { try {setChosenOrder(await call(`/orders/${id}`));setTab('orderDetail');}catch(e){failure(e)} }
  async function toggleFavorite(product) {
    if (!requireLogin())return;
    const exists=favorites.some(x=>x.id===product.id);
    try { await call(`/favorites/${product.id}`,{method:exists?'DELETE':'POST'});await refreshPrivate();success(exists?'Đã bỏ yêu thích.':'Đã thêm yêu thích.'); }
    catch(e){failure(e)}
  }
  function logout() { localStorage.removeItem('beautyglow_token');setToken('');setUser(null);setTab('home');success('Đã đăng xuất.'); }
  const cartCount=cart.items.reduce((s,x)=>s+x.quantity,0);
  const shipping=20000;
  const discount=(coupon.trim().toUpperCase()==='BG50'&&cart.subtotal_vnd>=500000)?50000:0;
  const estimate=cart.subtotal_vnd-discount+shipping;
  const headerTitle={home:'BeautyGlow',products:'Khám phá',cart:'Giỏ hàng',checkout:'Thanh toán',orders:'Đơn hàng',account:'Tài khoản',favorites:'Yêu thích',login:registerMode?'Tạo tài khoản':'Đăng nhập',success:'Đặt hàng thành công',orderDetail:'Chi tiết đơn hàng',detail:'Chi tiết sản phẩm'}[tab]||'BeautyGlow';
  const productCard = p => (
    <article className="product-card" key={p.id}>
      <button className="product-picture" onClick={()=>{setDetail(p);setTab('detail')}} aria-label={'Xem '+p.name}>
        <img src={p.image_url || '/assets/cream.svg'} alt={'Minh họa '+p.name} />
      </button>
      <div className="product-copy"><small>{p.brand || 'BeautyGlow'}</small>
        <button className="product-name" onClick={()=>{setDetail(p);setTab('detail')}}>{p.name}</button>
        <div className="prices"><strong>{VND(p.price_vnd)}</strong>{p.original_price_vnd > p.price_vnd && <del>{VND(p.original_price_vnd)}</del>}</div>
        <div className="card-actions"><button onClick={()=>addCart(p)} className="tiny-primary">+ Giỏ hàng</button>
          <button aria-label="Yêu thích" className="icon-button" onClick={()=>toggleFavorite(p)}><Heart size={18} fill={favorites.some(x=>x.id===p.id)?'#e25387':'none'}/></button></div>
      </div>
    </article>
  );
  return <div className="shell">
    <div className="phone">
      <header className="topbar"><div className="brand-mark">✦</div><strong>{headerTitle}</strong><button className="header-cart" aria-label="Giỏ hàng" onClick={()=>go('cart')}><ShoppingBag size={23}/>{cartCount>0&&<span>{cartCount}</span>}</button></header>
      {(notice||error)&&<div role="status" className={'toast '+(error?'bad':'good')}>{error||notice}<button aria-label="Đóng" onClick={()=>{setNotice('');setError('')}}>×</button></div>}
      <main className="content" key={tab}>
      {['home','products'].includes(tab)&&<>
        {tab==='home'&&<div className="hero"><span className="eyebrow">BEAUTYGLOW · BEAUTY STORE</span><h1>Làn da rạng rỡ<br/>mỗi ngày ✨</h1><p>Khám phá mỹ phẩm và chăm sóc da cùng BeautyGlow.</p><button onClick={()=>go('products')}>Khám phá ngay <ChevronRight size={16}/></button><div className="hero-icon">🌷</div></div>}
        <div className="searchbox"><Search size={19}/><input aria-label="Tìm sản phẩm" placeholder="Tìm sản phẩm, thương hiệu..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
        <div className="filters"><div className="section-title"><strong>Danh mục</strong><span>{products.length} sản phẩm</span></div>
          <div className="pills"><button className={!category?'active':''} onClick={()=>setCategory('')}>Tất cả</button>{categories.map((c,i)=><button key={c.id} className={String(category)===String(c.id)?'active':''} onClick={()=>setCategory(String(c.id))}>{categoriesEmoji[i]||'🧴'} {c.name}</button>)}</div>
          <div className="section-title"><strong><SlidersHorizontal size={17}/> Bộ lọc giá</strong><button className="link" onClick={()=>{setPriceBand('all');setCategory('');setSearch('')}}>Đặt lại</button></div>
          <div className="pills"><button className={priceBand==='all'?'active':''} onClick={()=>setPriceBand('all')}>Tất cả</button><button className={priceBand==='200-500'?'active':''} onClick={()=>setPriceBand('200-500')}>200k–500k</button></div>
        </div>
        <div className="section-title"><strong>💗 Sản phẩm nổi bật</strong><span>BeautyGlow</span></div>
        <div className="product-grid">{products.length?products.map(productCard):<p className="muted">Không tìm thấy sản phẩm theo bộ lọc.</p>}</div>
      </>}
      {tab==='detail'&&detail&&<><button className="back" onClick={()=>go('products')}><ArrowLeft size={18}/> Sản phẩm</button><div className="detail-img"><img src={detail.image_url} alt={'Minh họa '+detail.name}/></div><div className="detail-content"><small>{detail.brand}</small><h2>{detail.name}</h2><h3>{VND(detail.price_vnd)}</h3><p>{detail.description||'Sản phẩm chăm sóc sắc đẹp.'}</p><p>⭐ 4.8 · Còn {detail.stock} sản phẩm</p><button className="primary full" onClick={()=>addCart(detail)}><ShoppingBag size={18}/> Thêm vào giỏ hàng</button></div></>}
      {tab==='login'&&<div className="auth"><div className="auth-symbol">✦</div><h2>{registerMode?'Tạo tài khoản BeautyGlow':'Chào mừng quay lại'}</h2><p>Đăng nhập để lưu giỏ hàng và theo dõi đơn.</p><form onSubmit={authSubmit}>
        {registerMode&&<label>Họ và tên<input value={authForm.full_name} onChange={e=>setAuthForm({...authForm,full_name:e.target.value})} required placeholder="Họ và tên" /></label>}
        <label>Email<input type="email" required placeholder="email@example.com" value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})}/></label>
        <label>Mật khẩu<input type="password" required minLength={8} placeholder="Ít nhất 8 ký tự" value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})}/></label>
        <button disabled={busy} className="primary full">{registerMode?'Đăng ký':'Đăng nhập'}</button>
      </form><button className="link" onClick={()=>setRegisterMode(!registerMode)}>{registerMode?'Đã có tài khoản? Đăng nhập':'Chưa có tài khoản? Đăng ký ngay'}</button><div className="demo-hint">Tài khoản mẫu: <b>demo@beautyglow.local</b><br/>Mật khẩu: <b>BeautyGlow123!</b></div></div>}
      {tab==='cart'&&<><div className="section-title"><strong>{cartCount} sản phẩm</strong><span>Dữ liệu lưu trong MySQL</span></div>{!token?<div className="empty"><ShoppingBag size={43}/><p>Hãy đăng nhập để xem giỏ hàng.</p><button className="primary" onClick={()=>go('login')}>Đăng nhập</button></div>:!cart.items.length?<div className="empty"><ShoppingBag size={43}/><h2>Giỏ hàng trống</h2><p>Thêm vài món xinh xắn nha!</p><button className="primary" onClick={()=>go('products')}>Tiếp tục mua sắm</button></div>:<><div className="cart-list">{cart.items.map(item=><div className="cart-item" key={item.product_id}><img src={item.image_url} alt={'Minh họa '+item.name}/><div><b>{item.name}</b><strong>{VND(item.price_vnd)}</strong><div className="quantity"><button onClick={()=>changeQty(item,-1)}><Minus size={14}/></button><span>{item.quantity}</span><button onClick={()=>changeQty(item,1)}><Plus size={14}/></button></div></div><button className="icon-button delete" aria-label="Xóa" onClick={()=>changeQty(item,-item.quantity)}><Trash2 size={18}/></button></div>)}</div><div className="summary"><div><span>Tạm tính</span><b>{VND(cart.subtotal_vnd)}</b></div><div><span>Phí vận chuyển dự kiến</span><b>{VND(shipping)}</b></div><div className="summary-total"><b>Tổng dự kiến</b><b>{VND(cart.subtotal_vnd+shipping)}</b></div></div><button className="primary full" onClick={()=>go('checkout')}>Tiến hành thanh toán <ChevronRight size={18}/></button></>}</>}
      {tab==='checkout'&&<>{!token?<div className="empty"><p>Vui lòng đăng nhập để thanh toán.</p><button onClick={()=>go('login')} className="primary">Đăng nhập</button></div>:<form onSubmit={placeOrder} className="checkout-form"><h3>📍 Địa chỉ nhận hàng</h3>{addresses.map(a=><label key={a.id} className="radio-line"><input type="radio" checked={String(chosenAddressId)===String(a.id)} onChange={()=>setChosenAddressId(String(a.id))}/><span><b>{a.recipient_name} · {a.phone}</b><small>{a.street_address}, {a.ward}, {a.city}</small></span></label>)}
        {!addresses.length&&<div className="address-form"><p>Chưa có địa chỉ, hãy thêm trước khi đặt hàng:</p>{[['recipient_name','Tên người nhận'],['phone','Số điện thoại'],['street_address','Số nhà / tên đường'],['ward','Phường / xã'],['city','Tỉnh / thành phố']].map(([name,label])=><label key={name}>{label}<input required value={newAddress[name]} onChange={e=>setNewAddress({...newAddress,[name]:e.target.value})}/></label>)}<button disabled={busy} type="button" className="secondary full" onClick={saveAddress}>Lưu địa chỉ</button></div>}
        <h3>💳 Phương thức thanh toán</h3><label className="radio-line"><input type="radio" checked={payment==='COD'} onChange={()=>setPayment('COD')}/><span><b>COD</b><small>Thanh toán khi nhận hàng</small></span></label><label className="radio-line"><input type="radio" checked={payment==='MOMO_SIMULATION'} onChange={()=>setPayment('MOMO_SIMULATION')}/><span><b>MoMo (mô phỏng)</b><small>Chưa thực hiện giao dịch tiền thật</small></span></label>
        <h3>🎟 Mã giảm giá</h3><input placeholder="Nhập BG50 nếu đơn từ 500.000đ" value={coupon} onChange={e=>setCoupon(e.target.value)}/><div className="summary"><div><span>Tạm tính</span><b>{VND(cart.subtotal_vnd)}</b></div><div><span>Phí giao hàng</span><b>{VND(shipping)}</b></div><div><span>Giảm giá dự tính</span><b>-{VND(discount)}</b></div><div className="summary-total"><b>Tổng cộng</b><b>{VND(estimate)}</b></div></div><button disabled={busy||!cart.items.length||!addresses.length} className="primary full">{busy?'Đang xử lý...':'Xác nhận đặt hàng'}</button></form>}</>}
      {tab==='success'&&<div className="success"><CheckCircle2 size={76}/><h2>Đặt hàng thành công!</h2><p>Đơn hàng <b>#{lastOrder?.order_code}</b> đã được ghi vào MySQL.</p><div className="summary"><div><span>Tổng thanh toán</span><b>{VND(lastOrder?.total_vnd)}</b></div><div><span>Phương thức</span><b>{lastOrder?.payment_method==='COD'?'COD':'MoMo mô phỏng'}</b></div></div>{lastOrder?.payment_method==='MOMO_SIMULATION'&&<p className="warning">Chưa trả tiền thật. Trạng thái thanh toán: đang chờ.</p>}<button className="primary full" onClick={()=>go('orders')}>Xem đơn hàng</button><button className="secondary full" onClick={()=>go('home')}>Về trang chủ</button></div>}
      {tab==='orders'&&<>{!token?<div className="empty"><button className="primary" onClick={()=>go('login')}>Đăng nhập để xem đơn</button></div>:orders.length?orders.map(o=><button className="order-card" key={o.id} onClick={()=>viewOrder(o.id)}><div><strong>#{o.order_code}</strong><span className="state">{({PENDING:'Chờ xác nhận',CONFIRMED:'Đã xác nhận',SHIPPING:'Đang giao',DELIVERED:'Đã giao',CANCELLED:'Đã hủy'})[o.status]}</span></div><p>{o.payment_method==='COD'?'COD':'MoMo mô phỏng'} · {new Date(o.created_at).toLocaleDateString('vi-VN')}</p><div className="order-total"><b>{VND(o.total_vnd)}</b><ChevronRight size={17}/></div></button>):<div className="empty"><Package size={40}/><p>Chưa có đơn hàng.</p><button className="primary" onClick={()=>go('products')}>Khám phá mỹ phẩm</button></div>}</>}
      {tab==='orderDetail'&&chosenOrder&&<><button className="back" onClick={()=>go('orders')}><ArrowLeft size={18}/> Đơn hàng của tôi</button><div className="order-card detail-order"><h2>#{chosenOrder.order_code}</h2><p>Trạng thái: <strong>{chosenOrder.status}</strong></p><p>Người nhận: {chosenOrder.recipient_name}</p><p>{chosenOrder.shipping_address}</p>{chosenOrder.items.map((it,i)=><div className="line-item" key={i}><span>{it.product_name} ×{it.quantity}</span><b>{VND(it.unit_price_vnd*it.quantity)}</b></div>)}<div className="summary"><div><span>Tạm tính</span><b>{VND(chosenOrder.subtotal_vnd)}</b></div><div><span>Giảm giá</span><b>-{VND(chosenOrder.discount_vnd)}</b></div><div><span>Giao hàng</span><b>{VND(chosenOrder.shipping_vnd)}</b></div><div className="summary-total"><b>Tổng</b><b>{VND(chosenOrder.total_vnd)}</b></div></div><p><b>Thanh toán:</b> {chosenOrder.payment_method==='COD'?'COD':'MoMo mô phỏng'} ({chosenOrder.payment_status})</p></div></>}
      {tab==='favorites'&&<>{!token?<div className="empty"><p>Đăng nhập để lưu sản phẩm yêu thích.</p><button className="primary" onClick={()=>go('login')}>Đăng nhập</button></div>:favorites.length?<div className="product-grid">{favorites.map(f=>productCard({ ...f,brand:'BeautyGlow'}))}</div>:<div className="empty"><Heart size={44}/><h2>Chưa có sản phẩm yêu thích</h2><button className="primary" onClick={()=>go('products')}>Khám phá sản phẩm</button></div>}</>}
      {tab==='account'&&<div className="account">{user?<><div className="profile"><span className="avatar">{user.full_name?.[0]?.toUpperCase()||'B'}</span><div><h2>{user.full_name}</h2><p>{user.email}</p></div></div><button className="account-row" onClick={()=>go('orders')}><Package size={19}/> Đơn hàng của tôi <ChevronRight size={18}/></button><button className="account-row" onClick={()=>go('favorites')}><Heart size={19}/> Yêu thích <ChevronRight size={18}/></button><button className="account-row" onClick={()=>go('checkout')}><MapPin size={19}/> Địa chỉ giao hàng <ChevronRight size={18}/></button><button className="account-row" onClick={logout}><LogOut size={19}/> Đăng xuất <ChevronRight size={18}/></button></>:<div className="empty"><UserRound size={45}/><h2>Chào mừng đến BeautyGlow</h2><button className="primary" onClick={()=>go('login')}>Đăng nhập / Đăng ký</button></div>}<p className="muted tiny">Phiên bản demo học tập · React + Node.js + MySQL</p></div>}
      </main>
      <nav className="bottom-tabs">
        {[[House,'home','Trang chủ'],[LayoutGrid,'products','Danh mục'],[ShoppingBag,'cart','Giỏ hàng'],[Heart,'favorites','Yêu thích'],[UserRound,'account','Tài khoản']].map(([Icon,id,label])=><button key={id} className={(tab===id?'selected':'')} onClick={()=>go(id)}><Icon size={22}/><span>{label}</span>{id==='cart'&&cartCount>0&&<i>{cartCount}</i>}</button>)}
      </nav>
    </div>
    <aside className="help-panel"><div>✦ <b>BeautyGlow</b></div><h2>Ứng dụng mỹ phẩm</h2><p>Bản demo kết nối trực tiếp với MySQL qua Node.js API.</p><ul><li>Đăng nhập, đăng ký thật (mật khẩu được băm)</li><li>Tìm kiếm và lọc giá sản phẩm</li><li>Giỏ hàng lưu trong MySQL</li><li>Đặt đơn COD hoặc MoMo mô phỏng</li><li>Xem lịch sử và chi tiết đơn</li></ul><p className="small-muted">Màu và bố cục tham khảo thiết kế BeautyGlow trên Figma. Ảnh đang dùng minh họa tạm; chưa sao chép toàn bộ 109 màn hình.</p></aside>
  </div>;
}

createRoot(document.getElementById('root')).render(<App/>);
