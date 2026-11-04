interface ShareProduct {
    id: string;
    name: string;
    description: string;
    productImages: {
        imageUrl: string;
    }[];
}
export declare function renderProductShare(product: ShareProduct, backendOrigin: string): string;
export {};
