import {create} from "zustand";
import {persist} from "zustand/middleware";
import type {Product} from "@/types/product";

export interface CartItem{product:Product;quantity:number}
interface Store{items:CartItem[];cartOpen:boolean;addItem:(product:Product,quantity?:number)=>void;removeItem:(id:string)=>void;setQuantity:(id:string,q:number)=>void;clearCart:()=>void;setCartOpen:(open:boolean)=>void}

export const useStore=create<Store>()(persist((set)=>({
  items:[],cartOpen:false,
  addItem:(product,quantity=1)=>set(s=>{const e=s.items.find(i=>i.product.id===product.id);return{items:e?s.items.map(i=>i.product.id===product.id?{...i,quantity:i.quantity+quantity}:i):[...s.items,{product,quantity}],cartOpen:true}}),
  removeItem:id=>set(s=>({items:s.items.filter(i=>i.product.id!==id)})),
  setQuantity:(id,q)=>set(s=>({items:q<=0?s.items.filter(i=>i.product.id!==id):s.items.map(i=>i.product.id===id?{...i,quantity:q}:i)})),
  clearCart:()=>set({items:[]}),setCartOpen:open=>set({cartOpen:open})
}),{name:"aurelia-cart",partialize:(state)=>({items:state.items})}));
