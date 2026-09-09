# app/services/image_quality_validator.py

import cv2
import numpy as np


class ImageQualityValidator:

    def validate(self, image: np.ndarray) -> None:
        height, width = image.shape[:2]

        # 1. Kích thước tối thiểu
        if width < 1000 or height < 300:
            raise ValueError(
                f"Ảnh quá nhỏ ({width}x{height}). "
                "Vui lòng chụp toàn bộ bảng Smile ở độ phân giải rõ hơn."
            )

        # 2. Kiểm tra độ nét bằng variance of Laplacian
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        sharpness = cv2.Laplacian(
            gray,
            cv2.CV_64F
        ).var()

        if sharpness < 60:
            raise ValueError(
                f"Ảnh bị mờ (sharpness={sharpness:.1f}). "
                "Vui lòng chụp lại ảnh rõ nét hơn."
            )

        # 3. Kiểm tra độ tương phản
        contrast = gray.std()

        if contrast < 25:
            raise ValueError(
                f"Ảnh có độ tương phản thấp ({contrast:.1f}). "
                "Vui lòng chụp lại với chữ và nền rõ hơn."
            )