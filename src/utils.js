export const formatDuration = (ms) => {
    if (!ms && ms !== 0) return '0h 0m';
    const totalMinutes = Math.floor(ms / (1000 * 60));

    // If less than 1 minute, show "< 1m" or seconds? Let's show seconds if practical, or just "< 1m"
    if (totalMinutes === 0) {
        return '< 1m';
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
};

export const formatDate = (date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
    }).format(date);
};

export const getStartOfMonth = () => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const getStartOfYear = () => {
    const date = new Date();
    return new Date(date.getFullYear(), 0, 1);
};

export const getInitials = (name) => {
    if (!name) return '?';
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
};
