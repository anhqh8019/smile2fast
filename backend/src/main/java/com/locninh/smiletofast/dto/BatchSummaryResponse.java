package com.locninh.smiletofast.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record BatchSummaryResponse(
        Long id,
        String batchCode,
        LocalDate businessDate,
        String status,
        Integer totalRows,
        Integer validRows,
        Integer matchedRows,
        Integer invalidRows,
        Integer duplicateRows,
        LocalDateTime updatedAt
) {
}
