import IconX from '@/components/icon/icon-x';
import PanelCodeHighlight from '@/components/panel-code-highlight';
import React, { useEffect, useState } from 'react';

interface AlertProps {
    type: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
    message: string;
    title?: string;
    onClose?: () => void;
}

const Alert: React.FC<AlertProps> = ({ type, message, title, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isLeaving, setIsLeaving] = useState(false);

    const alertClasses = {
        primary: 'bg-blue-50 text-blue-800 dark:bg-blue-900/90 dark:text-blue-100 border-l-4 border-blue-500',
        secondary: 'bg-gray-50 text-gray-800 dark:bg-gray-900/90 dark:text-gray-100 border-l-4 border-gray-500',
        success: 'bg-green-50 text-green-800 dark:bg-green-900/90 dark:text-green-100 border-l-4 border-green-500',
        warning: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/90 dark:text-yellow-100 border-l-4 border-yellow-500',
        danger: 'bg-red-50 text-red-800 dark:bg-red-900/90 dark:text-red-100 border-l-4 border-red-500',
        info: 'bg-cyan-50 text-cyan-800 dark:bg-cyan-900/90 dark:text-cyan-100 border-l-4 border-cyan-500',
    };

    useEffect(() => {
        if (onClose) {
            const timer = setTimeout(() => {
                setIsLeaving(true);
                // Wait for animation to complete before calling onClose
                setTimeout(() => {
                    setIsVisible(false);
                    onClose();
                }, 300);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [onClose]);

    const handleClose = () => {
        setIsLeaving(true);
        setTimeout(() => {
            setIsVisible(false);
            if (onClose) onClose();
        }, 300);
    };

    if (!isVisible) return null;

    return (
        <div
            className={`
                flex items-center rounded-lg p-4 mb-4 shadow-lg
                transition-all duration-300 transform
                ${isLeaving ? 'animate-slide-out-right' : 'animate-slide-in-right'}
                ${alertClasses[type]}
            `}
        >
            <span className="ltr:pr-2 rtl:pl-2 flex-1">
                {title && <strong className="ltr:mr-1 rtl:ml-1 font-semibold">{title}!</strong>}
                <span className="text-sm">{message}</span>
            </span>
            {onClose && (
                <button type="button" className="hover:opacity-80 ltr:ml-auto rtl:mr-auto p-1 rounded transition-colors hover:bg-black/10 dark:hover:bg-white/10" onClick={handleClose}>
                    <IconX className="h-5 w-5" />
                </button>
            )}
        </div>
    );
};

const ElementsAlertsDefault = () => {
    // Example usage within the component
    return (
        <PanelCodeHighlight title="Default Alerts" codeHighlight={`<Alert type="primary" title="Primary" message="Lorem Ipsum is simply dummy text of the printing." />`}>
            <div className="mb-5 grid gap-5 lg:grid-cols-2">
                <Alert type="primary" title="Primary" message="Lorem Ipsum is simply dummy text of the printing." onClose={() => console.log('closed')} />
                <Alert type="secondary" title="Secondary" message="Lorem Ipsum is simply dummy text of the printing." onClose={() => console.log('closed')} />
                <Alert type="success" title="Success" message="Lorem Ipsum is simply dummy text of the printing." onClose={() => console.log('closed')} />
                <Alert type="warning" title="Warning" message="Lorem Ipsum is simply dummy text of the printing." onClose={() => console.log('closed')} />
                <Alert type="danger" title="Danger" message="Lorem Ipsum is simply dummy text of the printing." onClose={() => console.log('closed')} />
                <Alert type="info" title="Info" message="Lorem Ipsum is simply dummy text of the printing." onClose={() => console.log('closed')} />
            </div>
        </PanelCodeHighlight>
    );
};

export default ElementsAlertsDefault;
export { Alert };
