package com.recruitr.drive.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.recruitr.drive.dto.DriveRequest;
import com.recruitr.drive.dto.QuestionRequest;
import com.recruitr.drive.dto.RoundRequest;
import com.recruitr.drive.model.QuestionType;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AiService {

    private final RestTemplate restTemplate;
    private final DriveService driveService;
    private final QuestionService questionService;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api-key}")
    private String apiKey;

    @Value("${gemini.url}")
    private String geminiUrl;

    private static final String SYSTEM_PROMPT = """
        You are an AI assistant for a campus placement platform called Recruitr.
        Your ONLY job is to parse user commands into a structured JSON object.
        You must ALWAYS respond with valid JSON only. No explanation. No markdown.
        No code blocks. Just raw JSON.

        The JSON must follow this exact schema:

        {
          "action": "<ACTION_TYPE>",
          "result": "<human-readable summary of what you understood>",
          "payload": { ... }
        }

        Supported ACTION_TYPE values and their payload schemas:

        1. CREATE_DRIVE
           payload: { "title": string, "description": string }

        2. ADD_ROUND
           payload: {
             "driveId": number,
             "title": string,
             "durationMinutes": number,
             "cutoffScore": number
           }

        3. CREATE_QUESTION
           Generate one or more questions. Return a LIST of question objects.
           payload: {
             "questions": [
               {
                 "questionText": string,
                 "questionType": "MCQ" or "SUBJECTIVE",
                 "marks": number,
                 "tags": string,
                 "optionA": string or null,
                 "optionB": string or null,
                 "optionC": string or null,
                 "optionD": string or null,
                 "correctOption": "A" or "B" or "C" or "D" or null
               }
             ]
           }
           For SUBJECTIVE questions, set all option fields and correctOption to null.
           For MCQ questions, all four options and correctOption are required.

        4. QUERY_RESULTS
           payload: { "roundId": number }

        5. UNKNOWN
           Use this when the command cannot be mapped to any supported action.
           payload: {}

        Rules:
        - driveId and roundId must be extracted from the user's message if mentioned.
          If not mentioned and required, set to 0.
        - For CREATE_QUESTION, generate realistic, domain-appropriate question content
          based on the topic the user specifies.
        - For MCQ, always generate plausible wrong options alongside the correct answer.
        - Marks default: MCQ = 2, SUBJECTIVE = 10, unless user specifies.
        - Tags: derive from topic keywords in the user's command (comma-separated).
        - description defaults to empty string if not provided.
        - durationMinutes defaults to 30 if not specified.
        - cutoffScore defaults to 40 if not specified.
        """;

    public String processCommand(String userCommand,
            Long companyId, String callerRole) {
        try {
            // 1. Build Gemini request body
            String fullPrompt = SYSTEM_PROMPT + "\n\nUser command: " + userCommand;

            Map<String, Object> part = Map.of("text", fullPrompt);
            Map<String, Object> content = Map.of("parts", List.of(part));
            Map<String, Object> requestBody = Map.of(
                "contents", List.of(content),
                "generationConfig", Map.of(
                    "temperature", 0.2,
                    "maxOutputTokens", 1024
                )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String urlWithKey = geminiUrl + "?key=" + apiKey;
            HttpEntity<Map<String, Object>> entity =
                    new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                urlWithKey, HttpMethod.POST, entity, Map.class);

            // 2. Extract generated text from Gemini response
            Map<?, ?> body = response.getBody();
            if (body == null) return "AI service returned an empty response.";

            List<?> candidates = (List<?>) body.get("candidates");
            if (candidates == null || candidates.isEmpty())
                return "AI service returned no candidates.";

            Map<?, ?> candidate = (Map<?, ?>) candidates.get(0);
            Map<?, ?> contentNode = (Map<?, ?>) candidate.get("content");
            List<?> parts = (List<?>) contentNode.get("parts");
            String rawJson = ((Map<?, ?>) parts.get(0))
                    .get("text").toString().trim();

            // Strip markdown code fences if Gemini adds them
            if (rawJson.startsWith("```")) {
                rawJson = rawJson
                    .replaceAll("^```[a-zA-Z]*\\n?", "")
                    .replaceAll("```$", "")
                    .trim();
            }

            // 3. Parse the JSON
            JsonNode root = objectMapper.readTree(rawJson);
            String action = root.path("action").asText("UNKNOWN");
            String resultMsg = root.path("result")
                    .asText("Command processed.");
            JsonNode payload = root.path("payload");

            // 4. Route to correct service method
            return switch (action) {
                case "CREATE_DRIVE" -> {
                    DriveRequest req = new DriveRequest();
                    req.setTitle(payload.path("title").asText());
                    req.setDescription(
                        payload.path("description").asText(""));
                    var drive = driveService.createDrive(
                        req, companyId, callerRole);
                    yield "✅ " + resultMsg
                        + " Drive created with ID: " + drive.getId();
                }
                case "ADD_ROUND" -> {
                    Long driveId = payload.path("driveId").asLong(0);
                    if (driveId == 0) yield " Please specify the Drive ID "
                        + "in your command (e.g. 'to drive 3').";
                    RoundRequest req = new RoundRequest();
                    req.setTitle(payload.path("title").asText());
                    req.setDurationMinutes(
                        payload.path("durationMinutes").asInt(30));
                    req.setCutoffScore(
                        payload.path("cutoffScore").asDouble(40));
                    var round = driveService.addRound(
                        driveId, req, companyId, callerRole);
                    yield "✅ " + resultMsg
                        + " Round added with ID: " + round.getId();
                }
                case "CREATE_QUESTION" -> {
                    JsonNode questions = payload.path("questions");
                    if (!questions.isArray() || questions.isEmpty())
                        yield " No questions were generated.";
                    int count = 0;
                    for (JsonNode q : questions) {
                        QuestionRequest req = new QuestionRequest();
                        req.setQuestionText(
                            q.path("questionText").asText());
                        req.setQuestionType(QuestionType.valueOf(
                            q.path("questionType").asText("MCQ")));
                        req.setMarks(q.path("marks").asDouble(2));
                        req.setTags(q.path("tags").asText(""));
                        if (!q.path("optionA").isNull()) {
                            req.setOptionA(q.path("optionA").asText());
                            req.setOptionB(q.path("optionB").asText());
                            req.setOptionC(q.path("optionC").asText());
                            req.setOptionD(q.path("optionD").asText());
                            req.setCorrectOption(
                                q.path("correctOption").asText());
                        }
                        questionService.createQuestion(
                            req, companyId, callerRole);
                        count++;
                    }
                    yield "✅ " + resultMsg
                        + " " + count + " question(s) added to bank.";
                }
                case "QUERY_RESULTS" -> {
                    Long roundId = payload.path("roundId").asLong(0);
                    if (roundId == 0) yield " Please specify the Round ID "
                        + "in your command (e.g. 'round 2').";
                    var summary = driveService
                        .getRoundsForDrive(roundId)
                        .size();
                    yield "ℹ️ Query noted for round " + roundId
                        + ". Use the Results section for full data.";
                }
                default -> " I couldn't understand that command. "
                    + "Try: 'Create a drive', 'Add a round to drive X', "
                    + "'Generate 3 MCQ questions on Java'.";
            };

        } catch (Exception e) {
            return " AI processing failed: " + e.getMessage();
        }
    }
}
