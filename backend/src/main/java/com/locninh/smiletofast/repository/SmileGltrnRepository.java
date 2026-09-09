package com.locninh.smiletofast.repository;

import com.locninh.smiletofast.dto.JTypeDto;
import com.locninh.smiletofast.dto.SmileGltrnRow;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.List;

@Repository

public class SmileGltrnRepository {


    private final JdbcTemplate jdbc;

    public SmileGltrnRepository(
            @Qualifier("smileJdbcTemplate")
            JdbcTemplate jdbc
    ) {
        this.jdbc = jdbc;
    }


    /**
     * Folio bình thường:
     *
     * GPeriod
     * + JournalNo
     * + Amount
     * + GClient = Folio
     */
    public List<SmileGltrnRow> findNormalFolio(
            Integer gPeriod,
            String journalNo,
            BigDecimal amount,
            String folio
    ) {

        String sql = """
                SELECT
                    GPeriod,
                    JournalNo,
                    JournalType,
                    TrnSeq,
                    AccNo,

                    CAST(GClient AS varchar(100))
                        AS GClient,

                    TrnDesc,

                    TrnDb,
                    TrnCr,

                    OrgAmount,
                    OrgExRate,

                    PostDate

                FROM dbo.GLTRN

                WHERE GPeriod = ?
                  AND JournalNo = ?

                  AND (
                        ABS(ISNULL(TrnDb, 0)) = ?
                     OR ABS(ISNULL(TrnCr, 0)) = ?
                  )

                  AND CAST(
                        GClient AS varchar(100)
                      ) = ?

                ORDER BY TrnSeq
                """;

        return jdbc.query(
                sql,
                this::mapRow,

                gPeriod,
                journalNo,

                amount.abs(),
                amount.abs(),

                folio
        );
    }


    /**
     * Folio đặc biệt 6000001:
     *
     * Grid:
     *
     * Folio = 6000001
     * Ref#  = 100002557
     *
     * GLTRN:
     *
     * GClient = 100002557
     *
     * tức là match bằng Ref#.
     */
    public List<SmileGltrnRow> findFolio6000001(
            Integer gPeriod,
            String journalNo,
            BigDecimal amount,
            String refNo
    ) {

        String sql = """
                SELECT
                    GPeriod,
                    JournalNo,
                    JournalType,
                    TrnSeq,
                    AccNo,

                    CAST(GClient AS varchar(100))
                        AS GClient,

                    TrnDesc,

                    TrnDb,
                    TrnCr,

                    OrgAmount,
                    OrgExRate,

                    PostDate

                FROM dbo.GLTRN

                WHERE GPeriod = ?
                  AND JournalNo = ?

                  AND (
                        ABS(ISNULL(TrnDb, 0)) = ?
                     OR ABS(ISNULL(TrnCr, 0)) = ?
                  )

                  AND CAST(
                        GClient AS varchar(100)
                      ) = ?

                ORDER BY TrnSeq
                """;

        return jdbc.query(
                sql,
                this::mapRow,

                gPeriod,
                journalNo,

                amount.abs(),
                amount.abs(),

                refNo
        );
    }


    /**
     * Fallback:
     *
     * Không dùng Folio/GClient.
     *
     * Chỉ:
     *
     * GPeriod + JournalNo + Amount
     *
     * Dùng để debug hoặc trường hợp
     * GClient khác rule hiện tại.
     */
    public List<SmileGltrnRow> findByVoucherAndAmount(
            Integer gPeriod,
            String journalNo,
            BigDecimal amount
    ) {

        String sql = """
                SELECT
                    GPeriod,
                    JournalNo,
                    JournalType,
                    TrnSeq,
                    AccNo,

                    CAST(GClient AS varchar(100))
                        AS GClient,

                    TrnDesc,

                    TrnDb,
                    TrnCr,

                    OrgAmount,
                    OrgExRate,

                    PostDate

                FROM dbo.GLTRN

                WHERE GPeriod = ?
                  AND JournalNo = ?

                  AND (
                        ABS(ISNULL(TrnDb, 0)) = ?
                     OR ABS(ISNULL(TrnCr, 0)) = ?
                  )

                ORDER BY TrnSeq
                """;

        return jdbc.query(
                sql,
                this::mapRow,

                gPeriod,
                journalNo,

                amount.abs(),
                amount.abs()
        );
    }


    private SmileGltrnRow mapRow(
            ResultSet rs,
            int rowNum
    ) throws SQLException {

        Timestamp postDate =
                rs.getTimestamp(
                        "PostDate"
                );

        return new SmileGltrnRow(

                rs.getInt(
                        "GPeriod"
                ),

                rs.getString(
                        "JournalNo"
                ),

                rs.getString(
                        "JournalType"
                ),

                rs.getLong(
                        "TrnSeq"
                ),

                rs.getString(
                        "AccNo"
                ),

                rs.getString(
                        "GClient"
                ),

                rs.getString(
                        "TrnDesc"
                ),

                rs.getBigDecimal(
                        "TrnDb"
                ),

                rs.getBigDecimal(
                        "TrnCr"
                ),

                rs.getBigDecimal(
                        "OrgAmount"
                ),

                rs.getBigDecimal(
                        "OrgExRate"
                ),

                postDate != null
                        ? postDate.toLocalDateTime()
                        : null
        );
    }

}