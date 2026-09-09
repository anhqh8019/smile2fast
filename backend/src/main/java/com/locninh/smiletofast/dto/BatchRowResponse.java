package com.locninh.smiletofast.dto;


import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record BatchRowResponse(
        Long id,
        Integer rowNo,

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
        LocalDateTime postTime,

        String billId,
        LocalDateTime printTime,

        String chrPos,

        Boolean valid,

        String matchStatus,

        String journalNo,
        Long matchedTrnSeq,
        String matchedAccNo,
        String matchedGClient,

        String errorMessage
) {
}