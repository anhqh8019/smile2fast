import type {
  SmileTransactionRow,
} from "../models/smile";


export function validateSmileRow(
  row: SmileTransactionRow
): string[] {

  const errors: string[] =
    [];


  if (
    !row.folio ||
    !/^\d+$/.test(
      row.folio.trim()
    )
  ) {
    errors.push(
      "Folio không hợp lệ"
    );
  }


  if (
    !row.voucher ||
    !row.voucher.trim()
  ) {
    errors.push(
      "Thiếu Voucher"
    );
  }


  if (
    !row.code ||
    !/^\d+$/.test(
      row.code.trim()
    )
  ) {
    errors.push(
      "Code không hợp lệ"
    );
  }


  if (
    row.amount === null
  ) {
    errors.push(
      "Không đọc được Amount"
    );
  }


  if (
    row.glAmount === null
  ) {
    errors.push(
      "Không đọc được GLAmount"
    );
  }


  if (
    row.exchangeRate === null ||
    row.exchangeRate <= 0
  ) {
    errors.push(
      "Exchange Rate không hợp lệ"
    );
  }


  return errors;
}


export function revalidateRow(
  row: SmileTransactionRow
): SmileTransactionRow {

  const errors =
    validateSmileRow(
      row
    );


  if (
    errors.length > 0
  ) {

    return {
      ...row,

      valid:
        false,

      errors,

      matchStatus:
        "INVALID",
    };
  }


  return {
    ...row,

    valid:
      true,

    errors: [],

    matchStatus:
      row.matchStatus ===
      "DUPLICATE"

        ? "DUPLICATE"

        : row.matchStatus ===
          "MATCHED"

          ? "MATCHED"

          : "NEW",
  };
}