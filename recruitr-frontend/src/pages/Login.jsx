import React, { useState } from 'react';
import { Card, Form, Input, Button, Alert, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../auth/AuthContext';

const { Title, Text } = Typography;

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
      setErrorMsg('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1890ff 0%, #001529 100%)'
    }}>
      <Card style={{ width: 400, borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>Recruitr</Title>
          <Text type="secondary">UPES Campus Placement Mock Assessment Platform</Text>
        </div>

        {errorMsg && (
          <Alert message={errorMsg} type="error" showIcon style={{ marginBottom: 16 }} />
        )}

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: 'Please enter your email' }]}
          >
            <Input size="large" placeholder="user@domain.com" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password size="large" placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              Log In
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
