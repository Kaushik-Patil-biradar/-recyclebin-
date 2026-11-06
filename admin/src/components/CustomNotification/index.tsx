import React from 'react';
import { toast, ToastOptions, ToastContainer, ToastContainerProps } from 'react-toastify';
import {
  CustomNotification,
  ConfirmDeleteNotification,
  NotificationType,
  CustomNotificationProps,
  ConfirmDeleteNotificationProps,
} from './CustomNotification';
import './custom-notification.css';

export * from './CustomNotification';

export interface ToggleNotificationOptions {
  type: NotificationType;
  message: string;
  title?: string;
  detail?: string;
  timeout?: number;
}

/**
 * Custom toggleNotification replacement utilizing react-toastify
 */
export const customToggleNotification = ({
  type,
  message,
  title,
  detail,
  timeout = 4000,
}: ToggleNotificationOptions) => {
  let toastClass = 'recycle-bin-toast';
  let progressClass = '';

  switch (type) {
    case 'deleted':
      toastClass += ' recycle-bin-toast-deleted';
      progressClass = 'recycle-bin-progress-deleted';
      break;
    case 'danger':
    case 'error':
      toastClass += ' recycle-bin-toast-error';
      progressClass = 'recycle-bin-progress-error';
      break;
    case 'restore':
    case 'success':
      toastClass += ' recycle-bin-toast-restore';
      progressClass = 'recycle-bin-progress-restore';
      break;
    case 'warning':
      toastClass += ' recycle-bin-toast-warning';
      progressClass = 'recycle-bin-progress-warning';
      break;
    case 'info':
    default:
      toastClass += ' recycle-bin-toast-info';
      progressClass = 'recycle-bin-progress-info';
      break;
  }

  const options: ToastOptions = {
    position: 'top-center',
    autoClose: timeout,
    className: toastClass,
    progressClassName: progressClass,
    icon: false,
    closeButton: true,
  };

  return toast(
    <CustomNotification
      type={type}
      title={title}
      message={message}
      detail={detail}
    />,
    options
  );
};

/**
 * Specific convenience notification for snapshot deletion
 * Message defaults to: "Item permanently deleted"
 */
export const notifySnapshotDeleted = (
  message = 'Item permanently deleted',
  options?: { title?: string; detail?: string; timeout?: number }
) => {
  return customToggleNotification({
    type: 'deleted',
    message,
    title: options?.title || 'Snapshot Permanently Deleted',
    detail: options?.detail,
    timeout: options?.timeout,
  });
};

/**
 * Interactive confirmation notification replacing window.confirm
 */
export const notifyConfirmPurge = ({
  id,
  title,
  onConfirm,
  onCancel,
}: {
  id: number;
  title?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}) => {
  const toastId = `confirm-purge-${id}`;

  return toast(
    ({ closeToast }) => (
      <ConfirmDeleteNotification
        id={id}
        title={title}
        onConfirm={() => {
          closeToast();
          onConfirm();
        }}
        onCancel={() => {
          closeToast();
          if (onCancel) onCancel();
        }}
      />
    ),
    {
      toastId,
      position: 'top-center',
      autoClose: false,
      closeOnClick: false,
      closeButton: true,
      draggable: false,
      className: 'recycle-bin-toast recycle-bin-toast-deleted',
    }
  );
};

/**
 * Interactive confirmation notification for bulk snapshot deletion
 */
export const notifyConfirmBulkPurge = ({
  count,
  onConfirm,
  onCancel,
}: {
  count: number;
  onConfirm: () => void;
  onCancel?: () => void;
}) => {
  const toastId = 'confirm-bulk-purge';

  return toast(
    ({ closeToast }) => (
      <ConfirmDeleteNotification
        id={0}
        title={`${count} snapshots selected for permanent purge`}
        onConfirm={() => {
          closeToast();
          onConfirm();
        }}
        onCancel={() => {
          closeToast();
          if (onCancel) onCancel();
        }}
      />
    ),
    {
      toastId,
      position: 'top-center',
      autoClose: false,
      closeOnClick: false,
      closeButton: true,
      draggable: false,
      className: 'recycle-bin-toast recycle-bin-toast-deleted',
    }
  );
};

/**
 * Specific convenience notification for errors
 */
export const notifyError = (
  message: string,
  options?: { title?: string; detail?: string; timeout?: number }
) => {
  return customToggleNotification({
    type: 'error',
    message: message || 'An unexpected error occurred',
    title: options?.title || 'Action Failed',
    detail: options?.detail,
    timeout: options?.timeout,
  });
};

/**
 * Specific convenience notification for restoring items
 */
export const notifyRestored = (
  message = 'Item restored successfully',
  options?: { title?: string; detail?: string; timeout?: number }
) => {
  return customToggleNotification({
    type: 'restore',
    message,
    title: options?.title || 'Item Restored Successfully',
    detail: options?.detail,
    timeout: options?.timeout,
  });
};

/**
 * Preconfigured ToastContainer tailored for the Recycle Bin plugin
 */
export const RecycleBinToastContainer: React.FC<ToastContainerProps> = (props) => {
  return (
    <ToastContainer
      position="top-center"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      className="recycle-bin-toast-container"
      {...props}
    />
  );
};
