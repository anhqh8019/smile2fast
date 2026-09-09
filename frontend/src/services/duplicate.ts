import type {
  SmileTransactionRow,
} from "../models/smile";


export function buildTransactionKey(
  row: SmileTransactionRow
): string {

  return [
    row.voucher ?? "",
    row.folio ?? "",
    row.refNo ?? "",
    row.amount ?? "",
  ].join("|");
}


export function markDuplicates(
  rows: SmileTransactionRow[]
): SmileTransactionRow[] {

  const firstByKey =
    new Map<
      string,
      SmileTransactionRow
    >();


  return rows.map(
    row => {

      const key =
        buildTransactionKey(row);

      // Không đánh duplicate nếu key quá thiếu.
      if (
        !row.voucher ||
        !row.folio ||
        row.amount === null
      ) {
        return row;
      }

      const existing =
        firstByKey.get(key);

      if (!existing) {

        firstByKey.set(
          key,
          row
        );

        if (
          row.matchStatus ===
          "DUPLICATE"
        ) {
          return {
            ...row,
            matchStatus:
              row.valid
                ? "NEW"
                : "INVALID",
            duplicateOf: null,
          };
        }

        return row;
      }

      return {
        ...row,

        matchStatus:
          "DUPLICATE",

        duplicateOf:
          existing.id,
      };
    }
  );
}