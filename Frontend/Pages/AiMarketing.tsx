import React, { useState, useCallback } from 'react';
import { generateMarketingIdeas } from '../services/geminiService';
import IconAi from '../components/icons/IconAi';
import { useI18n } from '../i18n';

const AiMarketing: React.FC = () => {
    const { t, language } = useI18n();
    const [productInfo, setProductInfo] = useState<string>('');
    const [ideas, setIdeas] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = useCallback(async () => {
        if (!productInfo.trim()) {
            setError(t('aiMarketing.errorPrompt'));
            return;
        }
        setIsLoading(true);
        setError(null);
        setIdeas('');
        try {
            const result = await generateMarketingIdeas(productInfo, language);
            setIdeas(result);
        } catch (err) {
            const errorMessageKey = err instanceof Error ? err.message : "aiMarketing.geminiUnexpectedError";
            setError(t(errorMessageKey));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [productInfo, language, t]);

    const formatIdeas = (text: string) => {
        const ideaPrefix = language === 'en' ? 'Idea' : 'Idée';
        const descriptionPrefix = language === 'en' ? '*Description:*' : '*Description :*';

        return text.split('**').filter(s => s.trim()).map((part, index) => {
            if (part.startsWith(`${ideaPrefix}`)) {
                const [title, ...rest] = part.split(descriptionPrefix);
                const description = rest.join(descriptionPrefix);
                return (
                    <div key={index} className="mb-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
                        <h4 className="font-bold text-[#c6e911]">{`**${title.trim()}`}</h4>
                        <p className="mt-2 text-slate-700 whitespace-pre-wrap">{`${descriptionPrefix}${description.trim()}`}</p>
                    </div>
                );
            }
            return null;
        });
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="text-center">
                <IconAi className="h-16 w-16 mx-auto text-[#c6e911]" />
                <h2 className="text-3xl font-bold text-slate-800 mt-4">{t('aiMarketing.title')}</h2>
                <p className="text-slate-600 mt-2">{t('aiMarketing.subtitle')}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 space-y-4">
                <div>
                    <label htmlFor="productInfo" className="block text-sm font-medium text-slate-700 mb-1">
                        {t('aiMarketing.productInfoLabel')}
                    </label>
                    <textarea
                        id="productInfo"
                        rows={4}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#c6e911] focus:border-transparent transition"
                        placeholder={t('aiMarketing.productInfoPlaceholder')}
                        value={productInfo}
                        onChange={(e) => setProductInfo(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full flex justify-center items-center px-4 py-3 bg-[#c6e911] text-slate-800 font-semibold rounded-md hover:bg-[#adc40f] disabled:bg-lime-200 transition-colors"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t('aiMarketing.generating')}
                        </>
                    ) : t('aiMarketing.generateButton')}
                </button>
            </div>

            {ideas && (
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-semibold mb-4 text-slate-800">{t('aiMarketing.suggestedCampaigns')}</h3>
                    <div className="prose prose-slate max-w-none">
                        {formatIdeas(ideas)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiMarketing;