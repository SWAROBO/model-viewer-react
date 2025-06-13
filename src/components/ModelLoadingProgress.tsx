import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

type ModelLoadingProgressProps = {
    downloadProgress: number;
    loading: boolean;
    error: string | null;
};

const ModelLoadingProgress: React.FC<ModelLoadingProgressProps> = ({ downloadProgress, loading, error }) => {
    // The container is visible if loading OR there's an error.
    // The progress bar itself is only visible if loading AND no error.
    const isContainerVisible = loading || error;
    const isProgressBarVisible = loading && !error;

    return (
        <div data-testid="model-loading-progress-container" style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            padding: '5px',
            opacity: isContainerVisible ? 1 : 0,
            transition: 'opacity 0.5s ease-out',
            display: isContainerVisible ? 'flex' : 'none', // Use display: 'none' to truly hide from DOM
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            textAlign: 'center'
        }}>
            {error ? (
                <div data-testid="model-loading-error-message" style={{ fontSize: '1.2em', color: 'red' }}>
                    Error: {error}
                </div>
            ) : isProgressBarVisible ? ( // Only show progress bar if loading and no error
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
            ) : null}
        </div>
    );
};

export default ModelLoadingProgress;
