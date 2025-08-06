import React from 'react';
import Image from 'next/image';

const SwaroboLogo: React.FC = () => {
    return (
        <div className="logo-container">
            <a href="https://swarobo.ai/" target="_blank" rel="noopener noreferrer">
                <Image src="/pablo.png" alt="SWAROBO Logo" className="swarobo-logo" width={100} height={50} priority />
            </a>
        </div>
    );
};

export default SwaroboLogo;
