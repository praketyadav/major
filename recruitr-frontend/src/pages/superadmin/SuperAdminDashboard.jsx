import React, { useState, useEffect, useCallback } from 'react';
import {
  Layout, Typography, Card, Button, Row, Col, Statistic,
  Spin, message, Tooltip, Badge, Tabs
} from 'antd';
import {
  BankOutlined, ShopOutlined, TeamOutlined, ReloadOutlined,
  LogoutOutlined, ArrowUpOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../auth/AuthContext';
import NotificationBell from '../../components/NotificationBell';
import axiosInstance from '../../api/axiosInstance';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const SuperAdminDashboard = () => {
  const { name, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalColleges: 0,
    totalCompanies: 0,
    totalStudents: 0,
  });

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/v1/users/analytics');
      setAnalytics(res.data);
    } catch (err) {
      message.error('Failed to load system metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <Layout style={{ minHeight: '100vh', background: '#09090B' }}>
      <Header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#09090B', borderBottom: '1px solid #27272A', padding: '0 24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Title level={4} style={{ color: '#FAFAFA', margin: 0 }}>Recruitr</Title>
          <span style={{ color: '#71717A' }}>/</span>
          <span style={{
            background: 'rgba(30, 58, 138, 0.5)', border: '1px solid #3B82F6',
            color: '#60A5FA', padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 600
          }}>
            SUPER ADMIN
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <NotificationBell />
          <Button type="primary" danger onClick={logout} icon={<LogoutOutlined />}>Logout</Button>
        </div>
      </Header>
      <Content style={{ padding: 32 }}>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ color: '#FAFAFA', margin: 0 }}>System Overview</Title>
            <Text style={{ color: '#A1A1AA' }}>Interactive metrics and platform health</Text>
          </div>
          <Button icon={<ReloadOutlined />} onClick={fetchAnalytics} loading={loading}>Refresh</Button>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} sm={8}>
            <Card style={{ background: '#121216', border: '1px solid #27272A', borderRadius: 8 }}>
              <Statistic
                title={<span style={{ color: '#A1A1AA' }}>Total Colleges</span>}
                value={analytics.totalColleges}
                prefix={<BankOutlined style={{ color: '#3B82F6', marginRight: 8 }} />}
                valueStyle={{ color: '#FAFAFA', fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ background: '#121216', border: '1px solid #27272A', borderRadius: 8 }}>
              <Statistic
                title={<span style={{ color: '#A1A1AA' }}>Total Companies</span>}
                value={analytics.totalCompanies}
                prefix={<ShopOutlined style={{ color: '#10B981', marginRight: 8 }} />}
                valueStyle={{ color: '#FAFAFA', fontWeight: 700 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ background: '#121216', border: '1px solid #27272A', borderRadius: 8 }}>
              <Statistic
                title={<span style={{ color: '#A1A1AA' }}>Total Students</span>}
                value={analytics.totalStudents}
                prefix={<TeamOutlined style={{ color: '#F59E0B', marginRight: 8 }} />}
                valueStyle={{ color: '#FAFAFA', fontWeight: 700 }}
              />
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default SuperAdminDashboard;
