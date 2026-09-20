export const formatINR=(value:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(value);
export const shippingFor=(subtotal:number)=>subtotal>=2499?0:99;
export const taxFor=(subtotal:number)=>Math.round(subtotal*.03);