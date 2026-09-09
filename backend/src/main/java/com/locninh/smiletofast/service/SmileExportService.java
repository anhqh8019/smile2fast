package com.locninh.smiletofast.service;

import com.locninh.smiletofast.dto.JTypeDto;
import com.locninh.smiletofast.dto.SmileGlTransaction;
import com.locninh.smiletofast.repository.SmileGlRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SmileExportService {

    private final SmileGlRepository repository;


    public List<JTypeDto> getJournalTypes() {

        return repository.findJournalTypes();
    }


    public List<SmileGlTransaction> getTransactions(
            LocalDate fromDate,
            LocalDate toDate,
            String period,
            String journalType
    ) {

        if (fromDate == null) {
            throw new IllegalArgumentException(
                    "From Date không được để trống"
            );
        }

        if (toDate == null) {
            throw new IllegalArgumentException(
                    "To Date không được để trống"
            );
        }

        if (toDate.isBefore(fromDate)) {
            throw new IllegalArgumentException(
                    "To Date không được nhỏ hơn From Date"
            );
        }

        if (
                period == null ||
                        period.isBlank()
        ) {
            throw new IllegalArgumentException(
                    "Chu kỳ không được để trống"
            );
        }

        return repository.findTransactions(
                fromDate,
                toDate,
                period.trim(),
                journalType
        );
    }
}