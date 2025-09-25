import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("La clé API de Google Gemini n'est pas définie. Les fonctionnalités IA seront désactivées.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const getMarketingPrompt = (lang: string, productInfo: string): string => {
  if (lang === 'en') {
    return `
      Act as a strategic marketing expert for a company in West Africa.
      Generate 5 creative and impactful marketing campaign ideas for the following product.
      For each idea, provide a catchy title, a target audience, and a brief description of the campaign.
      The tone should be professional, optimistic, and adapted to the local market.

      Product Information:
      ---
      ${productInfo}
      ---

      Expected output format (use this exact format):
      **Idea 1: [Title of the idea]**
      *Target:* [Target audience]
      *Description:* [Campaign description]

      **Idea 2: [Title of the idea]**
      *Target:* [Target audience]
      *Description:* [Campaign description]

      ...and so on.
    `;
  }

  // Default to French
  return `
    Agis en tant qu'expert en marketing stratégique pour une entreprise en Afrique de l'Ouest.
    Génère 5 idées de campagnes marketing créatives et percutantes pour le produit suivant.
    Pour chaque idée, fournis un titre accrocheur, un public cible, et une brève description de la campagne.
    Le ton doit être professionnel, optimiste et adapté au marché local.

    Information sur le produit :
    ---
    ${productInfo}
    ---

    Format de sortie attendu (utilise ce format exact):
    **Idée 1 : [Titre de l'idée]**
    *Cible :* [Public cible]
    *Description :* [Description de la campagne]

    **Idée 2 : [Titre de l'idée]**
    *Cible :* [Public cible]
    *Description :* [Description de la campagne]

    ...et ainsi de suite.
  `;
};

export const generateMarketingIdeas = async (productInfo: string, lang: string): Promise<string> => {
  if (!ai) throw new Error("aiMarketing.geminiError");
  
  const prompt = getMarketingPrompt(lang, productInfo);
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 1,
        topK: 32,
        maxOutputTokens: 1024,
        thinkingConfig: { thinkingBudget: 512 }
      }
    });
    if (!response.text) {
        throw new Error("aiMarketing.geminiUnexpectedError");
    }
    return response.text;
  } catch (error) {
    console.error("Erreur lors de la communication avec Gemini:", error);
    throw new Error("aiMarketing.geminiUnexpectedError");
  }
};

export const generateProductDescription = async (productName: string): Promise<string> => {
  if (!ai) throw new Error("product.serviceUnavailable");
  
  const prompt = `Génère une description de produit marketing percutante et concise pour : "${productName}". La description doit être attrayante pour les clients en Afrique de l'Ouest, mettre en avant les avantages clés et ne doit pas dépasser 100 mots.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.8,
        maxOutputTokens: 256,
        thinkingConfig: { thinkingBudget: 128 }
      }
    });
    if (!response.text) {
        throw new Error("product.descriptionGenerationError");
    }
    return response.text.trim();
  } catch (error) {
    console.error("Erreur lors de la génération de la description du produit:", error);
    throw new Error("product.descriptionGenerationError");
  }
};

export const generateProductImage = async (productName: string, productDescription: string): Promise<string> => {
    if (!ai) throw new Error("product.serviceUnavailable");
    
    const prompt = `Image photoréaliste de haute qualité d'un produit : ${productName}. ${productDescription}. Le produit est présenté sur un fond blanc propre et bien éclairé. Style publicitaire.`;
    
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '4:3',
            },
        });

        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error("product.imageGenerationNoImage");
        }

        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    } catch (error) {
        console.error("Erreur lors de la génération de l'image du produit:", error);
        throw new Error("product.imageGenerationError");
    }
};
