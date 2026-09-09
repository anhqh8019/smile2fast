package com.locninh.smiletofast.dto;

import java.math.BigDecimal;

public record SmileMatchRequestRow(

        String id,

        Boolean pst,

        String folio,
        String voucher,

        BigDecimal amount,
        BigDecimal glAmount,

        String refNo

) {
}