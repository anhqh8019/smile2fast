import {
  useMemo,
} from "react";

import {
  AgGridReact,
} from "ag-grid-react";

import type {
  CellValueChangedEvent,
  ColDef,
} from "ag-grid-community";

import type {
  SmileTransactionRow,
} from "../models/smile";

import {
  revalidateRow,
} from "../services/validation";

import {
  markDuplicates,
} from "../services/duplicate";

import StatusBadge
  from "./StatusBadge";


interface Props {

  rows:
    SmileTransactionRow[];

  onRowsChange: (
    rows:
      SmileTransactionRow[]
  ) => void;

  onDeleteRow: (
    rowId: string
  ) => void;
}


export default function SmileGrid({
  rows,
  onRowsChange,
  onDeleteRow,
}: Props) {


  const formatNumber = (
    value:
      number |
      null |
      undefined
  ) => {

    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    return new Intl.NumberFormat(
      "vi-VN"
    ).format(
      value
    );
  };


  const parseNumber = (
    value: unknown
  ): number | null => {

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }


    if (
      typeof value ===
      "number"
    ) {
      return value;
    }


    const normalized =
      String(value)
        .trim()
        .replace(
          /,/g,
          ""
        );


    const result =
      Number(
        normalized
      );


    return Number.isFinite(
      result
    )
      ? result
      : null;
  };


  const columns =
    useMemo<
      ColDef<
        SmileTransactionRow
      >[]
    >(
      () => [

        // =====================================================
        // SOURCE
        // =====================================================

        {
          headerName:
            "Ảnh",

          field:
            "sourceImageName",

          width:
            130,

          editable:
            false,

          pinned:
            "left",
        },


        // =====================================================
        // SMILE DATA
        // =====================================================

        {
          headerName:
            "Pst",

          field:
            "pst",

          width:
            60,

          cellEditor:
            "agCheckboxCellEditor",

          cellRenderer:
            "agCheckboxCellRenderer",
        },


        {
          headerName:
            "Folio #",

          field:
            "folio",

          width:
            105,

          cellClassRules: {

            "cell-error":
              params =>
                !params.value ||
                !/^\d+$/.test(
                  String(
                    params.value
                  )
                ),
          },
        },


        {
          headerName:
            "BC",

          field:
            "bc",

          width:
            60,
        },


        {
          headerName:
            "Voucher",

          field:
            "voucher",

          width:
            180,

          cellClassRules: {

            "cell-error":
              params =>
                !params.value,
          },
        },


        {
          headerName:
            "Code",

          field:
            "code",

          width:
            75,

          cellClassRules: {

            "cell-error":
              params =>
                !params.value ||
                !/^\d+$/.test(
                  String(
                    params.value
                  )
                ),
          },
        },


        {
          headerName:
            "Description",

          field:
            "description",

          width:
            145,
        },


        {
          headerName:
            "Rm",

          field:
            "room",

          width:
            75,
        },


        {
          headerName:
            "Amount",

          field:
            "amount",

          width:
            130,

          valueFormatter:
            params =>
              formatNumber(
                params.value
              ),

          valueParser:
            params =>
              parseNumber(
                params.newValue
              ),

          cellClass:
            "money-cell",

          cellClassRules: {

            "cell-error":
              params =>
                params.value ===
                  null ||
                params.value ===
                  undefined,
          },
        },


        {
          headerName:
            "Origin Amt",

          field:
            "originAmount",

          width:
            125,

          valueFormatter:
            params =>
              formatNumber(
                params.value
              ),

          valueParser:
            params =>
              parseNumber(
                params.newValue
              ),

          cellClass:
            "money-cell",
        },


        {
          headerName:
            "Ex.Rate",

          field:
            "exchangeRate",

          width:
            85,

          valueParser:
            params =>
              parseNumber(
                params.newValue
              ),

          cellClassRules: {

            "cell-error":
              params =>
                params.value ===
                  null ||
                Number(
                  params.value
                ) <= 0,
          },
        },


        {
          headerName:
            "GL Amount",

          field:
            "glAmount",

          width:
            130,

          valueFormatter:
            params =>
              formatNumber(
                params.value
              ),

          valueParser:
            params =>
              parseNumber(
                params.newValue
              ),

          cellClass:
            "money-cell",

          cellClassRules: {

            "cell-error":
              params =>
                params.value ===
                  null ||
                params.value ===
                  undefined,
          },
        },


        {
          headerName:
            "Ref#",

          field:
            "refNo",

          width:
            130,
        },


        {
          headerName:
            "Comment",

          field:
            "comment",

          width:
            180,
        },


        {
          headerName:
            "Seri",

          field:
            "seri",

          width:
            105,
        },


        {
          headerName:
            "Bill#",

          field:
            "billNo",

          width:
            80,
        },


        {
          headerName:
            "Csh",

          field:
            "cashier",

          width:
            80,
        },


        {
          headerName:
            "Post Time",

          field:
            "postTime",

          width:
            180,
        },


        {
          headerName:
            "ChrPOS",

          field:
            "chrPos",

          width:
            80,
        },


        // =====================================================
        // MATCH RESULT
        // =====================================================

        {
          headerName:
            "Status",

          field:
            "matchStatus",

          width:
            115,

          editable:
            false,

          pinned:
            "right",

          cellRenderer:
            (params: any) => (

              <StatusBadge
                status={
                  params.data
                    .matchStatus
                }
              />
            ),
        },


        {
          headerName:
            "Journal",

          field:
            "journalNo",

          width:
            130,

          editable:
            false,
        },


        {
          headerName:
            "TrnSeq",

          field:
            "matchedTrnSeq",

          width:
            95,

          editable:
            false,
        },


        {
          headerName:
            "AccNo",

          field:
            "matchedAccNo",

          width:
            95,

          editable:
            false,
        },


        {
          headerName:
            "GClient",

          field:
            "matchedGClient",

          width:
            115,

          editable:
            false,
        },


        {
          headerName:
            "Match Result",

          field:
            "matchMessage",

          width:
            240,

          editable:
            false,
        },


        {
          headerName:
            "Errors",

          field:
            "errors",

          width:
            230,

          editable:
            false,

          valueFormatter:
            params =>
              params.value
                ?.join("; ")
              ?? "",
        },


        // =====================================================
        // ACTION
        // =====================================================

        {
          headerName:
            "Action",

          width:
            80,

          pinned:
            "right",

          editable:
            false,

          sortable:
            false,

          filter:
            false,

          cellRenderer:
            (params: any) => (

              <button
                className=
                  "delete-row-button"

                onClick={() =>
                  onDeleteRow(
                    params.data.id
                  )
                }
              >
                Xóa
              </button>
            ),
        },

      ],

      [
        onDeleteRow,
      ]
    );


  const defaultColDef =
    useMemo<
      ColDef<
        SmileTransactionRow
      >
    >(
      () => ({

        editable:
          true,

        resizable:
          true,

        sortable:
          true,

        filter:
          true,

      }),
      []
    );


  // =========================================================
  // CELL CHANGED
  // =========================================================

  const handleCellChanged = (
    event:
      CellValueChangedEvent<
        SmileTransactionRow
      >
  ) => {


    const oldStatus =
      event.data
        .matchStatus;


    const needResetMatch =
      oldStatus ===
        "MATCHED"
      ||
      oldStatus ===
        "NOT_FOUND"
      ||
      oldStatus ===
        "AMBIGUOUS";


    let changed =
      revalidateRow({

        ...event.data,


        matchStatus:
          needResetMatch
            ? "NEW"
            : event.data
                .matchStatus,


        journalNo:
          needResetMatch
            ? null
            : event.data
                .journalNo,


        matchedTrnSeq:
          needResetMatch
            ? null
            : event.data
                .matchedTrnSeq,


        matchedAccNo:
          needResetMatch
            ? null
            : event.data
                .matchedAccNo,


        matchedGClient:
          needResetMatch
            ? null
            : event.data
                .matchedGClient,


        matchMessage:
          needResetMatch
            ? "Dữ liệu thay đổi, cần đối chiếu lại"
            : event.data
                .matchMessage,
      });


    let updated =
      rows.map(
        row =>
          row.id ===
          changed.id

            ? changed

            : row
      );


    updated =
      markDuplicates(
        updated
      );


    onRowsChange(
      updated
    );
  };


  // =========================================================
  // ROW COLORS
  // =========================================================

  const rowClassRules = {

    "row-invalid":
      (params: any) =>
        params.data
          ?.matchStatus ===
        "INVALID",


    "row-matched":
      (params: any) =>
        params.data
          ?.matchStatus ===
        "MATCHED",


    "row-duplicate":
      (params: any) =>
        params.data
          ?.matchStatus ===
        "DUPLICATE",


    "row-not-found":
      (params: any) =>
        params.data
          ?.matchStatus ===
        "NOT_FOUND",


    "row-ambiguous":
      (params: any) =>
        params.data
          ?.matchStatus ===
        "AMBIGUOUS",
  };


  return (

    <div
      className=
        "smile-grid"
    >

      <AgGridReact

        rowData={
          rows
        }

        columnDefs={
          columns
        }

        defaultColDef={
          defaultColDef
        }

        getRowId={
          params =>
            params.data.id
        }

        onCellValueChanged={
          handleCellChanged
        }

        rowClassRules={
          rowClassRules
        }

        singleClickEdit={
          true
        }

        stopEditingWhenCellsLoseFocus={
          true
        }

        undoRedoCellEditing={
          true
        }

        undoRedoCellEditingLimit={
          30
        }

      />

    </div>
  );
}