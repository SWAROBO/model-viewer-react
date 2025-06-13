import { Script } from "@playcanvas/react/components";
import { AutoRotator } from "@playcanvas/react/scripts";
import { FC } from "react";

const AutoRotate: FC<Record<string, unknown>> = (props) => {
    return <Script data-testid="auto-rotate-script" script={AutoRotator} {...props} />
}

export default AutoRotate;
