export interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
  format?: string; // Formato de número de ejemplo
}

export const countries: Country[] = [
  // Países más comunes primero
  { name: 'México', code: 'MX', dialCode: '52', flag: '🇲🇽', format: '## #### ####' },
  { name: 'Estados Unidos', code: 'US', dialCode: '1', flag: '🇺🇸', format: '### ### ####' },
  { name: 'España', code: 'ES', dialCode: '34', flag: '🇪🇸', format: '### ## ## ##' },
  { name: 'Argentina', code: 'AR', dialCode: '54', flag: '🇦🇷', format: '## #### ####' },
  { name: 'Colombia', code: 'CO', dialCode: '57', flag: '🇨🇴', format: '### ### ####' },
  { name: 'Perú', code: 'PE', dialCode: '51', flag: '🇵🇪', format: '### ### ###' },
  { name: 'Chile', code: 'CL', dialCode: '56', flag: '🇨🇱', format: '# #### ####' },
  { name: 'Ecuador', code: 'EC', dialCode: '593', flag: '🇪🇨', format: '## ### ####' },
  { name: 'Venezuela', code: 'VE', dialCode: '58', flag: '🇻🇪', format: '### ### ####' },
  { name: 'Guatemala', code: 'GT', dialCode: '502', flag: '🇬🇹', format: '#### ####' },
  { name: 'Cuba', code: 'CU', dialCode: '53', flag: '🇨🇺', format: '# ### ####' },
  { name: 'Bolivia', code: 'BO', dialCode: '591', flag: '🇧🇴', format: '# ### ####' },
  { name: 'República Dominicana', code: 'DO', dialCode: '1809', flag: '🇩🇴', format: '### ####' },
  { name: 'Honduras', code: 'HN', dialCode: '504', flag: '🇭🇳', format: '#### ####' },
  { name: 'Paraguay', code: 'PY', dialCode: '595', flag: '🇵🇾', format: '### ### ###' },
  { name: 'El Salvador', code: 'SV', dialCode: '503', flag: '🇸🇻', format: '#### ####' },
  { name: 'Nicaragua', code: 'NI', dialCode: '505', flag: '🇳🇮', format: '#### ####' },
  { name: 'Costa Rica', code: 'CR', dialCode: '506', flag: '🇨🇷', format: '#### ####' },
  { name: 'Panamá', code: 'PA', dialCode: '507', flag: '🇵🇦', format: '#### ####' },
  { name: 'Uruguay', code: 'UY', dialCode: '598', flag: '🇺🇾', format: '## ### ###' },
  { name: 'Brasil', code: 'BR', dialCode: '55', flag: '🇧🇷', format: '## ##### ####' },
  { name: 'Canadá', code: 'CA', dialCode: '1', flag: '🇨🇦', format: '### ### ####' },
  // Otros países
  { name: 'Reino Unido', code: 'GB', dialCode: '44', flag: '🇬🇧', format: '#### ######' },
  { name: 'Francia', code: 'FR', dialCode: '33', flag: '🇫🇷', format: '# ## ## ## ##' },
  { name: 'Alemania', code: 'DE', dialCode: '49', flag: '🇩🇪', format: '### ########' },
  { name: 'Italia', code: 'IT', dialCode: '39', flag: '🇮🇹', format: '### ### ####' },
  { name: 'Portugal', code: 'PT', dialCode: '351', flag: '🇵🇹', format: '### ### ###' },
  { name: 'Japón', code: 'JP', dialCode: '81', flag: '🇯🇵', format: '## #### ####' },
  { name: 'China', code: 'CN', dialCode: '86', flag: '🇨🇳', format: '### #### ####' },
  { name: 'India', code: 'IN', dialCode: '91', flag: '🇮🇳', format: '##### #####' },
  { name: 'Australia', code: 'AU', dialCode: '61', flag: '🇦🇺', format: '### ### ###' },
  { name: 'Rusia', code: 'RU', dialCode: '7', flag: '🇷🇺', format: '### ### ## ##' },
];

/**
 * Obtiene el país por defecto (México)
 */
export const getDefaultCountry = (): Country => {
  return countries[0]; // México
};

/**
 * Encuentra un país por su código de marcación
 */
export const findCountryByDialCode = (dialCode: string): Country | undefined => {
  return countries.find(c => c.dialCode === dialCode);
};

/**
 * Encuentra un país por su código ISO
 */
export const findCountryByCode = (code: string): Country | undefined => {
  return countries.find(c => c.code === code.toUpperCase());
};

/**
 * Detecta el código de país desde un número de teléfono
 */
export const detectCountryFromNumber = (phoneNumber: string): Country | undefined => {
  // Remover caracteres no numéricos
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  
  // Intentar encontrar el país por código de marcación
  // Ordenar por longitud de dialCode descendente para encontrar el más específico primero
  const sortedCountries = [...countries].sort((a, b) => b.dialCode.length - a.dialCode.length);
  
  for (const country of sortedCountries) {
    if (cleanNumber.startsWith(country.dialCode)) {
      return country;
    }
  }
  
  return undefined;
};

/**
 * Formatea un número de teléfono con el código de país
 */
export const formatPhoneWithCountryCode = (
  phoneNumber: string,
  country: Country
): string => {
  // Limpiar el número
  let cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  
  // Si el número ya tiene el código de país, removerlo
  if (cleanNumber.startsWith(country.dialCode)) {
    cleanNumber = cleanNumber.substring(country.dialCode.length);
  }
  
  // Log para debugging
  console.log('📱 formatPhoneWithCountryCode:', {
    country: country.name,
    countryCode: country.code,
    dialCode: country.dialCode,
    inputNumber: phoneNumber,
    cleanNumber: cleanNumber,
    cleanNumberLength: cleanNumber.length
  });
  
  // Para México, NO agregar el "1" - WhatsApp espera solo 52 + 10 dígitos
  // El formato correcto para WhatsApp México es: 52 + número de 10 dígitos
  if (country.code === 'MX') {
    console.log('🇲🇽 Formato México detectado - usando formato sin 1: 52' + cleanNumber);
    return `${country.dialCode}${cleanNumber}`;
  }
  
  // Para otros países, retornar con formato internacional estándar
  return `${country.dialCode}${cleanNumber}`;
};

/**
 * Formatea un número para mostrar con formato visual
 */
export const formatPhoneForDisplay = (
  phoneNumber: string,
  country: Country
): string => {
  // Limpiar el número
  let cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  
  // Si el número ya tiene el código de país, removerlo para el formato visual
  if (cleanNumber.startsWith(country.dialCode)) {
    cleanNumber = cleanNumber.substring(country.dialCode.length);
  }
  
  // Aplicar formato si está disponible
  if (country.format) {
    let formatted = '';
    let numberIndex = 0;
    
    for (let i = 0; i < country.format.length && numberIndex < cleanNumber.length; i++) {
      if (country.format[i] === '#') {
        formatted += cleanNumber[numberIndex];
        numberIndex++;
      } else {
        formatted += country.format[i];
      }
    }
    
    // Agregar cualquier dígito restante
    if (numberIndex < cleanNumber.length) {
      formatted += cleanNumber.substring(numberIndex);
    }
    
    return `+${country.dialCode} ${formatted}`;
  }
  
  // Sin formato específico, mostrar el número simple
  return `+${country.dialCode} ${cleanNumber}`;
};

/**
 * Valida si un número es válido para un país específico
 */
export const isValidPhoneNumber = (
  phoneNumber: string,
  country: Country
): boolean => {
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  
  // Verificar longitud mínima (generalmente 6-10 dígitos sin código de país)
  if (cleanNumber.length < 6) return false;
  
  // Verificar longitud máxima (generalmente no más de 15 dígitos en total)
  const fullNumber = formatPhoneWithCountryCode(cleanNumber, country);
  if (fullNumber.length > 15) return false;
  
  return true;
};

/**
 * Obtiene el último país usado desde localStorage
 */
export const getLastUsedCountry = (): Country | null => {
  if (typeof window === 'undefined') return null;
  
  const saved = localStorage.getItem('lastUsedCountryCode');
  if (saved) {
    return findCountryByCode(saved) || null;
  }
  return null;
};

/**
 * Guarda el último país usado en localStorage
 */
export const saveLastUsedCountry = (country: Country): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('lastUsedCountryCode', country.code);
};