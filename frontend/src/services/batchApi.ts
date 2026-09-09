import type {
  MatchStatus,
  SmileTransactionRow,
} from "../models/smile";


export interface SaveBatchResponse {
  batchId: number;
  batchCode: string;
}


export interface BatchSummary {
  id: number;

  batchCode: string;

  businessDate: string | null;

  status: string;

  totalRows: number;

  validRows: number;

  matchedRows: number;

  invalidRows: number;

  duplicateRows: number;

  updatedAt: string;
}


export interface BatchRowDto {

  id: number;

  rowNo: number;

  sourceImageName: string | null;

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

  matchStatus: MatchStatus;

  journalNo: string | null;

  matchedTrnSeq: number | null;

  matchedAccNo: string | null;

  matchedGClient: string | null;

  errorMessage: string | null;
}


export interface BatchDetail {

  id: number;

  batchCode: string;

  businessDate: string | null;

  status: string;

  note: string | null;

  totalRows: number;

  validRows: number;

  matchedRows: number;

  invalidRows: number;

  duplicateRows: number;

  createdAt: string;

  updatedAt: string;

  rows: BatchRowDto[];
}


// =========================================================
// SAVE
// =========================================================

export async function saveBatch(
  batchId: number | null,
  rows: SmileTransactionRow[]
): Promise<SaveBatchResponse> {

  const body = {

    batchId,

    businessDate:
      null,

    note:
      null,

    rows:
      rows.map(
        row => ({

          sourceImageName:
            row.sourceImageName,

          pst:
            row.pst,

          folio:
            row.folio,

          bc:
            row.bc,

          voucher:
            row.voucher,

          code:
            row.code,

          description:
            row.description,

          room:
            row.room,

          amount:
            row.amount,

          originAmount:
            row.originAmount,

          exchangeRate:
            row.exchangeRate,

          glAmount:
            row.glAmount,

          refNo:
            row.refNo,

          comment:
            row.comment,

          seri:
            row.seri,

          billNo:
            row.billNo,

          cashier:
            row.cashier,

          postTime:
            row.postTime,

          billId:
            row.billId,

          printTime:
            row.printTime,

          chrPos:
            row.chrPos,

          valid:
            row.valid,

          matchStatus:
            row.matchStatus,

          journalNo:
            row.journalNo,

          matchedTrnSeq:
            row.matchedTrnSeq,

          matchedAccNo:
            row.matchedAccNo,

          matchedGClient:
            row.matchedGClient,

          errors:
            row.errors ?? [],
        })
      ),
  };


  const response =
    await fetch(
      "http://localhost:8080/api/batches/save",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            body
          ),
      }
    );


  if (!response.ok) {

    throw new Error(
      `Save batch thất bại: HTTP ${response.status}`
    );
  }


  return response.json();
}


// =========================================================
// LOAD LIST
// =========================================================

export async function getBatches():
Promise<BatchSummary[]> {

  const response =
    await fetch(
      "http://localhost:8080/api/batches"
    );


  if (!response.ok) {

    throw new Error(
      `Không tải được danh sách batch: HTTP ${response.status}`
    );
  }


  return response.json();
}


// =========================================================
// LOAD DETAIL
// =========================================================

export async function getBatch(
  batchId: number
): Promise<BatchDetail> {

  const response =
    await fetch(
      `http://localhost:8080/api/batches/${batchId}`
    );


  if (!response.ok) {

    throw new Error(
      `Không tải được batch ${batchId}: HTTP ${response.status}`
    );
  }


  return response.json();
}