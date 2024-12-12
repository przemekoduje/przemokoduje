import React, { useRef, useEffect } from 'react';
import p5 from 'p5';

const P5Sketch = () => {
  const sketchRef = useRef();

  useEffect(() => {
    const sketch = (p) => {
      let x = 0;

      p.setup = () => {
        p.createCanvas(400, 400);
        p.background(200);
      };

      p.draw = () => {
        p.background(200);
        p.fill(255, 0, 0);
        p.ellipse(x, 200, 50, 50);
        x = (x + 1) % p.width;
      };
    };

    // Inicjalizacja p5.js
    const p5Instance = new p5(sketch, sketchRef.current);

    // Usuwanie instancji po demontażu komponentu
    return () => {
      p5Instance.remove();
    };
  }, []);

  return <div ref={sketchRef}></div>;
};

export default P5Sketch;

