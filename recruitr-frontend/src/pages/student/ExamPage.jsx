import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Radio, Input, Typography, Modal, message, Space, Progress } from 'antd';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../auth/AuthContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ExamPage = () => {
  const { roundId } = useParams();
  const { userId } = useAuth();
  const navigate = useNavigate();

  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [initialDuration, setInitialDuration] = useState(0);
  const [loading, setLoading] = useState(true);

  const sessionIdRef = useRef(null);
  const answersRef = useRef({});
  const isSubmittedRef = useRef(false);

  sessionIdRef.current = sessionId;
  answersRef.current = answers;

  // 1. Mount & Start Exam
  useEffect(() => {
    const startExam = async () => {
      try {
        const res = await axiosInstance.post('/api/v1/exam/start', {
          studentId: Number(userId),
          roundId: Number(roundId),
          driveId: 1, // Default driveId or passed param
        });

        const data = res.data;
        setSessionId(data.sessionId);
        setQuestions(data.questions || []);
        setTimeLeft((data.durationMinutes || 30) * 60);
        setInitialDuration((data.durationMinutes || 30) * 60);
        setLoading(false);

        // Request fullscreen
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch (err) {
        message.error(err.response?.data?.error || 'Failed to start exam');
        navigate('/student');
      }
    };

    startExam();
  }, [roundId, userId, navigate]);

  // 2. Countdown Timer
  useEffect(() => {
    if (loading || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, timeLeft]);

  // 3. Proctoring Event Listeners (visibilitychange & fullscreenchange)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden && sessionIdRef.current && !isSubmittedRef.current) {
        try {
          const res = await axiosInstance.post(
            `/api/v1/exam/session/${sessionIdRef.current}/warning`,
            { warningType: 'TAB_SWITCH' }
          );
          if (res.data.autoSubmitted) {
            Modal.warning({
              title: 'Exam Auto-Submitted',
              content: 'You exceeded maximum tab switch limit. Your exam has been automatically submitted.',
              onOk: () => handleFinalSubmit(),
            });
          } else {
            message.warning(`Warning! Tab switch detected. Total warnings: ${res.data.warningCount}/3`);
          }
        } catch (e) {
          console.error(e);
        }
      }
    };

    const handleFullscreenChange = async () => {
      if (!document.fullscreenElement && sessionIdRef.current && !isSubmittedRef.current) {
        try {
          const res = await axiosInstance.post(
            `/api/v1/exam/session/${sessionIdRef.current}/warning`,
            { warningType: 'FULLSCREEN_EXIT' }
          );
          if (res.data.autoSubmitted) {
            Modal.warning({
              title: 'Exam Auto-Submitted',
              content: 'You exited fullscreen mode 3 times. Your exam has been auto-submitted.',
              onOk: () => handleFinalSubmit(),
            });
          } else {
            message.warning(`Warning! Fullscreen exit detected. Total warnings: ${res.data.warningCount}/3`);
          }
        } catch (e) {
          console.error(e);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 4. Submit Exam Function
  const handleFinalSubmit = async () => {
    if (isSubmittedRef.current) return;
    isSubmittedRef.current = true;

    const formattedResponses = Object.keys(answersRef.current).map((qId) => {
      const val = answersRef.current[qId];
      return {
        questionId: Number(qId),
        selectedOption: ['A', 'B', 'C', 'D'].includes(val) ? val : null,
        subjectiveAnswer: ['A', 'B', 'C', 'D'].includes(val) ? null : val,
      };
    });

    try {
      if (sessionIdRef.current) {
        await axiosInstance.post(`/api/v1/exam/session/${sessionIdRef.current}/submit`, {
          responses: formattedResponses,
        });
      }
      message.success('Exam submitted successfully!');
    } catch (e) {
      console.error(e);
    } finally {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      navigate('/student');
    }
  };

  const handleAnswerChange = (val) => {
    const currentQ = questions[currentIndex];
    setAnswers({
      ...answers,
      [currentQ.id]: val,
    });
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}><Title level={4}>Loading Exam Session...</Title></div>;
  }

  const currentQ = questions[currentIndex] || {};
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <Text type="danger" style={{ fontSize: 18, fontWeight: 'bold' }}>
              Time Remaining: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
            </Text>
          </div>
        }
      >
        <Progress percent={Math.round(((currentIndex + 1) / questions.length) * 100)} showInfo={false} style={{ marginBottom: 20 }} />

        <Title level={4}>{currentQ.questionText}</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Type: {currentQ.questionType} | Marks: {currentQ.marks}
        </Text>

        {currentQ.questionType === 'MCQ' ? (
          <Radio.Group
            onChange={(e) => handleAnswerChange(e.target.value)}
            value={answers[currentQ.id]}
            style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}
          >
            <Radio value="A">A) {currentQ.optionA}</Radio>
            <Radio value="B">B) {currentQ.optionB}</Radio>
            <Radio value="C">C) {currentQ.optionC}</Radio>
            <Radio value="D">D) {currentQ.optionD}</Radio>
          </Radio.Group>
        ) : (
          <TextArea
            rows={5}
            placeholder="Type your subjective response here..."
            value={answers[currentQ.id] || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            style={{ marginBottom: 24 }}
          />
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <Button
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(currentIndex - 1)}
          >
            Previous
          </Button>

          <Space>
            {currentIndex < questions.length - 1 ? (
              <Button type="primary" onClick={() => setCurrentIndex(currentIndex + 1)}>
                Next
              </Button>
            ) : (
              <Button type="primary" danger onClick={() => Modal.confirm({
                title: 'Submit Exam?',
                content: 'Are you sure you want to submit your responses?',
                onOk: handleFinalSubmit,
              })}>
                Submit Exam
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default ExamPage;
