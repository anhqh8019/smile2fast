import type {
  SmileTransactionRow,
} from "../models/smile";

import type {
  BatchRowDto,
} from "./batchApi";


export function mapBatchRow(
  row: BatchRowDto
): SmileTransactionRow {

  return {

    /*
     * Đây là ID phía frontend.
     * Không dùng DB ID trực tiếp làm numeric
     * vì Smile Grid đang dùng string.
     */
    id:
      `saved-${row.id}`,


    sourceImageId:
      "SAVED",

    sourceImageName:
      row.sourceImageName
      ?? "Batch đã lưu",


    sel:
      false,

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


    errors:
      row.errorMessage
        ? [row.errorMessage]
        : [],


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


    matchMessage:
      row.matchStatus ===
      "MATCHED"

        ? "Đã đối chiếu Smile DB"

        : null,


    duplicateOf:
      null,
  };
}