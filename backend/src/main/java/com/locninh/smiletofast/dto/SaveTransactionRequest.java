package com.locninh.smiletofast.dto;



import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record SaveTransactionRequest(
        Long id,

        String sourceImageName,

        Boolean pst,

        String folio,
        String bc,
        String voucher,

        String code,
        String description,
        String room,

        BigDecimal amount,
        BigDecimal originAmount,
        BigDecimal exchangeRate,
        BigDecimal glAmount,

        String refNo,
        String comment,

        String seri,
        String billNo,

        String cashier,

        @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss")
        LocalDateTime postTime,

        String billId,

        @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss")
        LocalDateTime printTime,

        String chrPos,

        Boolean valid,

        String matchStatus,

        String journalNo,
        Long matchedTrnSeq,
        String matchedAccNo,
        String matchedGClient,

        List<String> errors
) {
}