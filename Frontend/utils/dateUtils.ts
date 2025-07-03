/**
 * Utilidades para el manejo de fechas en el frontend
 */

import { format } from 'date-fns-tz';
import { toZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';

/**
 * Calcula el jueves de la semana siguiente a la fecha proporcionada
 * @param fecha - Fecha de referencia
 * @returns Fecha del jueves de la semana siguiente
 */
export const getNextThursdayOfWeek = (fecha: Date | string): Date => {
    const date = new Date(fecha);
    // Día de la semana: 0=Domingo, 1=Lunes, ..., 6=Sábado
    const dayOfWeek = date.getDay();
    // Días hasta el próximo lunes
    const daysToNextMonday = ((8 - dayOfWeek) % 7) || 7;
    const nextMonday = new Date(date);
    nextMonday.setDate(date.getDate() + daysToNextMonday);
    // Jueves = lunes + 3 días
    nextMonday.setDate(nextMonday.getDate() + 3);
    nextMonday.setHours(0, 0, 0, 0);
    return nextMonday;
};

/**
 * Obtiene el jueves de la semana siguiente a la fecha actual
 * @returns Fecha del jueves de la semana siguiente desde hoy
 */
export const getNextThursdayFromToday = (): Date => {
    return getNextThursdayOfWeek(new Date());
};

/**
 * Formatea una fecha para mostrar en formato legible
 * @param fecha - Fecha a formatear
 * @param formato - Formato de la fecha
 * @returns Fecha formateada
 */
export const formatDate = (fecha: Date | string, formato: string = "EEEE, d 'de' MMMM 'de' yyyy"): string => {
    const timeZone = 'America/Mexico_City';
    const zonedDate = toZonedTime(new Date(fecha), timeZone);
    return format(zonedDate, formato, { locale: es });
};

/**
 * Verifica si una fecha es un jueves
 * @param fecha - Fecha a verificar
 * @returns true si es jueves, false en caso contrario
 */
export const isThursday = (fecha: Date | string): boolean => {
    const date = new Date(fecha);
    return date.getDay() === 4;
};

/**
 * Obtiene el nombre del día de la semana en español
 * @param fecha - Fecha
 * @returns Nombre del día de la semana
 */
export const getDayName = (fecha: Date | string): string => {
    const date = new Date(fecha);
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()];
}; 