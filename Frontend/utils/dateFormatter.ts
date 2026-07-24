export const formatDate = (date: string | Date): string => {
    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch {
        return date.toString();
    }
};

export const formatDateTime = (date: string | Date): string => {
    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch {
        return date.toString();
    }
};

export const formatDateRange = (startDate: string | Date, endDate: string | Date): string => {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};
