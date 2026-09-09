package com.locninh.smiletofast.controller;

import com.locninh.smiletofast.dto.JTypeDto;
import com.locninh.smiletofast.dto.SmileGlTransaction;
import com.locninh.smiletofast.service.SmileExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/smile")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class SmileExportController {

    private final SmileExportService service;


    /*
     * Load Select Box Journal Type
     */
    @GetMapping("/journal-types")
    public List<JTypeDto> getJournalTypes() {

        return service.getJournalTypes();
    }


    /*
     * Query GLTRN
     */
    @GetMapping("/gl-transactions")
    public List<SmileGlTransaction> getTransactions(

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fromDate,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate toDate,

            @RequestParam
            String period,

            @RequestParam(required = false)
            String journalType

    ) {

        return service.getTransactions(
                fromDate,
                toDate,
                period,
                journalType
        );
    }
}