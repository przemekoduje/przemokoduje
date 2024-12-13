import React, { useRef, useEffect } from "react";
import "./App.css";

class Letter {
  constructor(x, y, width, height, imgSrc, rotation) {
    this.x = x; // Pozycja x środka litery
    this.y = y; // Pozycja y środka litery
    this.width = width; // Szerokość litery
    this.height = height; // Wysokość litery
    this.img = new Image(); // Tworzymy obraz
    this.img.src = imgSrc; // Ustawiamy ścieżkę do pliku PNG
    this.rotation = rotation;
    this.isDragging = false;
    this.vx = 0; // Prędkość w kierunku x
    this.vy = 0; // Prędkość w kierunku y
    this.offsetX = 0; // Przesunięcie w osi X
    this.offsetY = 0; // Przesunięcie w osi Y
    this.prevMouseX = 0; // Poprzednia pozycja myszy
    this.prevMouseY = 0; // Poprzednia pozycja myszy
  }

  draw(ctx) {
    ctx.save();
    ctx.scale(2, 2); // Skalowanie dla Retina
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180); 
    ctx.drawImage(
      this.img,
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

    if (
      localX < 0 ||
      localY < 0 ||
      localX > this.width ||
      localY > this.height
    ) {
      return false;
    }

    const canvas = document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;
    const tempCtx = canvas.getContext("2d");
    tempCtx.drawImage(this.img, 0, 0, this.width, this.height);

    const pixel = tempCtx.getImageData(localX, localY, 1, 1).data;
    return pixel[3] > 0; // Kanał alfa > 0 oznacza kliknięcie na litery
  }

  updatePosition(mouseX, mouseY) {
    this.vx = mouseX - this.x;
    this.vy = mouseY - this.y;
    this.x = mouseX - this.offsetX;
    this.y = mouseY - this.offsetY;
  }

  move(friction) {
    this.x += this.vx;
    this.y += this.vy;

    this.vx *= friction;
    this.vy *= friction;

    if (Math.abs(this.vx) < 0.01) this.vx = 0;
    if (Math.abs(this.vy) < 0.01) this.vy = 0;
  }
}

const App = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const parent = canvas.parentElement;

    // Ustawienia canvas
    const width = parent.offsetWidth * 0.9;
    const height = parent.offsetHeight * 0.9;

    canvas.width = width * 2;
    canvas.height = height * 2;

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const letters = [
      new Letter(50, 50, 100, 100, "/images/P.png", 0),
      new Letter(150, 50, 100, 100, "/images/R.png", 0),
      new Letter(250, 50, 100, 100, "/images/Z.png", 0),
      new Letter(350, 50, 100, 100, "/images/E.png", 0),
      new Letter(450, 50, 100, 100, "/images/m.png", 0),
      new Letter(550, 50, 100, 100, "/images/o.png"),
      new Letter(50, 600, 100, 100, "/images/k.png"),
      new Letter(150, 600, 100, 100, "/images/o.png"),
      new Letter(250, 600, 100, 100, "/images/d.png"),
      new Letter(350, 600, 100, 100, "/images/u.png"),
      new Letter(450, 600, 100, 200, "/images/j.png"),
      new Letter(550, 600, 100, 100, "/images/e1.png"),
    ];

    const friction = 0.98;
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
    
          // Zapisz pozycję myszy na start
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
    
      // Aktualizuj pozycję literki
      draggingLetter.updatePosition(mouseX, mouseY);
    
      // Oblicz prędkość literki na podstawie zmian pozycji myszy
      draggingLetter.vx = mouseX - draggingLetter.prevMouseX;
      draggingLetter.vy = mouseY - draggingLetter.prevMouseY;
    
      // Zapisz bieżącą pozycję myszy jako poprzednią
      draggingLetter.prevMouseX = mouseX;
      draggingLetter.prevMouseY = mouseY;
    
      updateLetters();
    };
    

    const handleMouseUp = () => {
      if (draggingLetter) {
        draggingLetter.isDragging = false;
    
        // Jeśli prędkość jest minimalna, zatrzymaj literkę
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

            [letter1.vx, letter2.vx] = [letter2.vx, letter1.vx];
            [letter1.vy, letter2.vy] = [letter2.vy, letter1.vy];
          }
        }
      }
    };

    const animate = () => {
      letters.forEach((letter) => {
        if (!letter.isDragging) letter.move(friction);
      });

      handleCollisions();
      updateLetters();
      requestAnimationFrame(animate);
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
