import React, { useRef, useEffect } from "react";
import "./App.css";

const gravityConstant = 0.5; // Stała grawitacyjna
const rotationSpeed = 5; // Prędkość powrotu do normalnej rotacji
const friction = 0.98; // Współczynnik tarcia
const collisionDamping = 0.8; // Tłumienie prędkości przy kolizji
const minVelocity = 0.1; // Minimalna prędkość, poniżej której zatrzymujemy literę

class Letter {
  constructor(x, y, width, height, svgSrc, rotation, id, color = "black") {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.svgSrc = svgSrc;
    this.rotation = rotation;
    this.isDragging = false;
    this.vx = 0;
    this.vy = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.prevMouseX = 0;
    this.prevMouseY = 0;
    this.mass = (width * height) / 10000; // Masa na podstawie obszaru litery
    this.svgImage = null;
    this.id = id; // Identyfikator literki
    this.color = color;
  }

  loadSVG() {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.svgImage = img;
        resolve();
      };
      img.src = this.svgSrc;
    });
  }

  draw(ctx) {
    if (!this.svgImage) return;

    ctx.save();
    ctx.scale(2, 2); // Dla wyświetlaczy Retina
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.drawImage(
      this.svgImage,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );
    ctx.restore();
  }

  isClicked(mouseX, mouseY) {
    const localX = mouseX - (this.x - this.width / 2);
    const localY = mouseY - (this.y - this.height / 2);

    if (localX < 0 || localY < 0 || localX > this.width || localY > this.height) {
      return false;
    }

    const canvas = document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;
    const tempCtx = canvas.getContext("2d");
    tempCtx.drawImage(this.svgImage, 0, 0, this.width, this.height);

    const pixel = tempCtx.getImageData(localX, localY, 1, 1).data;
    return pixel[3] > 0;
  }

  updatePosition(mouseX, mouseY) {
    this.vx = mouseX - this.x;
    this.vy = mouseY - this.y;
    this.x = mouseX - this.offsetX;
    this.y = mouseY - this.offsetY;
  }

  move(gravityEnabled) {
    if (gravityEnabled) {
      this.vy += gravityConstant * this.mass;
    }
    this.x += this.vx;
    this.y += this.vy;

    this.vx *= friction;
    this.vy *= friction;

    if (Math.abs(this.vx) < minVelocity) this.vx = 0;
    if (Math.abs(this.vy) < minVelocity) this.vy = 0;
  }
}

const App = () => {
  const canvasRef = useRef(null);
  let gravityEnabled = false;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const parent = canvas.parentElement;

    const width = parent.offsetWidth * 0.9;
    const height = parent.offsetHeight * 0.9;

    canvas.width = width * 2;
    canvas.height = height * 2;

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const letters = [
      new Letter(50, 50, 250, 250, "/images/P_svg.svg", 20, "P"),
      new Letter(350, 150, 220, 220, "/images/R_svg.svg", -30, "R"),
      new Letter(400, 150, 150, 150, "/images/Z_svg.svg", 25, "Z"),
      new Letter(650, 80, 120, 120, "/images/e_svg.svg", -45, "E"),
      new Letter(750, 50, 110, 110, "/images/m_svg.svg", 20, "M"),
      new Letter(850, 50, 140, 140, "/images/o_svg.svg", 20, "O"),

      new Letter(50, 450, 180, 180, "/images/k_svg.svg", 20, "k"),
      new Letter(250, 550, 120, 120, "/images/o_svg.svg", -30, "o"),
      new Letter(400, 480, 210, 210, "/images/d_svg.svg", 10, "d"),
      new Letter(600, 520, 130, 130, "/images/u_svg.svg", -25, "u"),
      new Letter(650, 550, 110, 220, "/images/j_svg.svg", 20, "j"),
      new Letter(750, 550, 140, 140, "/images/e1_svg.svg", 20, "e"),

    ];

    let draggingLetter = null;

    const clearCanvas = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const updateLetters = () => {
      clearCanvas();
      letters.forEach((letter) => letter.draw(ctx));
    };

    const handleMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      letters.forEach((letter) => {
        if (letter.isClicked(mouseX, mouseY)) {
          letter.isDragging = true;
          draggingLetter = letter;

          letter.offsetX = mouseX - letter.x;
          letter.offsetY = mouseY - letter.y;

          letter.prevMouseX = mouseX;
          letter.prevMouseY = mouseY;
        }
      });
    };

    const handleMouseMove = (e) => {
      if (!draggingLetter) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      draggingLetter.updatePosition(mouseX, mouseY);

      draggingLetter.vx = mouseX - draggingLetter.prevMouseX;
      draggingLetter.vy = mouseY - draggingLetter.prevMouseY;

      draggingLetter.prevMouseX = mouseX;
      draggingLetter.prevMouseY = mouseY;

      updateLetters();
    };

    const handleMouseUp = () => {
      if (draggingLetter) {
        if (draggingLetter.id === "R") {
          gravityEnabled = true;
        }

        draggingLetter.isDragging = false;

        const threshold = 1;
        if (
          Math.abs(draggingLetter.vx) < threshold &&
          Math.abs(draggingLetter.vy) < threshold
        ) {
          draggingLetter.vx = 0;
          draggingLetter.vy = 0;
        }

        draggingLetter = null;
      }
    };

    const handleCollisions = () => {
      for (let i = 0; i < letters.length; i++) {
        for (let j = i + 1; j < letters.length; j++) {
          const letter1 = letters[i];
          const letter2 = letters[j];

          const dx = letter2.x - letter1.x;
          const dy = letter2.y - letter1.y;
          const distance = Math.sqrt(dx ** 2 + dy ** 2);

          if (distance < (letter1.width + letter2.width) / 2) {
            const angle = Math.atan2(dy, dx);
            const overlap = (letter1.width + letter2.width) / 2 - distance;

            const correctionX = (overlap / 2) * Math.cos(angle);
            const correctionY = (overlap / 2) * Math.sin(angle);

            letter1.x -= correctionX;
            letter1.y -= correctionY;

            letter2.x += correctionX;
            letter2.y += correctionY;

            [letter1.vx, letter2.vx] = [letter2.vx * collisionDamping, letter1.vx * collisionDamping];
            [letter1.vy, letter2.vy] = [letter2.vy * collisionDamping, letter1.vy * collisionDamping];
          }
        }
      }
    };

    const handleWallCollisions = (letter, canvasWidth, canvasHeight) => {
      const halfWidth = letter.width / 2;
      const halfHeight = letter.height / 2;

      if (letter.x - halfWidth <= 0) {
        letter.x = halfWidth;
        letter.vx *= -collisionDamping;
      } else if (letter.x + halfWidth >= canvasWidth) {
        letter.x = canvasWidth - halfWidth;
        letter.vx *= -collisionDamping;
      }

      if (letter.y - halfHeight <= 0) {
        letter.y = halfHeight;
        letter.vy *= -collisionDamping;
      } else if (letter.y + halfHeight >= canvasHeight) {
        letter.y = canvasHeight - halfHeight;
        letter.vy *= -collisionDamping;
        letter.vx *= 0.9;
        letter.rotation = Math.max(0, letter.rotation - rotationSpeed);
      }
    };

    const animate = async () => {
      await Promise.all(letters.map((letter) => letter.loadSVG()));

      const animationLoop = () => {
        letters.forEach((letter) => {
          if (!letter.isDragging) {
            letter.move(gravityEnabled);
          }

          handleWallCollisions(letter, canvas.width / 2, canvas.height / 2);
        });

        handleCollisions();
        updateLetters();
        requestAnimationFrame(animationLoop);
      };

      animationLoop();
    };

    animate();

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div className="app" style={{ width: "100%", height: "100vh" }}>
      <canvas
        tabIndex={0}
        ref={canvasRef}
        className="canvas"
        id="canvas"
      ></canvas>
    </div>
  );
};

export default App;
