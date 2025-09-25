import { useState, useEffect, useRef, useCallback } from 'react';

interface IdleTimerProps {
    onIdle: () => void;
    timeout: number; // in milliseconds
}

const useIdleTimer = ({ onIdle, timeout }: IdleTimerProps) => {
    const timeoutId = useRef<number | null>(null);

    const reset = useCallback(() => {
        if (timeoutId.current) {
            clearTimeout(timeoutId.current);
        }
        timeoutId.current = window.setTimeout(onIdle, timeout);
    }, [onIdle, timeout]);

    useEffect(() => {
        const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

        const handleEvent = () => {
            reset();
        };

        events.forEach(event => {
            window.addEventListener(event, handleEvent, { passive: true });
        });
        
        reset(); // Initial setup

        return () => {
            if (timeoutId.current) {
                clearTimeout(timeoutId.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, handleEvent);
            });
        };
    }, [reset]);

    return { reset };
};

export default useIdleTimer;
