import React, { useState } from 'react';
import { Form, Input, Button, Alert, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../auth/AuthContext';

const { Title, Text } = Typography;

/* ═══════════════════════════════════════════════════════════
   DESIGN TOKENS — Extracted from Stitch "Recruitr Dark Mode
   Login (copy)" project (Obsidian Flux design system)
   ═══════════════════════════════════════════════════════════ */
const TOKENS = {
  // Canvas & Elevation
  canvasBase: '#0e0e11',       // surface-container-lowest
  surface: '#121216',           // card surface
  surfaceRecessed: '#09090B',   // input wells
  borderSubtle: '#27272A',      // dividers & borders
  outlineVariant: '#424656',    // top-edge highlights

  // Brand & Action
  primaryBlue: '#0066FF',
  deepCobalt: '#0047BB',

  // Text
  textPrimary: '#FAFAFA',
  textSecondary: '#A1A1AA',
  placeholderText: 'rgba(140, 144, 161, 0.7)', // outline/70

  // Glow & Focus
  focusRing: '0 0 0 1px #0066FF, 0 0 16px -4px rgba(0, 102, 255, 0.4)',
  buttonGlow: '0 0 20px rgba(0, 102, 255, 0.25)',
  buttonGlowHover: '0 0 25px rgba(0, 102, 255, 0.4)',

  // Spacing
  cardPadding: 40,             // sm:p-10 = 40px
  cardMaxWidth: 440,
  cardRadius: 16,              // rounded-2xl
  inputHeight: 44,             // h-11
  inputRadius: 8,              // rounded-lg

  // Typography
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  headlineLg: { fontSize: 32, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: '40px' },
  labelMd: { fontSize: 14, fontWeight: 500, letterSpacing: '0em', lineHeight: '20px' },
  bodyMd: { fontSize: 14, fontWeight: 400, letterSpacing: '0em', lineHeight: '20px' },
};

/* ═══════════════════════════════════════════════════════════
   BRAND BADGE — Recruitr Logo (aligned with Dashboard header)
   ═══════════════════════════════════════════════════════════ */
const RecruitrLogoBadge = ({ size = 48, fontSize = 26, borderRadius = 12 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius,
      backgroundColor: '#18181B',
      border: '1px solid #27272A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 800,
      fontSize,
      color: '#3B82F6',
      userSelect: 'none',
    }}
  >
    R
  </div>
);

/* ═══════════════════════════════════════════════════════════
   LOGIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
const Login = () => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const onFinish = async (values) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await axiosInstance.post('/api/v1/auth/login', values);
      const data = res.data;
      login(data);

      switch (data.role) {
        case 'SUPER_ADMIN':
          navigate('/super-admin');
          break;
        case 'COMPANY_ADMIN':
          navigate('/company-admin');
          break;
        case 'COLLEGE_ADMIN':
          navigate('/college-admin');
          break;
        case 'STUDENT':
          navigate('/student');
          break;
        default:
          navigate('/login');
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Invalid credentials'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Google Fonts Preconnect ─────────────────────── */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* ── Full-Screen Canvas ─────────────────────────── */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: TOKENS.canvasBase,
          fontFamily: TOKENS.fontFamily,
          overflow: 'hidden',
        }}
      >
        {/* Layer 1: 24px Architectural Grid */}
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),' +
              'linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            opacity: 0.6,
            zIndex: 0,
          }}
        />

        {/* Layer 2: Radial Blue Glow */}
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            background:
              'radial-gradient(circle at 50% 30%, rgba(0,102,255,0.08) 0%, rgba(15,15,18,0) 65%)',
            zIndex: 0,
          }}
        />

        {/* ── Card Container ────────────────────────────── */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            width: '100%',
            maxWidth: TOKENS.cardMaxWidth,
            padding: '0 4px',
          }}
        >
          {/* Ambient Underglow */}
          <div
            style={{
              position: 'absolute',
              inset: -6,
              background:
                'linear-gradient(to bottom, rgba(0,102,255,0.20) 0%, transparent 100%)',
              borderRadius: 24,
              filter: 'blur(16px)',
              opacity: 0.6,
              pointerEvents: 'none',
            }}
          />

          {/* Card Surface */}
          <div
            style={{
              position: 'relative',
              background: TOKENS.surface,
              borderRadius: TOKENS.cardRadius,
              padding: TOKENS.cardPadding,
              boxShadow:
                '0 24px 48px -12px rgba(0,0,0,0.7)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Top Edge Highlight */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 1,
                background:
                  'linear-gradient(to right, transparent, rgba(66,70,86,0.4), transparent)',
                borderRadius: `${TOKENS.cardRadius}px ${TOKENS.cardRadius}px 0 0`,
                pointerEvents: 'none',
              }}
            />

            {/* ── Header: Emblem + Wordmark + Subtitle ──── */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                marginBottom: 32,
              }}
            >
              {/* Logo Badge Container */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <RecruitrLogoBadge size={48} fontSize={26} borderRadius={12} />
              </div>

              {/* Wordmark */}
              <h1
                style={{
                  margin: 0,
                  color: TOKENS.textPrimary,
                  fontFamily: TOKENS.fontFamily,
                  ...TOKENS.headlineLg,
                }}
              >
                Recruitr
              </h1>

              {/* Subtitle */}
              <p
                style={{
                  margin: '8px 0 0 0',
                  color: TOKENS.textSecondary,
                  fontFamily: TOKENS.fontFamily,
                  ...TOKENS.bodyMd,
                  maxWidth: 340,
                  lineHeight: '22px',
                }}
              >
                A Multi-Tenant Campus Placement Mock Assessment Platform
              </p>
            </div>

            {/* ── Error Alert ───────────────────────────── */}
            {errorMsg && (
              <Alert
                message={errorMsg}
                type="error"
                showIcon
                closable
                onClose={() => setErrorMsg('')}
                style={{
                  marginBottom: 20,
                  background: 'rgba(147,0,10,0.15)',
                  border: '1px solid rgba(255,180,171,0.25)',
                  borderRadius: TOKENS.inputRadius,
                  color: '#ffb4ab',
                }}
              />
            )}

            {/* ── Credential Form ───────────────────────── */}
            <Form
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              style={{ fontFamily: TOKENS.fontFamily }}
            >
              {/* Email Field */}
              <Form.Item
                label={
                  <span
                    style={{
                      color: TOKENS.textPrimary,
                      ...TOKENS.labelMd,
                      fontFamily: TOKENS.fontFamily,
                    }}
                  >
                    Email Address
                  </span>
                }
                name="email"
                rules={[
                  { required: true, message: 'Email is required' },
                  { type: 'email', message: 'Enter a valid email' },
                ]}
                style={{ marginBottom: 20 }}
              >
                <Input
                  placeholder="user@domain.com"
                  autoComplete="email"
                  style={{
                    height: TOKENS.inputHeight,
                    background: TOKENS.surfaceRecessed,
                    border: 'none',
                    borderRadius: TOKENS.inputRadius,
                    color: TOKENS.textPrimary,
                    fontFamily: TOKENS.fontFamily,
                    fontSize: 14,
                    padding: '0 16px',
                  }}
                  styles={{
                    input: {
                      background: 'transparent',
                      color: TOKENS.textPrimary,
                      fontFamily: TOKENS.fontFamily,
                    },
                  }}
                  onFocus={(e) => {
                    e.target.parentElement.style.background = TOKENS.canvasBase;
                    e.target.parentElement.style.boxShadow = TOKENS.focusRing;
                  }}
                  onBlur={(e) => {
                    e.target.parentElement.style.background = TOKENS.surfaceRecessed;
                    e.target.parentElement.style.boxShadow = 'none';
                  }}
                />
              </Form.Item>

              {/* Password Field */}
              <Form.Item
                label={
                  <span
                    style={{
                      color: TOKENS.textPrimary,
                      ...TOKENS.labelMd,
                      fontFamily: TOKENS.fontFamily,
                    }}
                  >
                    Password
                  </span>
                }
                name="password"
                rules={[
                  { required: true, message: 'Password is required' },
                ]}
                style={{ marginBottom: 24 }}
              >
                <Input.Password
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={{
                    height: TOKENS.inputHeight,
                    background: TOKENS.surfaceRecessed,
                    border: 'none',
                    borderRadius: TOKENS.inputRadius,
                    color: TOKENS.textPrimary,
                    fontFamily: TOKENS.fontFamily,
                    fontSize: 14,
                    padding: '0 16px',
                  }}
                  styles={{
                    input: {
                      background: 'transparent',
                      color: TOKENS.textPrimary,
                      fontFamily: TOKENS.fontFamily,
                    },
                  }}
                  onFocus={(e) => {
                    const wrapper = e.target.closest('.ant-input-affix-wrapper');
                    if (wrapper) {
                      wrapper.style.background = TOKENS.canvasBase;
                      wrapper.style.boxShadow = TOKENS.focusRing;
                    }
                  }}
                  onBlur={(e) => {
                    const wrapper = e.target.closest('.ant-input-affix-wrapper');
                    if (wrapper) {
                      wrapper.style.background = TOKENS.surfaceRecessed;
                      wrapper.style.boxShadow = 'none';
                    }
                  }}
                />
              </Form.Item>

              {/* Submit Button */}
              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  htmlType="submit"
                  loading={loading}
                  block
                  style={{
                    height: TOKENS.inputHeight,
                    border: 'none',
                    borderRadius: TOKENS.inputRadius,
                    background:
                      'linear-gradient(135deg, #0066FF 0%, #0047BB 100%)',
                    color: TOKENS.textPrimary,
                    fontFamily: TOKENS.fontFamily,
                    ...TOKENS.labelMd,
                    boxShadow: TOKENS.buttonGlow,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = TOKENS.buttonGlowHover;
                    e.currentTarget.style.filter = 'brightness(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = TOKENS.buttonGlow;
                    e.currentTarget.style.filter = 'none';
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.99)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  Log In
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>

      {/* ── Global Ant Design Dark Overrides ──────────── */}
      <style>{`
        /* Reset Ant Design form item labels */
        .ant-form-item-label > label {
          color: ${TOKENS.textPrimary} !important;
          font-family: ${TOKENS.fontFamily} !important;
          font-size: 14px !important;
          font-weight: 500 !important;
        }
        .ant-form-item-label > label::after {
          display: none !important;
        }

        /* Ant Input base overrides */
        .ant-input,
        .ant-input-affix-wrapper {
          background: ${TOKENS.surfaceRecessed} !important;
          border: none !important;
          border-radius: ${TOKENS.inputRadius}px !important;
          color: ${TOKENS.textPrimary} !important;
          font-family: ${TOKENS.fontFamily} !important;
          transition: background 0.2s ease, box-shadow 0.2s ease !important;
        }
        .ant-input-affix-wrapper {
          padding: 0 16px !important;
          height: ${TOKENS.inputHeight}px !important;
        }
        .ant-input-affix-wrapper .ant-input {
          background: transparent !important;
          height: 100% !important;
        }
        .ant-input::placeholder {
          color: ${TOKENS.placeholderText} !important;
        }

        /* Password visibility toggle icon */
        .ant-input-password-icon,
        .ant-input-suffix .anticon {
          color: ${TOKENS.textSecondary} !important;
          transition: color 0.2s ease !important;
        }
        .ant-input-password-icon:hover,
        .ant-input-suffix .anticon:hover {
          color: ${TOKENS.textPrimary} !important;
        }

        /* Ant focused state - prevent default blue */
        .ant-input-affix-wrapper-focused,
        .ant-input-affix-wrapper:focus,
        .ant-input:focus,
        .ant-input-focused {
          border-color: transparent !important;
          box-shadow: none !important;
        }

        /* Button loading spinner */
        .ant-btn-loading-icon .anticon {
          color: ${TOKENS.textPrimary} !important;
        }

        /* Error message styling */
        .ant-form-item-explain-error {
          color: #ffb4ab !important;
          font-family: ${TOKENS.fontFamily} !important;
          font-size: 12px !important;
          margin-top: 4px !important;
        }

        /* Alert overrides for dark mode */
        .ant-alert-error .ant-alert-message {
          color: #ffb4ab !important;
        }
        .ant-alert-error .ant-alert-icon {
          color: #ffb4ab !important;
        }
        .ant-alert-error .ant-alert-close-icon {
          color: #ffb4ab !important;
        }
      `}</style>
    </>
  );
};

export default Login;
