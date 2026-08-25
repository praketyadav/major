import React, { useEffect, useState } from 'react';
import { Badge, Dropdown, List, Typography } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../auth/AuthContext';

const NotificationBell = () => {
  const { userId } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    if (!userId) return;
    try {
      const res = await axiosInstance.get(`/api/v1/notifications/${userId}`);
      setNotifications(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  const markRead = async (id) => {
    try {
      await axiosInstance.patch(`/api/v1/notifications/${id}/read`);
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const menu = (
    <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 3px 6px -4px rgba(0,0,0,0.12), 0 6px 16px 0 rgba(0,0,0,0.08)', width: 320, maxHeight: 400, overflowY: 'auto' }}>
      <Typography.Title level={5} style={{ margin: 0, marginBottom: 8 }}>Notifications</Typography.Title>
      <List
        dataSource={notifications}
        renderItem={(item) => (
          <List.Item
            onClick={() => markRead(item.id)}
            style={{
              cursor: 'pointer',
              background: item.read ? '#fff' : '#e6f7ff',
              padding: 8,
              borderRadius: 4,
              marginBottom: 4,
            }}
          >
            <List.Item.Meta
              title={<span style={{ fontWeight: item.read ? 'normal' : 'bold' }}>{item.title}</span>}
              description={item.message}
            />
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <Dropdown overlay={menu} trigger={['click']}>
      <Badge count={unreadCount} overflowCount={99}>
        <BellOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
      </Badge>
    </Dropdown>
  );
};

export default NotificationBell;
