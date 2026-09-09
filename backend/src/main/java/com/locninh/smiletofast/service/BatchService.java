package com.locninh.smiletofast.service;
import com.locninh.smiletofast.dto.*;
import com.locninh.smiletofast.repository.BatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BatchService {

    private final BatchRepository repository;

    @Transactional
    public SaveBatchResponse save(
            SaveBatchRequest request
    ) {

        SaveBatchResponse batch;

        if (request.batchId() == null) {

            batch =
                    repository.createBatch(
                            request
                    );

        } else {

            repository.updateBatch(
                    request.batchId(),
                    request
            );

            batch =
                    new SaveBatchResponse(
                            request.batchId(),
                            null
                    );
        }

        Long batchId =
                batch.batchId();

        repository.deleteRows(
                batchId
        );

        List<SaveTransactionRequest> rows =
                request.rows() != null
                        ? request.rows()
                        : List.of();

        for (
                int i = 0;
                i < rows.size();
                i++
        ) {

            repository.insertRow(
                    batchId,
                    i + 1,
                    rows.get(i)
            );
        }

        repository.updateCounters(
                batchId
        );

        BatchDetailResponse detail =
                repository.findById(
                        batchId
                );

        return new SaveBatchResponse(
                detail.id(),
                detail.batchCode()
        );
    }

    public List<BatchSummaryResponse> findAll() {

        return repository.findAll();
    }

    public BatchDetailResponse findById(
            Long id
    ) {

        return repository.findById(
                id
        );
    }
}