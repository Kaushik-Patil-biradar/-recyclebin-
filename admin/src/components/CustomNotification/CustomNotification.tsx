import React from 'react';
import { Flex, Box, Typography, Button } from '@strapi/design-system';
import { Trash, ArrowClockwise, WarningCircle, Information } from '@strapi/icons';

export type NotificationType =
  | 'deleted'
  | 'restore'
  | 'error'
  | 'warning'
  | 'info'
  | 'success'
  | 'danger';

export interface CustomNotificationProps {
  type: NotificationType;
  title?: string;
  message: string;
  detail?: string;
}

export interface ConfirmDeleteNotificationProps {
  id: number;
  title?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const getNotificationConfig = (type: NotificationType) => {
  switch (type) {
    case 'deleted':
      return {
        defaultTitle: 'Snapshot Permanently Deleted',
        icon: <Trash width={16} height={16} />,
        iconBg: '#FCEBEA',
        iconColor: '#D02B20',
      };
    case 'danger':
    case 'error':
      return {
        defaultTitle: 'Action Failed',
        icon: <WarningCircle width={16} height={16} />,
        iconBg: '#FDF4F4',
        iconColor: '#EE5E52',
      };
    case 'restore':
    case 'success':
      return {
        defaultTitle: 'Item Restored Successfully',
        icon: <ArrowClockwise width={16} height={16} />,
        iconBg: '#EAFBE7',
        iconColor: '#2F7C31',
      };
    case 'warning':
      return {
        defaultTitle: 'Warning',
        icon: <WarningCircle width={16} height={16} />,
        iconBg: '#FFF7ED',
        iconColor: '#F29D41',
      };
    case 'info':
    default:
      return {
        defaultTitle: 'Recycle Bin Notice',
        icon: <Information width={16} height={16} />,
        iconBg: '#F0F0FF',
        iconColor: '#4945FF',
      };
  }
};

export const CustomNotification: React.FC<CustomNotificationProps> = ({
  type,
  title,
  message,
  detail,
}) => {
  const config = getNotificationConfig(type);
  const displayTitle = title || config.defaultTitle;

  return (
    <Flex alignItems="flex-start" gap={3} style={{ width: '100%' }}>
      <Box
        style={{
          backgroundColor: config.iconBg,
          color: config.iconColor,
          borderRadius: '50%',
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {config.icon}
      </Box>
      <Flex direction="column" alignItems="flex-start" gap={1} style={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="omega"
          fontWeight="bold"
          style={{ lineHeight: 1.2, wordBreak: 'break-word' }}
        >
          {displayTitle}
        </Typography>
        <Typography
          variant="pi"
          textColor="neutral600"
          style={{ lineHeight: 1.3, wordBreak: 'break-word' }}
        >
          {message}
        </Typography>
        {detail && (
          <Box
            paddingTop={1}
            paddingBottom={1}
            paddingLeft={2}
            paddingRight={2}
            marginTop={1}
            background="neutral150"
            hasRadius
          >
            <Typography variant="sigma" textColor="neutral700">
              {detail}
            </Typography>
          </Box>
        )}
      </Flex>
    </Flex>
  );
};

export const ConfirmDeleteNotification: React.FC<ConfirmDeleteNotificationProps> = ({
  id,
  title,
  onConfirm,
  onCancel,
}) => {
  return (
    <Flex direction="column" alignItems="stretch" gap={3} style={{ width: '100%' }}>
      <Flex alignItems="flex-start" gap={3}>
        <Box
          style={{
            backgroundColor: '#FCEBEA',
            color: '#D02B20',
            borderRadius: '50%',
            width: 34,
            height: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Trash width={16} height={16} />
        </Box>
        <Flex direction="column" alignItems="flex-start" gap={1} style={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="omega"
            fontWeight="bold"
            style={{ lineHeight: 1.2, wordBreak: 'break-word' }}
          >
            Confirm Permanent Deletion
          </Typography>
          <Typography
            variant="pi"
            textColor="neutral600"
            style={{ lineHeight: 1.3, wordBreak: 'break-word' }}
          >
            Are you sure you want to permanently delete this snapshot? This action cannot be undone.
          </Typography>
          {title && (
            <Box
              paddingTop={1}
              paddingBottom={1}
              paddingLeft={2}
              paddingRight={2}
              marginTop={1}
              background="neutral150"
              hasRadius
            >
              <Typography variant="sigma" textColor="neutral700">
                {title}
              </Typography>
            </Box>
          )}
        </Flex>
      </Flex>
      <Flex justifyContent="flex-end" gap={2} style={{ marginTop: 4 }}>
        <Button size="S" variant="tertiary" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="S" variant="danger" onClick={onConfirm}>
          Delete Permanently
        </Button>
      </Flex>
    </Flex>
  );
};
