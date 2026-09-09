export type MatchStatus =
  | "NEW"
  | "MATCHED"
  | "NOT_FOUND"
  | "AMBIGUOUS"
  | "INVALID"
  | "DUPLICATE";

export type ImageOcrStatus =
  | "NEW"
  | "OCR_RUNNING"
  | "DONE"
  | "ERROR";


export interface SmileBatchImage {
  id: string;

  file: File;

  fileName: string;

  previewUrl: string;

  status: ImageOcrStatus;

  rowCount: number;

  error: string | null;
}


export interface SmileTransactionRow {

  id: string;

  sourceImageId: string;

  sourceImageName: string;


  sel: boolean;

  pst: boolean;


  folio: string | null;

  bc: string | null;

  voucher: string | null;


  code: string | null;

  description: string | null;

  room: string | null;


  amount: number | null;

  originAmount: number | null;

  exchangeRate: number | null;

  glAmount: number | null;


  refNo: string | null;

  comment: string | null;


  seri: string | null;

  billNo: string | null;


  cashier: string | null;

  postTime: string | null;


  billId: string | null;

  printTime: string | null;

  chrPos: string | null;


  valid: boolean;

  errors: string[];


  matchStatus: MatchStatus;


  /**
   * JournalNo thực tế trong GLTRN.
   *
   * VD:
   * RV26/08-289
   */
  journalNo: string | null;


  /**
   * Kết quả match Smile DB
   */
  matchedTrnSeq: number | null;

  matchedAccNo: string | null;

  matchedGClient: string | null;

  matchMessage: string | null;


  duplicateOf: string | null;
}