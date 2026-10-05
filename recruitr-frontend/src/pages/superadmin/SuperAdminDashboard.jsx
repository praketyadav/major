import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table, Form, Input, InputNumber, Button,
  Alert, Tag, Space, Typography, Divider,
  Spin, Row, Col, Descriptions, Modal, Tabs,
  Dropdown, message, Tooltip, Select
} from 'antd';
import {
  DashboardOutlined, BankOutlined, ShopOutlined,
  UserOutlined, ReloadOutlined, SearchOutlined,
  StopOutlined, PlusOutlined, DownloadOutlined,
  CopyOutlined, CheckOutlined, LogoutOutlined,
  GlobalOutlined, CheckCircleOutlined,
  CloseCircleOutlined, TeamOutlined, KeyOutlined,
  SettingOutlined, SafetyCertificateOutlined
} from '@ant-design/icons';
import { useAuth } from '../../auth/AuthContext';
import NotificationBell from '../../components/NotificationBell';
import axiosInstance from '../../api/axiosInstance';

const { Title, Text } = Typography;
const { Option } = Select;

// ── Theme Design Tokens (Standardized to Company Console Design System) ─────
const THEME = {
  bgMain: '#09090B',
  surface: '#121216',
  surfaceLow: '#121216',
  surfaceContainer: '#18181B',
  surfaceHigh: '#18181B',
  border: '#27272A',
  borderLight: 'rgba(255, 255, 255, 0.06)',
  primary: '#3B82F6',
  primaryHover: '#2563EB',
  primaryGlow: 'rgba(59, 130, 246, 0.25)',
  secondary: '#10B981',
  secondaryGlow: 'rgba(16, 185, 129, 0.15)',
  danger: '#EF4444',
  dangerGlow: 'rgba(239, 68, 68, 0.15)',
  textPrimary: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
};

// ── Reusable Button Tokens (Standardized to Company Console) ─────
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

const SuperAdminDashboard = () => {
  const { name, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');

  // ── Overview State ──────────────────────────────────
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');

  // ── Colleges State ──────────────────────────────────
  const [collegeForm] = Form.useForm();
  const [collegeLoading, setCollegeLoading] = useState(false);
  const [collegeAlert, setCollegeAlert] = useState(null);
  const [collegeList, setCollegeList] = useState([]);
  const [collegeListLoading, setCollegeListLoading] = useState(false);

  // ── Companies State ─────────────────────────────────
  const [companyForm] = Form.useForm();
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyAlert, setCompanyAlert] = useState(null);
  const [companyList, setCompanyList] = useState([]);
  const [companyListLoading, setCompanyListLoading] = useState(false);

  // ── Accounts State ──────────────────────────────────
  const [userIdInput, setUserIdInput] = useState('');
  const [fetchedUser, setFetchedUser] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState('');
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const [accountAlert, setAccountAlert] = useState(null);

  // ── Directory Table UI State ────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);

  // ── Onboard Modal State ─────────────────────────────
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [onboardActiveTab, setOnboardActiveTab] = useState('college');
  const [modalCollegeForm] = Form.useForm();
  const [modalCompanyForm] = Form.useForm();
  const [modalLoading, setModalLoading] = useState(false);

  // ── Manage Entity Modal State ───────────────────────
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [isManageModalVisible, setIsManageModalVisible] = useState(false);
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

  // ── Fetch Analytics on Mount ────────────────────────
  useEffect(() => {
    fetchAnalytics();
    fetchCollegeList();
    fetchCompanyList();
  }, []);

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError('');
    try {
      const res = await axiosInstance.get('/api/v1/users/analytics');
      setAnalytics(res.data);
    } catch (err) {
      setAnalyticsError(
        err.response?.data?.error || 'Failed to fetch analytics'
      );
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // ── Fetch College Admins ────────────────────────────
  const fetchCollegeList = useCallback(async () => {
    setCollegeListLoading(true);
    try {
      const res = await axiosInstance.get('/api/v1/users?role=COLLEGE_ADMIN');
      setCollegeList(res.data || []);
    } catch (err) {
      message.error('Failed to fetch college admins');
    } finally {
      setCollegeListLoading(false);
    }
  }, []);

  // ── Fetch Company Admins ────────────────────────────
  const fetchCompanyList = useCallback(async () => {
    setCompanyListLoading(true);
    try {
      const res = await axiosInstance.get('/api/v1/users?role=COMPANY_ADMIN');
      setCompanyList(res.data || []);
    } catch (err) {
      message.error('Failed to fetch company admins');
    } finally {
      setCompanyListLoading(false);
    }
  }, []);

  // ── Fetch tables when switching to their tabs ───────
  useEffect(() => {
    if (activeSection === 'colleges') {
      fetchCollegeList();
    } else if (activeSection === 'companies') {
      fetchCompanyList();
    }
  }, [activeSection, fetchCollegeList, fetchCompanyList]);

  // ── Register College Admin ──────────────────────────
  const handleCollegeSubmit = async (values) => {
    setCollegeLoading(true);
    setCollegeAlert(null);
    try {
      await axiosInstance.post('/api/v1/auth/register', {
        sapId: values.sapId,
        name: values.name,
        email: values.email,
        password: values.password,
        role: 'COLLEGE_ADMIN',
        collegeId: values.collegeId,
      });
      setCollegeAlert({
        type: 'success',
        message: 'College Admin registered successfully!',
      });
      message.success('College Admin registered successfully!');
      collegeForm.resetFields();
      fetchCollegeList();
      fetchAnalytics();
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Registration failed.';
      setCollegeAlert({
        type: 'error',
        message: errorMsg,
      });
      message.error(errorMsg);
    } finally {
      setCollegeLoading(false);
    }
  };

  // ── Register Company Admin ──────────────────────────
  const handleCompanySubmit = async (values) => {
    setCompanyLoading(true);
    setCompanyAlert(null);
    try {
      await axiosInstance.post('/api/v1/auth/register', {
        sapId: values.sapId,
        name: values.name,
        email: values.email,
        password: values.password,
        role: 'COMPANY_ADMIN',
        companyId: values.companyId,
      });
      setCompanyAlert({
        type: 'success',
        message: 'Company Admin registered successfully!',
      });
      message.success('Company Admin registered successfully!');
      companyForm.resetFields();
      fetchCompanyList();
      fetchAnalytics();
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Registration failed.';
      setCompanyAlert({
        type: 'error',
        message: errorMsg,
      });
      message.error(errorMsg);
    } finally {
      setCompanyLoading(false);
    }
  };

  // ── Modal Onboard Handler (College) ─────────────────
  const handleModalOnboard = async () => {
    try {
      const values = await modalCollegeForm.validateFields();
      setModalLoading(true);
      await axiosInstance.post('/api/v1/auth/register', {
        sapId: values.sapId,
        name: values.name,
        email: values.email,
        password: values.password,
        role: 'COLLEGE_ADMIN',
        collegeId: values.collegeId,
      });
      message.success('Institution Admin successfully registered!');
      modalCollegeForm.resetFields();
      setIsOnboardModalOpen(false);
      fetchCollegeList();
      fetchAnalytics();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.error || err.response?.data?.message || 'Registration failed');
    } finally {
      setModalLoading(false);
    }
  };

  // ── Modal Onboard Handler (Company) ─────────────────
  const handleModalCompanyOnboard = async () => {
    try {
      const values = await modalCompanyForm.validateFields();
      setModalLoading(true);
      await axiosInstance.post('/api/v1/auth/register', {
        sapId: values.sapId,
        name: values.name,
        email: values.email,
        password: values.password,
        role: 'COMPANY_ADMIN',
        companyId: values.companyId,
      });
      message.success('Corporate Partner Admin successfully registered!');
      modalCompanyForm.resetFields();
      setIsOnboardModalOpen(false);
      fetchCompanyList();
      fetchAnalytics();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.error || err.response?.data?.message || 'Registration failed');
    } finally {
      setModalLoading(false);
    }
  };

  // ── Manage Entity Handlers ─────────────────────────
  const handleOpenManageModal = (record) => {
    setSelectedEntity(record);
    setIsManageModalVisible(true);
    setIsResetPasswordOpen(false);
    setNewPasswordInput('');
  };

  const handleCloseManageModal = () => {
    setIsManageModalVisible(false);
    setSelectedEntity(null);
    setIsResetPasswordOpen(false);
    setNewPasswordInput('');
  };

  const handleToggleStatus = async () => {
    if (!selectedEntity) return;
    setStatusActionLoading(true);
    const newStatus = !selectedEntity.active;
    try {
      if (!newStatus) {
        await axiosInstance.patch(`/api/v1/users/${selectedEntity.id}/deactivate`);
        message.success(`Account for ${selectedEntity.name} deactivated successfully.`);
      } else {
        await axiosInstance.patch(`/api/v1/users/${selectedEntity.id}/reactivate`);
        message.success(`Account for ${selectedEntity.name} reactivated successfully.`);
      }
      setSelectedEntity((prev) => (prev ? { ...prev, active: newStatus } : null));
      fetchCollegeList();
      fetchCompanyList();
      fetchAnalytics();
    } catch (err) {
      message.error(err.response?.data?.error || err.response?.data?.message || 'Failed to update account status');
    } finally {
      setStatusActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPasswordInput || !newPasswordInput.trim()) {
      message.warning('Please enter a new temporary password');
      return;
    }
    if (newPasswordInput.trim().length < 6) {
      message.warning('Password must be at least 6 characters long');
      return;
    }
    setResetPasswordLoading(true);
    try {
      await axiosInstance.patch(`/api/v1/users/${selectedEntity.id}/password`, {
        password: newPasswordInput.trim(),
      });
      message.success(`Temporary password successfully set for ${selectedEntity.name}!`);
      setIsResetPasswordOpen(false);
      setNewPasswordInput('');
    } catch (err) {
      message.error(err.response?.data?.error || err.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let generated = 'Rct@';
    for (let i = 0; i < 8; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPasswordInput(generated);
  };

  // ── Fetch User by ID ───────────────────────────────
  const handleFetchUser = async () => {
    if (!userIdInput) return;
    setUserLoading(true);
    setUserError('');
    setFetchedUser(null);
    setAccountAlert(null);
    try {
      const res = await axiosInstance.get(`/api/v1/users/${userIdInput}`);
      setFetchedUser(res.data);
    } catch (err) {
      setUserError(err.response?.data?.error || 'User not found.');
    } finally {
      setUserLoading(false);
    }
  };

  // ── Deactivate User ────────────────────────────────
  const handleDeactivate = async () => {
    if (!fetchedUser) return;
    setDeactivateLoading(true);
    setAccountAlert(null);
    try {
      await axiosInstance.patch(`/api/v1/users/${fetchedUser.id}/deactivate`);
      setAccountAlert({
        type: 'success',
        message: 'Account deactivated successfully.',
      });
      message.success('Account deactivated successfully.');
      const res = await axiosInstance.get(`/api/v1/users/${fetchedUser.id}`);
      setFetchedUser(res.data);
      fetchCollegeList();
      fetchCompanyList();
      fetchAnalytics();
    } catch (err) {
      setAccountAlert({
        type: 'error',
        message: err.response?.data?.error || 'Deactivation failed.',
      });
      message.error('Deactivation failed.');
    } finally {
      setDeactivateLoading(false);
    }
  };

  // ── Quick Copy Helper ──────────────────────────────
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    message.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Combined Directory Data for Overview Table ─────
  const combinedEntities = useMemo(() => {
    const colleges = (collegeList || []).map(item => ({
      ...item,
      category: 'COLLEGE',
      formattedId: `COL-${item.collegeId ?? item.id}`,
    }));
    const companies = (companyList || []).map(item => ({
      ...item,
      category: 'COMPANY',
      formattedId: `CMP-${item.companyId ?? item.id}`,
    }));
    return [...colleges, ...companies];
  }, [collegeList, companyList]);

  // ── Filtered Entities ──────────────────────────────
  const filteredEntities = useMemo(() => {
    return combinedEntities.filter(item => {
      // Category filter
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false;
      }
      // Status filter
      if (statusFilter === 'ACTIVE' && !item.active) return false;
      if (statusFilter === 'INACTIVE' && item.active) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = item.name?.toLowerCase().includes(q);
        const emailMatch = item.email?.toLowerCase().includes(q);
        const sapMatch = String(item.sapId || '').toLowerCase().includes(q);
        const idMatch = String(item.formattedId || '').toLowerCase().includes(q);
        return nameMatch || emailMatch || sapMatch || idMatch;
      }
      return true;
    });
  }, [combinedEntities, categoryFilter, statusFilter, searchQuery]);

  // ── CSV Export Function ────────────────────────────
  const handleExportCSV = () => {
    if (!filteredEntities.length) {
      message.warning('No data available to export');
      return;
    }
    const headers = ['Entity ID', 'Name', 'Category', 'Primary Admin Email', 'SAP ID', 'Status', 'Date Registered'];
    const rows = filteredEntities.map(e => [
      `"${e.formattedId}"`,
      `"${e.name || ''}"`,
      `"${e.category}"`,
      `"${e.email || ''}"`,
      `"${e.sapId || ''}"`,
      `"${e.active ? 'Active' : 'Inactive'}"`,
      `"${e.createdAt ? new Date(e.createdAt).toLocaleDateString() : ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `recruitr-tenants-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('Directory exported to CSV successfully');
  };

  // ── Overview Table Columns ─────────────────────────
  const directoryColumns = [
    {
      title: 'ENTITY ID',
      dataIndex: 'formattedId',
      key: 'formattedId',
      width: 130,
      render: (val) => (
        <span style={{ fontFamily: 'monospace', fontSize: 13, color: THEME.primary, fontWeight: 600 }}>
          {val}
        </span>
      ),
    },
    {
      title: 'ORGANIZATION NAME',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              backgroundColor: record.category === 'COLLEGE' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: record.category === 'COLLEGE' ? THEME.primary : THEME.secondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 14,
              border: `1px solid ${record.category === 'COLLEGE' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            }}
          >
            {name ? name.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: THEME.textPrimary, fontSize: 14 }}>
              {name || 'Unnamed Entity'}
            </div>
            <div style={{ fontSize: 12, color: THEME.textMuted }}>
              SAP: {record.sapId || '—'}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'CATEGORY',
      dataIndex: 'category',
      key: 'category',
      width: 140,
      render: (cat) => (
        cat === 'COLLEGE' ? (
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.04em',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              color: '#60A5FA',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <BankOutlined style={{ fontSize: 12 }} /> COLLEGE
          </span>
        ) : (
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.04em',
              backgroundColor: 'rgba(78, 222, 163, 0.12)',
              color: THEME.secondary,
              border: '1px solid rgba(78, 222, 163, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <ShopOutlined style={{ fontSize: 12 }} /> COMPANY
          </span>
        )
      ),
    },
    {
      title: 'PRIMARY ADMIN',
      dataIndex: 'email',
      key: 'email',
      render: (email, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: THEME.textSecondary, fontSize: 13 }}>{email}</span>
          <Tooltip title={copiedId === record.id ? 'Copied!' : 'Copy Email'}>
            <Button
              type="text"
              size="small"
              icon={copiedId === record.id ? <CheckOutlined style={{ color: THEME.secondary }} /> : <CopyOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(email, record.id);
              }}
              style={{ color: THEME.textMuted, padding: '0 4px', height: 24 }}
            />
          </Tooltip>
        </div>
      ),
    },
    {
      title: 'STATUS',
      dataIndex: 'active',
      key: 'active',
      width: 120,
      render: (active) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 10px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            backgroundColor: active ? 'rgba(78, 222, 163, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: active ? THEME.secondary : THEME.danger,
            border: `1px solid ${active ? 'rgba(78, 222, 163, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: active ? THEME.secondary : THEME.danger,
              boxShadow: active ? '0 0 6px rgba(78,222,163,0.8)' : 'none',
            }}
          />
          {active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: 'ONBOARDED',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (val) => (
        <span style={{ color: THEME.textMuted, fontSize: 13 }}>
          {val ? new Date(val).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric',
          }) : '—'}
        </span>
      ),
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      width: 110,
      render: (_, record) => (
        <Button
          size="small"
          onClick={() => handleOpenManageModal(record)}
          style={{
            ...btnGhost,
            height: 30,
            padding: '0 12px',
            fontSize: 12,
          }}
        >
          Manage
        </Button>
      ),
    },
  ];

  // ── College Sub-View Columns ───────────────────────
  const collegeColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      sorter: (a, b) => a.id - b.id,
      render: (id) => <span style={{ color: THEME.textMuted }}>#{id}</span>,
    },
    {
      title: 'INSTITUTION NAME',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <span style={{ fontWeight: 600, color: THEME.textPrimary }}>{name}</span>,
    },
    {
      title: 'PRIMARY EMAIL',
      dataIndex: 'email',
      key: 'email',
      render: (email) => <span style={{ color: THEME.textSecondary }}>{email}</span>,
    },
    {
      title: 'SAP ID',
      dataIndex: 'sapId',
      key: 'sapId',
      width: 130,
      render: (sapId) => <span style={{ fontFamily: 'monospace', color: THEME.textMuted }}>{sapId}</span>,
    },
    {
      title: 'COLLEGE ID',
      dataIndex: 'collegeId',
      key: 'collegeId',
      width: 120,
      render: (val) => (
        <span style={{ fontFamily: 'monospace', color: THEME.primary, fontWeight: 600 }}>
          {val ? `COL-${val}` : '—'}
        </span>
      ),
    },
    {
      title: 'STATUS',
      dataIndex: 'active',
      key: 'active',
      width: 110,
      render: (active) => (
        <Tag color={active ? 'success' : 'error'} style={{ borderRadius: 4 }}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'DATE REGISTERED',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (val) => (
        <span style={{ color: THEME.textMuted }}>
          {val ? new Date(val).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric',
          }) : '—'}
        </span>
      ),
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      width: 110,
      render: (_, record) => (
        <Button
          size="small"
          onClick={() =>
            handleOpenManageModal({
              ...record,
              category: 'COLLEGE',
              formattedId: `COL-${record.collegeId ?? record.id}`,
            })
          }
          style={{
            ...btnGhost,
            height: 30,
            padding: '0 12px',
            fontSize: 12,
          }}
        >
          Manage
        </Button>
      ),
    },
  ];

  // ── Company Sub-View Columns ───────────────────────
  const companyColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      sorter: (a, b) => a.id - b.id,
      render: (id) => <span style={{ color: THEME.textMuted }}>#{id}</span>,
    },
    {
      title: 'COMPANY NAME',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <span style={{ fontWeight: 600, color: THEME.textPrimary }}>{name}</span>,
    },
    {
      title: 'PRIMARY EMAIL',
      dataIndex: 'email',
      key: 'email',
      render: (email) => <span style={{ color: THEME.textSecondary }}>{email}</span>,
    },
    {
      title: 'SAP ID',
      dataIndex: 'sapId',
      key: 'sapId',
      width: 130,
      render: (sapId) => <span style={{ fontFamily: 'monospace', color: THEME.textMuted }}>{sapId}</span>,
    },
    {
      title: 'COMPANY ID',
      dataIndex: 'companyId',
      key: 'companyId',
      width: 120,
      render: (val) => (
        <span style={{ fontFamily: 'monospace', color: THEME.secondary, fontWeight: 600 }}>
          {val ? `CMP-${val}` : '—'}
        </span>
      ),
    },
    {
      title: 'STATUS',
      dataIndex: 'active',
      key: 'active',
      width: 110,
      render: (active) => (
        <Tag color={active ? 'success' : 'error'} style={{ borderRadius: 4 }}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'DATE REGISTERED',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (val) => (
        <span style={{ color: THEME.textMuted }}>
          {val ? new Date(val).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric',
          }) : '—'}
        </span>
      ),
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      width: 110,
      render: (_, record) => (
        <Button
          size="small"
          onClick={() =>
            handleOpenManageModal({
              ...record,
              category: 'COMPANY',
              formattedId: `CMP-${record.companyId ?? record.id}`,
            })
          }
          style={{
            ...btnGhost,
            height: 30,
            padding: '0 12px',
            fontSize: 12,
          }}
        >
          Manage
        </Button>
      ),
    },
  ];

  // ── Registration Form Component ───────────────────
  const renderRegistrationForm = (config) => {
    const {
      form, loading, alert, onSubmit,
      idLabel, idField, idPlaceholder, title, subtitle,
    } = config;

    return (
      <div
        style={{
          background: THEME.surfaceLow,
          borderRadius: 12,
          border: `1px solid ${THEME.border}`,
          padding: 24,
          maxWidth: 580,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: THEME.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {title}
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: THEME.textSecondary }}>
            {subtitle}
          </p>
        </div>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            showIcon
            closable
            style={{
              marginBottom: 20,
              backgroundColor: alert.type === 'success' ? 'rgba(78, 222, 163, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              borderColor: alert.type === 'success' ? 'rgba(78, 222, 163, 0.3)' : 'rgba(239, 68, 68, 0.3)',
              color: alert.type === 'success' ? THEME.secondary : THEME.danger,
            }}
            onClose={() => {
              if (idField === 'collegeId') setCollegeAlert(null);
              else setCompanyAlert(null);
            }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={onSubmit}
          autoComplete="off"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<span style={{ color: THEME.textSecondary, fontWeight: 500, fontSize: 13 }}>SAP ID</span>}
                name="sapId"
                rules={[{ required: true, message: 'SAP ID is required' }]}
              >
                <Input
                  placeholder="e.g. 50012345"
                  className="recruitr-dark-input"
                  style={{
                    backgroundColor: THEME.surface,
                    borderColor: THEME.border,
                    color: THEME.textPrimary,
                    borderRadius: 8,
                    height: 40,
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span style={{ color: THEME.textSecondary, fontWeight: 500, fontSize: 13 }}>{idLabel}</span>}
                name={idField}
                rules={[{ required: true, message: `${idLabel} is required` }]}
              >
                <InputNumber
                  placeholder={idPlaceholder}
                  style={{
                    width: '100%',
                    backgroundColor: THEME.surface,
                    borderColor: THEME.border,
                    color: THEME.textPrimary,
                    borderRadius: 8,
                    height: 40,
                  }}
                  min={1}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={<span style={{ color: THEME.textSecondary, fontWeight: 500, fontSize: 13 }}>Full Name / Contact</span>}
            name="name"
            rules={[{ required: true, message: 'Full Name is required' }]}
          >
            <Input
              placeholder="e.g. Dr. Rajesh Sharma"
              style={{
                backgroundColor: THEME.surface,
                borderColor: THEME.border,
                color: THEME.textPrimary,
                borderRadius: 8,
                height: 40,
              }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ color: THEME.textSecondary, fontWeight: 500, fontSize: 13 }}>Primary Admin Email</span>}
            name="email"
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Enter a valid email address' },
            ]}
          >
            <Input
              placeholder="admin@institution.edu"
              style={{
                backgroundColor: THEME.surface,
                borderColor: THEME.border,
                color: THEME.textPrimary,
                borderRadius: 8,
                height: 40,
              }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ color: THEME.textSecondary, fontWeight: 500, fontSize: 13 }}>Temporary Master Password</span>}
            name="password"
            rules={[{ required: true, message: 'Password is required' }]}
          >
            <Input.Password
              placeholder="••••••••••••"
              style={{
                backgroundColor: THEME.surface,
                borderColor: THEME.border,
                color: THEME.textPrimary,
                borderRadius: 8,
                height: 40,
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 12 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{
                backgroundColor: THEME.primary,
                borderColor: THEME.primary,
                borderRadius: 8,
                fontWeight: 600,
                height: 44,
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
              }}
            >
              Provision Administrator Account
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  };

  // ── Overview Section Renderer ───────────────────────
  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Telemetry / Page Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 800,
                color: THEME.textPrimary,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                letterSpacing: '-0.02em',
              }}
            >
              Platform Overview
            </h1>
            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 4,
                fontWeight: 700,
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: THEME.primary,
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              MULTI-TENANT
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: THEME.textSecondary }}>
            Global system telemetry, active tenant metrics, and institutional directories.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            icon={<ReloadOutlined spin={analyticsLoading} />}
            onClick={() => {
              fetchAnalytics();
              fetchCollegeList();
              fetchCompanyList();
              message.success('Refreshed telemetry data');
            }}
            loading={analyticsLoading}
            style={{
              ...btnGhost,
              height: 40,
            }}
          >
            Refresh Telemetry
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsOnboardModalOpen(true)}
            style={{
              ...btnPrimary,
              height: 40,
            }}
          >
            Onboard Institution / Enterprise
          </Button>
        </div>
      </div>

      {analyticsError && (
        <Alert
          type="error"
          message={analyticsError}
          showIcon
          closable
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            color: THEME.danger,
            borderRadius: 8,
          }}
          onClose={() => setAnalyticsError('')}
        />
      )}

      {/* 3 Metric Cards Grid */}
      <Row gutter={[16, 16]}>
        {/* Metric 1: Colleges */}
        <Col xs={24} md={8}>
          <div
            onClick={() => setActiveSection('colleges')}
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 12,
              backgroundColor: '#121216',
              border: `1px solid ${THEME.border}`,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = THEME.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = THEME.border;
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#A1A1AA', textTransform: 'uppercase' }}>
                TOTAL COLLEGES
              </span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: THEME.primary,
                }}
              >
                <BankOutlined style={{ fontSize: 16 }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 32, fontWeight: 700, color: '#FAFAFA', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {analyticsLoading && !analytics ? <Spin size="small" /> : (analytics?.totalColleges ?? 0)}
              </span>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#71717A' }}>
                {(analytics?.totalColleges ?? 0) > 0 ? `${analytics.totalColleges} Campuses` : 'Campuses'}
              </span>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.4), transparent)' }} />
          </div>
        </Col>

        {/* Metric 2: Companies */}
        <Col xs={24} md={8}>
          <div
            onClick={() => setActiveSection('companies')}
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 12,
              backgroundColor: '#121216',
              border: `1px solid ${THEME.border}`,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = THEME.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = THEME.border;
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#A1A1AA', textTransform: 'uppercase' }}>
                TOTAL COMPANIES
              </span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: THEME.secondary,
                }}
              >
                <ShopOutlined style={{ fontSize: 16 }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 32, fontWeight: 700, color: '#FAFAFA', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {analyticsLoading && !analytics ? <Spin size="small" /> : (analytics?.totalCompanies ?? 0)}
              </span>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#71717A' }}>
                {(analytics?.totalCompanies ?? 0) > 0 ? `${analytics.totalCompanies} Partners` : 'Partners'}
              </span>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.4), transparent)' }} />
          </div>
        </Col>

        {/* Metric 3: Students */}
        <Col xs={24} md={8}>
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 12,
              backgroundColor: '#121216',
              border: `1px solid ${THEME.border}`,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#A1A1AA', textTransform: 'uppercase' }}>
                TOTAL STUDENTS
              </span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: 'rgba(168, 85, 247, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#c084fc',
                }}
              >
                <TeamOutlined style={{ fontSize: 16 }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 32, fontWeight: 700, color: '#FAFAFA', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {analyticsLoading && !analytics ? <Spin size="small" /> : (analytics?.totalStudents ?? 0)}
              </span>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#71717A' }}>
                {(analytics?.totalStudents ?? 0) > 0 ? `${analytics.totalStudents} Candidates` : 'Candidates'}
              </span>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.4), transparent)' }} />
          </div>
        </Col>
      </Row>

      {/* Directory & Tenancy Table Section */}
      <div
        style={{
          background: '#121216',
          borderRadius: 12,
          border: `1px solid ${THEME.border}`,
          padding: 24,
        }}
      >
        {/* Table Header & Controls Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  color: THEME.textPrimary,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                Directory &amp; Tenancy Management
              </h2>
              <span
                style={{
                  fontSize: 12,
                  padding: '2px 8px',
                  borderRadius: 12,
                  backgroundColor: THEME.surfaceContainer,
                  color: THEME.textSecondary,
                  border: `1px solid ${THEME.border}`,
                  fontWeight: 600,
                }}
              >
                {filteredEntities.length} entities
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: THEME.textMuted }}>
              Real-time audit directory of verified institutional accounts and active corporate tenants.
            </p>
          </div>

          {/* Export CSV Button */}
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportCSV}
            style={{
              ...btnGhost,
              height: 38,
            }}
          >
            Export Directory
          </Button>
        </div>

        {/* Filter / Search Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'center',
            marginBottom: 20,
            padding: 12,
            backgroundColor: '#09090B',
            borderRadius: 8,
            border: `1px solid ${THEME.border}`,
          }}
        >
          {/* Search Box */}
          <Input
            placeholder="Search by name, email, or tenant ID..."
            prefix={<SearchOutlined style={{ color: THEME.textMuted, marginRight: 6 }} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: '1 1 260px',
              backgroundColor: THEME.surfaceContainer,
              borderColor: THEME.border,
              color: THEME.textPrimary,
              borderRadius: 6,
              height: 36,
            }}
            allowClear
          />

          {/* Category Filter */}
          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 150 }}
            className="recruitr-dark-select"
          >
            <Option value="ALL">All Categories</Option>
            <Option value="COLLEGE">Colleges Only</Option>
            <Option value="COMPANY">Companies Only</Option>
          </Select>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 140 }}
            className="recruitr-dark-select"
          >
            <Option value="ALL">All Status</Option>
            <Option value="ACTIVE">Active Only</Option>
            <Option value="INACTIVE">Inactive Only</Option>
          </Select>
        </div>

        {/* The Directory Table */}
        <div className="recruitr-dark-table-container">
          <Table
            columns={directoryColumns}
            dataSource={filteredEntities}
            rowKey={(r) => `${r.category}-${r.id}`}
            loading={collegeListLoading || companyListLoading}
            pagination={{
              pageSize: 8,
              showSizeChanger: true,
              pageSizeOptions: ['8', '16', '32'],
              showTotal: (total) => `Showing ${total} tenant records`,
            }}
            size="middle"
            scroll={{ x: 800 }}
          />
        </div>
      </div>
    </div>
  );

  // ── Colleges Section Renderer ───────────────────────
  const renderColleges = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 800,
              color: THEME.textPrimary,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            Institutional Colleges
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 14, color: THEME.textSecondary }}>
            Registered universities and colleges with active placement cells.
          </p>
        </div>
        <Button
          icon={<ReloadOutlined spin={collegeListLoading} />}
          onClick={fetchCollegeList}
          loading={collegeListLoading}
          style={{
            backgroundColor: THEME.surfaceLow,
            borderColor: THEME.border,
            color: THEME.textPrimary,
            borderRadius: 8,
            height: 38,
          }}
        >
          Refresh List
        </Button>
      </div>

      <div
        style={{
          background: THEME.surfaceLow,
          borderRadius: 12,
          border: `1px solid ${THEME.border}`,
          padding: 24,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div className="recruitr-dark-table-container">
          <Table
            columns={collegeColumns}
            dataSource={collegeList}
            rowKey="id"
            loading={collegeListLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} college administrator(s)`,
            }}
            size="middle"
            scroll={{ x: 800 }}
          />
        </div>
      </div>

      {renderRegistrationForm({
        form: collegeForm,
        loading: collegeLoading,
        alert: collegeAlert,
        onSubmit: handleCollegeSubmit,
        idLabel: 'College ID',
        idField: 'collegeId',
        idPlaceholder: 'e.g. 101',
        title: 'Provision College Admin',
        subtitle: 'Issue root credential authority to a designated university dean or campus placement head.',
      })}
    </div>
  );

  // ── Companies Section Renderer ──────────────────────
  const renderCompanies = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 800,
              color: THEME.textPrimary,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            Corporate Partners
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 14, color: THEME.textSecondary }}>
            Registered enterprises and companies actively running recruitment drives.
          </p>
        </div>
        <Button
          icon={<ReloadOutlined spin={companyListLoading} />}
          onClick={fetchCompanyList}
          loading={companyListLoading}
          style={{
            backgroundColor: THEME.surfaceLow,
            borderColor: THEME.border,
            color: THEME.textPrimary,
            borderRadius: 8,
            height: 38,
          }}
        >
          Refresh List
        </Button>
      </div>

      <div
        style={{
          background: THEME.surfaceLow,
          borderRadius: 12,
          border: `1px solid ${THEME.border}`,
          padding: 24,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div className="recruitr-dark-table-container">
          <Table
            columns={companyColumns}
            dataSource={companyList}
            rowKey="id"
            loading={companyListLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} corporate partner(s)`,
            }}
            size="middle"
            scroll={{ x: 800 }}
          />
        </div>
      </div>

      {renderRegistrationForm({
        form: companyForm,
        loading: companyLoading,
        alert: companyAlert,
        onSubmit: handleCompanySubmit,
        idLabel: 'Company ID',
        idField: 'companyId',
        idPlaceholder: 'e.g. 201',
        title: 'Provision Company Admin',
        subtitle: 'Authorize designated corporate talent acquisition leads to publish job openings and drive examinations.',
      })}
    </div>
  );

  // ── Accounts Section Renderer ───────────────────────
  const renderAccounts = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 800,
            color: THEME.textPrimary,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}
        >
          Account Audit &amp; Deactivation
        </h1>
        <p style={{ margin: '4px 0 0 0', fontSize: 14, color: THEME.textSecondary }}>
          Audit any user across the global tenancy and revoke authentication permissions when necessary.
        </p>
      </div>

      {accountAlert && (
        <Alert
          type={accountAlert.type}
          message={accountAlert.message}
          showIcon
          closable
          style={{
            backgroundColor: accountAlert.type === 'success' ? 'rgba(78, 222, 163, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderColor: accountAlert.type === 'success' ? 'rgba(78, 222, 163, 0.3)' : 'rgba(239, 68, 68, 0.3)',
            color: accountAlert.type === 'success' ? THEME.secondary : THEME.danger,
            borderRadius: 8,
          }}
          onClose={() => setAccountAlert(null)}
        />
      )}

      {/* Search Input Box */}
      <div
        style={{
          background: THEME.surfaceLow,
          borderRadius: 12,
          border: `1px solid ${THEME.border}`,
          padding: 24,
          maxWidth: 640,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: THEME.textPrimary, marginBottom: 12 }}>
          Look Up User by Primary ID
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <InputNumber
            placeholder="Enter Numeric User ID (e.g. 1)"
            value={userIdInput}
            onChange={(val) => setUserIdInput(val)}
            style={{
              flex: 1,
              backgroundColor: THEME.surface,
              borderColor: THEME.border,
              color: THEME.textPrimary,
              borderRadius: 8,
              height: 42,
            }}
            min={1}
            onPressEnter={handleFetchUser}
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleFetchUser}
            loading={userLoading}
            style={{
              backgroundColor: THEME.primary,
              borderColor: THEME.primary,
              borderRadius: 8,
              height: 42,
              fontWeight: 600,
              padding: '0 20px',
            }}
          >
            Audit User
          </Button>
        </div>
      </div>

      {userError && (
        <Alert
          type="error"
          message={userError}
          showIcon
          closable
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            color: THEME.danger,
            borderRadius: 8,
            maxWidth: 640,
          }}
          onClose={() => setUserError('')}
        />
      )}

      {userLoading && !fetchedUser && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" />
        </div>
      )}

      {fetchedUser && (
        <div
          style={{
            background: THEME.surfaceLow,
            borderRadius: 12,
            border: `1px solid ${THEME.border}`,
            padding: 24,
            maxWidth: 640,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: `1px solid ${THEME.border}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  color: THEME.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 700,
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
              >
                {fetchedUser.name ? fetchedUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: THEME.textPrimary }}>
                  {fetchedUser.name}
                </div>
                <div style={{ fontSize: 12, color: THEME.textMuted }}>
                  User Record #{fetchedUser.id}
                </div>
              </div>
            </div>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: fetchedUser.active ? 'rgba(78, 222, 163, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                color: fetchedUser.active ? THEME.secondary : THEME.danger,
                border: `1px solid ${fetchedUser.active ? 'rgba(78, 222, 163, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              }}
            >
              {fetchedUser.active ? 'Active Account' : 'Deactivated'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 4 }}>EMAIL ADDRESS</div>
              <div style={{ fontSize: 14, color: THEME.textPrimary, fontWeight: 500 }}>{fetchedUser.email}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 4 }}>SAP ID</div>
              <div style={{ fontSize: 14, color: THEME.textPrimary, fontFamily: 'monospace' }}>{fetchedUser.sapId}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 4 }}>ASSIGNED ROLE</div>
              <div>
                <Tag color="blue" style={{ borderRadius: 4, fontWeight: 600 }}>{fetchedUser.role}</Tag>
              </div>
            </div>
            {fetchedUser.collegeId && (
              <div>
                <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 4 }}>COLLEGE ID</div>
                <div style={{ fontSize: 14, color: THEME.primary, fontWeight: 600, fontFamily: 'monospace' }}>
                  COL-{fetchedUser.collegeId}
                </div>
              </div>
            )}
            {fetchedUser.companyId && (
              <div>
                <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 4 }}>COMPANY ID</div>
                <div style={{ fontSize: 14, color: THEME.secondary, fontWeight: 600, fontFamily: 'monospace' }}>
                  CMP-{fetchedUser.companyId}
                </div>
              </div>
            )}
          </div>

          {fetchedUser.active ? (
            <Button
              type="primary"
              danger
              icon={<StopOutlined />}
              onClick={handleDeactivate}
              loading={deactivateLoading}
              style={{
                borderRadius: 8,
                height: 42,
                fontWeight: 600,
                width: '100%',
                backgroundColor: THEME.danger,
                borderColor: THEME.danger,
              }}
            >
              Deactivate User Access
            </Button>
          ) : (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: THEME.danger,
                fontSize: 13,
                textAlign: 'center',
                fontWeight: 500,
              }}
            >
              This account has been revoked and cannot authenticate.
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ── Main Content Router ─────────────────────────────
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverview();
      case 'colleges':
        return renderColleges();
      case 'companies':
        return renderCompanies();
      case 'accounts':
        return renderAccounts();
      default:
        return renderOverview();
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: THEME.bgMain,
        color: THEME.textPrimary,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Dynamic Style Injection for Dark Mode & AntD Overrides */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus Jakarta Sans:wght@600;700;800&display=swap');

        /* Scrollbar styles */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #09090B;
        }
        ::-webkit-scrollbar-thumb {
          background: #27272A;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #424656;
        }

        /* ── Ant Design Dark Table Overrides (Mapped to Company Console) ── */
        .dark-table .ant-table,
        .recruitr-dark-table-container .ant-table {
          background: transparent !important;
          color: #FAFAFA !important;
          border: none !important;
        }
        .dark-table .ant-table-container,
        .recruitr-dark-table-container .ant-table-container {
          border: none !important;
        }
        .dark-table .ant-table-thead > tr > th,
        .recruitr-dark-table-container .ant-table-thead > tr > th {
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
        .dark-table .ant-table-thead > tr > th::before,
        .recruitr-dark-table-container .ant-table-thead > tr > th::before {
          display: none !important;
        }
        .dark-table .ant-table-tbody > tr > td,
        .recruitr-dark-table-container .ant-table-tbody > tr > td {
          border-bottom: 1px solid #27272A !important;
          border-right: none !important;
          padding: 12px 16px !important;
          color: #FAFAFA !important;
          background: transparent !important;
          transition: all 0.2s ease !important;
        }
        .dark-table .ant-table-tbody > tr:hover > td,
        .dark-table .ant-table-cell-row-hover,
        .recruitr-dark-table-container .ant-table-tbody > tr:hover > td,
        .recruitr-dark-table-container .ant-table-cell-row-hover {
          background: #18181B !important;
        }
        .dark-table .ant-table-tbody > tr.ant-table-row-selected > td,
        .recruitr-dark-table-container .ant-table-tbody > tr.ant-table-row-selected > td {
          background: rgba(37, 99, 235, 0.10) !important;
        }
        .dark-table .ant-pagination,
        .recruitr-dark-table-container .ant-pagination {
          color: #A1A1AA !important;
          margin-top: 16px !important;
        }
        .dark-table .ant-pagination .ant-pagination-item,
        .recruitr-dark-table-container .ant-pagination .ant-pagination-item {
          background: #121216 !important;
          border-color: #27272A !important;
        }
        .dark-table .ant-pagination .ant-pagination-item a,
        .recruitr-dark-table-container .ant-pagination .ant-pagination-item a {
          color: #A1A1AA !important;
        }
        .dark-table .ant-pagination .ant-pagination-item-active,
        .recruitr-dark-table-container .ant-pagination .ant-pagination-item-active {
          background: #2563EB !important;
          border-color: #2563EB !important;
        }
        .dark-table .ant-pagination .ant-pagination-item-active a,
        .recruitr-dark-table-container .ant-pagination .ant-pagination-item-active a {
          color: #fff !important;
        }
        .dark-table .ant-pagination .ant-pagination-prev button,
        .dark-table .ant-pagination .ant-pagination-next button,
        .recruitr-dark-table-container .ant-pagination .ant-pagination-prev button,
        .recruitr-dark-table-container .ant-pagination .ant-pagination-next button,
        .recruitr-dark-table-container .ant-pagination .ant-pagination-prev .ant-pagination-item-link,
        .recruitr-dark-table-container .ant-pagination .ant-pagination-next .ant-pagination-item-link {
          background: #121216 !important;
          border-color: #27272A !important;
          color: #A1A1AA !important;
        }
        .dark-table .ant-empty-description,
        .recruitr-dark-table-container .ant-empty-description {
          color: #71717A !important;
        }
        .dark-table .ant-table-placeholder,
        .recruitr-dark-table-container .ant-table-placeholder {
          background: transparent !important;
        }
        .dark-table .ant-table-bordered .ant-table-container,
        .recruitr-dark-table-container .ant-table-bordered .ant-table-container {
          border: none !important;
        }

        /* Select dropdown dark overrides */
        .recruitr-dark-select .ant-select-selector {
          background-color: #121216 !important;
          border-color: #27272A !important;
          color: #FAFAFA !important;
          border-radius: 6px !important;
          height: 36px !important;
          align-items: center !important;
        }
        .ant-select-dropdown {
          background-color: #121216 !important;
          border: 1px solid #27272A !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5) !important;
        }
        .ant-select-item {
          color: #A1A1AA !important;
        }
        .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
          background-color: rgba(59, 130, 246, 0.2) !important;
          color: #3B82F6 !important;
        }
        .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
          background-color: #18181B !important;
        }

        /* Input Number dark overrides */
        .ant-input-number {
          background-color: #121216 !important;
          border-color: #27272A !important;
          color: #FAFAFA !important;
        }
        .ant-input-number-input {
          color: #FAFAFA !important;
        }
        .ant-input-number-handler-wrap {
          background: #18181B !important;
        }
      `}</style>

      {/* ── Fixed Top Header (Stitch Design) ────────── */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          backgroundColor: '#09090B',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${THEME.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          zIndex: 100,
        }}
      >
        {/* Left Side: Brand Logo + Product Wordmark + Console Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* 32x32 Rounded Dark Square with Electric Blue 'R' */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: '#18181B',
              border: '1px solid #27272A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
            }}
          >
            <span
              style={{
                color: THEME.primary,
                fontSize: 19,
                fontWeight: 900,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                lineHeight: 1,
              }}
            >
              R
            </span>
          </div>

          {/* Recruitr Title */}
          <span
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: THEME.textPrimary,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            Recruitr
          </span>

          {/* Divider */}
          <span style={{ color: '#424656', fontSize: 16 }}>/</span>

          {/* Console Tag */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3px 12px',
              borderRadius: 9999,
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              backgroundColor: 'rgba(30, 58, 138, 0.5)',
              border: '1px solid #3B82F6',
              color: '#60A5FA',
              whiteSpace: 'nowrap',
              lineHeight: '16px',
              userSelect: 'none',
            }}
          >
            SUPER ADMIN CONSOLE
          </span>
        </div>

        {/* Right Side: Notification Bell, Profile Pill, Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Notification Bell Component */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <NotificationBell />
          </div>

          {/* Vertical Divider */}
          <div style={{ width: 1, height: 24, backgroundColor: THEME.border }} />

          {/* User Profile Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '4px 12px 4px 6px',
              borderRadius: 999,
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${THEME.border}`,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: THEME.primary,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {name ? name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: THEME.textPrimary, lineHeight: 1.2 }}>
                {name || 'Super Admin'}
              </span>
              <span style={{ fontSize: 10, color: THEME.textMuted, lineHeight: 1 }}>
                Root Access
              </span>
            </div>
          </div>

          {/* Vertical Divider */}
          <div style={{ width: 1, height: 24, backgroundColor: THEME.border }} />

          {/* Logout Button */}
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={logout}
            style={{
              color: THEME.textSecondary,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              height: 34,
              padding: '0 12px',
              borderRadius: 6,
              border: `1px solid ${THEME.border}`,
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = THEME.danger;
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = THEME.textSecondary;
              e.currentTarget.style.borderColor = THEME.border;
            }}
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* ── Fixed Left Sidebar (Stitch Design) ───────── */}
      <aside
        style={{
          position: 'fixed',
          top: 64,
          left: 0,
          bottom: 0,
          width: 260,
          backgroundColor: '#09090B',
          borderRight: `1px solid ${THEME.border}`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '20px 16px',
          zIndex: 90,
        }}
      >
        <div>
          {/* Section Category Title */}
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: THEME.textMuted,
              textTransform: 'uppercase',
              padding: '0 12px 12px',
            }}
          >
            Main Navigation
          </div>

          {/* Nav Items List */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { key: 'overview', label: 'Overview', icon: <DashboardOutlined /> },
              { key: 'colleges', label: 'Colleges', icon: <BankOutlined /> },
              { key: 'companies', label: 'Companies', icon: <ShopOutlined /> },
              { key: 'accounts', label: 'User Accounts', icon: <UserOutlined /> },
            ].map((item) => {
              const isActive = activeSection === item.key;
              return (
                <div
                  key={item.key}
                  onClick={() => setActiveSection(item.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 16px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 500,
                    transition: 'all 0.15s ease',
                    backgroundColor: isActive ? 'rgba(30, 58, 138, 0.5)' : 'transparent',
                    color: isActive ? '#ffffff' : THEME.textSecondary,
                    borderLeft: isActive ? `3px solid ${THEME.primary}` : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.color = '#ffffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = THEME.textSecondary;
                    }
                  }}
                >
                  <span style={{ fontSize: 16, color: isActive ? THEME.primary : THEME.textMuted }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
              );
            })}
          </nav>
        </div>

      </aside>

      {/* ── Main Content Container ──────────────────── */}
      <main
        style={{
          marginLeft: 260,
          marginTop: 64,
          minHeight: 'calc(100vh - 64px)',
          padding: 32,
          maxWidth: 1400,
        }}
      >
        {renderActiveSection()}
      </main>

      {/* ── Modal: Onboard New Institution / Enterprise ─── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: THEME.primary, fontSize: 18 }}>
              <BankOutlined />
            </span>
            <span style={{ color: THEME.textPrimary, fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Onboard New Institution / Enterprise
            </span>
          </div>
        }
        open={isOnboardModalOpen}
        onCancel={() => {
          setIsOnboardModalOpen(false);
          setOnboardActiveTab('college');
          modalCollegeForm.resetFields();
          modalCompanyForm.resetFields();
        }}
        footer={null}
        width={600}
        styles={{
          content: {
            backgroundColor: THEME.surfaceLow,
            border: `1px solid ${THEME.border}`,
            borderRadius: 12,
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
          },
          header: {
            backgroundColor: THEME.surfaceLow,
            borderBottom: `1px solid ${THEME.border}`,
            paddingBottom: 16,
          },
        }}
      >
        <Tabs
          activeKey={onboardActiveTab}
          onChange={(key) => setOnboardActiveTab(key)}
          style={{ marginTop: 4 }}
          items={[
            {
              key: 'college',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: onboardActiveTab === 'college' ? THEME.primary : THEME.textMuted }}>
                  <BankOutlined /> College Campus
                </span>
              ),
              children: (
                <Form
                  form={modalCollegeForm}
                  layout="vertical"
                  onFinish={handleModalOnboard}
                  style={{ marginTop: 8 }}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label={<span style={{ color: THEME.textSecondary, fontSize: 13 }}>SAP ID</span>}
                        name="sapId"
                        rules={[{ required: true, message: 'SAP ID is required' }]}
                      >
                        <Input
                          placeholder="e.g. 500123"
                          style={{ backgroundColor: THEME.surface, borderColor: THEME.border, color: THEME.textPrimary, borderRadius: 6 }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={<span style={{ color: THEME.textSecondary, fontSize: 13 }}>College ID</span>}
                        name="collegeId"
                        rules={[{ required: true, message: 'College ID is required' }]}
                      >
                        <InputNumber
                          placeholder="e.g. 101"
                          style={{ width: '100%', backgroundColor: THEME.surface, borderColor: THEME.border, color: THEME.textPrimary, borderRadius: 6 }}
                          min={1}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    label={<span style={{ color: THEME.textSecondary, fontSize: 13 }}>College / University Name</span>}
                    name="name"
                    rules={[{ required: true, message: 'Name is required' }]}
                  >
                    <Input
                      placeholder="e.g. Stanford University"
                      style={{ backgroundColor: THEME.surface, borderColor: THEME.border, color: THEME.textPrimary, borderRadius: 6 }}
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span style={{ color: THEME.textSecondary, fontSize: 13 }}>Primary Administrator Email</span>}
                    name="email"
                    rules={[{ required: true, message: 'Email is required' }, { type: 'email' }]}
                  >
                    <Input
                      placeholder="dean@stanford.edu"
                      style={{ backgroundColor: THEME.surface, borderColor: THEME.border, color: THEME.textPrimary, borderRadius: 6 }}
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span style={{ color: THEME.textSecondary, fontSize: 13 }}>Initial Temporary Password</span>}
                    name="password"
                    rules={[{ required: true, message: 'Password is required' }]}
                  >
                    <Input.Password
                      placeholder="••••••••••••"
                      style={{ backgroundColor: THEME.surface, borderColor: THEME.border, color: THEME.textPrimary, borderRadius: 6 }}
                    />
                  </Form.Item>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                    <Button
                      onClick={() => setIsOnboardModalOpen(false)}
                      style={{ backgroundColor: 'transparent', borderColor: THEME.border, color: THEME.textSecondary }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={modalLoading}
                      style={{ backgroundColor: THEME.primary, borderColor: THEME.primary, fontWeight: 600 }}
                    >
                      Provision Institution
                    </Button>
                  </div>
                </Form>
              ),
            },
            {
              key: 'company',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: onboardActiveTab === 'company' ? THEME.secondary : THEME.textMuted }}>
                  <ShopOutlined /> Corporate Partner
                </span>
              ),
              children: (
                <Form
                  form={modalCompanyForm}
                  layout="vertical"
                  onFinish={handleModalCompanyOnboard}
                  style={{ marginTop: 8 }}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label={<span style={{ color: THEME.textSecondary, fontSize: 13 }}>SAP ID</span>}
                        name="sapId"
                        rules={[{ required: true, message: 'SAP ID is required' }]}
                      >
                        <Input
                          placeholder="e.g. 600200"
                          style={{ backgroundColor: THEME.surface, borderColor: THEME.border, color: THEME.textPrimary, borderRadius: 6 }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={<span style={{ color: THEME.textSecondary, fontSize: 13 }}>Company ID</span>}
                        name="companyId"
                        rules={[{ required: true, message: 'Company ID is required' }]}
                      >
                        <InputNumber
                          placeholder="e.g. 201"
                          style={{ width: '100%', backgroundColor: THEME.surface, borderColor: THEME.border, color: THEME.textPrimary, borderRadius: 6 }}
                          min={1}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    label={<span style={{ color: THEME.textSecondary, fontSize: 13 }}>Company / Corporate Name</span>}
                    name="name"
                    rules={[{ required: true, message: 'Company name is required' }]}
                  >
                    <Input
                      placeholder="e.g. Xebia Technologies"
                      style={{ backgroundColor: THEME.surface, borderColor: THEME.border, color: THEME.textPrimary, borderRadius: 6 }}
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span style={{ color: THEME.textSecondary, fontSize: 13 }}>Talent Partner Email</span>}
                    name="email"
                    rules={[{ required: true, message: 'Email is required' }, { type: 'email' }]}
                  >
                    <Input
                      placeholder="talent@xebia.com"
                      style={{ backgroundColor: THEME.surface, borderColor: THEME.border, color: THEME.textPrimary, borderRadius: 6 }}
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span style={{ color: THEME.textSecondary, fontSize: 13 }}>Initial Temporary Password</span>}
                    name="password"
                    rules={[{ required: true, message: 'Password is required' }]}
                  >
                    <Input.Password
                      placeholder="••••••••••••"
                      style={{ backgroundColor: THEME.surface, borderColor: THEME.border, color: THEME.textPrimary, borderRadius: 6 }}
                    />
                  </Form.Item>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                    <Button
                      onClick={() => setIsOnboardModalOpen(false)}
                      style={{ backgroundColor: 'transparent', borderColor: THEME.border, color: THEME.textSecondary }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={modalLoading}
                      style={{
                        backgroundColor: THEME.secondary,
                        borderColor: THEME.secondary,
                        fontWeight: 600,
                        color: '#09090B',
                        boxShadow: `0 4px 14px ${THEME.secondaryGlow}`,
                      }}
                    >
                      Provision Corporate Partner
                    </Button>
                  </div>
                </Form>
              ),
            },
          ]}
        />
      </Modal>

      {/* ── Modal: Manage Tenant ────────────────────── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '92%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: THEME.primary, fontSize: 18 }}>
                <SettingOutlined />
              </span>
              <span style={{ color: THEME.textPrimary, fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Manage Tenant: {selectedEntity?.name || 'Entity'}
              </span>
            </div>
            {selectedEntity && (
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontWeight: 700,
                  backgroundColor: selectedEntity.category === 'COLLEGE' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: selectedEntity.category === 'COLLEGE' ? THEME.primary : THEME.secondary,
                  border: `1px solid ${selectedEntity.category === 'COLLEGE' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                }}
              >
                {selectedEntity.formattedId || (selectedEntity.category === 'COLLEGE' ? `COL-${selectedEntity.collegeId ?? selectedEntity.id}` : `CMP-${selectedEntity.companyId ?? selectedEntity.id}`)}
              </span>
            )}
          </div>
        }
        open={isManageModalVisible}
        onCancel={handleCloseManageModal}
        footer={[
          <Button
            key="close"
            onClick={handleCloseManageModal}
            style={{ backgroundColor: THEME.surfaceContainer, borderColor: THEME.border, color: THEME.textPrimary, borderRadius: 6 }}
          >
            Close
          </Button>
        ]}
        width={680}
        styles={{
          content: {
            backgroundColor: THEME.surfaceLow,
            border: `1px solid ${THEME.border}`,
            borderRadius: 12,
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
          },
          header: {
            backgroundColor: THEME.surfaceLow,
            borderBottom: `1px solid ${THEME.border}`,
            paddingBottom: 16,
          },
          footer: {
            backgroundColor: THEME.surfaceLow,
            borderTop: `1px solid ${THEME.border}`,
            paddingTop: 14,
          },
        }}
      >
        {selectedEntity && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 16 }}>
            {/* Quick Stats / Audit Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div
                style={{
                  backgroundColor: THEME.surface,
                  border: `1px solid ${THEME.border}`,
                  borderRadius: 8,
                  padding: '12px 14px',
                }}
              >
                <div style={{ fontSize: 11, color: THEME.textMuted, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                  TENANCY ROLE
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: THEME.textPrimary, marginTop: 4 }}>
                  {selectedEntity.category === 'COLLEGE' ? 'Campus Admin' : 'Corporate Recruiter'}
                </div>
              </div>
              <div
                style={{
                  backgroundColor: THEME.surface,
                  border: `1px solid ${THEME.border}`,
                  borderRadius: 8,
                  padding: '12px 14px',
                }}
              >
                <div style={{ fontSize: 11, color: THEME.textMuted, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                  ASSOCIATION CODE
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: THEME.primary, fontFamily: 'monospace', marginTop: 4 }}>
                  {selectedEntity.category === 'COLLEGE' ? `College #${selectedEntity.collegeId ?? '—'}` : `Company #${selectedEntity.companyId ?? '—'}`}
                </div>
              </div>
              <div
                style={{
                  backgroundColor: THEME.surface,
                  border: `1px solid ${THEME.border}`,
                  borderRadius: 8,
                  padding: '12px 14px',
                }}
              >
                <div style={{ fontSize: 11, color: THEME.textMuted, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                  SYSTEM STATUS
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: selectedEntity.active ? THEME.secondary : THEME.danger,
                    marginTop: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: selectedEntity.active ? THEME.secondary : THEME.danger,
                    }}
                  />
                  {selectedEntity.active ? 'Operational' : 'Access Revoked'}
                </div>
              </div>
            </div>

            {/* Overview & Profile Details */}
            <div
              style={{
                backgroundColor: THEME.surface,
                border: `1px solid ${THEME.border}`,
                borderRadius: 8,
                padding: '16px 18px',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: THEME.textPrimary, marginBottom: 14 }}>
                Profile &amp; Credential Attributes
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px 20px' }}>
                <div>
                  <div style={{ fontSize: 11, color: THEME.textMuted }}>ORGANIZATION NAME</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: THEME.textPrimary, marginTop: 2 }}>
                    {selectedEntity.name || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: THEME.textMuted }}>PRIMARY ADMIN EMAIL</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: 13, color: THEME.textSecondary }}>{selectedEntity.email || '—'}</span>
                    {selectedEntity.email && (
                      <Tooltip title="Copy Email">
                        <Button
                          type="text"
                          size="small"
                          icon={<CopyOutlined />}
                          onClick={() => handleCopy(selectedEntity.email, 'modal-email')}
                          style={{ color: THEME.textMuted, padding: '0 4px', height: 20 }}
                        />
                      </Tooltip>
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: THEME.textMuted }}>SAP IDENTIFIER</div>
                  <div style={{ fontSize: 13, fontFamily: 'monospace', color: THEME.textPrimary, marginTop: 2 }}>
                    {selectedEntity.sapId || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: THEME.textMuted }}>REGISTRATION DATE</div>
                  <div style={{ fontSize: 13, color: THEME.textSecondary, marginTop: 2 }}>
                    {selectedEntity.createdAt ? new Date(selectedEntity.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    }) : '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Status Control (Deactivate / Reactivate) */}
            <div
              style={{
                backgroundColor: THEME.surface,
                border: `1px solid ${THEME.border}`,
                borderRadius: 8,
                padding: '16px 18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: THEME.textPrimary }}>
                    Account Status Control
                  </div>
                  <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 2 }}>
                    {selectedEntity.active
                      ? 'Access is currently active. Deactivation immediately invalidates tenant JWT tokens.'
                      : 'Access is currently suspended. Reactivation immediately restores authentication rights.'}
                  </div>
                </div>
                {selectedEntity.active ? (
                  <Button
                    type="primary"
                    danger
                    icon={<StopOutlined />}
                    loading={statusActionLoading}
                    onClick={handleToggleStatus}
                    style={{ borderRadius: 6, fontWeight: 600 }}
                  >
                    Deactivate Account
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    loading={statusActionLoading}
                    onClick={handleToggleStatus}
                    style={{
                      borderRadius: 6,
                      fontWeight: 600,
                      backgroundColor: THEME.secondary,
                      borderColor: THEME.secondary,
                      color: '#000',
                    }}
                  >
                    Reactivate Account
                  </Button>
                )}
              </div>
            </div>

            {/* Security & Credentials (Reset Password) */}
            <div
              style={{
                backgroundColor: THEME.surface,
                border: `1px solid ${THEME.border}`,
                borderRadius: 8,
                padding: '16px 18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isResetPasswordOpen ? 14 : 0 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: THEME.textPrimary }}>
                    Security &amp; Credentials
                  </div>
                  <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 2 }}>
                    Issue a temporary administrator credential if the tenant head is locked out.
                  </div>
                </div>
                {!isResetPasswordOpen && (
                  <Button
                    icon={<KeyOutlined />}
                    onClick={() => setIsResetPasswordOpen(true)}
                    style={{
                      backgroundColor: THEME.surfaceContainer,
                      borderColor: THEME.border,
                      color: THEME.textPrimary,
                      borderRadius: 6,
                      fontWeight: 500,
                    }}
                  >
                    Reset Admin Password
                  </Button>
                )}
              </div>

              {isResetPasswordOpen && (
                <div
                  style={{
                    backgroundColor: THEME.surfaceLow,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 6,
                    padding: 14,
                  }}
                >
                  <div style={{ fontSize: 12, color: THEME.textSecondary, marginBottom: 8 }}>
                    Enter New Temporary Master Password:
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                    <Input.Password
                      placeholder="Enter minimum 6 characters..."
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      style={{
                        backgroundColor: THEME.surface,
                        borderColor: THEME.border,
                        color: THEME.textPrimary,
                        borderRadius: 6,
                        height: 38,
                      }}
                    />
                    <Button
                      onClick={handleGenerateRandomPassword}
                      style={{
                        backgroundColor: THEME.surfaceContainer,
                        borderColor: THEME.border,
                        color: THEME.textSecondary,
                        borderRadius: 6,
                        height: 38,
                        fontSize: 12,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Auto-Generate
                    </Button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <Button
                      size="small"
                      onClick={() => {
                        setIsResetPasswordOpen(false);
                        setNewPasswordInput('');
                      }}
                      style={{ backgroundColor: 'transparent', borderColor: THEME.border, color: THEME.textMuted }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      size="small"
                      loading={resetPasswordLoading}
                      onClick={handleResetPassword}
                      style={{ backgroundColor: THEME.primary, borderColor: THEME.primary, fontWeight: 600 }}
                    >
                      Issue &amp; Update Password
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SuperAdminDashboard;
