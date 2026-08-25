package com.recruitr.drive.service;

import com.recruitr.drive.dto.*;
import com.recruitr.drive.exception.*;
import com.recruitr.drive.model.*;
import com.recruitr.drive.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DriveService {

    private final DriveRepository driveRepository;
    private final RoundRepository roundRepository;
    private final RoundQuestionRepository roundQuestionRepository;
    private final QuestionRepository questionRepository;

    public DriveResponse createDrive(DriveRequest request,
            Long companyId, String callerRole) {
        if (!"COMPANY_ADMIN".equals(callerRole)) {
            throw new AccessDeniedException(
                "Only Company Admin can create drives");
        }
        Drive drive = new Drive();
        drive.setTitle(request.getTitle());
        drive.setDescription(request.getDescription());
        drive.setCompanyId(companyId);
        drive.setStatus(DriveStatus.DRAFT);
        return mapDriveToResponse(driveRepository.save(drive));
    }

    public List<DriveResponse> getDrivesForCompany(
            Long companyId, String callerRole) {
        if (!"COMPANY_ADMIN".equals(callerRole)) {
            throw new AccessDeniedException(
                "Only Company Admin can list their drives");
        }
        return driveRepository.findByCompanyId(companyId)
                .stream()
                .map(this::mapDriveToResponse)
                .collect(Collectors.toList());
    }

    public DriveResponse getDriveById(Long driveId) {
        return mapDriveToResponse(findDrive(driveId));
    }

    public DriveResponse publishDrive(Long driveId,
            Long companyId, String callerRole) {
        if (!"COMPANY_ADMIN".equals(callerRole)) {
            throw new AccessDeniedException(
                "Only Company Admin can publish drives");
        }
        Drive drive = findDrive(driveId);
        validateDriveOwnership(drive, companyId);
        if (drive.getStatus() != DriveStatus.DRAFT) {
            throw new BadRequestException(
                "Only DRAFT drives can be published");
        }
        drive.setStatus(DriveStatus.PUBLISHED);
        return mapDriveToResponse(driveRepository.save(drive));
    }

    public DriveResponse closeDrive(Long driveId,
            Long companyId, String callerRole) {
        if (!"COMPANY_ADMIN".equals(callerRole)) {
            throw new AccessDeniedException(
                "Only Company Admin can close drives");
        }
        Drive drive = findDrive(driveId);
        validateDriveOwnership(drive, companyId);
        drive.setStatus(DriveStatus.CLOSED);
        return mapDriveToResponse(driveRepository.save(drive));
    }

    public void deleteDrive(Long driveId,
            Long companyId, String callerRole) {
        if (!"COMPANY_ADMIN".equals(callerRole)) {
            throw new AccessDeniedException(
                "Only Company Admin can delete drives");
        }
        Drive drive = findDrive(driveId);
        validateDriveOwnership(drive, companyId);
        if (drive.getStatus() != DriveStatus.DRAFT) {
            throw new BadRequestException(
                "Only DRAFT drives can be deleted");
        }
        driveRepository.delete(drive);
    }

    public RoundResponse addRound(Long driveId,
            RoundRequest request, Long companyId,
            String callerRole) {
        if (!"COMPANY_ADMIN".equals(callerRole)) {
            throw new AccessDeniedException(
                "Only Company Admin can add rounds");
        }
        Drive drive = findDrive(driveId);
        validateDriveOwnership(drive, companyId);

        long existingRounds = roundRepository.countByDriveId(driveId);
        if (existingRounds >= 3) {
            throw new BadRequestException(
                "A drive can have a maximum of 3 rounds");
        }

        Round round = new Round();
        round.setDriveId(driveId);
        round.setRoundNumber((int) existingRounds + 1);
        round.setTitle(request.getTitle());
        round.setDurationMinutes(request.getDurationMinutes());
        round.setCutoffScore(request.getCutoffScore());
        round.setStatus(RoundStatus.NOT_STARTED);
        return mapRoundToResponse(roundRepository.save(round));
    }

    public List<RoundResponse> getRoundsForDrive(Long driveId) {
        return roundRepository
                .findByDriveIdOrderByRoundNumberAsc(driveId)
                .stream()
                .map(this::mapRoundToResponse)
                .collect(Collectors.toList());
    }

    public RoundResponse activateRound(Long driveId,
            Long roundId, Long companyId, String callerRole) {
        if (!"COMPANY_ADMIN".equals(callerRole)) {
            throw new AccessDeniedException(
                "Only Company Admin can activate rounds");
        }
        Drive drive = findDrive(driveId);
        validateDriveOwnership(drive, companyId);
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Round not found with id: " + roundId));
        round.setStatus(RoundStatus.ACTIVE);
        return mapRoundToResponse(roundRepository.save(round));
    }

    @Transactional
    public List<QuestionResponse> assignQuestionsToRound(
            Long driveId, Long roundId,
            AssignQuestionsRequest request,
            Long companyId, String callerRole) {
        if (!"COMPANY_ADMIN".equals(callerRole)) {
            throw new AccessDeniedException(
                "Only Company Admin can assign questions");
        }
        Drive drive = findDrive(driveId);
        validateDriveOwnership(drive, companyId);

        roundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Round not found with id: " + roundId));

        // Clear existing assignments for this round
        roundQuestionRepository.deleteByRoundId(roundId);

        // Assign new questions
        List<RoundQuestion> assignments = request.getQuestionIds()
                .stream()
                .map(qId -> {
                    RoundQuestion rq = new RoundQuestion();
                    rq.setRoundId(roundId);
                    rq.setQuestionId(qId);
                    return rq;
                })
                .collect(Collectors.toList());

        roundQuestionRepository.saveAll(assignments);

        return request.getQuestionIds().stream()
                .map(qId -> questionRepository.findById(qId)
                    .map(this::mapQuestionToResponse)
                    .orElseThrow(() ->
                        new ResourceNotFoundException(
                            "Question not found: " + qId)))
                .collect(Collectors.toList());
    }

    public List<QuestionResponse> getQuestionsForRound(
            Long roundId) {
        List<RoundQuestion> rqs =
                roundQuestionRepository.findByRoundId(roundId);
        return rqs.stream()
                .map(rq -> questionRepository
                    .findById(rq.getQuestionId())
                    .map(this::mapQuestionToResponse)
                    .orElseThrow(() ->
                        new ResourceNotFoundException(
                            "Question not found: "
                                + rq.getQuestionId())))
                .collect(Collectors.toList());
    }

    public long countActiveDrives() {
        return driveRepository.countByStatus(DriveStatus.PUBLISHED);
    }

    public RoundResponse getRoundById(Long roundId) {
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Round not found with id: " + roundId));
        return mapRoundToResponse(round);
    }

    private Drive findDrive(Long driveId) {
        return driveRepository.findById(driveId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Drive not found with id: " + driveId));
    }

    private void validateDriveOwnership(Drive drive,
            Long companyId) {
        if (!drive.getCompanyId().equals(companyId)) {
            throw new AccessDeniedException(
                "You do not own this drive");
        }
    }

    private DriveResponse mapDriveToResponse(Drive drive) {
        DriveResponse r = new DriveResponse();
        r.setId(drive.getId());
        r.setTitle(drive.getTitle());
        r.setDescription(drive.getDescription());
        r.setCompanyId(drive.getCompanyId());
        r.setStatus(drive.getStatus());
        r.setCreatedAt(drive.getCreatedAt());
        r.setUpdatedAt(drive.getUpdatedAt());
        return r;
    }

    private RoundResponse mapRoundToResponse(Round round) {
        RoundResponse r = new RoundResponse();
        r.setId(round.getId());
        r.setDriveId(round.getDriveId());
        r.setRoundNumber(round.getRoundNumber());
        r.setTitle(round.getTitle());
        r.setDurationMinutes(round.getDurationMinutes());
        r.setCutoffScore(round.getCutoffScore());
        r.setStatus(round.getStatus());
        return r;
    }

    private QuestionResponse mapQuestionToResponse(
            Question question) {
        QuestionResponse r = new QuestionResponse();
        r.setId(question.getId());
        r.setCompanyId(question.getCompanyId());
        r.setQuestionText(question.getQuestionText());
        r.setQuestionType(question.getQuestionType());
        r.setOptionA(question.getOptionA());
        r.setOptionB(question.getOptionB());
        r.setOptionC(question.getOptionC());
        r.setOptionD(question.getOptionD());
        r.setCorrectOption(question.getCorrectOption());
        r.setMarks(question.getMarks());
        r.setTags(question.getTags());
        return r;
    }
}
