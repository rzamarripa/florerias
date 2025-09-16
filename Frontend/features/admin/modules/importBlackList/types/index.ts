export interface BlackListProvider {
  _id: string;
  rfc: string;
  nombre: string;
  situacion: string;
  numeroFechaOficioGlobalPresuncion: string;
  publicacionPaginaSATPresuntos: string;
  publicacionDOFPresuntos: string;
  publicacionPaginaSATDesvirtuados?: string | null;
  numeroFechaOficioGlobalDesvirtuados?: string | null;
  publicacionDOFDesvirtuados?: string | null;
  numeroFechaOficioGlobalDefinitivos?: string | null;
  publicacionPaginaSATDefinitivos?: string | null;
  publicacionDOFDefinitivos?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SummaryData {
  totalProviders: number;
  activeProviders: number;
  desvirtualizedProviders: number;
  definitiveProviders: number;
}

export interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

// Data format from the parsed XLSX file
export interface RawBlackListProviderData {
  'RFC': string;
  'Nombre': string;
  'Situación': string;
  'Número y fecha de oficio global de presunción': string;
  'Publicación página SAT presuntos': string;
  'Publicación DOF presuntos': string;
  'Publicación página SAT desvirtuados'?: string;
  'Número y fecha de oficio global de contribuyentes que desvirtuaron'?: string;
  'Publicación DOF desvirtuados'?: string;
  'Número y fecha de oficio global de definitivos'?: string;
  'Publicación página SAT definitivos'?: string;
  'Publicación DOF definitivos'?: string;
}