import { format } from 'date-fns-tz';
import { toZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';

export const getNextThursdayOfWeek = (fecha: Date | string): Date => {
    const date = new Date(fecha);
    const dayOfWeek = date.getDay();
    const daysToNextMonday = ((8 - dayOfWeek) % 7) || 7;
    const nextMonday = new Date(date);
    nextMonday.setDate(date.getDate() + daysToNextMonday);
    nextMonday.setDate(nextMonday.getDate() + 3);
    nextMonday.setHours(0, 0, 0, 0);
    return nextMonday;
};

export const getNextThursdayFromToday = (): Date => {
    return getNextThursdayOfWeek(new Date());
};

export const formatDate = (fecha: Date | string, formato: string = "EEEE, d 'de' MMMM 'de' yyyy"): string => {
    const timeZone = 'America/Mexico_City';
    const zonedDate = toZonedTime(new Date(fecha), timeZone);
    return format(zonedDate, formato, { locale: es });
};

export const isThuformatDatersday = (fecha: Date | string): boolean => {
    const date = new Date(fecha);
    return date.getDay() === 4;
};

export const getDayName = (fecha: Date | string): string => {
    const date = new Date(fecha);
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()];
};

export const formatDateTime = (fecha: any): string => {
    if (!fecha) return "";
    try {
        const d = new Date(fecha);
        if (isNaN(d.getTime())) return String(fecha);
        return d.toLocaleString("es-MX", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return String(fecha);
    }
}; 