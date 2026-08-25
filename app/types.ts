export type Role = 'waiter' | 'kitchen' | 'admin';
export type OrderStatus = 'new' | 'preparing' | 'ready' | 'served';
export type MenuItem = { id: string; name: string; description: string; category: string; price: number; color: string; available: boolean; customizations: string[] };
export type CartItem = MenuItem & { cartId: string; quantity: number; customization: string[]; note: string };
export type Order = { id: string; orderNumber: string; table: string; items: CartItem[]; status: OrderStatus; createdAt: number; waiter: string; note: string; total: number };

export const DEFAULT_MENU: MenuItem[] = [
  { id:'burger', name:'Smoky Chicken Burger', description:'Grilled chicken, cheddar, house sauce', category:'Fast food', price:890, color:'#f0a96b', available:true, customizations:['Extra cheese (+ Rs. 100)','No onion','Sauce on the side','Make it spicy'] },
  { id:'alfredo', name:'Fettuccine Alfredo', description:'Creamy parmesan sauce, mushrooms', category:'Main course', price:1090, color:'#e6c887', available:true, customizations:['Add chicken (+ Rs. 180)','No mushrooms','Extra parmesan','Less sauce'] },
  { id:'biryani', name:'Chicken Biryani', description:'Aromatic rice, raita, fresh salad', category:'Main course', price:590, color:'#d97954', available:true, customizations:['Single plate','Family portion','Extra raita','Extra spicy'] },
  { id:'fries', name:'Crispy Loaded Fries', description:'Cheese sauce, jalapeno, chipotle', category:'Sides', price:540, color:'#e4aa49', available:true, customizations:['Medium spice','Extra jalapeno','No chipotle','Extra cheese'] },
  { id:'steak', name:'Pepper Beef Steak', description:'Tenderloin, pepper sauce, vegetables', category:'Main course', price:1890, color:'#9d5949', available:true, customizations:['Medium rare','Medium','Well done','Mashed potato'] },
  { id:'drink', name:'Mint Lemonade', description:'Fresh lemon, mint and crushed ice', category:'Drinks', price:320, color:'#72a96d', available:true, customizations:['Less sugar','No sugar','Less ice','Add soda'] },
  { id:'cake', name:'Molten Chocolate Cake', description:'Warm chocolate center, vanilla scoop', category:'Dessert', price:620, color:'#7c5148', available:true, customizations:['No ice cream','Extra ice cream','Birthday message'] },
  { id:'wings', name:'Firecracker Wings', description:'Six crispy wings, spicy glaze, ranch', category:'Fast food', price:780, color:'#d45e43', available:true, customizations:['Mild','Medium','Extra spicy','Ranch on side'] },
];

const sampleCart = (name:string, quantity:number, note='') => ({ ...DEFAULT_MENU.find(i => i.name === name)!, cartId:`sample-${name}`, quantity, customization:note ? [note] : [], note:'' });
export const SAMPLE_ORDERS: Order[] = [
  { id:'sample-1', orderNumber:'#104', table:'7', items:[sampleCart('Chicken Biryani',2,'Extra spicy'),sampleCart('Mint Lemonade',2,'Less ice')], status:'preparing', createdAt:Date.now()-11*60000, waiter:'Hamza',note:'Serve drinks first',total:1911 },
  { id:'sample-2', orderNumber:'#105', table:'3', items:[sampleCart('Smoky Chicken Burger',1,'No onion'),sampleCart('Crispy Loaded Fries',1)], status:'new', createdAt:Date.now()-5*60000, waiter:'Areeba',note:'',total:1502 },
  { id:'sample-3', orderNumber:'#103', table:'15', items:[sampleCart('Pepper Beef Steak',2,'Medium'),sampleCart('Mint Lemonade',2)], status:'ready', createdAt:Date.now()-18*60000, waiter:'Hamza',note:'One steak without pepper sauce',total:4641 },
  { id:'sample-4', orderNumber:'#102', table:'9', items:[sampleCart('Fettuccine Alfredo',2)], status:'served', createdAt:Date.now()-42*60000, waiter:'Areeba',note:'',total:2289 },
];
