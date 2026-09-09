package com.locninh.smiletofast.dto;


import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record BatchDetailResponse(
        Long id,
        String batchCode,
        LocalDate businessDate,
        String status,
        String note,

        Integer totalRows,
        Integer validRows,
        Integer matchedRows,
        Integer invalidRows,
        Integer duplicateRows,

        LocalDateTime createdAt,
        LocalDateTime updatedAt,

        List<BatchRowResponse> rows
) {
}