import { CartItem } from '../components/ecommerce/ShoppingCart';

interface PaymentPayload {
    amount: number;
    paymentMethod: string;
    customerInfo: { name: string; email: string; address: string; };
    cartItems: CartItem[];
}

/**
 * Simule le traitement d'un paiement via une API externe.
 * Dans une application réelle, cela interagirait avec une passerelle de paiement comme Stripe.
 * @param payload - Les informations de paiement.
 * @returns Une promesse qui se résout avec un message de succès ou rejette avec une erreur.
 */
export const processPayment = async (payload: PaymentPayload): Promise<{ success: boolean; transactionId: string }> => {
    console.log('Processing payment for:', payload.amount, 'via', payload.paymentMethod);

    // 1. Simulation d'un appel réseau
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Simulation d'une logique de succès/échec (ex: faire échouer les paiements > 1 000 000)
    if (payload.amount > 1000000 && payload.paymentMethod !== 'credit') {
        throw new Error('Le montant est trop élevé pour cette méthode de paiement.');
    }

    // 3. Simulation d'une réponse réussie
    return { success: true, transactionId: `txn_${Date.now()}` };
};