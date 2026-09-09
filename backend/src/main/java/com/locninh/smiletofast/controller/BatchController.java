package com.locninh.smiletofast.controller;

import com.locninh.smiletofast.dto.BatchDetailResponse;
import com.locninh.smiletofast.dto.BatchSummaryResponse;
import com.locninh.smiletofast.dto.SaveBatchRequest;
import com.locninh.smiletofast.dto.SaveBatchResponse;
import com.locninh.smiletofast.service.BatchService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/batches")
@RequiredArgsConstructor
@CrossOrigin(
        origins = {
                "http://localhost:5173",
                "http://127.0.0.1:5173"
        }
)
public class BatchController {

    private final BatchService service;

    @PostMapping("/save")
    public SaveBatchResponse save(
            @RequestBody SaveBatchRequest request
    ) {

        return service.save(
                request
        );
    }

    @GetMapping
    public List<BatchSummaryResponse> getBatches() {

        return service.findAll();
    }

    @GetMapping("/{id}")
    public BatchDetailResponse getBatch(
            @PathVariable Long id
    ) {

        return service.findById(
                id
        );
    }
}