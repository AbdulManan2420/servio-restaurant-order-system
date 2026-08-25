'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  BarChart3, Check, ChefHat, ChevronRight, CircleDollarSign, Clock3,
  Flame, LayoutGrid, LockKeyhole, LogOut, Minus, PackageCheck, Plus, Search, Settings2,
  ShoppingBag, Store, UtensilsCrossed, X,
} from 'lucide-react';
import {
  createOrder, isFirebaseConfigured, loginForRole, logoutUser, saveMenuItem, subscribeAuth, subscribeMenu,
  subscribeOrders, updateMenuItem, updateOrderStatus,
} from './services/firebase';
import type { ProtectedRole } from './services/firebase';
import type { CartItem, MenuItem, Order, OrderStatus, Role, ServiceMode } from './types';
import { DEFAULT_MENU, SAMPLE_ORDERS } from './types';

const categories = ['All items', 'Main course', 'Fast food', 'Sides', 'Drinks', 'Dessert'];
const statusLabels: Record<OrderStatus, string> = {
  new: 'New order', preparing: 'Preparing', ready: 'Ready to serve', served: 'Served',
};

function money(value: number) { return `Rs. ${value.toLocaleString()}`; }
function elapsed(createdAt: number) { return `${Math.max(1, Math.round((Date.now() - createdAt) / 60000))} min`; }

export default function Home() {
  const [role, setRole] = useState<Role>('waiter');
  const [menu, setMenu] = useState<MenuItem[]>(DEFAULT_MENU);
  const [orders, setOrders] = useState<Order[]>(SAMPLE_ORDERS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [table, setTable] = useState('12');
  const [serviceMode, setServiceMode] = useState<ServiceMode>('dine_in');
  const [customerName, setCustomerName] = useState('');
  const [category, setCategory] = useState('All items');
  const [query, setQuery] = useState('');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [toast, setToast] = useState('');
  const [authenticatedRole, setAuthenticatedRole] = useState<ProtectedRole | null>(null);
  const [loginRole, setLoginRole] = useState<ProtectedRole | null>(null);

  useEffect(() => subscribeMenu(setMenu), []);
  useEffect(() => subscribeOrders(setOrders), []);
  useEffect(() => subscribeAuth(setAuthenticatedRole), []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredMenu = useMemo(() => menu.filter(item => item.available &&
    (category === 'All items' || item.category === category) &&
    `${item.name} ${item.description}`.toLowerCase().includes(query.toLowerCase())), [menu, category, query]);

  const addCustomizedItem = (item: MenuItem, customization: string[], note: string) => {
    setCart(current => [...current, { ...item, cartId: crypto.randomUUID(), quantity: 1, customization, note }]);
    setEditingItem(null);
    setToast(`${item.name} added to the order`);
  };

  const updateQuantity = (cartId: string, amount: number) => setCart(current => current
    .map(item => item.cartId === cartId ? { ...item, quantity: item.quantity + amount } : item)
    .filter(item => item.quantity > 0));

  const placeOrder = async (orderNote: string) => {
    if (!cart.length) return;
    const order: Order = {
      id: crypto.randomUUID(), orderNumber: `#${String(100 + orders.length + 1)}`,
      serviceMode, table: serviceMode === 'dine_in' ? table : '', customerName: serviceMode === 'takeaway' ? customerName.trim() : '',
      items: cart, status: 'new', createdAt: Date.now(), waiter: 'Current user', note: orderNote,
      total: Math.round(cart.reduce((sum, item) => sum + item.price * item.quantity, 0) * 1.05),
    };
    setOrders(current => [order, ...current]);
    await createOrder(order);
    setCart([]);
    setCustomerName('');
    setToast(`Order ${order.orderNumber} sent to kitchen`);
  };

  const changeStatus = async (id: string, status: OrderStatus) => {
    setOrders(current => current.map(order => order.id === id ? { ...order, status } : order));
    await updateOrderStatus(id, status);
  };

  const selectRole = (nextRole: Role) => {
    if (nextRole === 'waiter' || authenticatedRole === nextRole) setRole(nextRole);
    else setLoginRole(nextRole);
  };

  const logout = async () => { await logoutUser(); setRole('waiter'); setToast('Signed out securely'); };

  return (
    <main className="app-shell">
      <Topbar role={role} setRole={selectRole} authenticatedRole={authenticatedRole} logout={logout} />
      {role === 'waiter' && <WaiterView menu={filteredMenu} cart={cart} table={table} setTable={setTable}
        serviceMode={serviceMode} setServiceMode={setServiceMode} customerName={customerName} setCustomerName={setCustomerName}
        category={category} setCategory={setCategory} query={query} setQuery={setQuery}
        editItem={setEditingItem} updateQuantity={updateQuantity} placeOrder={placeOrder} />}
      {role === 'kitchen' && <KitchenView orders={orders} changeStatus={changeStatus} />}
      {role === 'admin' && <AdminView orders={orders} menu={menu} setToast={setToast} />}
      {editingItem && <CustomizationModal item={editingItem} onClose={() => setEditingItem(null)} onAdd={addCustomizedItem} />}
      {loginRole && <LoginModal role={loginRole} onClose={() => setLoginRole(null)} onSuccess={() => { setRole(loginRole); setLoginRole(null); setToast('Workspace unlocked'); }} />}
      {toast && <div className="toast" role="status"><Check size={17} />{toast}</div>}
    </main>
  );
}

function Topbar({ role, setRole, authenticatedRole, logout }: { role: Role; setRole: (role: Role) => void; authenticatedRole: ProtectedRole | null; logout: () => void }) {
  return <header className="topbar">
    <div className="brand"><span className="brand-mark"><UtensilsCrossed size={20} /></span><div><strong>Servio</strong><small>Restaurant OS</small></div></div>
    <nav className="role-tabs" aria-label="Choose workspace">
      <button className={role === 'waiter' ? 'active' : ''} onClick={() => setRole('waiter')}>Waiter / Customer</button>
      <button className={role === 'kitchen' ? 'active' : ''} onClick={() => setRole('kitchen')}>Kitchen {authenticatedRole !== 'kitchen' && <LockKeyhole size={12} />}</button>
      <button className={role === 'admin' ? 'active' : ''} onClick={() => setRole('admin')}>Admin {authenticatedRole !== 'admin' && <LockKeyhole size={12} />}</button>
    </nav>
    <div className="shift"><span className="status-dot" />Dinner shift <strong>Open</strong>{authenticatedRole && <button className="logout-button" onClick={logout} title="Sign out"><LogOut size={14} />Sign out</button>}<span className={`sync-badge ${isFirebaseConfigured ? 'live' : ''}`}>{isFirebaseConfigured ? 'Firebase live' : 'Demo mode'}</span></div>
  </header>;
}

function LoginModal({ role, onClose, onSuccess }: { role: ProtectedRole; onClose: () => void; onSuccess: () => void }) {
  const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent) => { event.preventDefault(); setLoading(true); setError(''); try { await loginForRole(role, password); onSuccess(); } catch { setError('Incorrect password. Please try again.'); setLoading(false); } };
  return <div className="modal-backdrop"><form className="modal auth-modal" onSubmit={submit}><button type="button" className="icon-button modal-close" onClick={onClose} aria-label="Close"><X size={19} /></button><span className="auth-icon"><LockKeyhole size={22} /></span><p className="eyebrow">Protected workspace</p><h2>{role === 'admin' ? 'Admin' : 'Kitchen'} login</h2><p className="modal-description">Enter the {role} password to continue.</p><label><span>Password</span><input type="password" autoFocus value={password} onChange={e => setPassword(e.target.value)} required placeholder="Enter password" /></label>{error && <p className="auth-error">{error}</p>}<button className="modal-add" disabled={loading}>{loading ? 'Checking...' : `Unlock ${role}`}</button></form></div>;
}

type WaiterProps = {
  menu: MenuItem[]; cart: CartItem[]; table: string; setTable: (v: string) => void;
  serviceMode: ServiceMode; setServiceMode: (v: ServiceMode) => void; customerName: string; setCustomerName: (v: string) => void;
  category: string; setCategory: (v: string) => void; query: string; setQuery: (v: string) => void;
  editItem: (item: MenuItem) => void; updateQuantity: (id: string, n: number) => void; placeOrder: (note: string) => void;
};

function WaiterView(props: WaiterProps) {
  const [note, setNote] = useState('');
  const subtotal = props.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * .05);
  const count = props.cart.reduce((sum, item) => sum + item.quantity, 0);
  return <div className="workspace">
    <section className="order-panel">
      <div className="order-heading"><div><p className="eyebrow">New order</p><h1>What can we serve?</h1><p>Choose dine in or take away, then add items from today&apos;s menu.</p></div>
        <div className="service-controls"><div className="service-choice" aria-label="Order type"><button className={props.serviceMode === 'dine_in' ? 'active' : ''} onClick={() => props.setServiceMode('dine_in')}>Dine in</button><button className={props.serviceMode === 'takeaway' ? 'active' : ''} onClick={() => props.setServiceMode('takeaway')}>Take away</button></div>
          {props.serviceMode === 'dine_in' ? <label className="table-select"><span>Table</span><select value={props.table} onChange={e => props.setTable(e.target.value)}>{Array.from({ length: 20 }, (_, i) => <option key={i + 1}>{i + 1}</option>)}</select></label> : <label className="pickup-name"><span>Pickup name</span><input value={props.customerName} onChange={e => props.setCustomerName(e.target.value)} placeholder="Customer name" /></label>}
        </div>
      </div>
      <div className="filters"><label className="search"><Search size={18} /><input value={props.query} onChange={e => props.setQuery(e.target.value)} placeholder="Search menu" aria-label="Search menu" /></label>
        <div className="categories">{categories.map(item => <button key={item} onClick={() => props.setCategory(item)} className={props.category === item ? 'active' : ''}>{item}</button>)}</div>
      </div>
      <div className="menu-grid">{props.menu.length ? props.menu.map((item, index) => <article className="menu-card" key={item.id}>
        <div className="food-visual" style={{ background: item.color }}><span>0{(index % 9) + 1}</span><i>{item.category}</i></div>
        <div className="menu-copy"><div><h2>{item.name}</h2><p>{item.description}</p></div><div className="menu-bottom"><strong>{money(item.price)}</strong><button onClick={() => props.editItem(item)} aria-label={`Customize and add ${item.name}`} title="Customize and add"><Plus size={18} /></button></div></div>
      </article>) : <div className="empty-state"><Search size={26} /><strong>No matching dishes</strong><p>Try another search or category.</p></div>}</div>
    </section>
    <aside className="cart-panel">
      <div className="cart-title"><div><p className="eyebrow">{props.serviceMode === 'dine_in' ? `Table ${props.table}` : 'Take away'}</p><h2>Current order</h2></div><span><ShoppingBag size={17} /> {count} items</span></div>
      <div className="guest-note"><Clock3 size={17} /><div><strong>{props.serviceMode === 'dine_in' ? 'Dine-in order' : 'Take-away order'}</strong><p>{props.serviceMode === 'takeaway' && props.customerName ? `Pickup for ${props.customerName}` : 'Ready to send to the kitchen'}</p></div></div>
      <div className="cart-items">{props.cart.length ? props.cart.map(item => <div className="cart-item" key={item.cartId}><div><strong>{item.name}</strong><p>{[...item.customization, item.note].filter(Boolean).join(', ') || 'Standard preparation'}</p><span>{money(item.price * item.quantity)}</span></div><div className="stepper"><button onClick={() => props.updateQuantity(item.cartId, -1)} aria-label="Decrease quantity"><Minus size={14} /></button><b>{item.quantity}</b><button onClick={() => props.updateQuantity(item.cartId, 1)} aria-label="Increase quantity"><Plus size={14} /></button></div></div>) : <div className="cart-empty"><ShoppingBag size={29} /><strong>Your order is empty</strong><p>Add a menu item to get started.</p></div>}</div>
      <label className="order-note"><span>Order note</span><textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Allergy, timing or service note" /></label>
      <div className="totals"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div><span>Tax (5%)</span><strong>{money(tax)}</strong></div><div className="grand"><span>Total</span><strong>{money(subtotal + tax)}</strong></div></div>
      <button disabled={!props.cart.length || (props.serviceMode === 'takeaway' && !props.customerName.trim())} className="place-order" onClick={() => { props.placeOrder(note); setNote(''); }}>Place order <span>{money(subtotal + tax)}</span></button>
    </aside>
  </div>;
}

function CustomizationModal({ item, onClose, onAdd }: { item: MenuItem; onClose: () => void; onAdd: (i: MenuItem, c: string[], n: string) => void }) {
  const [selected, setSelected] = useState<string[]>([]); const [note, setNote] = useState('');
  const options = item.customizations.length ? item.customizations : ['Mild spice', 'Medium spice', 'Extra spicy'];
  const toggle = (option: string) => setSelected(current => current.includes(option) ? current.filter(v => v !== option) : [...current, option]);
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><section className="modal" role="dialog" aria-modal="true" aria-label={`Customize ${item.name}`}>
    <button className="icon-button modal-close" onClick={onClose} aria-label="Close" title="Close"><X size={19} /></button>
    <p className="eyebrow">Customize item</p><h2>{item.name}</h2><p className="modal-description">{item.description}</p>
    <div className="option-list"><span>Preferences</span>{options.map(option => <label key={option}><input type="checkbox" checked={selected.includes(option)} onChange={() => toggle(option)} /><i><Check size={13} /></i>{option}</label>)}</div>
    <label className="special-note"><span>Special instructions</span><textarea value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. no onion, sauce on the side" /></label>
    <button className="modal-add" onClick={() => onAdd(item, selected, note)}>Add to order <strong>{money(item.price)}</strong></button>
  </section></div>;
}

function KitchenView({ orders, changeStatus }: { orders: Order[]; changeStatus: (id: string, status: OrderStatus) => void }) {
  const active = orders.filter(order => order.status !== 'served');
  return <div className="kitchen-view"><div className="page-heading"><div><p className="eyebrow">Kitchen display</p><h1>Live order queue</h1><p>Tickets are sorted by arrival time. Keep every station moving.</p></div><div className="queue-stats"><span><Flame size={17} />{active.length} active</span><span><Clock3 size={17} />Avg. 14 min</span></div></div>
    <div className="status-legend"><span><i className="dot new" />New</span><span><i className="dot preparing" />Preparing</span><span><i className="dot ready" />Ready</span></div>
    <div className="ticket-grid">{active.map(order => <article className={`ticket ${order.status}`} key={order.id}>
      <header><div><span>{order.orderNumber} · {(order.serviceMode ?? 'dine_in') === 'takeaway' ? 'TAKE AWAY' : 'DINE IN'}</span><h2>{(order.serviceMode ?? 'dine_in') === 'takeaway' ? `Pickup · ${order.customerName || 'Guest'}` : `Table ${order.table}`}</h2></div><strong><Clock3 size={15} />{elapsed(order.createdAt)}</strong></header>
      <div className="ticket-items">{order.items.map(item => <div key={item.cartId}><b>{item.quantity}</b><p><strong>{item.name}</strong><span>{[...item.customization, item.note].filter(Boolean).join(', ') || 'Standard'}</span></p></div>)}</div>
      {order.note && <p className="ticket-note"><Settings2 size={14} />{order.note}</p>}
      <footer><span>{statusLabels[order.status]}</span>{order.status === 'new' && <button onClick={() => changeStatus(order.id, 'preparing')}>Start cooking <ChevronRight size={16} /></button>}{order.status === 'preparing' && <button onClick={() => changeStatus(order.id, 'ready')}>Mark ready <PackageCheck size={16} /></button>}{order.status === 'ready' && <button onClick={() => changeStatus(order.id, 'served')}>Served <Check size={16} /></button>}</footer>
    </article>)}</div>{!active.length && <div className="large-empty"><ChefHat size={38} /><h2>Kitchen is all clear</h2><p>New orders will appear here automatically.</p></div>}
  </div>;
}

function AdminView({ orders, menu, setToast }: { orders: Order[]; menu: MenuItem[]; setToast: (v: string) => void }) {
  const [showAdd, setShowAdd] = useState(false); const [activeTab, setActiveTab] = useState<'overview' | 'menu'>('overview');
  const sales = orders.filter(o => o.status === 'served').reduce((sum, order) => sum + order.total, 0);
  const toggleAvailability = async (item: MenuItem) => { await updateMenuItem(item.id, { available: !item.available }); setToast(`${item.name} ${item.available ? 'paused' : 'is available'}`); };
  return <div className="admin-layout"><aside className="admin-nav"><p>Management</p><button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}><LayoutGrid size={17} />Overview</button><button className={activeTab === 'menu' ? 'active' : ''} onClick={() => setActiveTab('menu')}><Store size={17} />Menu management</button></aside>
    <section className="admin-content">{activeTab === 'overview' ? <><div className="page-heading"><div><p className="eyebrow">Admin dashboard</p><h1>Today at a glance</h1><p>Track service activity and restaurant performance.</p></div></div>
      <div className="metric-grid"><Metric icon={<CircleDollarSign />} label="Completed sales" value={money(sales)} hint={`${orders.filter(o => o.status === 'served').length} paid orders`} /><Metric icon={<ShoppingBag />} label="Total orders" value={String(orders.length)} hint={`${orders.filter(o => o.status !== 'served').length} currently active`} /><Metric icon={<BarChart3 />} label="Average order" value={money(orders.length ? Math.round(orders.reduce((s, o) => s + o.total, 0) / orders.length) : 0)} hint="Includes 5% tax" /><Metric icon={<ChefHat />} label="Kitchen load" value={`${orders.filter(o => o.status === 'preparing').length} cooking`} hint={`${orders.filter(o => o.status === 'ready').length} ready to serve`} /></div>
      <div className="recent-orders"><div className="section-title"><div><h2>Recent orders</h2><p>Latest dine-in and take-away activity</p></div></div><div className="order-table"><div className="table-row table-head"><span>Order</span><span>Service</span><span>Items</span><span>Total</span><span>Status</span></div>{orders.slice(0, 7).map(order => <div className="table-row" key={order.id}><strong>{order.orderNumber}</strong><span>{(order.serviceMode ?? 'dine_in') === 'takeaway' ? `Take away · ${order.customerName || 'Guest'}` : `Table ${order.table}`}</span><span>{order.items.reduce((s, i) => s + i.quantity, 0)} items</span><strong>{money(order.total)}</strong><span className={`status-pill ${order.status}`}>{statusLabels[order.status]}</span></div>)}</div></div></> : <>
      <div className="page-heading"><div><p className="eyebrow">Menu management</p><h1>Dishes and availability</h1><p>Pause sold-out items or add something new.</p></div><button className="primary-action" onClick={() => setShowAdd(true)}><Plus size={17} />Add menu item</button></div>
      <div className="menu-management"><div className="manage-row manage-head"><span>Item</span><span>Category</span><span>Price</span><span>Availability</span><span /></div>{menu.map(item => <div className="manage-row" key={item.id}><span className="item-identity"><i style={{ background: item.color }} /> <strong>{item.name}</strong></span><span>{item.category}</span><strong>{money(item.price)}</strong><span className={`availability ${item.available ? 'available' : 'paused'}`}>{item.available ? 'Available' : 'Paused'}</span><button className="text-action" onClick={() => toggleAvailability(item)}>{item.available ? 'Pause item' : 'Make available'}</button></div>)}</div></>}
    </section>{showAdd && <AddMenuModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); setToast('New menu item added'); }} />}</div>;
}

function Metric({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) { return <article className="metric"><span>{icon}</span><p>{label}</p><strong>{value}</strong><small>{hint}</small></article>; }

function AddMenuModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSaving(true); const data = new FormData(event.currentTarget); await saveMenuItem({ id: crypto.randomUUID(), name: String(data.get('name')), description: String(data.get('description')), category: String(data.get('category')), price: Number(data.get('price')), color: '#d97954', available: true, customizations: ['Mild spice', 'Medium spice', 'Extra spicy', 'No onion'] }); onSaved(); };
  return <div className="modal-backdrop"><form className="modal form-modal" onSubmit={submit}><button type="button" className="icon-button modal-close" onClick={onClose} aria-label="Close"><X size={19} /></button><p className="eyebrow">Menu management</p><h2>Add a new dish</h2><label><span>Item name</span><input name="name" required placeholder="e.g. Zinger Burger" /></label><label><span>Description</span><textarea name="description" required placeholder="Main ingredients and serving details" /></label><div className="form-grid"><label><span>Category</span><select name="category">{categories.slice(1).map(c => <option key={c}>{c}</option>)}</select></label><label><span>Price (Rs.)</span><input name="price" type="number" min="1" required placeholder="850" /></label></div><button className="modal-add" disabled={saving}>{saving ? 'Saving...' : 'Add to menu'}</button></form></div>;
}
