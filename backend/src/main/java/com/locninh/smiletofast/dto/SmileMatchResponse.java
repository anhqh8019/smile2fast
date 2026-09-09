package com.locninh.smiletofast.dto;



import java.util.List;

public record SmileMatchResponse(

        Integer total,

        Integer matched,

        Integer notFound,

        Integer ambiguous,

        Integer invalid,

        List<SmileMatchResult> results

) {
}