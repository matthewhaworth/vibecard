export type CheckoutSession = {
    id: string;
    userId: number;
    paymentReference: string;
    status: string;
    postcards: Array<{
        id: number;
        prompt: string;
        imageUrl: string;
        pdfUrl: string;
    }>;
}

