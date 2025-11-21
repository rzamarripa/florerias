export interface RGBColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface StageCatalog {
  _id: string;
  administrator: {
    _id: string;
    name: string;
    email: string;
  };
  company: {
    _id: string;
    legalName: string;
    tradeName?: string;
  };
  name: string;
  abreviation: string;
  stageNumber: number;
  boardType: "Produccion" | "Envio";
  color: RGBColor;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStageCatalogData {
  name: string;
  abreviation: string;
  stageNumber: number;
  boardType: "Produccion" | "Envio";
  color: RGBColor;
  company?: string; // Solo para Super Admin
}

export interface UpdateStageCatalogData {
  name?: string;
  abreviation?: string;
  stageNumber?: number;
  boardType?: "Produccion" | "Envio";
  color?: RGBColor;
}
