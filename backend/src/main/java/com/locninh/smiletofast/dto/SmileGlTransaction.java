package com.locninh.smiletofast.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SmileGlTransaction(
        String accNo,
        String gPeriod,
        LocalDateTime postDate,
        String gUser,
        Long trnSeq,
        String journalNo,
        String journalType,
        String trnRef,
        String trnXRef,
        String trnDesc,
        String gApp,
        String gClient,
        BigDecimal trnDb,
        BigDecimal trnCr,
        String orgCurr,
        BigDecimal orgExRate,
        BigDecimal orgAmount,
        String deptCode
) {}