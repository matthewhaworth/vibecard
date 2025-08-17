export type Postcard = {
    id: number;
    prompt: string;
    message: string;
    image_url: string;
    pdf_url: string;
}

export type CheckoutSession = {
    id: number;
    user_id: number;
    payment_reference?: string;
    status: string;
    paid?: boolean;
    shipping_address_city?: string;
    shipping_address_country?: string;
    shipping_address_line1?: string;
    shipping_address_line2?: string;
    shipping_address_postal_code?: string;
    shipping_address_state?: string;
    shipping_address_country_code?: string;
    shipping_name?: string;
    shipping_phone?: string;
    postcards: Postcard[];
}