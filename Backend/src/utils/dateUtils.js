/**
 * Utilidades para el manejo de fechas
 */

/**
 * Calcula el jueves de la semana siguiente a la fecha proporcionada
 * @param {Date|string} fecha - Fecha de referencia
 * @returns {Date} - Fecha del jueves de la semana siguiente
 */
export const getNextThursdayOfWeek = (fecha) => {
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
 * Formatea una fecha para mostrar en formato legible
 * @param {Date|string} fecha - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
export const formatDate = (fecha) => {
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
 * @param {Date|string} fecha - Fecha a verificar
 * @returns {boolean} - true si es jueves, false en caso contrario
 */
export const isThursday = (fecha) => {
    const date = new Date(fecha);
    return date.getDay() === 4;
}; 