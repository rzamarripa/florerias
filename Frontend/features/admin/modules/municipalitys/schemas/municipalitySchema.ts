import { z } from "zod";

// Lista de países válidos para validación
const VALID_COUNTRIES = [
    "Afganistán", "Albania", "Alemania", "Andorra", "Angola", "Argentina", "Armenia", "Australia",
    "Austria", "Azerbaiyán", "Bahamas", "Bangladés", "Barbados", "Bélgica", "Belice", "Benín",
    "Bielorrusia", "Birmania", "Bolivia", "Bosnia y Herzegovina", "Botsuana", "Brasil", "Brunéi",
    "Bulgaria", "Burkina Faso", "Burundi", "Bután", "Cabo Verde", "Camboya", "Camerún", "Canadá",
    "Catar", "Chad", "Chile", "China", "Chipre", "Colombia", "Comoras", "Corea del Norte",
    "Corea del Sur", "Costa de Marfil", "Costa Rica", "Croacia", "Cuba", "Dinamarca", "Dominica",
    "Ecuador", "Egipto", "El Salvador", "Emiratos Árabes Unidos", "Eritrea", "Eslovaquia",
    "Eslovenia", "España", "Estados Unidos", "Estonia", "Etiopía", "Filipinas", "Finlandia",
    "Fiyi", "Francia", "Gabón", "Gambia", "Georgia", "Ghana", "Granada", "Grecia", "Guatemala",
    "Guinea", "Guinea-Bisáu", "Guinea Ecuatorial", "Guyana", "Haití", "Honduras", "Hungría",
    "India", "Indonesia", "Irak", "Irán", "Irlanda", "Islandia", "Israel", "Italia", "Jamaica",
    "Japón", "Jordania", "Kazajistán", "Kenia", "Kirguistán", "Kiribati", "Kuwait", "Laos",
    "Lesoto", "Letonia", "Líbano", "Liberia", "Libia", "Liechtenstein", "Lituania", "Luxemburgo",
    "Madagascar", "Malasia", "Malaui", "Maldivas", "Malí", "Malta", "Marruecos", "Mauricio",
    "Mauritania", "México", "Micronesia", "Moldavia", "Mónaco", "Mongolia", "Montenegro",
    "Mozambique", "Namibia", "Nauru", "Nepal", "Nicaragua", "Níger", "Nigeria", "Noruega",
    "Nueva Zelanda", "Omán", "Países Bajos", "Pakistán", "Palaos", "Panamá", "Papúa Nueva Guinea",
    "Paraguay", "Perú", "Polonia", "Portugal", "Reino Unido", "República Centroafricana",
    "República Checa", "República del Congo", "República Democrática del Congo", "República Dominicana",
    "Ruanda", "Rumanía", "Rusia", "Samoa", "San Cristóbal y Nieves", "San Marino", "San Vicente y las Granadinas",
    "Santa Lucía", "Santo Tomé y Príncipe", "Senegal", "Serbia", "Seychelles", "Sierra Leona",
    "Singapur", "Siria", "Somalia", "Sri Lanka", "Suazilandia", "Sudáfrica", "Sudán", "Sudán del Sur",
    "Suecia", "Suiza", "Surinam", "Tailandia", "Tanzania", "Tayikistán", "Timor Oriental", "Togo",
    "Tonga", "Trinidad y Tobago", "Túnez", "Turkmenistán", "Turquía", "Tuvalu", "Ucrania", "Uganda",
    "Uruguay", "Uzbekistán", "Vanuatu", "Vaticano", "Venezuela", "Vietnam", "Yemen", "Yibuti",
    "Zambia", "Zimbabue"
] as const;

// Lista de estados válidos para validación (ejemplo con algunos estados)
const VALID_STATES = [
    "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas", "Chihuahua",
    "Coahuila", "Colima", "Durango", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "México",
    "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo",
    "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas",
    // Estados Unidos
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
    "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
    "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri",
    "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina",
    "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
    "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
    // Canadá
    "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Northwest Territories",
    "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon"
] as const;

export const municipalitySchema = z.object({
    name: z
        .string()
        .min(1, "El nombre del municipio es requerido")
        .min(2, "El nombre del municipio debe tener al menos 2 caracteres")
        .max(100, "El nombre del municipio no puede exceder los 100 caracteres")
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s.-]+$/, "El nombre del municipio solo puede contener letras, espacios, puntos y guiones"),
    state: z
        .string()
        .min(1, "El estado es requerido")
        .refine(
            (value) => VALID_STATES.includes(value as any),
            "Por favor selecciona un estado válido de la lista"
        ),
    country: z
        .string()
        .min(1, "El país es requerido")
        .refine(
            (value) => VALID_COUNTRIES.includes(value as any),
            "Por favor selecciona un país válido de la lista"
        ),
});

export type MunicipalityFormData = z.infer<typeof municipalitySchema>;

export { VALID_COUNTRIES as AVAILABLE_COUNTRIES, VALID_STATES as AVAILABLE_STATES };