import { z } from "zod";

const validateRFC = (rfc: string): boolean => {
  const cleanRFC = rfc.trim().toUpperCase();
  
  const personaFisicaRegex = /^[A-Z]{4}[0-9]{6}[A-Z0-9]{3}$/;
  
  const personaMoralRegex = /^[A-Z]{3}[0-9]{6}[A-Z0-9]{3}$/;
  
  if (cleanRFC.length !== 12 && cleanRFC.length !== 13) {
    return false;
  }
  
  if (cleanRFC.length === 13) {
    if (!personaFisicaRegex.test(cleanRFC)) {
      return false;
    }
  } else {
    if (!personaMoralRegex.test(cleanRFC)) {
      return false;
    }
  }
  
  const month = parseInt(cleanRFC.substring(cleanRFC.length === 13 ? 6 : 5, cleanRFC.length === 13 ? 8 : 7));
  const day = parseInt(cleanRFC.substring(cleanRFC.length === 13 ? 8 : 7, cleanRFC.length === 13 ? 10 : 9));
  
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  if (month === 2 && day > 29) return false;
  if ((month === 4 || month === 6 || month === 9 || month === 11) && day > 30) return false;
  
  return true;
};

export const companySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  legalRepresentative: z.string().min(1, "El representante legal es requerido"),
  rfc: z.string()
    .min(1, "El RFC es requerido")
    .transform(val => val.trim().toUpperCase()) 
    .refine(validateRFC, {
      message: "El RFC no tiene un formato válido. Debe ser de 12 caracteres para persona moral (3 letras + 6 dígitos + 3 alfanuméricos) o 13 caracteres para persona física (4 letras + 6 dígitos + 3 alfanuméricos)"
    }),
  address: z.string().min(1, "La dirección es requerida"),
});

export type CompanyFormData = z.infer<typeof companySchema>;

