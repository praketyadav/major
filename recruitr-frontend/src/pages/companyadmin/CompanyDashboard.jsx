import React from 'react';
import { Layout, Typography, Card, Button } from 'antd';
import { useAuth } from '../../auth/AuthContext';
import NotificationBell from '../../components/NotificationBell';

const { Header, Content } = Layout;
const { Title, Paragraph } = Typography;

const CompanyDashboard = () => {
  const { name, logout } = useAuth();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#001529', padding: '0 24px' }}>
        <Title level={3} style={{ color: '#fff', margin: 0 }}>Recruitr Company Dashboard</Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: '#fff' }}>
          <span>Welcome, {name}</span>
          <NotificationBell />
          <Button type="primary" danger onClick={logout}>Logout</Button>
        </div>
      </Header>
      <Content style={{ padding: 24 }}>
        <Card title="Drive & Question Management">
          <Paragraph>Create drives, configure assessment rounds, manage question banks, review subjective answers, and advance candidates.</Paragraph>
        </Card>
      </Content>
    </Layout>
  );
};

export default CompanyDashboard;
