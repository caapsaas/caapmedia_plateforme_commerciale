import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n';

interface IdleTimeoutModalProps {
    isOpen: boolean;
    onLogout: () => void;
    onStayLoggedIn: () => void;
}

const COUNTDOWN_SECONDS = 60;

const IdleTimeoutModal: React.FC<IdleTimeoutModalProps> = ({ isOpen, onLogout, onStayLoggedIn }) => {
    const { t } = useI18n();
    const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

    useEffect(() => {
        if (!isOpen) {
            setCountdown(COUNTDOWN_SECONDS);
            return;
        }

        if (countdown <= 0) {
            onLogout();
            return;
        }

        const intervalId = setInterval(() => {
            setCountdown(prev => prev - 1);
        }, 1000);

        return () => clearInterval(intervalId);

    }, [isOpen, countdown, onLogout]);
    
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center" role="dialog" aria-modal="true">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 text-center">
                <h3 className="text-xl font-bold text-slate-800">{t('idleModal.title')}</h3>
                <p className="mt-4 text-slate-600">
                    {t('idleModal.message', { countdown: countdown.toString() })}
                </p>
                <div className="mt-6 flex justify-center space-x-4">
                    <button onClick={onStayLoggedIn} className="px-6 py-2 bg-[#b9d45b] text-slate-800 font-semibold rounded-md hover:bg-[#a8c54d] transition-colors">
                        {t('idleModal.stayLoggedIn')}
                    </button>
                    <button onClick={onLogout} className="px-6 py-2 bg-slate-200 text-slate-700 font-semibold rounded-md hover:bg-slate-300 transition-colors">
                        {t('idleModal.logout')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IdleTimeoutModal;
