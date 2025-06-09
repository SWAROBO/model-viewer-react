import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

type ModelLoadingProgressProps = {
    downloadProgress: number;
    loading: boolean;
};

const ModelLoadingProgress: React.FC<ModelLoadingProgressProps> = ({ downloadProgress, loading }) => {
    if (!loading) return null;

    return (
        <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            padding: '5px',
            opacity: downloadProgress < 100 ? 1 : 0,
            transition: 'opacity 0.5s ease-out'
        }}>
            <CircularProgressbar
                value={downloadProgress}
                text={`${downloadProgress}%`}
                className="my-progressbar"
                styles={buildStyles({
                    strokeLinecap: 'butt',
                    textSize: '1.5em',
                    pathColor: `white`,
                    textColor: 'white',
                    trailColor: 'gray',
                })}
            />
        </div>
    );
};

export default ModelLoadingProgress;
