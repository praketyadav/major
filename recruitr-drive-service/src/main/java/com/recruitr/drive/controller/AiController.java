package com.recruitr.drive.controller;

import com.recruitr.drive.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/command")
    public ResponseEntity<Map<String, String>> handleCommand(
            @RequestBody Map<String, String> body,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role) {

        String command = body.get("command");
        if (command == null || command.isBlank()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Command cannot be empty"));
        }

        String result = aiService.processCommand(
            command, Long.parseLong(userId), role);

        return ResponseEntity.ok(Map.of("result", result));
    }
}
