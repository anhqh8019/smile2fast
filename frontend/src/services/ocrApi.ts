export interface PythonOcrRow {

  sel: boolean;
  pst: boolean;

  folio: string | null;
  bc: string | null;

  voucher: string | null;

  code: string | null;
  description: string | null;

  room: string | null;

  amount: number | null;

  origin_amount:
    number | null;

  exchange_rate:
    number | null;

  gl_amount:
    number | null;

  ref_no: string | null;

  comment: string | null;

  seri: string | null;
  bill_no: string | null;

  cashier: string | null;

  post_time:
    string | null;

  bill_id:
    string | null;

  print_time:
    string | null;

  chr_pos:
    string | null;

  valid: boolean;

  errors: string[];
}


export interface PythonOcrResponse {

  success: boolean;

  image: {
    width: number;
    height: number;
  };

  cache?: {
    key: string;
    raw_ocr_cached: boolean;
  };

  row_count: number;

  valid_count: number;

  invalid_count: number;

  posted_count: number;

  rows: PythonOcrRow[];
}


export async function scanSmileImage(
  file: File,
  forceOcr = false,
): Promise<PythonOcrResponse> {

  const formData =
    new FormData();

  formData.append(
    "file",
    file
  );

  const url =
    new URL(
      "http://127.0.0.1:8000/ocr/smile"
    );

  if (forceOcr) {

    url.searchParams.set(
      "forceOcr",
      "true"
    );
  }

  const response =
    await fetch(
      url.toString(),
      {
        method: "POST",
        body: formData,
      }
    );

  const data =
    await response.json();

  if (!response.ok) {

    const message =
      data?.error?.message
      ?? data?.detail
      ?? "OCR thất bại";

    throw new Error(
      typeof message === "string"
        ? message
        : JSON.stringify(
            message
          )
    );
  }

  return data;
}