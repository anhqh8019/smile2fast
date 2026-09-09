from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from difflib import SequenceMatcher
from typing import Any, Optional

import re


# ============================================================
# OCR TOKEN
# ============================================================

@dataclass
class OcrToken:
    text: str
    confidence: float

    x1: float
    y1: float
    x2: float
    y2: float

    @property
    def center_x(self) -> float:
        return (self.x1 + self.x2) / 2.0

    @property
    def center_y(self) -> float:
        return (self.y1 + self.y2) / 2.0

    @property
    def width(self) -> float:
        return self.x2 - self.x1

    @property
    def height(self) -> float:
        return self.y2 - self.y1


# ============================================================
# EXCEPTION
# ============================================================

class SmileGridParseError(Exception):
    pass


# ============================================================
# PARSER
# ============================================================

class SmileGridParser:

    # --------------------------------------------------------
    # Thứ tự cột chính xác trên màn hình Smile
    # --------------------------------------------------------

    COLUMN_ORDER = [
        "sel",
        "pst",
        "folio",
        "bc",
        "voucher",
        "code",
        "description",
        "room",
        "amount",
        "origin_amount",
        "exchange_rate",
        "gl_amount",
        "ref_no",
        "comment",
        "seri",
        "bill_no",
        "cashier",
        "post_time",
        "bill_id",
        "print_time",
        "chr_pos",
    ]

    # --------------------------------------------------------
    # Các alias header PaddleOCR có thể đọc được
    # --------------------------------------------------------

    HEADER_ALIASES = {

        "sel": [
            "sel",
        ],

        "pst": [
            "pst",
            "post",
        ],

        "folio": [
            "folio",
            "folio#",
            "folio #",
        ],

        "bc": [
            "bc",
        ],

        "voucher": [
            "voucher",
        ],

        "code": [
            "code",
        ],

        "description": [
            "description",
            "desc",
        ],

        "room": [
            "rm",
            "room",
        ],

        "amount": [
            "amount",
            "amount/",
        ],

        "origin_amount": [
            "originamt",
            "origin amt",
            "originamount",
            "origin amount",
        ],

        "exchange_rate": [
            "ex.rate",
            "exrate",
            "exchange rate",
        ],

        "gl_amount": [
            "glamount",
            "gl amount",
        ],

        "ref_no": [
            "ref#",
            "ref",
            "refno",
        ],

        "comment": [
            "comment",
            "commen",
        ],

        "seri": [
            "seri",
            "serial",
        ],

        "bill_no": [
            "bill#",
            "bill",
            "billno",
        ],

        "cashier": [
            "csh",
            "cashier",
        ],

        "post_time": [
            "posttime",
            "post time",
        ],

        "bill_id": [
            "billid",
            "bill id",
        ],

        "print_time": [
            "print",
            "printtime",
            "print time",
        ],

        "chr_pos": [
            "chrpos",
            "chr pos",
        ],
    }

    # --------------------------------------------------------
    # Tỷ lệ center fallback theo screenshot 1357px
    #
    # Chỉ dùng nếu PaddleOCR không đọc được một header.
    # Không còn hard-code boundary.
    # --------------------------------------------------------

    FALLBACK_CENTER_RATIO = {
        "sel": 0.008,
        "pst": 0.027,
        "folio": 0.061,
        "bc": 0.089,
        "voucher": 0.143,
        "code": 0.194,
        "description": 0.239,
        "room": 0.289,
        "amount": 0.338,
        "origin_amount": 0.407,
        "exchange_rate": 0.464,
        "gl_amount": 0.510,
        "ref_no": 0.557,
        "comment": 0.611,
        "seri": 0.669,
        "bill_no": 0.720,
        "cashier": 0.763,
        "post_time": 0.820,
        "bill_id": 0.882,
        "print_time": 0.916,
        "chr_pos": 0.957,
    }

    def __init__(
        self,
        min_confidence: float = 0.30,
        row_tolerance: float = 6.0,
    ):
        self.min_confidence = min_confidence
        self.row_tolerance = row_tolerance

    # ========================================================
    # PUBLIC
    # ========================================================

    def parse(
        self,
        raw_result: Any,
        image_width: int,
    ) -> list[dict]:

        tokens = self._extract_tokens(raw_result)

        tokens = [
            t
            for t in tokens
            if t.confidence >= self.min_confidence
        ]

        if not tokens:
            raise SmileGridParseError(
                "OCR không nhận diện được dữ liệu."
            )

        # --------------------------------------------
        # 1. Detect header
        # --------------------------------------------

        header_tokens = self._find_header_tokens(tokens)

        header_y = self._header_y(header_tokens)

        # --------------------------------------------
        # 2. Xác định center từng column
        # --------------------------------------------

        centers = self._build_column_centers(
            header_tokens=header_tokens,
            image_width=image_width,
        )

        # --------------------------------------------
        # 3. Center -> boundary
        # --------------------------------------------

        boundaries = self._build_boundaries(
            centers,
            image_width,
        )

        # --------------------------------------------
        # 4. Chỉ lấy token phía dưới header
        # --------------------------------------------

        data_tokens = [
            t
            for t in tokens
            if t.center_y > header_y + 5
        ]

        # --------------------------------------------
        # 5. Group thành row
        # --------------------------------------------

        token_rows = self._group_rows(
            data_tokens
        )

        result: list[dict] = []

        for tokens_in_row in token_rows:

            parsed = self._parse_row(
                tokens=tokens_in_row,
                boundaries=boundaries,
            )

            if parsed is None:
                continue

            parsed = self._repair_row(parsed)

            errors = self._validate_row(parsed)

            parsed["valid"] = len(errors) == 0
            parsed["errors"] = errors

            result.append(parsed)

        return result

    # ========================================================
    # EXTRACT PADDLE OCR
    # ========================================================

    def _extract_tokens(
        self,
        raw_result: Any,
    ) -> list[OcrToken]:

        tokens: list[OcrToken] = []

        if isinstance(raw_result, list):

            for item in raw_result:
                tokens.extend(
                    self._extract_tokens(item)
                )

            return tokens

        if not isinstance(raw_result, dict):
            return tokens

        data = raw_result.get(
            "res",
            raw_result
        )

        texts = (
            data.get("rec_texts")
            or data.get("texts")
            or []
        )

        scores = (
            data.get("rec_scores")
            or data.get("scores")
            or []
        )

        boxes = (
            data.get("rec_boxes")
            or data.get("boxes")
            or data.get("dt_polys")
            or []
        )

        for i, text in enumerate(texts):

            if not text:
                continue

            score = 1.0

            if i < len(scores):
                try:
                    score = float(
                        scores[i]
                    )
                except Exception:
                    pass

            if i >= len(boxes):
                continue

            rect = self._box_to_rect(
                boxes[i]
            )

            if rect is None:
                continue

            x1, y1, x2, y2 = rect

            tokens.append(
                OcrToken(
                    text=str(text).strip(),
                    confidence=score,
                    x1=x1,
                    y1=y1,
                    x2=x2,
                    y2=y2,
                )
            )

        return tokens

    def _box_to_rect(
        self,
        box: Any,
    ) -> Optional[
        tuple[
            float,
            float,
            float,
            float
        ]
    ]:

        if box is None:
            return None

        try:

            # [x1,y1,x2,y2]

            if (
                isinstance(box, (list, tuple))
                and len(box) == 4
                and all(
                    isinstance(x, (int, float))
                    for x in box
                )
            ):

                return (
                    float(box[0]),
                    float(box[1]),
                    float(box[2]),
                    float(box[3]),
                )

            # polygon

            xs = []
            ys = []

            for point in box:

                if (
                    isinstance(
                        point,
                        (list, tuple)
                    )
                    and len(point) >= 2
                ):

                    xs.append(
                        float(point[0])
                    )

                    ys.append(
                        float(point[1])
                    )

            if xs and ys:

                return (
                    min(xs),
                    min(ys),
                    max(xs),
                    max(ys),
                )

        except Exception:
            return None

        return None

    # ========================================================
    # HEADER DETECTION
    # ========================================================

    def _find_header_tokens(
        self,
        tokens: list[OcrToken],
    ) -> dict[str, OcrToken]:

        matches: dict[
            str,
            tuple[OcrToken, float]
        ] = {}

        for token in tokens:

            # Header thường nằm phía trên ảnh.
            # Không bắt buộc tuyệt đối nhưng giúp tránh
            # dữ liệu bị nhận nhầm thành header.

            for field in self.COLUMN_ORDER:

                score = self._header_score(
                    token.text,
                    field
                )

                if score < 0.70:
                    continue

                current = matches.get(field)

                if (
                    current is None
                    or score > current[1]
                ):
                    matches[field] = (
                        token,
                        score
                    )

        result = {
            field: value[0]
            for field, value in matches.items()
        }

        # Với ảnh Smile chuẩn, phải nhận được ít nhất
        # một số header chính.

        important = [
            "folio",
            "voucher",
            "description",
            "amount",
            "gl_amount",
        ]

        found = sum(
            1
            for field in important
            if field in result
        )

        if found < 3:

            raise SmileGridParseError(
                "Không nhận diện được header Smile "
                "(Folio/Voucher/Amount/GLAmount...). "
                "Vui lòng chụp lại đầy đủ tiêu đề bảng."
            )

        return result

    def _header_score(
        self,
        text: str,
        field: str,
    ) -> float:

        source = self._normalize_header(
            text
        )

        if not source:
            return 0.0

        best = 0.0

        for alias in self.HEADER_ALIASES[field]:

            target = self._normalize_header(
                alias
            )

            if source == target:
                return 1.0

            # Ví dụ:
            # "amount/" ↔ "amount"
            if (
                target in source
                or source in target
            ):
                best = max(
                    best,
                    0.90
                )

            ratio = SequenceMatcher(
                None,
                source,
                target
            ).ratio()

            best = max(
                best,
                ratio
            )

        return best

    def _normalize_header(
        self,
        value: str,
    ) -> str:

        return re.sub(
            r"[^a-z0-9]",
            "",
            value.lower()
        )

    def _header_y(
        self,
        headers: dict[str, OcrToken],
    ) -> float:

        values = [
            token.center_y
            for token in headers.values()
        ]

        return sum(values) / len(values)

    # ========================================================
    # COLUMN CENTERS
    # ========================================================

    def _build_column_centers(
        self,
        header_tokens: dict[str, OcrToken],
        image_width: int,
    ) -> dict[str, float]:

        centers = {}

        for field in self.COLUMN_ORDER:

            token = header_tokens.get(
                field
            )

            if token is not None:

                centers[field] = (
                    token.center_x
                )

            else:

                # Header OCR miss -> fallback theo tỷ lệ ảnh.

                centers[field] = (
                    self.FALLBACK_CENTER_RATIO[field]
                    * image_width
                )

        # Bắt buộc center tăng dần.
        # OCR header sai có thể phá thứ tự.

        previous = -1.0

        for field in self.COLUMN_ORDER:

            center = centers[field]

            if center <= previous:

                # fallback lại

                center = (
                    self.FALLBACK_CENTER_RATIO[field]
                    * image_width
                )

                centers[field] = center

            previous = center

        return centers

    def _build_boundaries(
        self,
        centers: dict[str, float],
        image_width: int,
    ) -> dict[
        str,
        tuple[float, float]
    ]:

        result = {}

        for i, field in enumerate(
            self.COLUMN_ORDER
        ):

            center = centers[field]

            if i == 0:
                left = 0.0
            else:

                previous = centers[
                    self.COLUMN_ORDER[i - 1]
                ]

                left = (
                    previous + center
                ) / 2.0

            if i == len(
                self.COLUMN_ORDER
            ) - 1:

                right = float(
                    image_width
                )

            else:

                next_center = centers[
                    self.COLUMN_ORDER[i + 1]
                ]

                right = (
                    center + next_center
                ) / 2.0

            result[field] = (
                left,
                right
            )

        return result

    # ========================================================
    # ROW GROUPING
    # ========================================================

    def _group_rows(
        self,
        tokens: list[OcrToken],
    ) -> list[list[OcrToken]]:

        sorted_tokens = sorted(
            tokens,
            key=lambda t: (
                t.center_y,
                t.center_x
            )
        )

        rows: list[
            list[OcrToken]
        ] = []

        for token in sorted_tokens:

            best_row = None
            best_distance = None

            for row in rows:

                avg_y = sum(
                    t.center_y
                    for t in row
                ) / len(row)

                distance = abs(
                    token.center_y
                    - avg_y
                )

                if (
                    distance
                    <= self.row_tolerance
                ):

                    if (
                        best_distance is None
                        or distance
                        < best_distance
                    ):

                        best_row = row
                        best_distance = distance

            if best_row is None:

                rows.append(
                    [token]
                )

            else:

                best_row.append(
                    token
                )

        for row in rows:

            row.sort(
                key=lambda t: t.center_x
            )

        return rows

    # ========================================================
    # TOKEN -> COLUMN
    # ========================================================

    def _parse_row(
        self,
        tokens: list[OcrToken],
        boundaries: dict[
            str,
            tuple[float, float]
        ],
    ) -> Optional[dict]:

        cells: dict[
            str,
            list[OcrToken]
        ] = {
            field: []
            for field in self.COLUMN_ORDER
        }

        for token in tokens:

            field = self._find_column_for_token(
                token,
                boundaries
            )

            if field:
                cells[field].append(
                    token
                )

        raw = {
            field: self._join_tokens(
                values
            )
            for field, values
            in cells.items()
        }

        if not self._looks_like_data(
            raw
        ):
            return None

        return {
            "sel": self._checkbox(
                raw["sel"]
            ),

            "pst": self._checkbox(
                raw["pst"]
            ),

            "folio": self._text(
                raw["folio"]
            ),

            "bc": self._text(
                raw["bc"]
            ),

            "voucher": self._text(
                raw["voucher"]
            ),

            "code": self._text(
                raw["code"]
            ),

            "description": self._text(
                raw["description"]
            ),

            "room": self._text(
                raw["room"]
            ),

            "amount": self._number(
                raw["amount"]
            ),

            "origin_amount": self._number(
                raw["origin_amount"]
            ),

            "exchange_rate": self._number(
                raw["exchange_rate"]
            ),

            "gl_amount": self._number(
                raw["gl_amount"]
            ),

            "ref_no": self._text(
                raw["ref_no"]
            ),

            "comment": self._text(
                raw["comment"]
            ),

            "seri": self._text(
                raw["seri"]
            ),

            "bill_no": self._text(
                raw["bill_no"]
            ),

            "cashier": self._text(
                raw["cashier"]
            ),

            "post_time": self._text(
                raw["post_time"]
            ),

            "bill_id": self._text(
                raw["bill_id"]
            ),

            "print_time": self._text(
                raw["print_time"]
            ),

            "chr_pos": self._text(
                raw["chr_pos"]
            ),
        }

    def _find_column_for_token(
        self,
        token: OcrToken,
        boundaries: dict[
            str,
            tuple[float, float]
        ],
    ) -> Optional[str]:

        # Chủ yếu dùng center.
        # Dynamic boundary đã lấy từ header.

        x = token.center_x

        for field in self.COLUMN_ORDER:

            left, right = boundaries[
                field
            ]

            if left <= x < right:
                return field

        return None

    def _join_tokens(
        self,
        tokens: list[OcrToken],
    ) -> str:

        if not tokens:
            return ""

        ordered = sorted(
            tokens,
            key=lambda t: t.x1
        )

        return " ".join(
            t.text.strip()
            for t in ordered
            if t.text.strip()
        ).strip()

    # ========================================================
    # REPAIR
    # ========================================================

    def _repair_row(
        self,
        row: dict,
    ) -> dict:

        # ----------------------------------------------------
        # 1. Folio + BC dính:
        # 104944A
        # 104774D
        # ----------------------------------------------------

        folio = row.get("folio")

        if folio:

            match = re.fullmatch(
                r"(\d{4,})([A-Za-z])",
                folio.replace(" ", "")
            )

            if match:

                row["folio"] = (
                    match.group(1)
                )

                if not row.get("bc"):

                    row["bc"] = (
                        match.group(2)
                        .upper()
                    )

        # ----------------------------------------------------
        # 2. Code dính Description
        #
        # "95 Bank Tranfer"
        # "2 CASH VND"
        # ----------------------------------------------------

        desc = row.get(
            "description"
        )

        if (
            desc
            and not row.get("code")
        ):

            match = re.match(
                r"^\s*(\d{1,3})\s+(.+)$",
                desc
            )

            if match:

                row["code"] = (
                    match.group(1)
                )

                row["description"] = (
                    match.group(2)
                    .strip()
                )

        # ----------------------------------------------------
        # 3. Room dính cuối Description
        #
        # "Bank Tranfer VA1"
        # "Bank Tranfer 9903"
        # "CASH VND 302"
        # ----------------------------------------------------

        desc = row.get(
            "description"
        )

        if (
            desc
            and not row.get("room")
        ):

            match = re.match(
                r"^(.*?\b(?:Tranfer|Transfer|VND))"
                r"\s+([A-Z0-9]{2,5})$",
                desc,
                flags=re.IGNORECASE
            )

            if match:

                row["description"] = (
                    match.group(1)
                    .strip()
                )

                row["room"] = (
                    match.group(2)
                    .strip()
                )

        # ----------------------------------------------------
        # 4. Ref + Comment dính
        #
        # "106 19/08/2026 250D608"
        # ----------------------------------------------------

        ref = row.get("ref_no")

        if ref:

            match = re.match(
                r"^(\d+)"
                r"\s+"
                r"(.+)$",
                ref
            )

            if match:

                possible_comment = (
                    match.group(2)
                )

                if re.search(
                    r"\d{1,2}[-/]\d{1,2}[-/]\d{4}",
                    possible_comment
                ):

                    row["ref_no"] = (
                        match.group(1)
                    )

                    if not row.get(
                        "comment"
                    ):

                        row["comment"] = (
                            possible_comment
                        )

        # ----------------------------------------------------
        # 5. Bill# + Cashier
        #
        # "3737 FO3"
        # ----------------------------------------------------

        bill = row.get(
            "bill_no"
        )

        if bill:

            match = re.fullmatch(
                r"(\d+)\s+([A-Za-z$0-9]+)",
                bill
            )

            if match:

                row["bill_no"] = (
                    match.group(1)
                )

                if not row.get(
                    "cashier"
                ):

                    row["cashier"] = (
                        match.group(2)
                    )

        # ----------------------------------------------------
        # 6. Cashier + Post time
        #
        # FO3 20/08/2026 14:42:30
        # ----------------------------------------------------

        cashier = row.get(
            "cashier"
        )

        if cashier:

            match = re.fullmatch(
                r"([A-Za-z$0-9]+)"
                r"\s+"
                r"(\d{1,2}/\d{1,2}/\d{4})"
                r"\s+"
                r"(\d{2}:\d{2}:\d{2})",
                cashier
            )

            if match:

                row["cashier"] = (
                    match.group(1)
                )

                if not row.get(
                    "post_time"
                ):

                    row["post_time"] = (
                        f"{match.group(2)} "
                        f"{match.group(3)}"
                    )

        # ----------------------------------------------------
        # 7. Normalize BC
        # ----------------------------------------------------

        if row.get("bc"):

            row["bc"] = (
                row["bc"]
                .strip()
                .upper()
            )

        # ----------------------------------------------------
        # 8. Normalize description typo Smile
        # Không bắt buộc sửa thành Transfer.
        # Giữ nguyên text nguồn.
        # ----------------------------------------------------

        return row

    # ========================================================
    # VALIDATION
    # ========================================================

    def _validate_row(
        self,
        row: dict,
    ) -> list[str]:

        errors = []

        # ----------------------------------------------------
        # Pst là dòng được chọn để xử lý
        # ----------------------------------------------------

        if row.get("pst"):

            if not row.get("folio"):

                errors.append(
                    "Thiếu Folio"
                )

            if not row.get("voucher"):

                errors.append(
                    "Thiếu Voucher"
                )

            if not row.get("code"):

                errors.append(
                    "Thiếu Code"
                )

            if row.get("amount") is None:

                errors.append(
                    "Không đọc được Amount"
                )

            if row.get("gl_amount") is None:

                errors.append(
                    "Không đọc được GLAmount"
                )

        # ----------------------------------------------------
        # Folio phải numeric
        # ----------------------------------------------------

        folio = row.get(
            "folio"
        )

        if (
            folio
            and not re.fullmatch(
                r"\d+",
                folio
            )
        ):

            errors.append(
                f"Folio không hợp lệ: {folio}"
            )

        # ----------------------------------------------------
        # Code Smile hiện đang thấy 2 / 95.
        # Chưa raise nếu có code khác trong tương lai.
        # ----------------------------------------------------

        code = row.get(
            "code"
        )

        if (
            code
            and not re.fullmatch(
                r"\d+",
                code
            )
        ):

            errors.append(
                f"Code không hợp lệ: {code}"
            )

        # ----------------------------------------------------
        # Exchange rate.
        #
        # Với ảnh hiện tại VND => 1.
        # Nếu đọc thành -30,600,000 chắc chắn lệch cột.
        # ----------------------------------------------------

        ex_rate = row.get(
            "exchange_rate"
        )

        if (
            ex_rate is not None
            and (
                ex_rate <= 0
                or ex_rate > 100000
            )
        ):

            errors.append(
                f"Exchange rate bất thường: {ex_rate}"
            )

        # ----------------------------------------------------
        # Amount / GLAmount nên cùng magnitude
        # với các payment hiện tại.
        # ----------------------------------------------------

        amount = row.get(
            "amount"
        )

        gl_amount = row.get(
            "gl_amount"
        )

        if (
            amount is not None
            and gl_amount is not None
        ):

            difference = abs(
                abs(amount)
                - abs(gl_amount)
            )

            if difference > 1:

                errors.append(
                    "Amount và GLAmount không khớp: "
                    f"{amount} / {gl_amount}"
                )

        return errors

    # ========================================================
    # HELPERS
    # ========================================================

    def _looks_like_data(
        self,
        raw: dict[str, str],
    ) -> bool:

        folio = raw.get(
            "folio",
            ""
        )

        voucher = raw.get(
            "voucher",
            ""
        )

        description = raw.get(
            "description",
            ""
        )

        combined = (
            f"{folio} "
            f"{voucher} "
            f"{description}"
        )

        # Một dòng Smile hợp lệ thường có
        # folio numeric hoặc voucher RV/RC.

        return bool(
            re.search(
                r"\d{4,}",
                combined
            )
            or re.search(
                r"(RV|RC)\d",
                combined,
                flags=re.IGNORECASE
            )
        )

    def _text(
        self,
        value: str,
    ) -> Optional[str]:

        if not value:
            return None

        value = re.sub(
            r"\s+",
            " ",
            value
        ).strip()

        return value or None

    def _checkbox(
        self,
        value: str,
    ) -> bool:

        if not value:
            return False

        value = value.lower()

        markers = [
            "✓",
            "✔",
            "☑",
            "√",
            "v",
            "x",
        ]

        return any(
            marker in value
            for marker in markers
        )

    def _number(
        self,
        value: str,
    ) -> Optional[float]:

        if not value:
            return None

        text = value.strip()

        text = re.sub(
            r"[^0-9,.\-]",
            "",
            text
        )

        if not text:
            return None

        negative = (
            text.startswith("-")
        )

        text = text.lstrip("-")

        # --------------------------------------------
        # 1,130,000.00
        # --------------------------------------------

        if (
            "," in text
            and "." in text
        ):

            last_comma = text.rfind(
                ","
            )

            last_dot = text.rfind(
                "."
            )

            if last_dot > last_comma:

                # US:
                # 1,130,000.00

                text = text.replace(
                    ",",
                    ""
                )

            else:

                # EU:
                # 1.130.000,00

                text = text.replace(
                    ".",
                    ""
                )

                text = text.replace(
                    ",",
                    "."
                )

        elif "," in text:

            parts = text.split(
                ","
            )

            # 30,600,000

            if (
                len(parts) > 2
                or (
                    len(parts) == 2
                    and len(parts[-1]) == 3
                )
            ):

                text = "".join(
                    parts
                )

            else:

                text = text.replace(
                    ",",
                    "."
                )

        elif "." in text:

            parts = text.split(
                "."
            )

            # 30.600.000

            if len(parts) > 2:

                text = "".join(
                    parts
                )

        try:

            result = Decimal(
                text
            )

            if negative:
                result = -result

            return float(
                result
            )

        except InvalidOperation:

            return None