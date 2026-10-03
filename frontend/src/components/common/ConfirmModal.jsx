import React from 'react';
import Modal from './Modal';
import { AlertTriangle, Info } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  loading = false,
}) => {
  const isDanger = confirmVariant === 'danger';
  const Icon = isDanger ? AlertTriangle : Info;
  const iconColor = isDanger ? 'text-red-500 bg-red-50' : 'text-blue-500 bg-blue-50';
  const buttonColor = isDanger
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-[#8178F2] hover:bg-[#6c63e6] text-white';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <div className={`p-3 rounded-full shrink-0 ${iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 text-center sm:text-left mt-2 sm:mt-0">
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
      <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8178F2] disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8178F2] disabled:opacity-50 flex items-center justify-center ${buttonColor}`}
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : null}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
