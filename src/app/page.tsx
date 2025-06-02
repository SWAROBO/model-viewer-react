import { Application, Entity } from "@playcanvas/react";
import { Camera, Render, Light } from "@playcanvas/react/components";
import { OrbitControls } from "@playcanvas/react/scripts";

const App = () => (
    <Application>
        <Entity position={[0, 0, 4]}>
            <Camera clearColor="gray" />
            <OrbitControls />
        </Entity>
        <Entity name="light" rotation={[45, -45, 45]}>
            <Light type="directional" color="orange" />
        </Entity>
        <Entity position={[0, 0, 0]}>
            <Render type="box" />
        </Entity>
    </Application>
);
export default App;
