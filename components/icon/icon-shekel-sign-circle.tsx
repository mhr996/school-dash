import { FC } from 'react';

interface IconShekelSignCircleProps {
    className?: string;
    fill?: boolean;
}

const IconShekelSignCircle: FC<IconShekelSignCircleProps> = ({ className, fill = false }) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className}>
            {fill ? (
                <>
                    {/* Filled Circle with Shekel */}
                    <circle cx="256" cy="256" r="256" fill="currentColor" />
                    <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="320" fontWeight="bold" fill="white" fontFamily="Arial, sans-serif">
                        ₪
                    </text>
                </>
            ) : (
                <>
                    {/* Outlined Circle with Shekel */}
                    <circle cx="256" cy="256" r="208" fill="none" stroke="currentColor" strokeWidth="48" />
                    <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="280" fontWeight="bold" fill="currentColor" fontFamily="Arial, sans-serif">
                        ₪
                    </text>
                </>
            )}
        </svg>
    );
};

export default IconShekelSignCircle;
