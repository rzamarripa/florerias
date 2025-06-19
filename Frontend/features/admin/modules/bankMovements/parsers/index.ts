import { parseBanBajio } from "./banbajioParser";
import { parseBanorte } from "./banorteParser";
import { parseBanamex } from "./banamexParser";
import { parseBBVA } from "./bbvaParser";
import { parseAfirme } from "./afirmeParser";
import { MovimientoBancario } from "./types";

type ParserFn = (json: any[][]) => MovimientoBancario[];

export function getParser(banco: string): ParserFn | null {
  switch (banco.toLowerCase()) {
    case "banbajio":
      return parseBanBajio;
    case "banorte":
      return parseBanorte;
    case "banamex":
      return parseBanamex;
    case "bbva":
    case "bbva bancomer":
      return parseBBVA;
    case "afirme":
      return parseAfirme;
    default:
      return null;
  }
}
