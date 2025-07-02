/**
 * Utilidades para el manejo de fechas en el frontend
 */

/**
 * Calcula el jueves de la semana siguiente a la fecha proporcionada
 * @param fecha - Fecha de referencia
 * @returns Fecha del jueves de la semana siguiente
 */
export const getNextThursdayOfWeek = (fecha: Date | string): Date => {
    const date = new Date(fecha);
    
    // Obtener el día de la semana (0 = Domingo, 1 = Lunes, ..., 4 = Jueves, ..., 6 = Sábado)
    const dayOfWeek = date.getDay();
    
    // Calcular cuántos días hay que agregar para llegar al jueves de la semana siguiente
    // Primero avanzamos al domingo de la semana siguiente (7 días), luego al jueves (+4 días)
    const daysToNextWeekSunday = 7 - dayOfWeek; // Días para llegar al domingo de la semana siguiente
    const daysToThursday = 4; // Jueves es el día 4 de la semana (0-indexed)
    const totalDaysToAdd = daysToNextWeekSunday + daysToThursday;
    
    // Crear la nueva fecha
    const nextThursday = new Date(date);
    nextThursday.setDate(date.getDate() + totalDaysToAdd);
    
    // Establecer la hora a 00:00:00 para consistencia
    nextThursday.setHours(0, 0, 0, 0);
    
    return nextThursday;
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
 * @returns Fecha formateada
 */
export const formatDate = (fecha: Date | string): string => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
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