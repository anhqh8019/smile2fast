package com.locninh.smiletofast.dto;



import java.util.List;

public record SmileMatchResult(

        String rowId,

        SmileMatchStatus status,

        String message,

        String journalNo,

        Long matchedTrnSeq,

        String matchedAccNo,

        String matchedGClient,

        List<SmileGltrnRow> candidates

) {
}