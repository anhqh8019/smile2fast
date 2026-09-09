package com.locninh.smiletofast.controller;

import com.locninh.smiletofast.dto.SmileMatchRequest;
import com.locninh.smiletofast.dto.SmileMatchResponse;

import com.locninh.smiletofast.service.SmileMatchService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/smile")
@RequiredArgsConstructor
@CrossOrigin(
        origins = {
                "http://localhost:5173",
                "http://127.0.0.1:5173"
        }
)
public class SmileMatchController {

    private final SmileMatchService service;


    @PostMapping("/match")
    public SmileMatchResponse match(
            @RequestBody SmileMatchRequest request
    ) {

        return service.match(
                request
        );
    }
}