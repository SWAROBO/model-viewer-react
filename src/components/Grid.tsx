import { Script } from "@playcanvas/react/components";
import { Grid as GridScript } from "@playcanvas/react/scripts";
import { FC } from "react";

const Grid: FC<Record<string, unknown>> = ({ ...props }) => {
    return <Script script={GridScript} data-testid="grid-script-component" {...props} />
}

export default Grid;
