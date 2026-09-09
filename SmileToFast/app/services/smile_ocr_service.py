import os
from typing import Any


os.environ["FLAGS_enable_pir_api"] = "0"
os.environ["FLAGS_use_mkldnn"] = "0"


from paddleocr import PaddleOCR

from app.services.image_preprocessor import (
    decode_image,
)

from app.services.image_quality_validator import (
    ImageQualityValidator,
)

from app.services.ocr_cache import (
    OcrCache,
)

from app.services.smile_grid_parser import (
    SmileGridParser,
    SmileGridParseError,
)


class SmileOcrService:

    def __init__(self):

        print(
            "Initializing Smile OCR Service..."
        )

        self.ocr = PaddleOCR(
            lang="en",

            enable_mkldnn=False,

            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=False,
        )

        self.image_validator = (
            ImageQualityValidator()
        )

        self.grid_parser = SmileGridParser(
            min_confidence=0.30,
            row_tolerance=6.0,
        )

        self.cache = OcrCache(
            cache_dir="cache/ocr"
        )

        print(
            "Smile OCR Service initialized."
        )

    # ========================================================
    # PUBLIC
    # ========================================================

    def scan(
        self,
        image_bytes: bytes,
        force_ocr: bool = False,
    ) -> dict:

        # ----------------------------------------------------
        # 1. Decode
        # ----------------------------------------------------

        image = decode_image(
            image_bytes
        )

        height, width = image.shape[:2]

        # ----------------------------------------------------
        # 2. Validate ảnh
        # ----------------------------------------------------

        self.image_validator.validate(
            image
        )

        # ----------------------------------------------------
        # 3. Cache key
        # ----------------------------------------------------

        cache_key = (
            self.cache.build_key(
                image_bytes
            )
        )

        print(
            "OCR image hash:",
            cache_key
        )

        # ----------------------------------------------------
        # 4. Raw OCR cache
        # ----------------------------------------------------

        raw_results = None

        if not force_ocr:

            raw_results = (
                self.cache.get(
                    cache_key
                )
            )

        if raw_results is not None:

            print(
                "OCR CACHE HIT"
            )

        else:

            print(
                "OCR CACHE MISS"
            )

            raw_results = (
                self._run_paddle_ocr(
                    image
                )
            )

            self.cache.put(
                cache_key,
                raw_results
            )

        # ----------------------------------------------------
        # 5. Parse grid
        #
        # Luôn chạy lại parser.
        #
        # Nghĩa là sửa smile_grid_parser.py
        # không cần OCR lại.
        # ----------------------------------------------------

        rows = self.grid_parser.parse(
            raw_result=raw_results,
            image_width=width,
        )

        # ----------------------------------------------------
        # 6. Summary
        # ----------------------------------------------------

        valid_rows = [
            row
            for row in rows
            if row.get("valid") is True
        ]

        invalid_rows = [
            row
            for row in rows
            if row.get("valid") is not True
        ]

        posted_rows = [
            row
            for row in valid_rows
            if row.get("pst") is True
        ]

        # ----------------------------------------------------
        # 7. Validate toàn scan
        # ----------------------------------------------------

        self._validate_scan_result(
            rows=rows,
            valid_rows=valid_rows,
            invalid_rows=invalid_rows,
        )

        # ----------------------------------------------------
        # 8. Response
        # ----------------------------------------------------

        return {
            "image": {
                "width": width,
                "height": height,
            },

            "cache": {
                "key": cache_key,
                "raw_ocr_cached": True,
            },

            "row_count": len(rows),

            "valid_count": len(
                valid_rows
            ),

            "invalid_count": len(
                invalid_rows
            ),

            "posted_count": len(
                posted_rows
            ),

            "rows": rows,
        }

    # ========================================================
    # PADDLE OCR
    # ========================================================

    def _run_paddle_ocr(
        self,
        image,
    ) -> list[dict]:

        print(
            "Running PaddleOCR..."
        )

        results = self.ocr.predict(
            image,

            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=False,
        )

        if not results:

            raise SmileGridParseError(
                "PaddleOCR không nhận diện "
                "được nội dung trong ảnh."
            )

        raw_results = []

        for result in results:

            data = (
                self._extract_result_json(
                    result
                )
            )

            if data is not None:

                raw_results.append(
                    data
                )

        if not raw_results:

            raise SmileGridParseError(
                "Không lấy được OCR result."
            )

        print(
            "PaddleOCR completed."
        )

        return raw_results

    # ========================================================
    # RESULT JSON
    # ========================================================

    def _extract_result_json(
        self,
        result: Any,
    ) -> dict | None:

        try:

            data = result.json

            if callable(data):
                data = data()

            return self._json_safe(
                data
            )

        except Exception as exc:

            print(
                "Cannot parse OCR result:",
                exc
            )

            return None

    def _json_safe(
        self,
        value: Any,
    ) -> Any:

        if value is None:
            return None

        if isinstance(
            value,
            (
                str,
                int,
                float,
                bool,
            ),
        ):
            return value

        if isinstance(
            value,
            dict,
        ):

            return {
                str(key):
                    self._json_safe(item)

                for key, item
                in value.items()
            }

        if isinstance(
            value,
            (
                list,
                tuple,
            ),
        ):

            return [
                self._json_safe(item)
                for item in value
            ]

        if hasattr(
            value,
            "tolist",
        ):

            return self._json_safe(
                value.tolist()
            )

        return str(
            value
        )

    # ========================================================
    # FINAL VALIDATION
    # ========================================================

    def _validate_scan_result(
        self,
        rows: list[dict],
        valid_rows: list[dict],
        invalid_rows: list[dict],
    ) -> None:

        if not rows:

            raise SmileGridParseError(
                "Không nhận diện được "
                "dòng dữ liệu Smile."
            )

        if not valid_rows:

            raise SmileGridParseError(
                "Không có dòng OCR nào "
                "đủ độ tin cậy."
            )

        invalid_ratio = (
            len(invalid_rows)
            / len(rows)
        )

        if invalid_ratio > 0.40:

            raise SmileGridParseError(
                "Ảnh hoặc parser chưa đạt. "
                f"Có {len(invalid_rows)}/"
                f"{len(rows)} dòng lỗi."
            )