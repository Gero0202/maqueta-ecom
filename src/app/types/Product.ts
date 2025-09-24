export interface Product {
    product_id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    image_url: string;
    created_at: string;
    updated_at: string;
}

export type NewProduct = {
    name: string
    description: string
    price: number
    stock: number
    category: string
    image_url: string
}