import type {
  SmileTransactionRow,
} from "../models/smile";


export interface SmileMatchResultDto {
  rowId: string;

  status:
    | "MATCHED"
    | "NOT_FOUND"
    | "AMBIGUOUS"
    | "INVALID";

  message: string | null;

  journalNo: string | null;

  matchedTrnSeq: number | null;

  matchedAccNo: string | null;

  matchedGClient: string | null;

  candidates: unknown[];
}


export interface SmileMatchResponse {
  total: number;

  matched: number;

  notFound: number;

  ambiguous: number;

  invalid: number;

  results: SmileMatchResultDto[];
}


export async function matchSmileRows(
  rows: SmileTransactionRow[]
): Promise<SmileMatchResponse> {

  const body = {
    rows: rows.map(
      row => ({
        id: row.id,

        pst: row.pst,

        folio: row.folio,

        voucher: row.voucher,

        amount: row.amount,

        glAmount: row.glAmount,

        refNo: row.refNo,
      })
    ),
  };


  const response =
    await fetch(
      "http://localhost:8080/api/smile/match",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(
          body
        ),
      }
    );


  if (!response.ok) {

    let message =
      `Đối chiếu Smile thất bại: HTTP ${response.status}`;

    try {

      const error =
        await response.json();

      message =
        error?.message
        ?? error?.error
        ?? message;

    } catch {
      // giữ message mặc định
    }

    throw new Error(
      message
    );
  }


  return response.json();
}