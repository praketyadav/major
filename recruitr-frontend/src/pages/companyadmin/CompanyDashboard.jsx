import React, { useState, useEffect, useCallback } from 'react';
import {
  Layout, Typography, Table, Modal, Form, Input, Select,
  Button, Tag, Alert, Statistic, Popconfirm, Checkbox,
  Space, Spin, InputNumber, Menu, message, Tooltip, Badge,
  ConfigProvider,
} from 'antd';
import {
  CarOutlined, BankOutlined, OrderedListOutlined,
  BarChartOutlined, TrophyOutlined, PlusOutlined,
  LogoutOutlined, DeleteOutlined, RocketOutlined,
  CheckCircleOutlined, CloseCircleOutlined,
  SettingOutlined, FileTextOutlined, TeamOutlined,
  SearchOutlined, ReloadOutlined, BellOutlined,
  AppstoreOutlined, EditOutlined, InboxOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../auth/AuthContext';
import NotificationBell from '../../components/NotificationBell';
import axiosInstance from '../../api/axiosInstance';
import driveService from '../../services/api/driveService';
import questionService from '../../services/api/questionService';
import resultsService from '../../services/api/resultsService';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// ═══════════════════════════════════════════════════════════════════
// DESIGN SYSTEM — DARK THEME TOKENS
// ═══════════════════════════════════════════════════════════════════
const theme = {
  bg:             '#09090B',
  surface:        '#09090B',
  surfaceElevated:'#121216',
  surfaceHover:   '#18181B',
  border:         '#27272A',
  borderLight:    'rgba(255,255,255,0.06)',
  primary:        '#3B82F6',
  primaryHover:   '#2563EB',
  primaryGlow:    'rgba(30, 58, 138, 0.5)',
  accent:         '#10B981',
  accentGlow:     'rgba(16, 185, 129, 0.12)',
  danger:         '#EF4444',
  dangerGlow:     'rgba(239, 68, 68, 0.12)',
  warning:        '#F59E0B',
  warningGlow:    'rgba(245, 158, 11, 0.12)',
  textPrimary:    '#FAFAFA',
  textSecondary:  '#A1A1AA',
  textMuted:      '#71717A',
  radius:         '6px',
  radiusLg:       '8px',
  radiusXl:       '12px',
  shadow:         '0 1px 3px rgba(0,0,0,0.3)',
  shadowLg:       '0 4px 16px rgba(0,0,0,0.4)',
  transition:     'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  font:           "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

// ── Section keys ───────────────────────────────────────────────────
const SECTIONS = {
  DRIVES: 'DRIVES',
  QUESTIONS: 'QUESTIONS',
  ROUNDS: 'ROUNDS',
  RESULTS: 'RESULTS',
  SHORTLIST: 'SHORTLIST',
};

const sectionMeta = {
  [SECTIONS.DRIVES]:    { icon: <CarOutlined />,           label: 'My Drives',     desc: 'Create and manage recruitment drives' },
  [SECTIONS.QUESTIONS]: { icon: <FileTextOutlined />,      label: 'Question Bank', desc: 'Curate your assessment library' },
  [SECTIONS.ROUNDS]:    { icon: <OrderedListOutlined />,   label: 'Rounds',        desc: 'Configure drive rounds & assignments' },
  [SECTIONS.RESULTS]:   { icon: <BarChartOutlined />,      label: 'Results',       desc: 'Review scores and advance candidates' },
  [SECTIONS.SHORTLIST]: { icon: <TrophyOutlined />,        label: 'Shortlist',     desc: 'Top-performing candidates' },
};

// ── Reusable style fragments ──────────────────────────────────────
const cardStyle = {
  background: theme.surfaceElevated,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radiusLg,
  padding: '24px',
};

const glassCard = {
  background: theme.surfaceElevated,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radiusLg,
  padding: '20px',
};

const statCardStyle = () => ({
  background: theme.surfaceElevated,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius,
  padding: '20px 24px',
});

const btnPrimary = {
  background: '#3B82F6',
  borderColor: '#3B82F6',
  color: '#FAFAFA',
  borderRadius: '8px',
  fontWeight: 600,
  fontSize: '13px',
  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  height: 38,
  transition: 'all 0.2s ease',
};

const btnDanger = {
  background: 'transparent',
  borderColor: 'rgba(239, 68, 68, 0.35)',
  color: '#EF4444',
  borderRadius: '8px',
  fontWeight: 600,
  fontSize: '12px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  height: 38,
  transition: 'all 0.2s ease',
};

const btnGhost = {
  background: '#121216',
  borderColor: '#27272A',
  color: '#A1A1AA',
  borderRadius: '8px',
  fontWeight: 500,
  fontSize: '13px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  height: 38,
  transition: 'all 0.2s ease',
};

const sectionHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 24,
};

const pageTitle = {
  color: theme.textPrimary,
  margin: 0,
  fontFamily: theme.font,
  fontSize: 22,
  fontWeight: 700,
  letterSpacing: '-0.02em',
};

const sectionSubtext = {
  color: theme.textMuted,
  fontSize: 13,
  marginTop: 2,
};

const modalStyles = {
  mask: { background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' },
};

// ═══════════════════════════════════════════════════════════════════
// SECTION 1 — MY DRIVES
// ═══════════════════════════════════════════════════════════════════
const MyDrivesSection = ({ onManageRounds }) => {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [filterText, setFilterText] = useState('');

  const fetchDrives = useCallback(async () => {
    setLoading(true);
    try {
      const res = await driveService.getCompanyDrives();
      setDrives(res.data || []);
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed to fetch drives');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  const handleCreate = async (values) => {
    setSubmitting(true);
    try {
      await driveService.createDrive({
        title: values.title.trim(),
        description: values.description ? values.description.trim() : '',
      });
      message.success('Drive created successfully');
      form.resetFields();
      setModalOpen(false);
      fetchDrives();
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed to create drive');
    } finally {
      setSubmitting(false);
    }
  };

  const publishDrive = async (id) => {
    try {
      await driveService.publishDrive(id);
      message.success('Drive published successfully');
      fetchDrives();
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed to publish drive');
    }
  };

  const closeDrive = async (id) => {
    try {
      await driveService.closeDrive(id);
      message.success('Drive closed successfully');
      fetchDrives();
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed to close drive');
    }
  };

  const deleteDrive = async (id) => {
    try {
      await driveService.deleteDrive(id);
      message.success('Drive deleted successfully');
      fetchDrives();
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed to delete drive');
    }
  };

  const statusTag = (s) => {
    const map = {
      PUBLISHED: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)', label: 'Published' },
      CLOSED:    { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)', label: 'Closed' },
      DRAFT:     { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)', label: 'Draft' },
    };
    const cfg = map[s] || map.DRAFT;
    return (
      <span style={{
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        padding: '3px 10px',
        borderRadius: 9999,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: cfg.color }} />
        {cfg.label}
      </span>
    );
  };

  const filteredDrives = drives.filter(d => {
    if (!filterText) return true;
    const q = filterText.toLowerCase();
    return (
      (d.title && d.title.toLowerCase().includes(q)) ||
      (d.id && String(d.id).toLowerCase().includes(q)) ||
      (d.description && d.description.toLowerCase().includes(q))
    );
  });

  const columns = [
    {
      title: 'ID', dataIndex: 'id', key: 'id', width: 80,
      render: (v) => <span style={{ color: '#71717A', fontFamily: 'monospace', fontSize: 12 }}>#{v}</span>,
    },
    {
      title: 'TITLE', dataIndex: 'title', key: 'title',
      render: (t) => <span style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 13 }}>{t}</span>,
    },
    {
      title: 'DESCRIPTION', dataIndex: 'description', key: 'description', ellipsis: true,
      render: (t) => <span style={{ color: '#A1A1AA', fontSize: 13 }}>{t || '—'}</span>,
    },
    {
      title: 'STATUS', dataIndex: 'status', key: 'status', width: 140,
      render: (s) => statusTag(s),
    },
    {
      title: 'CREATED AT', dataIndex: 'createdAt', key: 'createdAt', width: 170,
      render: (t) => <span style={{ color: '#71717A', fontSize: 12 }}>{t ? new Date(t).toLocaleDateString() : '—'}</span>,
    },
    {
      title: 'ACTIONS', key: 'actions', width: 290, align: 'right',
      render: (_, record) => (
        <Space size={6}>
          {record.status === 'DRAFT' && (
            <Button size="small" style={{ ...btnPrimary, height: 30, padding: '0 10px', fontSize: 12 }} icon={<RocketOutlined />}
              onClick={() => publishDrive(record.id)}>Publish</Button>
          )}
          {record.status === 'PUBLISHED' && (
            <Button size="small" style={{ ...btnDanger, height: 30, padding: '0 10px', fontSize: 12 }} icon={<CloseCircleOutlined />}
              onClick={() => closeDrive(record.id)}>Close</Button>
          )}
          {record.status === 'DRAFT' && (
            <Popconfirm title="Delete this drive?" onConfirm={() => deleteDrive(record.id)}
              okButtonProps={{ style: btnPrimary }} cancelButtonProps={{ style: btnGhost }}>
              <Button size="small" style={{ ...btnDanger, height: 30, padding: '0 10px', fontSize: 12 }} icon={<DeleteOutlined />}>Delete</Button>
            </Popconfirm>
          )}
          <Button size="small" style={{ ...btnGhost, height: 30, padding: '0 10px', fontSize: 12 }} icon={<SettingOutlined />}
            onClick={() => onManageRounds(record.id)}>Rounds</Button>
        </Space>
      ),
    },
  ];

  // Stats computation
  const total = drives.length;
  const published = drives.filter(d => d.status === 'PUBLISHED').length;
  const draft = drives.filter(d => d.status === 'DRAFT').length;
  const closed = drives.filter(d => d.status === 'CLOSED').length;

  return (
    <>
      {/* Top Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#A1A1AA' }}>
          <span style={{ color: '#71717A', display: 'flex', alignItems: 'center', gap: 4 }}>
            <BankOutlined style={{ fontSize: 14 }} />
            Company Console
          </span>
          <span style={{ color: '#71717A' }}>›</span>
          <span style={{ color: '#FAFAFA', fontWeight: 600 }}>My Drives</span>
        </div>
      </div>

      {/* Hero Header & Global Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ color: '#FAFAFA', fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>My Drives</h1>
          <p style={{ color: '#A1A1AA', fontSize: 13, margin: '4px 0 0 0' }}>
            Create and manage your recruitment drives, automated pipelines, and candidate assessments.
          </p>
        </div>
        <Button style={btnPrimary} icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Create Drive
        </Button>
      </div>

      {/* 4 Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Card 1: Total Drives */}
        <div style={{
          position: 'relative', overflow: 'hidden', borderRadius: 12,
          backgroundColor: '#121216', border: '1px solid #27272A',
          padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          transition: 'all 0.2s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#A1A1AA', textTransform: 'uppercase' }}>
              TOTAL DRIVES
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#18181B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717A' }}>
              <AppstoreOutlined style={{ fontSize: 16 }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 32, fontWeight: 700, color: '#FAFAFA', letterSpacing: '-0.02em', lineHeight: 1 }}>{total}</span>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#71717A' }}>{total > 0 ? `${total} Total` : '0.0%'}</span>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(140, 144, 159, 0.4), transparent)' }} />
        </div>

        {/* Card 2: Published */}
        <div style={{
          position: 'relative', overflow: 'hidden', borderRadius: 12,
          backgroundColor: '#121216', border: '1px solid #27272A',
          padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          transition: 'all 0.2s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#A1A1AA', textTransform: 'uppercase' }}>
              PUBLISHED
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
              <CheckCircleOutlined style={{ fontSize: 16 }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 32, fontWeight: 700, color: '#10B981', letterSpacing: '-0.02em', lineHeight: 1 }}>{published}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 600, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
              Active
            </span>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.4), transparent)' }} />
        </div>

        {/* Card 3: Draft */}
        <div style={{
          position: 'relative', overflow: 'hidden', borderRadius: 12,
          backgroundColor: '#121216', border: '1px solid #27272A',
          padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          transition: 'all 0.2s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#A1A1AA', textTransform: 'uppercase' }}>
              DRAFT
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
              <EditOutlined style={{ fontSize: 16 }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 32, fontWeight: 700, color: '#F59E0B', letterSpacing: '-0.02em', lineHeight: 1 }}>{draft}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 600, backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
              Unpublished
            </span>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.4), transparent)' }} />
        </div>

        {/* Card 4: Closed */}
        <div style={{
          position: 'relative', overflow: 'hidden', borderRadius: 12,
          backgroundColor: '#121216', border: '1px solid #27272A',
          padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          transition: 'all 0.2s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#A1A1AA', textTransform: 'uppercase' }}>
              CLOSED
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
              <InboxOutlined style={{ fontSize: 16 }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 32, fontWeight: 700, color: '#EF4444', letterSpacing: '-0.02em', lineHeight: 1 }}>{closed}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 600, backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}>
              Archived
            </span>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.4), transparent)' }} />
        </div>
      </div>

      {/* Search & Filter Ribbon */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <Input
          placeholder="Filter by drive title or ID..."
          prefix={<SearchOutlined style={{ color: '#71717A', marginRight: 6 }} />}
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{
            width: 320, backgroundColor: '#121216', border: '1px solid #27272A',
            color: '#FAFAFA', borderRadius: 8, height: 38,
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button style={btnGhost} icon={<ReloadOutlined />} onClick={fetchDrives}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Data Table with Empty State */}
      <div style={{
        borderRadius: 12, backgroundColor: '#121216', border: '1px solid #27272A',
        overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      }}>
        <Table
          columns={columns}
          dataSource={filteredDrives}
          rowKey="id"
          loading={loading}
          pagination={filteredDrives.length > 8 ? { pageSize: 8, showSizeChanger: false } : false}
          size="middle"
          className="dark-table"
          locale={{
            emptyText: (
              <div style={{ padding: '64px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {/* Visual Icon Glow & Geometry */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80, marginBottom: 20 }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(37, 99, 235, 0.12)', filter: 'blur(16px)' }} />
                  <div style={{
                    position: 'relative', width: 64, height: 64, borderRadius: 16,
                    background: '#18181B', border: '1px solid #27272A',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.05)',
                  }}>
                    <svg style={{ width: 32, height: 32, color: '#71717A' }} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                {/* Text Presentation */}
                <h3 style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 16, margin: 0, letterSpacing: '-0.01em' }}>No data</h3>
                <p style={{ color: '#A1A1AA', fontSize: 13, marginTop: 6, marginBottom: 20, maxWidth: 360, textAlign: 'center', lineHeight: 1.5 }}>
                  You haven't created any drives yet. Click “+ Create Drive” to launch your first assessment cycle.
                </p>
                {/* Immediate Action Link */}
                <Button
                  style={{
                    backgroundColor: '#18181B',
                    border: '1px solid #27272A',
                    color: '#3B82F6',
                    borderRadius: 8,
                    height: 38,
                    fontWeight: 500,
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  icon={<PlusOutlined />}
                  onClick={() => setModalOpen(true)}
                >
                  Initialize First Requisition
                </Button>
              </div>
            ),
          }}
        />
      </div>

      <Modal
        title={<span style={{ color: theme.textPrimary, fontWeight: 700, fontSize: 18 }}>Create New Drive</span>}
        open={modalOpen}
        onCancel={() => { form.resetFields(); setModalOpen(false); }}
        footer={null} destroyOnClose width={520}
        styles={{ header: { background: theme.surface, borderBottom: `1px solid ${theme.border}` }, body: { background: theme.surface }, content: { background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: theme.radiusLg } }}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} className="dark-form">
          <Form.Item name="title" label={<span style={{ color: theme.textSecondary }}>Drive Title</span>} rules={[{ required: true, message: 'Title is required' }]}>
            <Input className="dark-input" placeholder="e.g. Campus Hiring 2026" />
          </Form.Item>
          <Form.Item name="description" label={<span style={{ color: theme.textSecondary }}>Description</span>}>
            <TextArea rows={3} className="dark-input" placeholder="Describe the drive purpose..." />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button style={{ ...btnPrimary, width: '100%', height: 42 }} htmlType="submit" loading={submitting}>
              Create Drive
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
// SECTION 2 — QUESTION BANK
// ═══════════════════════════════════════════════════════════════════
const QuestionBankSection = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [questionType, setQuestionType] = useState('MCQ');
  const [filterText, setFilterText] = useState('');
  const [form] = Form.useForm();

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await questionService.getQuestions();
      setQuestions(res.data || []);
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleCreate = async (values) => {
    setSubmitting(true);
    try {
      const body = {
        questionText: values.questionText.trim(),
        questionType: values.questionType,
        marks: Number(values.marks),
        tags: values.tags ? values.tags.trim() : '',
      };
      if (values.questionType === 'MCQ') {
        body.optionA = values.optionA ? values.optionA.trim() : '';
        body.optionB = values.optionB ? values.optionB.trim() : '';
        body.optionC = values.optionC ? values.optionC.trim() : '';
        body.optionD = values.optionD ? values.optionD.trim() : '';
        body.correctOption = values.correctOption;
      }
      await questionService.createQuestion(body);
      message.success('Question added to bank successfully');
      form.resetFields();
      setQuestionType('MCQ');
      setModalOpen(false);
      fetchQuestions();
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed to create question');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteQuestion = async (id) => {
    try {
      await questionService.deleteQuestion(id);
      message.success('Question removed from bank');
      fetchQuestions();
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed to delete question');
    }
  };

  const typeTag = (t) => {
    const isMCQ = t === 'MCQ';
    return (
      <span style={{
        color: isMCQ ? '#60A5FA' : '#C084FC',
        backgroundColor: isMCQ ? 'rgba(59, 130, 246, 0.15)' : 'rgba(168, 85, 247, 0.15)',
        border: `1px solid ${isMCQ ? 'rgba(59, 130, 246, 0.3)' : 'rgba(168, 85, 247, 0.3)'}`,
        padding: '3px 10px',
        borderRadius: 9999,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          backgroundColor: isMCQ ? '#3B82F6' : '#A855F7',
        }} />
        {isMCQ ? 'MCQ' : 'Subjective'}
      </span>
    );
  };

  const filteredQuestions = questions.filter(q => {
    if (!filterText) return true;
    const search = filterText.toLowerCase();
    return (
      (q.questionText && q.questionText.toLowerCase().includes(search)) ||
      (q.tags && q.tags.toLowerCase().includes(search)) ||
      (q.questionType && q.questionType.toLowerCase().includes(search)) ||
      (q.id && String(q.id).toLowerCase().includes(search))
    );
  });

  const columns = [
    {
      title: 'ID', dataIndex: 'id', key: 'id', width: 80,
      render: (v) => <span style={{ color: '#71717A', fontFamily: 'monospace', fontSize: 12 }}>#{v}</span>,
    },
    {
      title: 'TYPE', dataIndex: 'questionType', key: 'questionType', width: 140,
      render: (t) => typeTag(t),
    },
    {
      title: 'QUESTION TEXT', dataIndex: 'questionText', key: 'questionText',
      render: (t) => (
        <Tooltip title={t && t.length > 80 ? t : null}>
          <span style={{ color: '#FAFAFA', fontSize: 13, fontWeight: 500 }}>
            {t && t.length > 80 ? t.slice(0, 80) + '…' : t}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'MARKS', dataIndex: 'marks', key: 'marks', width: 90, align: 'center',
      render: (m) => (
        <span style={{
          color: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          padding: '2px 8px',
          borderRadius: 6,
          fontWeight: 700,
          fontSize: 12,
        }}>
          {m} pts
        </span>
      ),
    },
    {
      title: 'TAGS', dataIndex: 'tags', key: 'tags', width: 180,
      render: (t) => {
        if (!t) return <span style={{ color: '#71717A', fontSize: 12 }}>—</span>;
        const tagList = t.split(',').map(s => s.trim()).filter(Boolean);
        return (
          <Space size={4} wrap>
            {tagList.map((tag, idx) => (
              <span key={idx} style={{
                color: '#A1A1AA',
                backgroundColor: '#18181B',
                border: '1px solid #27272A',
                padding: '2px 8px',
                borderRadius: 9999,
                fontSize: 11,
              }}>
                {tag}
              </span>
            ))}
          </Space>
        );
      },
    },
    {
      title: 'ACTIONS', key: 'actions', width: 110, align: 'right',
      render: (_, record) => (
        <Popconfirm
          title="Delete Question"
          description="Are you sure you want to remove this question from the bank?"
          onConfirm={() => deleteQuestion(record.id)}
          okButtonProps={{ style: btnPrimary }}
          cancelButtonProps={{ style: btnGhost }}
        >
          <Button size="small" style={{ ...btnDanger, height: 30, padding: '0 10px', fontSize: 12 }} icon={<DeleteOutlined />}>
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  // Stats computation
  const totalQ = questions.length;
  const mcqCount = questions.filter(q => q.questionType === 'MCQ').length;
  const subCount = questions.filter(q => q.questionType === 'SUBJECTIVE').length;

  return (
    <>
      {/* Top Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#A1A1AA' }}>
          <span style={{ color: '#71717A', display: 'flex', alignItems: 'center', gap: 4 }}>
            <BankOutlined style={{ fontSize: 14 }} />
            Company Console
          </span>
          <span style={{ color: '#71717A' }}>›</span>
          <span style={{ color: '#FAFAFA', fontWeight: 600 }}>Question Bank</span>
        </div>
      </div>

      {/* Hero Header & Global Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ color: '#FAFAFA', fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Question Bank</h1>
          <p style={{ color: '#A1A1AA', fontSize: 13, margin: '4px 0 0 0' }}>
            Author, categorize, and organize MCQ and subjective questions for your assessment rounds.
          </p>
        </div>
        <Button style={btnPrimary} icon={<PlusOutlined />} onClick={() => { form.setFieldsValue({ questionType: 'MCQ', marks: 1 }); setQuestionType('MCQ'); setModalOpen(true); }}>
          Add Question
        </Button>
      </div>

      {/* 3 Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Card 1: Total Questions */}
        <div style={{
          position: 'relative', overflow: 'hidden', borderRadius: 12,
          backgroundColor: '#121216', border: '1px solid #27272A',
          padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#A1A1AA', textTransform: 'uppercase' }}>
              TOTAL QUESTIONS
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#18181B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717A' }}>
              <FileTextOutlined style={{ fontSize: 16 }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 32, fontWeight: 700, color: '#FAFAFA', letterSpacing: '-0.02em', lineHeight: 1 }}>{totalQ}</span>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#71717A' }}>{totalQ > 0 ? `${totalQ} Total` : '0 Items'}</span>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(140, 144, 159, 0.4), transparent)' }} />
        </div>

        {/* Card 2: MCQ Questions */}
        <div style={{
          position: 'relative', overflow: 'hidden', borderRadius: 12,
          backgroundColor: '#121216', border: '1px solid #27272A',
          padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#A1A1AA', textTransform: 'uppercase' }}>
              MCQ QUESTIONS
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
              <OrderedListOutlined style={{ fontSize: 16 }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 32, fontWeight: 700, color: '#60A5FA', letterSpacing: '-0.02em', lineHeight: 1 }}>{mcqCount}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 600, backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA' }}>
              {totalQ > 0 ? `${Math.round((mcqCount / totalQ) * 100)}%` : '0%'}
            </span>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.4), transparent)' }} />
        </div>

        {/* Card 3: Subjective Questions */}
        <div style={{
          position: 'relative', overflow: 'hidden', borderRadius: 12,
          backgroundColor: '#121216', border: '1px solid #27272A',
          padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#A1A1AA', textTransform: 'uppercase' }}>
              SUBJECTIVE
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A855F7' }}>
              <EditOutlined style={{ fontSize: 16 }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 32, fontWeight: 700, color: '#C084FC', letterSpacing: '-0.02em', lineHeight: 1 }}>{subCount}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 600, backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#C084FC' }}>
              {totalQ > 0 ? `${Math.round((subCount / totalQ) * 100)}%` : '0%'}
            </span>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.4), transparent)' }} />
        </div>
      </div>

      {/* Search & Filter Ribbon */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <Input
          placeholder="Filter by question text, tags, or type..."
          prefix={<SearchOutlined style={{ color: '#71717A', marginRight: 6 }} />}
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{
            width: 320, backgroundColor: '#121216', border: '1px solid #27272A',
            color: '#FAFAFA', borderRadius: 8, height: 38,
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button style={btnGhost} icon={<ReloadOutlined />} onClick={fetchQuestions}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Data Table with Dark Styling & Empty State */}
      <div style={{
        borderRadius: 12, backgroundColor: '#121216', border: '1px solid #27272A',
        overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      }}>
        <Table
          columns={columns}
          dataSource={filteredQuestions}
          rowKey="id"
          loading={loading}
          pagination={filteredQuestions.length > 10 ? { pageSize: 10, showSizeChanger: false } : false}
          size="middle"
          className="dark-table"
          locale={{
            emptyText: (
              <div style={{ padding: '64px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80, marginBottom: 20 }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.12)', filter: 'blur(16px)' }} />
                  <div style={{
                    position: 'relative', width: 64, height: 64, borderRadius: 16,
                    background: '#18181B', border: '1px solid #27272A',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.05)',
                  }}>
                    <FileTextOutlined style={{ fontSize: 30, color: '#71717A' }} />
                  </div>
                </div>
                <h3 style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 16, margin: 0, letterSpacing: '-0.01em' }}>No Questions Found</h3>
                <p style={{ color: '#A1A1AA', fontSize: 13, marginTop: 6, marginBottom: 20, maxWidth: 360, textAlign: 'center', lineHeight: 1.5 }}>
                  Your question library is currently empty. Click “+ Add Question” to create assessment items for your hiring rounds.
                </p>
                <Button
                  style={{
                    backgroundColor: '#18181B',
                    border: '1px solid #27272A',
                    color: '#3B82F6',
                    borderRadius: 8,
                    height: 38,
                    fontWeight: 500,
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  icon={<PlusOutlined />}
                  onClick={() => { form.setFieldsValue({ questionType: 'MCQ', marks: 1 }); setQuestionType('MCQ'); setModalOpen(true); }}
                >
                  Create First Question
                </Button>
              </div>
            ),
          }}
        />
      </div>

      {/* Dynamic Add Question Modal */}
      <Modal
        title={<span style={{ color: theme.textPrimary, fontWeight: 700, fontSize: 18 }}>Add New Question</span>}
        open={modalOpen}
        onCancel={() => { form.resetFields(); setQuestionType('MCQ'); setModalOpen(false); }}
        footer={null}
        destroyOnClose
        width={620}
        styles={{
          header: { background: theme.surface, borderBottom: `1px solid ${theme.border}` },
          body: { background: theme.surface },
          content: { background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: theme.radiusLg },
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{ questionType: 'MCQ', marks: 1 }}
          className="dark-form"
        >
          <Form.Item
            name="questionText"
            label={<span style={{ color: theme.textSecondary }}>Question Text</span>}
            rules={[{ required: true, message: 'Question text is required' }]}
          >
            <TextArea rows={3} className="dark-input" placeholder="e.g. What is the time complexity of binary search?" />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="questionType"
              label={<span style={{ color: theme.textSecondary }}>Question Type</span>}
              rules={[{ required: true, message: 'Question type is required' }]}
              style={{ flex: 1 }}
            >
              <Select
                placeholder="Select type"
                onChange={(v) => setQuestionType(v)}
                className="dark-select"
                popupClassName="dark-dropdown"
              >
                <Option value="MCQ">MCQ (Multiple Choice)</Option>
                <Option value="SUBJECTIVE">Subjective / Coding</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="marks"
              label={<span style={{ color: theme.textSecondary }}>Marks / Points</span>}
              rules={[{ required: true, message: 'Marks are required' }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={1} max={100} style={{ width: '100%' }} className="dark-input" placeholder="e.g. 2" />
            </Form.Item>
          </div>

          <Form.Item
            name="tags"
            label={<span style={{ color: theme.textSecondary }}>Tags / Categories</span>}
          >
            <Input className="dark-input" placeholder="e.g. Algorithms, Data Structures, Java" />
          </Form.Item>

          {/* Dynamic MCQ Options & Correct Answer Designation */}
          {questionType === 'MCQ' && (
            <div style={{
              background: '#121216',
              border: '1px solid #27272A',
              borderRadius: 8,
              padding: 16,
              marginBottom: 20,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                Multiple Choice Options
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {['A', 'B', 'C', 'D'].map((opt) => (
                  <Form.Item
                    key={opt}
                    name={`option${opt}`}
                    label={<span style={{ color: theme.textSecondary }}>Option {opt}</span>}
                    rules={[{ required: true, message: `Option ${opt} is required` }]}
                    style={{ marginBottom: 12 }}
                  >
                    <Input className="dark-input" placeholder={`Enter text for Option ${opt}`} />
                  </Form.Item>
                ))}
              </div>

              <Form.Item
                name="correctOption"
                label={<span style={{ color: '#10B981', fontWeight: 600 }}>Designate Correct Option</span>}
                rules={[{ required: true, message: 'Please select the correct option' }]}
                style={{ marginBottom: 0 }}
              >
                <Select
                  placeholder="Select correct option (A, B, C, or D)"
                  className="dark-select"
                  popupClassName="dark-dropdown"
                >
                  {['A', 'B', 'C', 'D'].map((o) => (
                    <Option key={o} value={o}>Option {o}</Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
          )}

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              style={{ ...btnPrimary, width: '100%', height: 42 }}
              htmlType="submit"
              loading={submitting}
            >
              Save Question to Library
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
// SECTION 3 — ROUNDS
// ═══════════════════════════════════════════════════════════════════
const RoundsSection = ({ initialDriveId }) => {
  const [drives, setDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState(initialDriveId || null);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignRoundId, setAssignRoundId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchDrives = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/api/v1/drives');
      setDrives(res.data || []);
    } catch (e) {
      message.error('Failed to fetch drives');
    }
  }, []);

  useEffect(() => { fetchDrives(); }, [fetchDrives]);

  useEffect(() => {
    if (initialDriveId) setSelectedDriveId(initialDriveId);
  }, [initialDriveId]);

  const fetchRounds = useCallback(async () => {
    if (!selectedDriveId) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/v1/drives/${selectedDriveId}/rounds`);
      setRounds(res.data || []);
    } catch (e) {
      message.error('Failed to fetch rounds');
    } finally {
      setLoading(false);
    }
  }, [selectedDriveId]);

  useEffect(() => { fetchRounds(); }, [fetchRounds]);

  const handleAddRound = async (values) => {
    setSubmitting(true);
    try {
      await axiosInstance.post(`/api/v1/drives/${selectedDriveId}/rounds`, {
        title: values.title,
        durationMinutes: values.durationMinutes,
        cutoffScore: values.cutoffScore,
      });
      message.success('Round added');
      form.resetFields();
      setAddModalOpen(false);
      fetchRounds();
    } catch (e) {
      message.error('Failed to add round');
    } finally {
      setSubmitting(false);
    }
  };

  const activateRound = async (roundId) => {
    try {
      await axiosInstance.patch(`/api/v1/drives/${selectedDriveId}/rounds/${roundId}/activate`);
      message.success('Round activated');
      fetchRounds();
    } catch (e) {
      message.error('Failed to activate round');
    }
  };

  const openAssignModal = async (roundId) => {
    setAssignRoundId(roundId);
    try {
      const res = await axiosInstance.get('/api/v1/questions');
      setQuestions(res.data || []);
    } catch (e) {
      message.error('Failed to fetch questions');
    }
    setSelectedQuestionIds([]);
    setAssignModalOpen(true);
  };

  const handleAssign = async () => {
    if (selectedQuestionIds.length === 0) {
      message.warning('Select at least one question');
      return;
    }
    setSubmitting(true);
    try {
      await axiosInstance.post(
        `/api/v1/drives/${selectedDriveId}/rounds/${assignRoundId}/questions`,
        { questionIds: selectedQuestionIds },
      );
      message.success('Questions assigned');
      setAssignModalOpen(false);
      setSelectedQuestionIds([]);
    } catch (e) {
      message.error('Failed to assign questions');
    } finally {
      setSubmitting(false);
    }
  };

  const roundStatusTag = (s) => {
    const map = {
      ACTIVE:      { color: theme.accent, bg: theme.accentGlow },
      NOT_STARTED: { color: theme.textMuted, bg: theme.surfaceHigh },
      COMPLETED:   { color: theme.danger, bg: theme.dangerGlow },
    };
    const cfg = map[s] || map.NOT_STARTED;
    return (
      <span style={{
        color: cfg.color, background: cfg.bg, padding: '3px 10px',
        borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em',
      }}>
        {s}
      </span>
    );
  };

  const columns = [
    {
      title: 'Round', dataIndex: 'roundNumber', key: 'roundNumber', width: 80,
      render: (v) => <Text style={{ color: theme.primary, fontWeight: 800, fontSize: 16 }}>#{v}</Text>,
    },
    {
      title: 'Title', dataIndex: 'title', key: 'title',
      render: (t) => <Text strong style={{ color: theme.textPrimary }}>{t}</Text>,
    },
    {
      title: 'Duration', dataIndex: 'durationMinutes', key: 'durationMinutes', width: 120,
      render: (v) => <Text style={{ color: theme.textSecondary }}>{v} min</Text>,
    },
    {
      title: 'Cutoff', dataIndex: 'cutoffScore', key: 'cutoffScore', width: 100,
      render: (v) => <Text style={{ color: theme.warning, fontWeight: 600 }}>{v}</Text>,
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 140,
      render: (s) => roundStatusTag(s),
    },
    {
      title: 'Actions', key: 'actions', width: 280,
      render: (_, record) => (
        <Space size={6}>
          {record.status === 'NOT_STARTED' && (
            <Button size="small" style={btnPrimary} icon={<CheckCircleOutlined />}
              onClick={() => activateRound(record.id)}>Activate</Button>
          )}
          <Button size="small" style={btnGhost} icon={<FileTextOutlined />}
            onClick={() => openAssignModal(record.id)}>Assign Qs</Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={sectionHeader}>
        <div>
          <div style={pageTitle}>Rounds Management</div>
          <div style={sectionSubtext}>Configure and assign questions to drive rounds</div>
        </div>
        {selectedDriveId && (
          <Button style={btnPrimary} icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
            Add Round
          </Button>
        )}
      </div>

      <div style={{ ...cardStyle, marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Text style={{ color: theme.textSecondary, fontWeight: 500, whiteSpace: 'nowrap' }}>Select Drive:</Text>
          <Select
            placeholder="Choose a drive..."
            value={selectedDriveId}
            onChange={(v) => setSelectedDriveId(v)}
            style={{ width: 340 }}
            allowClear
            className="dark-select"
            popupClassName="dark-dropdown"
          >
            {drives.map((d) => (
              <Option key={d.id} value={d.id}>{d.id} — {d.title}</Option>
            ))}
          </Select>
        </div>
      </div>

      {!selectedDriveId ? (
        <div style={{ ...glassCard, textAlign: 'center', padding: '48px 24px' }}>
          <OrderedListOutlined style={{ fontSize: 40, color: theme.textMuted, marginBottom: 12 }} />
          <div style={{ color: theme.textSecondary, fontSize: 15 }}>Select a drive above to manage its rounds</div>
        </div>
      ) : (
        <div style={cardStyle}>
          <Table
            columns={columns} dataSource={rounds} rowKey="id" loading={loading}
            pagination={false} size="middle" className="dark-table"
          />
        </div>
      )}

      {/* Add Round Modal */}
      <Modal
        title={<span style={{ color: theme.textPrimary, fontWeight: 700, fontSize: 18 }}>Add New Round</span>}
        open={addModalOpen}
        onCancel={() => { form.resetFields(); setAddModalOpen(false); }}
        footer={null} destroyOnClose width={500}
        styles={{ header: { background: theme.surface, borderBottom: `1px solid ${theme.border}` }, body: { background: theme.surface }, content: { background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: theme.radiusLg } }}
      >
        <Form form={form} layout="vertical" onFinish={handleAddRound} className="dark-form">
          <Form.Item name="title" label={<span style={{ color: theme.textSecondary }}>Round Title</span>} rules={[{ required: true, message: 'Required' }]}>
            <Input className="dark-input" placeholder="e.g. Technical Aptitude" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="durationMinutes" label={<span style={{ color: theme.textSecondary }}>Duration (min)</span>} rules={[{ required: true, message: 'Required' }]} style={{ flex: 1 }}>
              <InputNumber min={1} style={{ width: '100%' }} className="dark-input" />
            </Form.Item>
            <Form.Item name="cutoffScore" label={<span style={{ color: theme.textSecondary }}>Cutoff Score</span>} rules={[{ required: true, message: 'Required' }]} style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} className="dark-input" />
            </Form.Item>
          </div>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button style={{ ...btnPrimary, width: '100%', height: 42 }} htmlType="submit" loading={submitting}>
              Create Round
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Assign Questions Modal */}
      <Modal
        title={<span style={{ color: theme.textPrimary, fontWeight: 700, fontSize: 18 }}>Assign Questions to Round</span>}
        open={assignModalOpen}
        onCancel={() => { setAssignModalOpen(false); setSelectedQuestionIds([]); }}
        onOk={handleAssign}
        confirmLoading={submitting}
        okText="Assign Selected"
        width={720}
        okButtonProps={{ style: btnPrimary }}
        cancelButtonProps={{ style: btnGhost }}
        styles={{ header: { background: theme.surface, borderBottom: `1px solid ${theme.border}` }, body: { background: theme.surface }, content: { background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: theme.radiusLg }, footer: { background: theme.surface, borderTop: `1px solid ${theme.border}` } }}
      >
        {questions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <FileTextOutlined style={{ fontSize: 36, color: theme.textMuted, marginBottom: 8 }} />
            <div style={{ color: theme.textSecondary }}>No questions in the question bank yet.</div>
          </div>
        ) : (
          <div style={{ maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
            {questions.map((q) => (
              <div key={q.id} style={{
                padding: '12px 16px', marginBottom: 8, borderRadius: theme.radius,
                background: selectedQuestionIds.includes(q.id) ? theme.primaryGlow : theme.surfaceHigh,
                border: `1px solid ${selectedQuestionIds.includes(q.id) ? theme.primary : theme.border}`,
                cursor: 'pointer', transition: theme.transition,
              }}
                onClick={() => {
                  setSelectedQuestionIds((prev) =>
                    prev.includes(q.id) ? prev.filter((x) => x !== q.id) : [...prev, q.id]
                  );
                }}
              >
                <Checkbox
                  checked={selectedQuestionIds.includes(q.id)}
                  style={{ marginRight: 12 }}
                  onChange={(e) => {
                    setSelectedQuestionIds((prev) =>
                      e.target.checked ? [...prev, q.id] : prev.filter((x) => x !== q.id)
                    );
                  }}
                >
                  <span style={{ color: theme.textMuted, fontFamily: 'monospace', fontSize: 11, marginRight: 8 }}>#{q.id}</span>
                  <span style={{ color: theme.textPrimary, fontSize: 13 }}>
                    {q.questionText && q.questionText.length > 80
                      ? q.questionText.slice(0, 80) + '…'
                      : q.questionText}
                  </span>
                  <span style={{ marginLeft: 12 }}>
                    <span style={{
                      color: q.questionType === 'MCQ' ? theme.primary : theme.warning,
                      background: q.questionType === 'MCQ' ? theme.primaryGlow : theme.warningGlow,
                      padding: '1px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600, marginRight: 6,
                    }}>{q.questionType}</span>
                    <span style={{
                      color: theme.accent, background: theme.accentGlow,
                      padding: '1px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600,
                    }}>{q.marks} pts</span>
                  </span>
                </Checkbox>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
// SECTION 4 — RESULTS
// ═══════════════════════════════════════════════════════════════════
const ResultsSection = () => {
  const [drives, setDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [selectedRoundId, setSelectedRoundId] = useState(null);
  const [activeRound, setActiveRound] = useState(null);
  const [resultsData, setResultsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [releasingKey, setReleasingKey] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const { user } = useAuth();
  const [reviewResult, setReviewResult] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm] = Form.useForm();

  // 1. Fetch drives
  const fetchDrives = useCallback(async () => {
    try {
      const res = await driveService.getCompanyDrives();
      setDrives(res.data || []);
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed to fetch drives');
    }
  }, []);

  useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  // 2. Fetch rounds when drive changes
  const fetchRounds = useCallback(async () => {
    if (!selectedDriveId) {
      setRounds([]);
      setSelectedRoundId(null);
      setActiveRound(null);
      setResultsData(null);
      return;
    }
    try {
      const res = await driveService.getRoundsForDrive(selectedDriveId);
      const roundList = res.data || [];
      setRounds(roundList);
      if (roundList.length > 0 && !selectedRoundId) {
        setSelectedRoundId(roundList[0].id);
        setActiveRound(roundList[0]);
      }
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed to fetch rounds for drive');
    }
  }, [selectedDriveId, selectedRoundId]);

  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  // 3. Fetch candidate results when round changes
  const fetchResults = useCallback(async () => {
    if (!selectedRoundId) {
      setResultsData(null);
      return;
    }
    setLoading(true);
    try {
      const res = await resultsService.getResultsForRound(selectedRoundId);
      setResultsData(res.data || null);
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed to fetch results for round');
      setResultsData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedRoundId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleDriveChange = (driveId) => {
    setSelectedDriveId(driveId);
    setSelectedRoundId(null);
    setActiveRound(null);
    setResultsData(null);
  };

  const handleRoundChange = (roundId) => {
    setSelectedRoundId(roundId);
    const round = rounds.find((r) => r.id === roundId);
    setActiveRound(round || null);
  };

  // The Engine Trigger: Advance Students
  const handleAdvanceStudents = async () => {
    if (!selectedRoundId) return;
    setAdvancing(true);
    try {
      const cutoff = activeRound?.cutoffScore ?? 0;
      const res = await resultsService.advanceStudents(selectedRoundId, {
        cutoffScore: cutoff,
      });
      const summary = res.data;
      if (summary) {
        message.success(
          `Advancement Complete! ${summary.advanced ?? 0} candidate(s) advanced, ${summary.eliminated ?? 0} eliminated against cutoff of ${cutoff} pts.`,
          5
        );
      } else {
        message.success('Candidates advanced successfully based on round cutoff');
      }
      fetchResults();
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed to advance candidates');
    } finally {
      setAdvancing(false);
    }
  };

  // Release Key
  const handleReleaseKey = async () => {
    if (!selectedRoundId) return;
    setReleasingKey(true);
    try {
      await resultsService.releaseResultKey(selectedRoundId);
      message.success('Assessment scorecard and result key released to candidates');
      fetchResults();
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed to release result key');
    } finally {
      setReleasingKey(false);
    }
  };

  // Subjective Review Modal Handlers
  const openReviewModal = (record) => {
    setReviewResult(record);
    reviewForm.resetFields();
    reviewForm.setFieldsValue({
      questionId: 1,
      marksAwarded: record.subjectiveScore || 0,
    });
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = async (values) => {
    if (!reviewResult) return;
    setSubmittingReview(true);
    try {
      const reviewerId = user?.id || localStorage.getItem('userId') || 1;
      await resultsService.submitSubjectiveReview(reviewResult.id, {
        questionId: Number(values.questionId),
        marksAwarded: Number(values.marksAwarded),
        reviewedBy: Number(reviewerId),
      });
      message.success('Subjective score recorded successfully');
      setReviewModalOpen(false);
      setReviewResult(null);
      reviewForm.resetFields();
      fetchResults();
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed to submit subjective review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Determine candidate display status
  const cutoff = activeRound?.cutoffScore ?? 0;
  const isAdvancementRun = (resultsData?.advanced ?? 0) > 0 || (resultsData?.eliminated ?? 0) > 0;

  const getCandidateStatus = (record) => {
    if (isAdvancementRun) {
      return (record.totalScore ?? 0) >= cutoff ? 'ADVANCED' : 'ELIMINATED';
    }
    if (record.subjectiveReviewed) {
      return (record.totalScore ?? 0) >= cutoff ? 'QUALIFIED' : 'EVALUATED';
    }
    return 'PENDING';
  };

  const renderStatusTag = (status) => {
    const configMap = {
      ADVANCED: {
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.12)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        label: 'ADVANCED',
      },
      QUALIFIED: {
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.12)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        label: 'MET CUTOFF',
      },
      ELIMINATED: {
        color: '#EF4444',
        bg: 'rgba(239, 68, 68, 0.12)',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        label: 'ELIMINATED',
      },
      EVALUATED: {
        color: '#3B82F6',
        bg: 'rgba(59, 130, 246, 0.12)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        label: 'EVALUATED',
      },
      PENDING: {
        color: '#F59E0B',
        bg: 'rgba(245, 158, 11, 0.12)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        label: 'PENDING REVIEW',
      },
    };
    const cfg = configMap[status] || configMap.PENDING;
    return (
      <span style={{
        color: cfg.color,
        backgroundColor: cfg.bg,
        border: cfg.border,
        padding: '3px 10px',
        borderRadius: 9999,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: cfg.color,
        }} />
        {cfg.label}
      </span>
    );
  };

  const allResults = resultsData?.results || [];
  const filteredResults = allResults.filter((r) => {
    const status = getCandidateStatus(r);
    const matchesStatus = statusFilter === 'ALL' || status === statusFilter;
    const matchesQuery =
      !searchQuery ||
      String(r.studentId).includes(searchQuery) ||
      String(r.id).includes(searchQuery);
    return matchesStatus && matchesQuery;
  });

  const columns = [
    {
      title: 'CANDIDATE',
      dataIndex: 'studentId',
      key: 'studentId',
      width: 140,
      render: (v) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            backgroundColor: '#18181B',
            border: '1px solid #27272A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3B82F6',
            fontSize: 12,
            fontWeight: 700,
          }}>
            <TeamOutlined />
          </div>
          <div>
            <span style={{ color: '#FAFAFA', fontWeight: 600, fontFamily: 'monospace', fontSize: 13 }}>
              #STU-{v}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'MCQ SCORE',
      dataIndex: 'mcqScore',
      key: 'mcqScore',
      width: 110,
      render: (v) => (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          color: '#60A5FA',
          padding: '2px 8px',
          borderRadius: 6,
          fontWeight: 600,
          fontSize: 12,
        }}>
          {v ?? 0} pts
        </span>
      ),
    },
    {
      title: 'SUBJECTIVE',
      dataIndex: 'subjectiveScore',
      key: 'subjectiveScore',
      width: 120,
      render: (v, record) => (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: record.subjectiveReviewed ? 'rgba(168, 85, 247, 0.1)' : '#18181B',
          border: `1px solid ${record.subjectiveReviewed ? 'rgba(168, 85, 247, 0.25)' : '#27272A'}`,
          color: record.subjectiveReviewed ? '#C084FC' : '#71717A',
          padding: '2px 8px',
          borderRadius: 6,
          fontWeight: 600,
          fontSize: 12,
        }}>
          {v ?? 0} pts
        </span>
      ),
    },
    {
      title: 'TOTAL SCORE',
      dataIndex: 'totalScore',
      key: 'totalScore',
      width: 120,
      render: (v) => (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10B981',
          padding: '3px 10px',
          borderRadius: 6,
          fontWeight: 700,
          fontSize: 13,
        }}>
          {v ?? 0} pts
        </span>
      ),
    },
    {
      title: 'PERCENTILE',
      dataIndex: 'percentile',
      key: 'percentile',
      width: 110,
      render: (v) => (
        <span style={{ color: '#A1A1AA', fontFamily: 'monospace', fontSize: 12, fontWeight: 500 }}>
          {v != null ? `${Number(v).toFixed(1)}%` : '—'}
        </span>
      ),
    },
    {
      title: 'STATUS',
      key: 'status',
      width: 150,
      render: (_, record) => renderStatusTag(getCandidateStatus(record)),
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      width: 140,
      align: 'right',
      render: (_, record) => (
        <Button
          size="small"
          style={record.subjectiveReviewed ? btnGhost : btnPrimary}
          icon={<EditOutlined />}
          onClick={() => openReviewModal(record)}
        >
          {record.subjectiveReviewed ? 'Re-Grade' : 'Review'}
        </Button>
      ),
    },
  ];

  return (
    <>
      {/* Top Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#A1A1AA' }}>
          <span style={{ color: '#71717A', display: 'flex', alignItems: 'center', gap: 4 }}>
            <BankOutlined style={{ fontSize: 14 }} />
            Company Console
          </span>
          <span style={{ color: '#71717A' }}>›</span>
          <span style={{ color: '#FAFAFA', fontWeight: 600 }}>Results & Assessment Pipeline</span>
        </div>
      </div>

      {/* Hero Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ color: '#FAFAFA', fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
            Results & Evaluations
          </h1>
          <p style={{ color: '#A1A1AA', fontSize: 13, margin: '4px 0 0 0' }}>
            Inspect candidate scores, evaluate subjective responses, and trigger pipeline advancement against cutoffs.
          </p>
        </div>

        {selectedRoundId && resultsData && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button
              style={btnGhost}
              icon={<CheckCircleOutlined />}
              onClick={handleReleaseKey}
              loading={releasingKey}
            >
              Release Result Key
            </Button>
            <Button
              style={btnPrimary}
              icon={<RocketOutlined />}
              onClick={handleAdvanceStudents}
              loading={advancing}
            >
              Generate Shortlist / Advance Candidates
            </Button>
          </div>
        )}
      </div>

      {/* Cascading Drive & Round Selector Ribbon */}
      <div style={{
        borderRadius: 12,
        backgroundColor: '#121216',
        border: '1px solid #27272A',
        padding: '16px 20px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CarOutlined style={{ color: '#3B82F6', fontSize: 18 }} />
            <span style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>
              Drive:
            </span>
            <Select
              placeholder="Choose a Drive..."
              value={selectedDriveId}
              onChange={handleDriveChange}
              style={{ minWidth: 260 }}
              allowClear
              className="dark-select"
              popupClassName="dark-dropdown"
            >
              {drives.map((d) => (
                <Option key={d.id} value={d.id}>
                  {d.title}
                </Option>
              ))}
            </Select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <OrderedListOutlined style={{ color: '#3B82F6', fontSize: 18 }} />
            <span style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>
              Round:
            </span>
            <Select
              placeholder="Choose a Round..."
              value={selectedRoundId}
              onChange={handleRoundChange}
              style={{ minWidth: 260 }}
              allowClear
              disabled={!selectedDriveId || rounds.length === 0}
              className="dark-select"
              popupClassName="dark-dropdown"
            >
              {rounds.map((r) => (
                <Option key={r.id} value={r.id}>
                  #{r.roundNumber} — {r.title} (Cutoff: {r.cutoffScore ?? 0} pts)
                </Option>
              ))}
            </Select>
          </div>
        </div>

        {selectedRoundId && (
          <Button
            style={btnGhost}
            icon={<ReloadOutlined />}
            onClick={fetchResults}
            loading={loading}
          >
            Refresh
          </Button>
        )}
      </div>

      {resultsData && (
        <>
          {/* Dynamic 4-Metric Statistics Ribbon */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            {/* Metric 1: Total Attempted */}
            <div style={{
              position: 'relative', overflow: 'hidden', borderRadius: 12,
              backgroundColor: '#121216', border: '1px solid #27272A',
              padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#A1A1AA', textTransform: 'uppercase' }}>
                  CANDIDATES ATTEMPTED
                </span>
                <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#18181B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717A' }}>
                  <TeamOutlined style={{ fontSize: 15 }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 30, fontWeight: 700, color: '#FAFAFA', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {resultsData?.totalAttempted ?? 0}
                </span>
                <span style={{ fontSize: 11, color: '#71717A', fontFamily: 'monospace' }}>Submissions</span>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.4), transparent)' }} />
            </div>

            {/* Metric 2: Passing Cutoff */}
            <div style={{
              position: 'relative', overflow: 'hidden', borderRadius: 12,
              backgroundColor: '#121216', border: '1px solid #27272A',
              padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#A1A1AA', textTransform: 'uppercase' }}>
                  ROUND CUTOFF
                </span>
                <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
                  <OrderedListOutlined style={{ fontSize: 15 }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 30, fontWeight: 700, color: '#F59E0B', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {cutoff}
                </span>
                <span style={{ fontSize: 11, color: '#F59E0B', fontWeight: 600 }}>Points Required</span>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.4), transparent)' }} />
            </div>

            {/* Metric 3: Average Score */}
            <div style={{
              position: 'relative', overflow: 'hidden', borderRadius: 12,
              backgroundColor: '#121216', border: '1px solid #27272A',
              padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#A1A1AA', textTransform: 'uppercase' }}>
                  AVERAGE SCORE
                </span>
                <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
                  <BarChartOutlined style={{ fontSize: 15 }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 30, fontWeight: 700, color: '#60A5FA', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {resultsData?.averageScore ? Number(resultsData.averageScore).toFixed(1) : '0.0'}
                </span>
                <span style={{ fontSize: 11, color: '#71717A', fontFamily: 'monospace' }}>Mean Score</span>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.4), transparent)' }} />
            </div>

            {/* Metric 4: Advanced Count */}
            <div style={{
              position: 'relative', overflow: 'hidden', borderRadius: 12,
              backgroundColor: '#121216', border: '1px solid #27272A',
              padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#A1A1AA', textTransform: 'uppercase' }}>
                  ADVANCED TO NEXT
                </span>
                <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                  <TrophyOutlined style={{ fontSize: 15 }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 30, fontWeight: 700, color: '#10B981', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {resultsData?.advanced ?? allResults.filter(r => (r.totalScore ?? 0) >= cutoff).length}
                </span>
                <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>Qualified</span>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.4), transparent)' }} />
            </div>
          </div>

          {/* Filter Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <Input
                placeholder="Search by Student ID..."
                prefix={<SearchOutlined style={{ color: '#71717A', marginRight: 6 }} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: 260,
                  backgroundColor: '#121216',
                  border: '1px solid #27272A',
                  color: '#FAFAFA',
                  borderRadius: 8,
                  height: 38,
                }}
              />
              <Select
                value={statusFilter}
                onChange={(v) => setStatusFilter(v)}
                style={{ width: 180 }}
                className="dark-select"
                popupClassName="dark-dropdown"
              >
                <Option value="ALL">All Statuses</Option>
                <Option value="ADVANCED">Advanced Only</Option>
                <Option value="QUALIFIED">Met Cutoff</Option>
                <Option value="ELIMINATED">Eliminated Only</Option>
                <Option value="PENDING">Pending Review</Option>
              </Select>
            </div>
          </div>

          {/* Data Table */}
          <div style={{
            borderRadius: 12,
            backgroundColor: '#121216',
            border: '1px solid #27272A',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}>
            <Table
              columns={columns}
              dataSource={filteredResults}
              rowKey="id"
              loading={loading}
              pagination={filteredResults.length > 10 ? { pageSize: 10, showSizeChanger: false } : false}
              size="middle"
              className="dark-table"
              locale={{
                emptyText: (
                  <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                    <BarChartOutlined style={{ fontSize: 32, color: '#71717A', marginBottom: 8 }} />
                    <div style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 14 }}>No Test Submissions Yet</div>
                    <div style={{ color: '#A1A1AA', fontSize: 12, marginTop: 4 }}>
                      Students enrolled in this round have not submitted their assessments yet.
                    </div>
                  </div>
                ),
              }}
            />
          </div>

          {/* Action bar */}
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <Button style={btnPrimary} icon={<RocketOutlined />} onClick={advanceStudents}>
              Advance Students
            </Button>
            <Button style={btnGhost} onClick={releaseKey}>
              Release Result Key
            </Button>
          </div>
        </>
      )}

      {!resultsData && !loading && (
        <div style={{ ...glassCard, textAlign: 'center', padding: '48px 24px' }}>
          <BarChartOutlined style={{ fontSize: 40, color: theme.textMuted, marginBottom: 12 }} />
          <div style={{ color: theme.textSecondary, fontSize: 15 }}>Select a drive and round above to view results</div>
        </div>
      )}
      {loading && !resultsData && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Spin size="large" />
        </div>
      )}

      {/* ── Modal: Review Subjective Answer ─────────────────────── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EditOutlined style={{ color: '#3B82F6', fontSize: 18 }} />
            <span style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 16 }}>
              Subjective Question Evaluation
            </span>
          </div>
        }
        open={reviewModalOpen}
        onCancel={() => {
          reviewForm.resetFields();
          setReviewModalOpen(false);
          setReviewResult(null);
        }}
        footer={null}
        destroyOnClose
        width={460}
        styles={{
          header: { background: '#121216', borderBottom: '1px solid #27272A', padding: '16px 24px' },
          body: { background: '#121216', padding: '20px 24px' },
          content: { background: '#121216', border: '1px solid #27272A', borderRadius: 12, overflow: 'hidden' },
        }}
      >
        {reviewResult && (
          <div style={{
            backgroundColor: '#18181B',
            border: '1px solid #27272A',
            borderRadius: 8,
            padding: '12px 14px',
            marginBottom: 20,
            fontSize: 13,
            color: '#A1A1AA',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>Student: <strong style={{ color: '#FAFAFA' }}>#STU-{reviewResult.studentId}</strong></span>
            <span>MCQ Score: <strong style={{ color: '#60A5FA' }}>{reviewResult.mcqScore ?? 0} pts</strong></span>
          </div>
        )}

        <Form
          form={reviewForm}
          layout="vertical"
          onFinish={handleReviewSubmit}
          className="dark-form"
        >
          <Form.Item
            name="questionId"
            label="Subjective Question ID"
            rules={[{ required: true, message: 'Question ID is required' }]}
          >
            <InputNumber
              min={1}
              style={{ width: '100%' }}
              className="dark-input"
              placeholder="e.g. 1"
            />
          </Form.Item>

          <Form.Item
            name="marksAwarded"
            label="Marks Awarded"
            rules={[{ required: true, message: 'Marks awarded is required' }]}
          >
            <InputNumber
              min={0}
              max={100}
              step={0.5}
              style={{ width: '100%' }}
              className="dark-input"
              placeholder="e.g. 8.5"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Button
              style={{ ...btnPrimary, width: '100%', height: 42, justifyContent: 'center' }}
              htmlType="submit"
              loading={submittingReview}
            >
              Submit Evaluation Score
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
// SECTION 5 — SHORTLIST
// ═══════════════════════════════════════════════════════════════════
const ShortlistSection = () => {
  const [drives, setDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [selectedRoundId, setSelectedRoundId] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDrives = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/api/v1/drives');
      setDrives(res.data || []);
    } catch (e) {
      message.error('Failed to fetch drives');
    }
  }, []);

  useEffect(() => { fetchDrives(); }, [fetchDrives]);

  const fetchRounds = useCallback(async () => {
    if (!selectedDriveId) { setRounds([]); return; }
    try {
      const res = await axiosInstance.get(`/api/v1/drives/${selectedDriveId}/rounds`);
      setRounds(res.data || []);
    } catch (e) {
      message.error('Failed to fetch rounds');
    }
  }, [selectedDriveId]);

  useEffect(() => { fetchRounds(); }, [fetchRounds]);

  const fetchResults = useCallback(async () => {
    if (!selectedRoundId) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/v1/results/round/${selectedRoundId}`);
      const sorted = [...(res.data?.results || [])].sort((a, b) => b.totalScore - a.totalScore);
      setResults(sorted);
    } catch (e) {
      message.error('Failed to fetch results');
    } finally {
      setLoading(false);
    }
  }, [selectedRoundId]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  const handleDriveChange = (driveId) => {
    setSelectedDriveId(driveId);
    setSelectedRoundId(null);
    setResults([]);
  };

  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

  const columns = [
    {
      title: 'Rank', key: 'rank', width: 70,
      render: (_, __, idx) => (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: '50%',
          background: idx < 3 ? `${medalColors[idx]}22` : theme.surfaceHigh,
          border: idx < 3 ? `2px solid ${medalColors[idx]}` : `1px solid ${theme.border}`,
          color: idx < 3 ? medalColors[idx] : theme.textMuted,
          fontWeight: 800, fontSize: 13, fontFamily: theme.font,
        }}>
          {idx + 1}
        </div>
      ),
    },
    {
      title: 'Student ID', dataIndex: 'studentId', key: 'studentId', width: 110,
      render: (v) => <Text style={{ color: theme.textPrimary, fontFamily: 'monospace', fontSize: 12 }}>{v}</Text>,
    },
    {
      title: 'MCQ', dataIndex: 'mcqScore', key: 'mcqScore', width: 80,
      render: (v) => <Text style={{ color: theme.primary, fontWeight: 700 }}>{v}</Text>,
    },
    {
      title: 'Subjective', dataIndex: 'subjectiveScore', key: 'subjectiveScore', width: 110,
      render: (v) => <Text style={{ color: theme.warning, fontWeight: 700 }}>{v}</Text>,
    },
    {
      title: 'Total', dataIndex: 'totalScore', key: 'totalScore', width: 100,
      render: (v) => <Text style={{ color: theme.accent, fontWeight: 800, fontSize: 15 }}>{v}</Text>,
    },
    {
      title: 'Percentile', dataIndex: 'percentile', key: 'percentile', width: 100,
      render: (v) => <Text style={{ color: theme.textSecondary }}>{v != null ? v : '—'}</Text>,
    },
  ];

  return (
    <>
      <div style={sectionHeader}>
        <div>
          <div style={pageTitle}>
            <TrophyOutlined style={{ color: '#FFD700', marginRight: 10 }} />
            Candidate Shortlist
          </div>
          <div style={sectionSubtext}>Top-performing candidates ranked by total score</div>
        </div>
      </div>

      {/* Selectors */}
      <div style={{ ...cardStyle, marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: theme.textSecondary, fontWeight: 500, whiteSpace: 'nowrap' }}>Drive:</Text>
            <Select placeholder="Select Drive" value={selectedDriveId} onChange={handleDriveChange}
              style={{ width: 280 }} allowClear className="dark-select" popupClassName="dark-dropdown">
              {drives.map((d) => <Option key={d.id} value={d.id}>{d.id} — {d.title}</Option>)}
            </Select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: theme.textSecondary, fontWeight: 500, whiteSpace: 'nowrap' }}>Round:</Text>
            <Select placeholder="Select Round" value={selectedRoundId} onChange={(v) => setSelectedRoundId(v)}
              style={{ width: 280 }} allowClear disabled={!selectedDriveId}
              className="dark-select" popupClassName="dark-dropdown">
              {rounds.map((r) => <Option key={r.id} value={r.id}>{r.roundNumber ?? r.id} — {r.title}</Option>)}
            </Select>
          </div>
        </div>
      </div>

      {results.length > 0 ? (
        <div style={cardStyle}>
          <Table
            columns={columns} dataSource={results} rowKey="id" loading={loading}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            size="middle" className="dark-table"
          />
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <div style={{ ...glassCard, textAlign: 'center', padding: '48px 24px' }}>
          <TrophyOutlined style={{ fontSize: 40, color: theme.textMuted, marginBottom: 12 }} />
          <div style={{ color: theme.textSecondary, fontSize: 15 }}>Select a drive and round to view the shortlist</div>
        </div>
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════
const CompanyDashboard = () => {
  const { name, logout } = useAuth();
  const [activeSection, setActiveSection] = useState(SECTIONS.DRIVES);
  const [selectedDriveId, setSelectedDriveId] = useState(null);
  const [siderCollapsed, setSiderCollapsed] = useState(false);

  const handleManageRounds = (driveId) => {
    setSelectedDriveId(driveId);
    setActiveSection(SECTIONS.ROUNDS);
  };

  const renderSection = () => {
    switch (activeSection) {
      case SECTIONS.DRIVES:
        return <MyDrivesSection onManageRounds={handleManageRounds} />;
      case SECTIONS.QUESTIONS:
        return <QuestionBankSection />;
      case SECTIONS.ROUNDS:
        return <RoundsSection initialDriveId={selectedDriveId} />;
      case SECTIONS.RESULTS:
        return <ResultsSection />;
      case SECTIONS.SHORTLIST:
        return <ShortlistSection />;
      default:
        return null;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: theme.bg, fontFamily: theme.font }}>
      {/* ── Top Header ─────────────────────────────────────────── */}
      <Header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#09090B', padding: '0 28px', height: 60,
        borderBottom: '1px solid #27272A',
        zIndex: 100,
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'nowrap' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            backgroundColor: '#18181B', border: '1px solid #27272A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 18, color: '#3B82F6',
            userSelect: 'none',
          }}>
            R
          </div>
          <span style={{
            fontSize: 18, fontWeight: 700, color: '#FAFAFA',
            letterSpacing: '-0.02em',
          }}>
            Recruitr
          </span>
          <span style={{ color: '#71717A', fontSize: 16, userSelect: 'none', margin: '0 2px' }}>/</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: '3px 12px', borderRadius: 9999,
            fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
            backgroundColor: 'rgba(30, 58, 138, 0.5)',
            border: '1px solid #3B82F6',
            color: '#60A5FA',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            lineHeight: '16px',
            userSelect: 'none',
          }}>
            COMPANY ADMIN CONSOLE
          </span>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <NotificationBell />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#121216', border: '1px solid #27272A',
            borderRadius: 9999, padding: '4px 14px 4px 6px',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: '#3B82F6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 12,
            }}>
              {name ? name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#FAFAFA', fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{name || 'Corporate Partner'}</span>
              <span style={{ color: '#71717A', fontSize: 10, lineHeight: 1 }}>Company Admin</span>
            </div>
          </div>
          <Tooltip title="Sign out">
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={logout}
              style={{
                color: theme.textMuted,
                borderRadius: theme.radius,
                transition: theme.transition,
              }}
            />
          </Tooltip>
        </div>
      </Header>

      <Layout style={{ background: '#09090B' }}>
        {/* ── Left Sidebar ───────────────────────────────────── */}
        <Sider
          width={240}
          collapsible
          collapsed={siderCollapsed}
          onCollapse={(c) => setSiderCollapsed(c)}
          trigger={null}
          style={{
            background: '#09090B',
            borderRight: '1px solid #27272A',
            overflow: 'auto',
            height: 'calc(100vh - 60px)',
            position: 'sticky',
            top: 60,
            left: 0,
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ padding: '16px 0' }}>
            {!siderCollapsed && (
              <div style={{
                color: '#71717A', fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                padding: '0 20px 12px',
              }}>
                Hiring Suite
              </div>
            )}
            <ConfigProvider
              theme={{
                components: {
                  Menu: {
                    itemBg: 'transparent',
                    itemColor: '#A1A1AA',
                    itemHoverBg: '#18181B',
                    itemHoverColor: '#FAFAFA',
                    itemSelectedBg: 'rgba(30, 58, 138, 0.5)',
                    itemSelectedColor: '#FFFFFF',
                    itemBorderRadius: 9999,
                    itemMarginInline: 10,
                    itemHeight: 40,
                    activeBarBorderWidth: 0,
                    activeBarWidth: 0,
                    activeBarHeight: 0,
                  },
                },
              }}
            >
              <Menu
                className="company-sidebar-menu"
                mode="inline"
                selectedKeys={[activeSection]}
                onClick={({ key }) => setActiveSection(key)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                }}
                items={Object.entries(sectionMeta).map(([key, meta]) => ({
                  key,
                  icon: <span style={{ fontSize: 18 }}>{meta.icon}</span>,
                  label: <span style={{ fontWeight: 500, fontSize: 13 }}>{meta.label}</span>,
                }))}
              />
            </ConfigProvider>
          </div>

          {/* Bottom Settings & Collapse toggle */}
          <div style={{ borderTop: '1px solid #27272A', padding: '12px 16px' }}>
            <div
              onClick={() => setSiderCollapsed(!siderCollapsed)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: siderCollapsed ? 'center' : 'space-between',
                color: '#71717A', fontSize: 12, cursor: 'pointer',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#FAFAFA'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#71717A'; }}
            >
              {!siderCollapsed && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SettingOutlined style={{ fontSize: 15 }} />
                  Workspace Settings
                </span>
              )}
              <span>{siderCollapsed ? '›' : '‹ Collapse'}</span>
            </div>
          </div>
        </Sider>

        {/* ── Main Content ───────────────────────────────────── */}
        <Content style={{
          padding: 32, background: theme.bg, minHeight: 'calc(100vh - 60px)',
          overflowY: 'auto',
        }}>
          {/* Breadcrumb */}
          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: theme.textMuted, fontSize: 12 }}>Company Console</span>
            <span style={{ color: theme.textMuted, fontSize: 12 }}>›</span>
            <span style={{ color: theme.primary, fontSize: 12, fontWeight: 600 }}>
              {sectionMeta[activeSection]?.label}
            </span>
          </div>
          {renderSection()}
        </Content>
      </Layout>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* CSS OVERRIDES — Dark Theme for Ant Design Components  */}
      {/* ═══════════════════════════════════════════════════════ */}
      <style>{`
        /* ── Google Font ── */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        /* ── Sidebar Menu (Detached Rounded Pill Active State) ── */
        .company-sidebar-menu.ant-menu {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
        }
        .company-sidebar-menu .ant-menu-item {
          border: 1px solid transparent !important;
          margin-top: 4px !important;
          margin-bottom: 4px !important;
          color: #A1A1AA !important;
          border-radius: 9999px !important;
          transition: all 0.2s ease !important;
        }
        .company-sidebar-menu .ant-menu-item:hover {
          color: #FAFAFA !important;
          background-color: #18181B !important;
        }
        .company-sidebar-menu .ant-menu-item-selected {
          background-color: rgba(30, 58, 138, 0.5) !important;
          border: 1px solid rgba(59, 130, 246, 0.8) !important;
          color: #FFFFFF !important;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3) !important;
        }
        .company-sidebar-menu .ant-menu-item-selected .ant-menu-item-icon {
          color: #60A5FA !important;
        }
        .company-sidebar-menu .ant-menu-item-selected::after,
        .company-sidebar-menu .ant-menu-item-selected::before {
          display: none !important;
        }

        /* ── Table ── */
        .dark-table .ant-table {
          background: transparent !important;
          color: #FAFAFA !important;
          border: none !important;
        }
        .dark-table .ant-table-container {
          border: none !important;
        }
        .dark-table .ant-table-thead > tr > th {
          background: #121216 !important;
          color: #A1A1AA !important;
          border-bottom: 1px solid #27272A !important;
          border-right: none !important;
          font-size: 11px !important;
          font-weight: 500 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.06em !important;
          padding: 12px 16px !important;
        }
        .dark-table .ant-table-thead > tr > th::before {
          display: none !important;
        }
        .dark-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #27272A !important;
          border-right: none !important;
          padding: 12px 16px !important;
          color: #FAFAFA !important;
          background: transparent !important;
          transition: all 0.2s ease !important;
        }
        .dark-table .ant-table-tbody > tr:hover > td,
        .dark-table .ant-table-cell-row-hover {
          background: #18181B !important;
        }
        .dark-table .ant-table-tbody > tr.ant-table-row-selected > td {
          background: rgba(37, 99, 235, 0.10) !important;
        }
        .dark-table .ant-pagination .ant-pagination-item {
          background: #121216 !important;
          border-color: #27272A !important;
        }
        .dark-table .ant-pagination .ant-pagination-item a {
          color: #A1A1AA !important;
        }
        .dark-table .ant-pagination .ant-pagination-item-active {
          background: #2563EB !important;
          border-color: #2563EB !important;
        }
        .dark-table .ant-pagination .ant-pagination-item-active a {
          color: #fff !important;
        }
        .dark-table .ant-pagination .ant-pagination-prev button,
        .dark-table .ant-pagination .ant-pagination-next button {
          color: #A1A1AA !important;
        }
        .dark-table .ant-empty-description {
          color: #71717A !important;
        }
        .dark-table .ant-table-placeholder {
          background: transparent !important;
        }
        .dark-table .ant-table-bordered .ant-table-container {
          border: none !important;
        }

        /* ── Form Inputs ── */
        .dark-form .ant-form-item-label > label {
          color: #A1A1AA !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.04em !important;
        }
        .dark-input,
        .dark-input .ant-input,
        .dark-input .ant-input-number-input,
        .dark-form .ant-input,
        .dark-form .ant-input-number,
        .dark-form .ant-input-number-input {
          background: #121216 !important;
          border: 1px solid #27272A !important;
          color: #FAFAFA !important;
          border-radius: 6px !important;
        }
        .dark-input:focus,
        .dark-input .ant-input:focus,
        .dark-form .ant-input:focus,
        .dark-form .ant-input-number-focused {
          border-color: #2563EB !important;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15) !important;
        }
        .dark-input::placeholder,
        .dark-input .ant-input::placeholder,
        .dark-form .ant-input::placeholder {
          color: #71717A !important;
        }

        /* ── Select ── */
        .dark-select .ant-select-selector {
          background: #121216 !important;
          border: 1px solid #27272A !important;
          color: #FAFAFA !important;
          border-radius: 6px !important;
        }
        .dark-select .ant-select-selection-placeholder {
          color: #71717A !important;
        }
        .dark-select .ant-select-arrow {
          color: #71717A !important;
        }
        .dark-select .ant-select-clear {
          background: #121216 !important;
          color: #71717A !important;
        }
        .dark-dropdown {
          background: #121216 !important;
          border: 1px solid #27272A !important;
          border-radius: 6px !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4) !important;
        }
        .dark-dropdown .ant-select-item {
          color: #A1A1AA !important;
          border-radius: 4px !important;
        }
        .dark-dropdown .ant-select-item-option-active {
          background: #18181B !important;
        }
        .dark-dropdown .ant-select-item-option-selected {
          background: rgba(37, 99, 235, 0.10) !important;
          color: #2563EB !important;
          font-weight: 600 !important;
        }

        /* ── Checkbox ── */
        .ant-checkbox-inner {
          background: #121216 !important;
          border-color: #27272A !important;
        }
        .ant-checkbox-checked .ant-checkbox-inner {
          background: #2563EB !important;
          border-color: #2563EB !important;
        }

        /* ── Popconfirm ── */
        .ant-popover-inner,
        .ant-popconfirm-inner-content {
          background: #121216 !important;
          border: 1px solid #27272A !important;
          border-radius: 6px !important;
        }
        .ant-popconfirm-message-title {
          color: #FAFAFA !important;
        }
        .ant-popover-arrow::before,
        .ant-popover-arrow::after {
          background: #121216 !important;
        }

        /* ── Spin ── */
        .ant-spin-dot-item {
          background: #2563EB !important;
        }

        /* ── Message ── */
        .ant-message-notice-content {
          background: #121216 !important;
          border: 1px solid #27272A !important;
          color: #FAFAFA !important;
          border-radius: 6px !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4) !important;
        }

        /* ── Scrollbar ── */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #09090B;
        }
        ::-webkit-scrollbar-thumb {
          background: #27272A;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #71717A;
        }

        /* ── Sider trigger ── */
        .ant-layout-sider-trigger {
          background: #09090B !important;
          border-top: 1px solid #27272A !important;
          color: #71717A !important;
        }

        /* ── Tooltip ── */
        .ant-tooltip-inner {
          background: #121216 !important;
          color: #FAFAFA !important;
          border: 1px solid #27272A !important;
          border-radius: 6px !important;
          font-size: 12px !important;
        }
        .ant-tooltip-arrow::before {
          background: #121216 !important;
        }

        /* ── Modal ── */
        .ant-modal-mask {
          background: rgba(0,0,0,0.6) !important;
          backdrop-filter: blur(4px) !important;
        }
        .ant-modal-close {
          color: #71717A !important;
        }
        .ant-modal-close:hover {
          color: #FAFAFA !important;
        }

        /* ── Table Loading ── */
        .dark-table .ant-spin-nested-loading > div > .ant-spin .ant-spin-dot-item {
          background: #2563EB !important;
        }
      `}</style>
    </Layout>
  );
};

export default CompanyDashboard;
