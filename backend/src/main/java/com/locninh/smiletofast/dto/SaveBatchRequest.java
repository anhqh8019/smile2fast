package com.locninh.smiletofast.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.util.List;

public record SaveBatchRequest(
        Long batchId,

        @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss")
        LocalDate businessDate,
        String note,
        List<SaveTransactionRequest> rows
) {
}