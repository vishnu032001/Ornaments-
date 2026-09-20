import rawProducts from "./products.json";
import type {Product} from "@/types/product";

export const products = rawProducts as Product[];
export default products;
