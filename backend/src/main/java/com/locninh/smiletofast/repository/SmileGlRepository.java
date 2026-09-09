package com.locninh.smiletofast.repository;

import com.locninh.smiletofast.dto.JTypeDto;
import com.locninh.smiletofast.dto.SmileGlTransaction;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Repository
public class SmileGlRepository {

    private final JdbcTemplate jdbc;

    public SmileGlRepository(
            @Qualifier("smileJdbcTemplate")
            JdbcTemplate jdbc
    ) {
        this.jdbc = jdbc;
    }

    public List<JTypeDto> findJournalTypes() {

        String sql = """
        SELECT
            JType,
            Description
        FROM SMILE_BO.dbo.JType
        WHERE JType IS NOT NULL
        ORDER BY JType
        """;

        return jdbc.query(
                sql,
                (rs, rowNum) ->
                        new JTypeDto(
                                rs.getString("JType"),
                                rs.getString("Description")
                        )
        );
    }

    public List<SmileGlTransaction> findTransactions(
            LocalDate fromDate,
            LocalDate toDate,
            String period,
            String journalType
    ) {

        StringBuilder sql = new StringBuilder("""
        SELECT
            g.AccNo,
            g.GPeriod,
            g.PostDate,
            g.GUser,
            g.TrnSeq,
            g.JournalNo,
            g.JournalType,
            g.TrnRef,
            g.TrnXRef,
            g.TrnDesc,
            g.GApp,
            g.GClient,
            g.TrnDb,
            g.TrnCr,
            g.OrgCurr,
            g.OrgExRate,
            g.OrgAmount,
            g.DeptCode
        FROM SMILE_BO.dbo.GLTRN g
        WHERE g.PostDate >= ?
          AND g.PostDate < DATEADD(DAY, 1, ?)
          AND g.GPeriod = ?
        """);

        List<Object> params = new ArrayList<>();

        params.add(fromDate);
        params.add(toDate);
        params.add(period);

        if (
                journalType != null &&
                        !journalType.isBlank()
        ) {

            sql.append("""
            AND g.JournalType = ?
            """);

            params.add(journalType);

        } else {

            sql.append("""
            AND EXISTS (
                SELECT 1
                FROM SMILE_BO.dbo.JType jt
                WHERE jt.JType = g.JournalType
            )
            """);
        }

        sql.append("""
        ORDER BY
            g.PostDate,
            g.JournalNo,
            g.TrnSeq
        """);

        return jdbc.query(
                sql.toString(),

                (rs, rowNum) ->
                        new SmileGlTransaction(
                                rs.getString("AccNo"),
                                rs.getString("GPeriod"),

                                rs.getTimestamp("PostDate") != null
                                        ? rs.getTimestamp("PostDate").toLocalDateTime()
                                        : null,

                                rs.getString("GUser"),
                                rs.getLong("TrnSeq"),
                                rs.getString("JournalNo"),
                                rs.getString("JournalType"),
                                rs.getString("TrnRef"),
                                rs.getString("TrnXRef"),
                                rs.getString("TrnDesc"),
                                rs.getString("GApp"),
                                rs.getString("GClient"),
                                rs.getBigDecimal("TrnDb"),
                                rs.getBigDecimal("TrnCr"),
                                rs.getString("OrgCurr"),
                                rs.getBigDecimal("OrgExRate"),
                                rs.getBigDecimal("OrgAmount"),
                                rs.getString("DeptCode")
                        ),

                params.toArray()
        );
    }

}