package com.locninh.smiletofast.dto;


import java.util.List;

public record SmileMatchRequest(
        List<SmileMatchRequestRow> rows
) {
}