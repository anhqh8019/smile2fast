package com.locninh.smiletofast.service;

import com.locninh.smiletofast.dto.*;
import com.locninh.smiletofast.repository.SmileGltrnRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SmileMatchService {

    private static final String SPECIAL_FOLIO =
            "6000001";


    private final SmileGltrnRepository repository;


    public SmileMatchResponse match(
            SmileMatchRequest request
    ) {

        List<SmileMatchRequestRow> rows =
                request.rows() != null
                        ? request.rows()
                        : List.of();


        List<SmileMatchResult> results =
                new ArrayList<>();


        int matched = 0;
        int notFound = 0;
        int ambiguous = 0;
        int invalid = 0;


        for (
                SmileMatchRequestRow row
                : rows
        ) {

            SmileMatchResult result =
                    matchOne(row);

            results.add(result);


            switch (result.status()) {

                case MATCHED ->
                        matched++;

                case NOT_FOUND ->
                        notFound++;

                case AMBIGUOUS ->
                        ambiguous++;

                case INVALID ->
                        invalid++;
            }
        }


        return new SmileMatchResponse(

                rows.size(),

                matched,

                notFound,

                ambiguous,

                invalid,

                results
        );
    }


    private SmileMatchResult matchOne(
            SmileMatchRequestRow row
    ) {

        // =====================================================
        // VALIDATION
        // =====================================================

        if (
                row.pst() != null
                        && !row.pst()
        ) {

            return invalid(
                    row,
                    "Row chưa Pst"
            );
        }


        if (
                row.voucher() == null
                        || row.voucher().isBlank()
        ) {

            return invalid(
                    row,
                    "Thiếu Voucher"
            );
        }


        if (
                row.voucher().length()
                        <= 6
        ) {

            return invalid(
                    row,
                    "Voucher không hợp lệ: "
                            + row.voucher()
            );
        }


        if (
                row.folio() == null
                        || row.folio().isBlank()
        ) {

            return invalid(
                    row,
                    "Thiếu Folio"
            );
        }


        BigDecimal amount =
                resolveAmount(
                        row
                );


        if (amount == null) {

            return invalid(
                    row,
                    "Không có Amount/GLAmount"
            );
        }


        // =====================================================
        // PARSE VOUCHER
        //
        // 202608RV26/08-301
        //
        // =>
        //
        // GPeriod   = 202608
        // JournalNo = RV26/08-301
        // =====================================================

        Integer gPeriod;

        String journalNo;


        try {

            gPeriod =
                    Integer.valueOf(
                            row.voucher()
                                    .substring(
                                            0,
                                            6
                                    )
                    );


            journalNo =
                    row.voucher()
                            .substring(
                                    6
                            );

        } catch (Exception e) {

            return invalid(
                    row,
                    "Không parse được Voucher: "
                            + row.voucher()
            );
        }


        // =====================================================
        // QUERY
        // =====================================================

        List<SmileGltrnRow> candidates;


        if (
                SPECIAL_FOLIO.equals(
                        row.folio()
                )
        ) {

            if (
                    row.refNo() == null
                            || row.refNo()
                            .isBlank()
            ) {

                return invalid(
                        row,
                        "Folio 6000001 nhưng thiếu Ref#"
                );
            }


            candidates =
                    repository
                            .findFolio6000001(

                                    gPeriod,

                                    journalNo,

                                    amount,

                                    row.refNo()
                            );

        } else {

            candidates =
                    repository
                            .findNormalFolio(

                                    gPeriod,

                                    journalNo,

                                    amount,

                                    row.folio()
                            );
        }


        // =====================================================
        // NOT FOUND
        // =====================================================

        if (
                candidates.isEmpty()
        ) {

            /*
             * Fallback này rất hữu ích
             * trong giai đoạn tìm rule Smile.
             *
             * Nếu Voucher + Amount tìm được,
             * nhưng Folio/GClient không match,
             * trả AMBIGUOUS để user review,
             * không tự động nhận.
             */

            List<SmileGltrnRow> fallback =
                    repository
                            .findByVoucherAndAmount(

                                    gPeriod,

                                    journalNo,

                                    amount
                            );


            if (
                    fallback.isEmpty()
            ) {

                return new SmileMatchResult(

                        row.id(),

                        SmileMatchStatus.NOT_FOUND,

                        "Không tìm thấy GLTRN",

                        null,
                        null,
                        null,
                        null,

                        List.of()
                );
            }


            return new SmileMatchResult(

                    row.id(),

                    SmileMatchStatus.AMBIGUOUS,

                    "Voucher + Amount có dữ liệu nhưng GClient không khớp rule Folio/Ref#",

                    null,
                    null,
                    null,
                    null,

                    fallback
            );
        }


        // =====================================================
        // MULTIPLE
        // =====================================================

        if (
                candidates.size() > 1
        ) {

            return new SmileMatchResult(

                    row.id(),

                    SmileMatchStatus.AMBIGUOUS,

                    "Có nhiều GLTRN cùng match",

                    null,
                    null,
                    null,
                    null,

                    candidates
            );
        }


        // =====================================================
        // MATCHED
        // =====================================================

        SmileGltrnRow matched =
                candidates.getFirst();


        return new SmileMatchResult(

                row.id(),

                SmileMatchStatus.MATCHED,

                "Match thành công",

                matched.journalNo(),

                matched.trnSeq(),

                matched.accNo(),

                matched.gClient(),

                candidates
        );
    }


    private BigDecimal resolveAmount(
            SmileMatchRequestRow row
    ) {

        if (
                row.amount() != null
        ) {

            return row.amount()
                    .abs();
        }


        if (
                row.glAmount() != null
        ) {

            return row.glAmount()
                    .abs();
        }


        return null;
    }


    private SmileMatchResult invalid(
            SmileMatchRequestRow row,
            String message
    ) {

        return new SmileMatchResult(

                row.id(),

                SmileMatchStatus.INVALID,

                message,

                null,
                null,
                null,
                null,

                List.of()
        );
    }
}