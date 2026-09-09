package com.locninh.smiletofast.repository;
import com.locninh.smiletofast.dto.*;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Repository
public class BatchRepository {

    @Qualifier("integrationJdbcTemplate")
    private final JdbcTemplate jdbc;

    public BatchRepository(
            @Qualifier("integrationJdbcTemplate")
            JdbcTemplate jdbc
    ) {
        this.jdbc = jdbc;
    }

    public SaveBatchResponse createBatch(
            SaveBatchRequest request
    ) {

        String batchCode =
                "BATCH-" +
                        LocalDateTime.now().format(
                                DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")
                        );

        KeyHolder keyHolder =
                new GeneratedKeyHolder();

        jdbc.update(
                connection -> {

                    PreparedStatement ps =
                            connection.prepareStatement(
                                    """
                                    INSERT INTO dbo.integration_batch
                                    (
                                        batch_code,
                                        business_date,
                                        status,
                                        note
                                    )
                                    VALUES (?, ?, 'DRAFT', ?)
                                    """,
                                    Statement.RETURN_GENERATED_KEYS
                            );

                    ps.setString(
                            1,
                            batchCode
                    );

                    if (request.businessDate() != null) {
                        ps.setDate(
                                2,
                                Date.valueOf(
                                        request.businessDate()
                                )
                        );
                    } else {
                        ps.setNull(
                                2,
                                Types.DATE
                        );
                    }

                    ps.setString(
                            3,
                            request.note()
                    );

                    return ps;
                },
                keyHolder
        );

        Long id =
                keyHolder.getKey()
                        .longValue();

        return new SaveBatchResponse(
                id,
                batchCode
        );
    }

    public void updateBatch(
            Long batchId,
            SaveBatchRequest request
    ) {

        jdbc.update(
                """
                UPDATE dbo.integration_batch
                SET
                    business_date = ?,
                    note = ?,
                    updated_at = SYSDATETIME()
                WHERE id = ?
                """,
                request.businessDate(),
                request.note(),
                batchId
        );
    }

    public void deleteRows(
            Long batchId
    ) {

        jdbc.update(
                """
                DELETE
                FROM dbo.integration_transaction
                WHERE batch_id = ?
                """,
                batchId
        );
    }

    public void insertRow(
            Long batchId,
            int rowNo,
            SaveTransactionRequest row
    ) {

        jdbc.update(
                """
                INSERT INTO dbo.integration_transaction
                (
                    batch_id,
                    row_no,
                    source_image_name,

                    pst,
                    folio,
                    bc,
                    voucher,

                    code,
                    description,
                    room,

                    amount,
                    origin_amount,
                    exchange_rate,
                    gl_amount,

                    ref_no,
                    comment,
                    seri,
                    bill_no,

                    cashier,
                    post_time,
                    bill_id,
                    print_time,
                    chr_pos,

                    valid,
                    match_status,

                    matched_journal_no,
                    matched_trn_seq,
                    matched_acc_no,
                    matched_gclient,

                    error_message
                )
                VALUES
                (
                    ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?,
                    ?, ?, ?, ?,
                    ?
                )
                """,

                batchId,
                rowNo,
                row.sourceImageName(),

                Boolean.TRUE.equals(row.pst()),
                row.folio(),
                row.bc(),
                row.voucher(),

                row.code(),
                row.description(),
                row.room(),

                row.amount(),
                row.originAmount(),
                row.exchangeRate(),
                row.glAmount(),

                row.refNo(),
                row.comment(),

                row.seri(),
                row.billNo(),

                row.cashier(),
                row.postTime(),

                row.billId(),
                row.printTime(),

                row.chrPos(),

                Boolean.TRUE.equals(row.valid()),
                row.matchStatus(),

                row.journalNo(),
                row.matchedTrnSeq(),
                row.matchedAccNo(),
                row.matchedGClient(),

                row.errors() != null
                        ? String.join(
                        "; ",
                        row.errors()
                )
                        : null
        );
    }

    public void updateCounters(
            Long batchId
    ) {

        jdbc.update(
                """
                UPDATE b
                SET
                    total_rows = x.total_rows,
                    valid_rows = x.valid_rows,
                    matched_rows = x.matched_rows,
                    invalid_rows = x.invalid_rows,
                    duplicate_rows = x.duplicate_rows,

                    status =
                        CASE
                            WHEN x.invalid_rows > 0
                                OR x.duplicate_rows > 0
                                THEN 'DRAFT'

                            WHEN x.total_rows > 0
                                AND x.matched_rows = x.total_rows
                                THEN 'READY_TO_IMPORT'

                            WHEN x.matched_rows > 0
                                THEN 'MATCHED'

                            ELSE 'DRAFT'
                        END,

                    updated_at = SYSDATETIME()

                FROM dbo.integration_batch b

                CROSS APPLY
                (
                    SELECT
                        COUNT(*) AS total_rows,

                        SUM(
                            CASE
                                WHEN t.valid = 1
                                THEN 1
                                ELSE 0
                            END
                        ) AS valid_rows,

                        SUM(
                            CASE
                                WHEN t.match_status = 'MATCHED'
                                THEN 1
                                ELSE 0
                            END
                        ) AS matched_rows,

                        SUM(
                            CASE
                                WHEN t.valid = 0
                                THEN 1
                                ELSE 0
                            END
                        ) AS invalid_rows,

                        SUM(
                            CASE
                                WHEN t.match_status = 'DUPLICATE'
                                THEN 1
                                ELSE 0
                            END
                        ) AS duplicate_rows

                    FROM dbo.integration_transaction t
                    WHERE t.batch_id = b.id
                ) x

                WHERE b.id = ?
                """,
                batchId
        );
    }

    public List<BatchSummaryResponse> findAll() {

        return jdbc.query(
                """
                SELECT
                    id,
                    batch_code,
                    business_date,
                    status,

                    total_rows,
                    valid_rows,
                    matched_rows,
                    invalid_rows,
                    duplicate_rows,

                    updated_at

                FROM dbo.integration_batch

                ORDER BY updated_at DESC
                """,
                (rs, rowNum) ->
                        new BatchSummaryResponse(
                                rs.getLong("id"),
                                rs.getString("batch_code"),

                                rs.getDate("business_date") != null
                                        ? rs.getDate("business_date")
                                        .toLocalDate()
                                        : null,

                                rs.getString("status"),

                                rs.getInt("total_rows"),
                                rs.getInt("valid_rows"),
                                rs.getInt("matched_rows"),
                                rs.getInt("invalid_rows"),
                                rs.getInt("duplicate_rows"),

                                rs.getTimestamp("updated_at")
                                        .toLocalDateTime()
                        )
        );
    }

    public BatchDetailResponse findById(
            Long batchId
    ) {

        var batch =
                jdbc.queryForObject(
                        """
                        SELECT
                            id,
                            batch_code,
                            business_date,
                            status,
                            note,

                            total_rows,
                            valid_rows,
                            matched_rows,
                            invalid_rows,
                            duplicate_rows,

                            created_at,
                            updated_at

                        FROM dbo.integration_batch

                        WHERE id = ?
                        """,
                        (rs, rowNum) ->
                                new BatchDetailResponse(
                                        rs.getLong("id"),
                                        rs.getString("batch_code"),

                                        rs.getDate("business_date") != null
                                                ? rs.getDate("business_date")
                                                .toLocalDate()
                                                : null,

                                        rs.getString("status"),
                                        rs.getString("note"),

                                        rs.getInt("total_rows"),
                                        rs.getInt("valid_rows"),
                                        rs.getInt("matched_rows"),
                                        rs.getInt("invalid_rows"),
                                        rs.getInt("duplicate_rows"),

                                        rs.getTimestamp("created_at")
                                                .toLocalDateTime(),

                                        rs.getTimestamp("updated_at")
                                                .toLocalDateTime(),

                                        List.of()
                                ),
                        batchId
                );

        List<BatchRowResponse> rows =
                jdbc.query(
                        """
                        SELECT
                            id,
                            row_no,
                            source_image_name,

                            pst,
                            folio,
                            bc,
                            voucher,

                            code,
                            description,
                            room,

                            amount,
                            origin_amount,
                            exchange_rate,
                            gl_amount,

                            ref_no,
                            comment,
                            seri,
                            bill_no,

                            cashier,
                            post_time,
                            bill_id,
                            print_time,
                            chr_pos,

                            valid,
                            match_status,

                            matched_journal_no,
                            matched_trn_seq,
                            matched_acc_no,
                            matched_gclient,

                            error_message

                        FROM dbo.integration_transaction

                        WHERE batch_id = ?

                        ORDER BY row_no
                        """,

                        (rs, rowNum) ->
                                new BatchRowResponse(
                                        rs.getLong("id"),
                                        rs.getInt("row_no"),

                                        rs.getString("source_image_name"),

                                        rs.getBoolean("pst"),

                                        rs.getString("folio"),
                                        rs.getString("bc"),
                                        rs.getString("voucher"),

                                        rs.getString("code"),
                                        rs.getString("description"),
                                        rs.getString("room"),

                                        rs.getBigDecimal("amount"),
                                        rs.getBigDecimal("origin_amount"),
                                        rs.getBigDecimal("exchange_rate"),
                                        rs.getBigDecimal("gl_amount"),

                                        rs.getString("ref_no"),
                                        rs.getString("comment"),

                                        rs.getString("seri"),
                                        rs.getString("bill_no"),

                                        rs.getString("cashier"),

                                        toLocalDateTime(
                                                rs.getTimestamp("post_time")
                                        ),

                                        rs.getString("bill_id"),

                                        toLocalDateTime(
                                                rs.getTimestamp("print_time")
                                        ),

                                        rs.getString("chr_pos"),

                                        rs.getBoolean("valid"),

                                        rs.getString("match_status"),

                                        rs.getString("matched_journal_no"),

                                        getNullableLong(
                                                rs,
                                                "matched_trn_seq"
                                        ),

                                        rs.getString("matched_acc_no"),
                                        rs.getString("matched_gclient"),

                                        rs.getString("error_message")
                                ),

                        batchId
                );

        return new BatchDetailResponse(
                batch.id(),
                batch.batchCode(),
                batch.businessDate(),
                batch.status(),
                batch.note(),

                batch.totalRows(),
                batch.validRows(),
                batch.matchedRows(),
                batch.invalidRows(),
                batch.duplicateRows(),

                batch.createdAt(),
                batch.updatedAt(),

                rows
        );
    }

    private static LocalDateTime toLocalDateTime(
            Timestamp value
    ) {

        return value != null
                ? value.toLocalDateTime()
                : null;
    }

    private static Long getNullableLong(
            ResultSet rs,
            String column
    ) throws SQLException {

        long value =
                rs.getLong(column);

        return rs.wasNull()
                ? null
                : value;
    }
}
