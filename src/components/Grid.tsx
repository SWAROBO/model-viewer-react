import { Script } from "@playcanvas/react/components";
import { Grid as GridScript } from "@playcanvas/react/scripts";
import { FC } from "react";

interface GridProps {
    size?: number;
    divisions?: number;
    // Add any other props that GridScript might accept
}

const Grid: FC<GridProps> = ({ ...props }) => {
    return <Script script={GridScript} {...props} />
}

export default Grid;
