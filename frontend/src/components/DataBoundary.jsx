import React from 'react';
import { useTranslation } from 'react-i18next';

export default function DataBoundary({ loading, error, onRetry, children, loadingText }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 min-h-[300px]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-on-surface-variant font-label-md text-label-md">
          {loadingText || t('common.loading', 'Loading data...')}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 min-h-[300px] bg-error-container/10 rounded-xl border border-error/20">
        <span className="material-symbols-outlined text-[48px] text-error mb-4">error</span>
        <h3 className="text-error font-title-md text-title-md mb-2">{t('common.error', 'Something went wrong')}</h3>
        <p className="text-on-surface-variant font-body-sm text-body-sm text-center max-w-sm mb-6">
          {error.message || error || 'An unexpected network error occurred while fetching data.'}
        </p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="px-6 py-2 bg-error text-on-error rounded-full font-label-md text-label-md font-bold shadow-sm hover:opacity-90 transition-opacity active:scale-95"
          >
            {t('common.retry', 'Retry')}
          </button>
        )}
      </div>
    );
  }

  return children;
}
