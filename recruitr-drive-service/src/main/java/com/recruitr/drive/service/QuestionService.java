package com.recruitr.drive.service;

import com.recruitr.drive.dto.*;
import com.recruitr.drive.exception.*;
import com.recruitr.drive.model.*;
import com.recruitr.drive.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;

    public QuestionResponse createQuestion(
            QuestionRequest request,
            Long companyId, String callerRole) {
        if (!"COMPANY_ADMIN".equals(callerRole)) {
            throw new AccessDeniedException(
                "Only Company Admin can create questions");
        }
        if (request.getQuestionType() == QuestionType.MCQ) {
            if (request.getOptionA() == null
                    || request.getOptionB() == null
                    || request.getOptionC() == null
                    || request.getOptionD() == null
                    || request.getCorrectOption() == null) {
                throw new BadRequestException(
                    "MCQ questions must have all 4 options "
                        + "and a correct option");
            }
        }
        Question q = new Question();
        q.setCompanyId(companyId);
        q.setQuestionText(request.getQuestionText());
        q.setQuestionType(request.getQuestionType());
        q.setOptionA(request.getOptionA());
        q.setOptionB(request.getOptionB());
        q.setOptionC(request.getOptionC());
        q.setOptionD(request.getOptionD());
        q.setCorrectOption(request.getCorrectOption());
        q.setMarks(request.getMarks());
        q.setTags(request.getTags());
        return mapToResponse(questionRepository.save(q));
    }

    public List<QuestionResponse> getQuestionsForCompany(
            Long companyId, String callerRole) {
        if (!"COMPANY_ADMIN".equals(callerRole)) {
            throw new AccessDeniedException(
                "Only Company Admin can view their questions");
        }
        return questionRepository.findByCompanyId(companyId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public QuestionResponse updateQuestion(Long questionId,
            QuestionRequest request,
            Long companyId, String callerRole) {
        if (!"COMPANY_ADMIN".equals(callerRole)) {
            throw new AccessDeniedException(
                "Only Company Admin can update questions");
        }
        Question q = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Question not found with id: " + questionId));
        if (!q.getCompanyId().equals(companyId)) {
            throw new AccessDeniedException(
                "You do not own this question");
        }
        q.setQuestionText(request.getQuestionText());
        q.setQuestionType(request.getQuestionType());
        q.setOptionA(request.getOptionA());
        q.setOptionB(request.getOptionB());
        q.setOptionC(request.getOptionC());
        q.setOptionD(request.getOptionD());
        q.setCorrectOption(request.getCorrectOption());
        q.setMarks(request.getMarks());
        q.setTags(request.getTags());
        return mapToResponse(questionRepository.save(q));
    }

    public void deleteQuestion(Long questionId,
            Long companyId, String callerRole) {
        if (!"COMPANY_ADMIN".equals(callerRole)) {
            throw new AccessDeniedException(
                "Only Company Admin can delete questions");
        }
        Question q = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Question not found with id: " + questionId));
        if (!q.getCompanyId().equals(companyId)) {
            throw new AccessDeniedException(
                "You do not own this question");
        }
        questionRepository.delete(q);
    }

    private QuestionResponse mapToResponse(Question q) {
        QuestionResponse r = new QuestionResponse();
        r.setId(q.getId());
        r.setCompanyId(q.getCompanyId());
        r.setQuestionText(q.getQuestionText());
        r.setQuestionType(q.getQuestionType());
        r.setOptionA(q.getOptionA());
        r.setOptionB(q.getOptionB());
        r.setOptionC(q.getOptionC());
        r.setOptionD(q.getOptionD());
        r.setCorrectOption(q.getCorrectOption());
        r.setMarks(q.getMarks());
        r.setTags(q.getTags());
        return r;
    }
}
