import type {
  SmileTransactionRow,
} from "../models/smile";

import type {
  PythonOcrRow,
} from "./ocrApi";


export function mapPythonRow(
  row: PythonOcrRow,
  index: number,
  sourceImageId: string,
  sourceImageName: string
): SmileTransactionRow {

  return {
    id: `${sourceImageId}-${index}-${Date.now()}`,

    sourceImageId,
    sourceImageName,

    sel: row.sel,
    pst: row.pst,

    folio: row.folio,
    bc: row.bc,

    voucher: row.voucher,

    code: row.code,
    description: row.description,

    room: row.room,

    amount: row.amount,

    originAmount:
      row.origin_amount,

    exchangeRate:
      row.exchange_rate,

    glAmount:
      row.gl_amount,

    refNo:
      row.ref_no,

    comment:
      row.comment,

    seri:
      row.seri,

    billNo:
      row.bill_no,

    cashier:
      row.cashier,

    postTime:
      row.post_time,

    billId:
      row.bill_id,

    printTime:
      row.print_time,

    chrPos:
      row.chr_pos,

    valid:
      row.valid,

    errors:
      row.errors ?? [],

    matchStatus:
      row.valid
        ? "NEW"
        : "INVALID",

    journalNo:
      null,

    duplicateOf:
      null,
  };
}