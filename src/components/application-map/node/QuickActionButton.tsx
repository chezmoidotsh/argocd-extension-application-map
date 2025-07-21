import React, { useCallback } from 'react';

import './QuickActionButton.scss';

type QuickActionButtonProps = {
  isUnlocked: boolean;
  icon: string;
  title: string;
  onClick: () => Promise<{ success: true } | { success: false; error: string }>;
};

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ isUnlocked, icon, title, onClick }) => {
  if (!isUnlocked) {
    return (
      <button
        className="argocd-application-map__node-quick-actions__button"
        title={`${title} (not allowed for your user)`}
        disabled
      >
        <i className={`fa fa-lock`}></i>
      </button>
    );
  }

  const [status, setStatus] = React.useState<'idle' | 'executing' | 'succeeded' | 'failed'>('idle');
  const onClickHandler = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();

      setStatus('executing');
      const result = await onClick();

      if (result.success === true) {
        setStatus('succeeded');
        console.log(`${title} action completed successfully.`);
      } else {
        setStatus('failed');
        console.error(`${title} action failed:`, result.error);
      }
    },
    [onClick, title]
  );

  return (
    <button
      className={`argocd-application-map__node-quick-actions__button ${status}`}
      onClick={onClickHandler}
      title={title}
    >
      <i className={`fa ${icon}`}></i>
    </button>
  );
};

export default QuickActionButton;
