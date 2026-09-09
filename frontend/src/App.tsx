import {
  useMemo,
  useState,
} from "react";

import MultiImageUpload
  from "./components/MultiImageUpload";

import SmileGrid
  from "./components/SmileGrid";

import type {
  SmileBatchImage,
  SmileTransactionRow,
} from "./models/smile";

import {
  scanSmileImage,
} from "./services/ocrApi";

import {
  mapPythonRow,
} from "./services/ocrMapper";

import {
  markDuplicates,
} from "./services/duplicate";

import {
  revalidateRow,
} from "./services/validation";

import {
  matchSmileRows,
} from "./services/smileMatchApi";

import {
  getBatch,
  getBatches,
  saveBatch,
} from "./services/batchApi";

import type {
  BatchSummary,
} from "./services/batchApi";

import {
  mapBatchRow,
} from "./services/batchMapper";


import "./styles.css";


export default function App() {

  const [
  batchId,
  setBatchId,
] =
  useState<number | null>(
    null
  );


const [
  batchCode,
  setBatchCode,
] =
  useState<string | null>(
    null
  );


const [
  saving,
  setSaving,
] =
  useState(false);


const [
  loadingBatch,
  setLoadingBatch,
] =
  useState(false);


const [
  showLoadDialog,
  setShowLoadDialog,
] =
  useState(false);


const [
  savedBatches,
  setSavedBatches,
] =
  useState<
    BatchSummary[]
  >([]);

  // =========================================================
  // STATE
  // =========================================================

  const [
    images,
    setImages,
  ] =
    useState<
      SmileBatchImage[]
    >([]);


  const [
    rows,
    setRows,
  ] =
    useState<
      SmileTransactionRow[]
    >([]);


  const [
    running,
    setRunning,
  ] =
    useState(
      false
    );


  const [
    matching,
    setMatching,
  ] =
    useState(
      false
    );


  const [
    globalError,
    setGlobalError,
  ] =
    useState<
      string | null
    >(null);


  // =========================================================
  // ADD IMAGES
  // =========================================================

  const handleFilesSelected = (
    files: File[]
  ) => {

    const newImages =
      files.map(
        (
          file,
          index
        ): SmileBatchImage => {

          const id =
            `${Date.now()}-${index}-${file.name}`;


          return {

            id,

            file,

            fileName:
              file.name,

            previewUrl:
              URL.createObjectURL(
                file
              ),

            status:
              "NEW",

            rowCount:
              0,

            error:
              null,
          };
        }
      );


    setImages(
      previous => [
        ...previous,
        ...newImages,
      ]
    );
  };


  // =========================================================
  // OCR ONE IMAGE
  // =========================================================

  const ocrImage = async (
    image:
      SmileBatchImage,

    forceOcr =
      false
  ) => {


    setImages(
      previous =>
        previous.map(
          item =>

            item.id ===
            image.id

              ? {
                  ...item,

                  status:
                    "OCR_RUNNING",

                  error:
                    null,
                }

              : item
        )
    );


    try {

      const response =
        await scanSmileImage(
          image.file,
          forceOcr
        );


      const newRows =
        response.rows.map(
          (
            row,
            index
          ) =>
            mapPythonRow(

              row,

              index,

              image.id,

              image.fileName
            )
        );


      setRows(
        previous => {

          // OCR lại ảnh:
          // bỏ dữ liệu cũ của ảnh đó.

          const remaining =
            previous.filter(
              row =>
                row.sourceImageId
                !== image.id
            );


          return markDuplicates([
            ...remaining,
            ...newRows,
          ]);
        }
      );


      setImages(
        previous =>
          previous.map(
            item =>

              item.id ===
              image.id

                ? {
                    ...item,

                    status:
                      "DONE",

                    rowCount:
                      newRows.length,

                    error:
                      null,
                  }

                : item
          )
      );

    } catch (error) {

      const message =
        error instanceof Error

          ? error.message

          : "OCR thất bại";


      setImages(
        previous =>
          previous.map(
            item =>

              item.id ===
              image.id

                ? {
                    ...item,

                    status:
                      "ERROR",

                    error:
                      message,
                  }

                : item
          )
      );
    }
  };


  // =========================================================
  // OCR ALL
  // =========================================================

  const handleOcrAll =
    async () => {

      if (
        images.length ===
        0
      ) {
        return;
      }


      setRunning(
        true
      );

      setGlobalError(
        null
      );


      try {

        for (
          const image
          of images
        ) {

          if (
            image.status ===
            "DONE"
          ) {
            continue;
          }


          await ocrImage(
            image
          );
        }

      } catch (error) {

        setGlobalError(

          error instanceof Error

            ? error.message

            : "OCR batch thất bại"
        );

      } finally {

        setRunning(
          false
        );
      }
    };


  // =========================================================
  // OCR AGAIN
  // =========================================================

  const handleForceOcrOne =
    async (
      image:
        SmileBatchImage
    ) => {

      setRunning(
        true
      );


      try {

        await ocrImage(
          image,
          true
        );

      } finally {

        setRunning(
          false
        );
      }
    };


  // =========================================================
  // DELETE IMAGE
  // =========================================================

  const handleDeleteImage = (
    image:
      SmileBatchImage
  ) => {

    const ok =
      window.confirm(
        `Xóa ảnh "${image.fileName}" và toàn bộ row của ảnh này?`
      );


    if (!ok) {
      return;
    }


    URL.revokeObjectURL(
      image.previewUrl
    );


    setImages(
      previous =>
        previous.filter(
          item =>
            item.id !==
            image.id
        )
    );


    setRows(
      previous =>
        markDuplicates(
          previous.filter(
            row =>
              row.sourceImageId !==
              image.id
          )
        )
    );
  };

//========================================================
// Save Batch
//=================================================
const handleSaveBatch =
  async () => {

    if (
      rows.length === 0
    ) {

      alert(
        "Không có dữ liệu để lưu."
      );

      return;
    }


    setSaving(
      true
    );

    setGlobalError(
      null
    );


    try {

      const result =
        await saveBatch(
          batchId,
          rows
        );


      setBatchId(
        result.batchId
      );


      setBatchCode(
        result.batchCode
      );


      alert(
        [
          "Đã lưu batch thành công.",
          "",
          `Batch ID: ${result.batchId}`,
          `Batch Code: ${result.batchCode}`,
          `Rows: ${rows.length}`,
          `Matched: ${matchedCount}`,
        ].join("\n")
      );

    } catch (error) {

      console.error(
        "Save batch error:",
        error
      );


      setGlobalError(

        error instanceof Error

          ? error.message

          : "Save batch thất bại"
      );

    } finally {

      setSaving(
        false
      );
    }
  };

  const handleOpenLoad =
  async () => {

    setLoadingBatch(
      true
    );

    setGlobalError(
      null
    );


    try {

      const batches =
        await getBatches();


      setSavedBatches(
        batches
      );


      setShowLoadDialog(
        true
      );

    } catch (error) {

      setGlobalError(

        error instanceof Error

          ? error.message

          : "Không tải được danh sách batch"
      );

    } finally {

      setLoadingBatch(
        false
      );
    }
  };

  const handleLoadBatch =
  async (
    id: number
  ) => {

    /*
     * Nếu Grid hiện tại đang có dữ liệu,
     * confirm trước khi thay.
     */
    if (
      rows.length > 0
    ) {

      const ok =
        window.confirm(
          "Load batch sẽ thay toàn bộ dữ liệu hiện tại trên Grid.\nTiếp tục?"
        );


      if (!ok) {
        return;
      }
    }


    setLoadingBatch(
      true
    );

    setGlobalError(
      null
    );


    try {

      const batch =
        await getBatch(
          id
        );


      const loadedRows =
        batch.rows.map(
          mapBatchRow
        );


      /*
       * Ảnh gốc không được lưu trong DB,
       * nên khi load batch thì clear
       * phần images.
       */
      images.forEach(
        image =>
          URL.revokeObjectURL(
            image.previewUrl
          )
      );


      setImages(
        []
      );


      setRows(
        loadedRows
      );


      setBatchId(
        batch.id
      );


      setBatchCode(
        batch.batchCode
      );


      setShowLoadDialog(
        false
      );


      alert(
        [
          "Load batch thành công.",
          "",
          `Batch: ${batch.batchCode}`,
          `Status: ${batch.status}`,
          `Rows: ${batch.totalRows}`,
          `Matched: ${batch.matchedRows}`,
        ].join("\n")
      );

    } catch (error) {

      console.error(
        "Load batch error:",
        error
      );


      setGlobalError(

        error instanceof Error

          ? error.message

          : "Load batch thất bại"
      );

    } finally {

      setLoadingBatch(
        false
      );
    }
  };

  // =========================================================
  // ADD MANUAL ROW
  // =========================================================

  const handleAddRow =
    () => {

      const id =

        typeof crypto !==
          "undefined"

        &&
        typeof crypto.randomUUID ===
          "function"

          ? crypto.randomUUID()

          : `manual-${Date.now()}`;


      const newRow:
        SmileTransactionRow = {

        id,


        sourceImageId:
          "MANUAL",

        sourceImageName:
          "Nhập tay",


        sel:
          false,

        pst:
          true,


        folio:
          null,

        bc:
          null,

        voucher:
          null,


        code:
          null,

        description:
          null,

        room:
          null,


        amount:
          null,

        originAmount:
          null,

        exchangeRate:
          1,

        glAmount:
          null,


        refNo:
          null,

        comment:
          null,


        seri:
          null,

        billNo:
          null,


        cashier:
          null,

        postTime:
          null,


        billId:
          null,

        printTime:
          null,

        chrPos:
          null,


        valid:
          false,

        errors:
          [],


        matchStatus:
          "INVALID",


        journalNo:
          null,


        matchedTrnSeq:
          null,

        matchedAccNo:
          null,

        matchedGClient:
          null,

        matchMessage:
          null,


        duplicateOf:
          null,
      };


      const validated =
        revalidateRow(
          newRow
        );


      setRows(
        previous => [
          ...previous,
          validated,
        ]
      );
    };


  // =========================================================
  // DELETE ROW
  // =========================================================

  const handleDeleteRow = (
    rowId: string
  ) => {

    const row =
      rows.find(
        item =>
          item.id ===
          rowId
      );


    if (!row) {
      return;
    }


    const formattedAmount =

      row.amount !==
      null

        ? new Intl.NumberFormat(
            "vi-VN"
          ).format(
            row.amount
          )

        : "";


    const ok =
      window.confirm(

        [
          "Xóa giao dịch này?",
          "",
          `Ảnh: ${row.sourceImageName}`,
          `Folio: ${row.folio ?? ""}`,
          `Voucher: ${row.voucher ?? ""}`,
          `Amount: ${formattedAmount}`,
        ].join("\n")
      );


    if (!ok) {
      return;
    }


    setRows(
      previous =>
        markDuplicates(
          previous.filter(
            item =>
              item.id !==
              rowId
          )
        )
    );
  };


  // =========================================================
  // MATCH SMILE DB
  // =========================================================

  const handleMatchDb =
    async () => {

      if (
        rows.length ===
        0
      ) {

        alert(
          "Không có dữ liệu để đối chiếu."
        );

        return;
      }


      const invalidRows =
        rows.filter(
          row =>
            !row.valid
        );


      if (
        invalidRows.length >
        0
      ) {

        alert(
          `Còn ${invalidRows.length} dòng lỗi.\n` +
          "Hãy sửa hoặc xóa trước khi đối chiếu Smile DB."
        );

        return;
      }


      const duplicateRows =
        rows.filter(
          row =>
            row.matchStatus ===
            "DUPLICATE"
        );


      if (
        duplicateRows.length >
        0
      ) {

        alert(
          `Còn ${duplicateRows.length} dòng trùng.\n` +
          "Hãy kiểm tra hoặc xóa trước khi đối chiếu."
        );

        return;
      }


      setMatching(
        true
      );

      setGlobalError(
        null
      );


      try {

        const response =
          await matchSmileRows(
            rows
          );


        const resultMap =
          new Map(

            response.results.map(
              result => [
                result.rowId,
                result,
              ]
            )
          );


        setRows(
          previous =>
            previous.map(
              row => {

                const result =
                  resultMap.get(
                    row.id
                  );


                if (!result) {
                  return row;
                }


                return {

                  ...row,


                  matchStatus:
                    result.status,


                  journalNo:
                    result.journalNo,


                  matchedTrnSeq:
                    result.matchedTrnSeq,


                  matchedAccNo:
                    result.matchedAccNo,


                  matchedGClient:
                    result.matchedGClient,


                  matchMessage:
                    result.message,
                };
              }
            )
        );


        alert(

          [
            "Đối chiếu Smile hoàn tất.",
            "",
            `Tổng: ${response.total}`,
            `Matched: ${response.matched}`,
            `Not Found: ${response.notFound}`,
            `Review: ${response.ambiguous}`,
            `Invalid: ${response.invalid}`,
          ].join("\n")
        );

      } catch (error) {

        console.error(
          "Smile match error:",
          error
        );


        setGlobalError(

          error instanceof Error

            ? error.message

            : "Đối chiếu Smile DB thất bại"
        );

      } finally {

        setMatching(
          false
        );
      }
    };


  // =========================================================
  // SUMMARY
  // =========================================================

  const totalCount =
    rows.length;


  const validCount =
    useMemo(
      () =>
        rows.filter(
          row =>
            row.valid
        ).length,

      [rows]
    );


  const invalidCount =
    useMemo(
      () =>
        rows.filter(
          row =>
            !row.valid
        ).length,

      [rows]
    );


  const duplicateCount =
    useMemo(
      () =>
        rows.filter(
          row =>
            row.matchStatus ===
            "DUPLICATE"
        ).length,

      [rows]
    );


  const matchedCount =
    useMemo(
      () =>
        rows.filter(
          row =>
            row.matchStatus ===
            "MATCHED"
        ).length,

      [rows]
    );


  const notFoundCount =
    useMemo(
      () =>
        rows.filter(
          row =>
            row.matchStatus ===
            "NOT_FOUND"
        ).length,

      [rows]
    );


  const ambiguousCount =
    useMemo(
      () =>
        rows.filter(
          row =>
            row.matchStatus ===
            "AMBIGUOUS"
        ).length,

      [rows]
    );


  // =========================================================
  // IMPORT FAST PLACEHOLDER
  // =========================================================

  const handleImportFast =
    () => {

      if (
        rows.length ===
        0
      ) {
        return;
      }


      if (
        matchedCount !==
        rows.length
      ) {

        alert(
          "Chỉ được Import FAST khi tất cả row đều MATCHED."
        );

        return;
      }


      alert(
        "Import FAST sẽ làm ở bước sau."
      );
    };


  // =========================================================
  // UI
  // =========================================================

  return (

    <main
      className=
        "app-container"
    >

      <header
        className=
          "app-header"
      >

        <h1>
          Smile → FAST
        </h1>

        <p>
          Scan, kiểm tra và đối chiếu giao dịch Smile
        </p>

      </header>


      {/* =====================================================
          IMAGE SECTION
      ===================================================== */}

      <section
        className=
          "card"
      >

        <div
          className=
            "section-header"
        >

          <h2>
            1. Upload ảnh Smile
          </h2>


          <div
            className=
              "toolbar"
          >

            <MultiImageUpload

              disabled={
                running ||
                matching
              }

              onFilesSelected={
                handleFilesSelected
              }

            />


            <button

              className=
                "secondary-button"

              disabled={
                running ||
                matching ||
                images.length ===
                  0
              }

              onClick={
                handleOcrAll
              }

            >
              OCR tất cả
            </button>

          </div>

        </div>


        {globalError && (

          <div
            className=
              "ocr-error"
          >
            {globalError}
          </div>

        )}


        <div
          className=
            "image-list"
        >

          {images.map(
            (
              image,
              index
            ) => (

              <div

                key={
                  image.id
                }

                className=
                  "image-item"
              >

                <div
                  className=
                    "image-thumbnail"
                >

                  <img

                    src={
                      image.previewUrl
                    }

                    alt={
                      image.fileName
                    }

                  />

                </div>


                <div
                  className=
                    "image-info"
                >

                  <strong>
                    {index + 1}.{" "}
                    {image.fileName}
                  </strong>


                  <div>

                    Status:{" "}

                    <span
                      className={
                        `image-status image-status-${image.status.toLowerCase()}`
                      }
                    >
                      {image.status}
                    </span>

                  </div>


                  <div>
                    Rows:{" "}
                    {image.rowCount}
                  </div>


                  {image.error && (

                    <div
                      className=
                        "image-error"
                    >
                      {image.error}
                    </div>

                  )}

                </div>


                <div
                  className=
                    "image-actions"
                >

                  <button

                    className=
                      "secondary-button"

                    disabled={
                      running ||
                      matching
                    }

                    onClick={() =>
                      handleForceOcrOne(
                        image
                      )
                    }

                  >
                    OCR lại
                  </button>


                  <button

                    className=
                      "delete-row-button"

                    disabled={
                      running ||
                      matching
                    }

                    onClick={() =>
                      handleDeleteImage(
                        image
                      )
                    }

                  >
                    Xóa ảnh
                  </button>

                </div>

              </div>

            )
          )}

        </div>

      </section>


      {/* =====================================================
          GRID
      ===================================================== */}

      {rows.length >
        0 && (

        <section
          className=
            "card"
        >

          <div
            className=
              "grid-header"
          >

            <div>

              <h2>
                2. Kiểm tra & đối chiếu
              </h2>
              {batchId && (

  <div className="current-batch">

    Batch:
    {" "}

    <strong>
      {batchCode}
    </strong>

    {" "}

    <span>
      (ID {batchId})
    </span>

  </div>

)}


              <span>
                Ảnh:{" "}
                {images.length}
              </span>


              <span>
                Tổng:{" "}
                {totalCount}
              </span>


              <span
                className=
                  "valid-text"
              >
                Hợp lệ:{" "}
                {validCount}
              </span>


              <span
                className=
                  "invalid-text"
              >
                Lỗi:{" "}
                {invalidCount}
              </span>


              <span
                className=
                  "duplicate-text"
              >
                Trùng:{" "}
                {duplicateCount}
              </span>


              <span
                className=
                  "matched-text"
              >
                Matched:{" "}
                {matchedCount}
              </span>


              {notFoundCount >
                0 && (

                <span
                  className=
                    "invalid-text"
                >
                  Not Found:{" "}
                  {notFoundCount}
                </span>

              )}


              {ambiguousCount >
                0 && (

                <span
                  className=
                    "duplicate-text"
                >
                  Review:{" "}
                  {ambiguousCount}
                </span>

              )}

            </div>


            <div className="toolbar">

  <button
    className="secondary-button"
    disabled={
      running ||
      matching
    }
    onClick={
      handleAddRow
    }
  >
    + Add Row
  </button>


  <button
    className="secondary-button"

    disabled={
      running ||
      matching ||
      rows.length === 0
    }

    onClick={
      handleMatchDb
    }
  >
    {matching
      ? "Đang đối chiếu..."
      : "Đối chiếu Smile DB"
    }
  </button>


  <button
    className="secondary-button"

    disabled={
      saving ||
      running ||
      matching ||
      rows.length === 0
    }

    onClick={
      handleSaveBatch
    }
  >
    {saving
      ? "Đang lưu..."
      : "Save"
    }
  </button>


  <button
    className="secondary-button"

    disabled={
      loadingBatch ||
      saving ||
      running ||
      matching
    }

    onClick={
      handleOpenLoad
    }
  >
    {loadingBatch
      ? "Đang tải..."
      : "Load"
    }
  </button>


  <button
    className="primary-button"

    disabled={
      running ||
      matching ||
      saving ||
      invalidCount > 0 ||
      duplicateCount > 0 ||
      matchedCount !==
        rows.length
    }

    onClick={
      handleImportFast
    }
  >
    Import FAST
  </button>

</div>

          </div>


          <SmileGrid

            rows={
              rows
            }

            onRowsChange={
              setRows
            }

            onDeleteRow={
              handleDeleteRow
            }

          />

        </section>

      )}
    {showLoadDialog && (

  <div className="modal-backdrop">

    <div className="batch-modal">

      <div className="batch-modal-header">

        <h3>
          Batch đã lưu
        </h3>


        <button
          className="modal-close-button"

          onClick={() =>
            setShowLoadDialog(
              false
            )
          }
        >
          ×
        </button>

      </div>


      {savedBatches.length ===
      0 ? (

        <div className="empty-batch">

          Chưa có batch nào.

        </div>

      ) : (

        <div className="batch-table-wrapper">

          <table className="batch-table">

            <thead>

              <tr>

                <th>
                  ID
                </th>

                <th>
                  Batch
                </th>

                <th>
                  Ngày
                </th>

                <th>
                  Status
                </th>

                <th>
                  Rows
                </th>

                <th>
                  Matched
                </th>

                <th>
                  Lỗi
                </th>

                <th>
                  Cập nhật
                </th>

                <th>
                  Action
                </th>

              </tr>

            </thead>


            <tbody>

              {savedBatches.map(
                batch => (

                  <tr
                    key={
                      batch.id
                    }
                  >

                    <td>
                      {batch.id}
                    </td>


                    <td>
                      {batch.batchCode}
                    </td>


                    <td>
                      {batch.businessDate
                        ?? "-"
                      }
                    </td>


                    <td>

                      <span
                        className={
                          `batch-status batch-status-${batch.status.toLowerCase()}`
                        }
                      >
                        {batch.status}
                      </span>

                    </td>


                    <td>
                      {batch.totalRows}
                    </td>


                    <td>
                      {batch.matchedRows}
                    </td>


                    <td>
                      {batch.invalidRows}
                    </td>


                    <td>
                      {
                        new Date(
                          batch.updatedAt
                        ).toLocaleString(
                          "vi-VN"
                        )
                      }
                    </td>


                    <td>

                      <button
                        className="secondary-button"

                        disabled={
                          loadingBatch
                        }

                        onClick={() =>
                          handleLoadBatch(
                            batch.id
                          )
                        }
                      >
                        Load
                      </button>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      )}

    </div>

  </div>

)}
    </main>
  );
}