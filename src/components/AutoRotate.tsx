import { Script } from "@playcanvas/react/components";
import { AutoRotator } from "@playcanvas/react/scripts";
import { FC } from "react"; // Removed useEffect import

const AutoRotate: FC<Record<string, unknown>> = (props) => {
    return (
        <>
            <Script data-testid="auto-rotate-script" script={AutoRotator} {...props} />
            {/* Hidden element to signal auto-rotate active state for Playwright */}
            <div data-testid="auto-rotate-indicator" data-auto-rotate-active="true" style={{ display: 'none' }} />
        </>
    );
}

export default AutoRotate;
