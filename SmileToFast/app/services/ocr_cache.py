from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any


class OcrCache:

    def __init__(
        self,
        cache_dir: str = "cache/ocr",
    ):
        self.cache_dir = Path(cache_dir)

        self.cache_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

    def build_key(
        self,
        image_bytes: bytes,
    ) -> str:

        return hashlib.sha256(
            image_bytes
        ).hexdigest()

    def get(
        self,
        key: str,
    ) -> Any | None:

        file_path = self._path(key)

        if not file_path.exists():
            return None

        try:
            with file_path.open(
                "r",
                encoding="utf-8",
            ) as f:
                return json.load(f)

        except Exception as exc:
            print(
                f"OCR cache read error: {exc}"
            )

            return None

    def put(
        self,
        key: str,
        value: Any,
    ) -> None:

        file_path = self._path(key)

        with file_path.open(
            "w",
            encoding="utf-8",
        ) as f:

            json.dump(
                value,
                f,
                ensure_ascii=False,
                indent=2,
            )

    def delete(
        self,
        key: str,
    ) -> None:

        file_path = self._path(key)

        if file_path.exists():
            file_path.unlink()

    def clear(self) -> int:

        count = 0

        for file_path in self.cache_dir.glob(
            "*.json"
        ):

            file_path.unlink()
            count += 1

        return count

    def exists(
        self,
        key: str,
    ) -> bool:

        return self._path(
            key
        ).exists()

    def _path(
        self,
        key: str,
    ) -> Path:

        return (
            self.cache_dir
            / f"{key}.json"
        )