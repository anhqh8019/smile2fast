package com.locninh.smiletofast.dto;



import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SmileGltrnRow(

        Integer gPeriod,
        String journalNo,
        String journalType,

        Long trnSeq,

        String accNo,
        String gClient,

        String trnDesc,

        BigDecimal trnDb,
        BigDecimal trnCr,

        BigDecimal orgAmount,
        BigDecimal orgExRate,

        LocalDateTime postDate

) {
}