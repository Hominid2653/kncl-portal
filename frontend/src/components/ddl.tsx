import { useState } from "react";

const DDL = () => {
  const [count, setCount] = useState(0);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>DDL Component</h2>

      <p>
        You clicked the button {count} time{count !== 1 ? "s" : ""}.
      </p>

      <button onClick={() => setCount(count + 1)}>
        Click Me
      </button>
    </div>
  );
};

export default DDL;