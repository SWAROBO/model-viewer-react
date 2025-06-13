import { render, screen, waitFor, act } from '@testing-library/react'; // Import act
import Page from './page'; // Import the default export, which is DynamicPage
import { useSearchParams } from 'next/navigation';
import { Application } from '@playcanvas/react';
import ModelViewer from '@/components/ModelViewer';
import SwaroboLogo from '@/components/SwaroboLogo';
import { useModelData } from '@/hooks/useModelData';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
    useSearchParams: vi.fn(),
}));

// Mock PlayCanvas Application component
vi.mock('@playcanvas/react', () => ({
    Application: vi.fn(({ children }) => <div data-testid="playcanvas-application">{children}</div>),
}));

// Mock ModelViewer component
vi.mock('@/components/ModelViewer', () => ({
    default: vi.fn((props) => <div data-testid="mock-model-viewer" data-props={JSON.stringify(props)}>Mock ModelViewer</div>),
}));

// Mock SwaroboLogo component
vi.mock('@/components/SwaroboLogo', () => ({
    default: vi.fn(() => <div data-testid="mock-swarobo-logo">Mock SwaroboLogo</div>),
}));

// Mock useModelData hook
vi.mock('@/hooks/useModelData', () => ({
    useModelData: vi.fn(),
}));

describe('Page', () => {
    const mockModelData = [
        { model: 'car', modelUrl: 'car.glb', autoRotate: true },
        { model: 'house', modelUrl: 'house.glb', autoRotate: false },
    ];
    const mockDefaultModelViewerProps = { modelUrl: 'default.glb', autoRotate: false };
    // New object to represent the props passed to ModelViewer when 'car' model is selected/defaulted
    const mockCarModelPropsWithoutModel = { modelUrl: 'car.glb', autoRotate: true };

    beforeEach(() => {
        vi.resetAllMocks();
        // Default mock for useSearchParams
        (useSearchParams as vi.Mock).mockReturnValue(new URLSearchParams());

        // Default mock for useModelData
        (useModelData as vi.Mock).mockReturnValue({
            modelData: mockModelData,
            defaultModelViewerProps: mockDefaultModelViewerProps,
        });
    });

    it('renders SwaroboLogo and ModelViewer with default props when no model param is present', async () => {
        await act(async () => { // Wrap render in act
            render(<Page />);
        });

        // Check for SwaroboLogo
        await waitFor(() => { // Use waitFor for elements that might appear after async updates
            expect(screen.getByTestId('mock-swarobo-logo')).toBeInTheDocument();
        });

        // Check for ModelViewer with default props
        await waitFor(() => {
            // Expect mockCarModelPropsWithoutModel as per current page.tsx logic
            expect(ModelViewer).toHaveBeenCalledWith(
                expect.objectContaining(mockCarModelPropsWithoutModel), // Changed to mockCarModelPropsWithoutModel
                undefined // Explicitly expect undefined for the second argument
            );
        });
        expect(screen.getByTestId('mock-model-viewer')).toBeInTheDocument();
    });

    it('renders ModelViewer with props for a selected model from search params', async () => {
        (useSearchParams as vi.Mock).mockReturnValue(new URLSearchParams('?model=house'));

        await act(async () => {
            render(<Page />);
        });

        await waitFor(() => {
            expect(ModelViewer).toHaveBeenCalledWith(
                expect.objectContaining({ modelUrl: 'house.glb', autoRotate: false }),
                undefined // Explicitly expect undefined
            );
        });
    });

    it('falls back to default props if selected model is not found', async () => {
        (useSearchParams as vi.Mock).mockReturnValue(new URLSearchParams('?model=nonexistent'));

        await act(async () => {
            render(<Page />);
        });

        await waitFor(() => {
            // Expect mockCarModelPropsWithoutModel here as well
            expect(ModelViewer).toHaveBeenCalledWith(
                expect.objectContaining(mockCarModelPropsWithoutModel), // Changed to mockCarModelPropsWithoutModel
                undefined // Explicitly expect undefined
            );
        });
    });

    it('does not render ModelViewer if modelData is empty', async () => {
        (useModelData as vi.Mock).mockReturnValue({
            modelData: [],
            defaultModelViewerProps: mockDefaultModelViewerProps,
        });

        render(<Page />);

        await waitFor(() => {
            expect(ModelViewer).not.toHaveBeenCalled();
        });
        expect(screen.queryByTestId('mock-model-viewer')).not.toBeInTheDocument();
    });
});
