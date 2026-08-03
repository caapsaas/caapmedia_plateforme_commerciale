// Numéro WhatsApp commercial utilisé pour toutes les commandes initiées
// depuis la vitrine publique (fiche produit, panier) — voir ShoppingCart.tsx :
// pas de checkout backend, la commande part toujours en conversation WhatsApp.
export const WHATSAPP_SALES_NUMBER = '237671890184';

export const buildWhatsAppLink = (message: string, phoneNumber: string = WHATSAPP_SALES_NUMBER): string => {
    const cleanPhone = phoneNumber.replace(/[\s\-()]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};
