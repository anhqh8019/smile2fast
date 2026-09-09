# app/services/image_preprocessor.py

import cv2
import numpy as np


def decode_image(
    image_bytes: bytes,
) -> np.ndarray:

    if not image_bytes:
        raise ValueError(
            "Image bytes rỗng."
        )

    buffer = np.frombuffer(
        image_bytes,
        dtype=np.uint8,
    )

    image = cv2.imdecode(
        buffer,
        cv2.IMREAD_COLOR,
    )

    if image is None:

        raise ValueError(
            "OpenCV không đọc được ảnh."
        )

    return image