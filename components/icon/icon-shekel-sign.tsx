import { FC } from 'react';

interface IconShekelSignProps {
    className?: string;
}

const IconShekelSign: FC<IconShekelSignProps> = ({ className }) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className={className}>
            {/* Shekel Sign (₪) as text */}
            <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="400" fontWeight="bold" fill="currentColor" fontFamily="Arial, sans-serif">
                ₪
            </text>
        </svg>
    );
};

export default IconShekelSign;
