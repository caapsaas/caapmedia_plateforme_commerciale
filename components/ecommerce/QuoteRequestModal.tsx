import React, { useState } from 'react';
import { useI18n } from '../../i18n';
import IconUpload from '../icons/IconUpload';
import IconFile from '../icons/IconFile';
import IconDelete from '../icons/IconDelete';
import IconCheckCircle from '../icons/IconCheckCircle';

interface QuoteRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string; company: string; email: string; phone: string; description: string; }) => void;
}

const QuoteRequestModal: React.FC<QuoteRequestModalProps> = ({ isOpen, onClose, onSave }) => {
    const { t } = useI18n();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        email: '',
        phone: '',
        description: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };
    
    const handleRemoveFile = () => {
        setFile(null);
        const fileInput = document.getElementById('quote-file-upload') as HTMLInputElement;
        if(fileInput) fileInput.value = '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call to send email and save lead
        setTimeout(() => {
            onSave(formData);
            setIsSubmitting(false);
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                setIsSuccess(false); // Reset for next use
            }, 3000);
        }, 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">{isSuccess ? t('quoteRequest.successTitle') : t('quoteRequest.title')}</h2>
                    {!isSuccess && <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>}
                </div>

                {isSuccess ? (
                    <div className="p-8 text-center">
                        <IconCheckCircle className="h-16 w-16 mx-auto text-green-500"/>
                        <p className="text-slate-600 mt-2">{t('quoteRequest.successMessage')}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <p className="text-sm text-slate-600">{t('quoteRequest.subtitle')}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">{t('quoteRequest.name')}</label>
                                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911]" />
                                </div>
                                <div>
                                    <label htmlFor="company" className="block text-sm font-medium text-slate-700">{t('quoteRequest.company')}</label>
                                    <input type="text" name="company" id="company" value={formData.company} onChange={handleChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911]" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">{t('quoteRequest.email')}</label>
                                    <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911]" />
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700">{t('quoteRequest.phone')}</label>
                                    <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911]" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-slate-700">{t('quoteRequest.projectDescription')}</label>
                                <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={4} required className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:border-[#c6e911] focus:ring-[#c6e911]"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('quoteRequest.fileUpload')}</label>
                                {!file ? (
                                    <label htmlFor="quote-file-upload" className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md cursor-pointer hover:border-[#c6e911]">
                                        <div className="space-y-1 text-center">
                                            <IconUpload className="mx-auto h-12 w-12 text-slate-400" />
                                            <p className="text-sm text-slate-600">{t('calculator.dragAndDrop')}</p>
                                        </div>
                                        <input id="quote-file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                                    </label>
                                ) : (
                                    <div className="mt-1 flex items-center justify-between p-3 border border-green-300 bg-green-50 rounded-md">
                                        <div className="flex items-center gap-3">
                                            <IconFile className="h-6 w-6 text-green-600"/>
                                            <p className="text-sm text-green-700">{file.name}</p>
                                        </div>
                                        <button type="button" onClick={handleRemoveFile} className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full">
                                            <IconDelete className="h-5 w-5"/>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 flex justify-end">
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="px-6 py-3 bg-[#c6e911] text-slate-800 font-bold rounded-lg hover:bg-[#adc40f] disabled:bg-slate-400 flex items-center justify-center min-w-[120px]"
                            >
                                {isSubmitting ? (
                                    <svg className="animate-spin h-5 w-5 text-slate-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : t('quoteRequest.submitButton')}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default QuoteRequestModal;