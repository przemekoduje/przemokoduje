import React, { useRef, useEffect } from "react";
import "./App.css";

class Ball {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.isDragging = false; 
    this.vx = 0; // Prędkość w kierunku x
    this.vy = 0; // Prędkość w kierunku y
  }

  draw(ctx) {
    ctx.save();
    ctx.scale(2, 2); // Skalowanie dla Retina
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  isClicked(mouseX, mouseY) {
    const distance = Math.sqrt((mouseX - this.x) ** 2 + (mouseY - this.y) ** 2);
    return distance <= this.radius;
  }

  updatePosition(mouseX, mouseY) {
    this.vx = mouseX - this.x;
    this.vy = mouseY - this.y;
    this.x = mouseX;
    this.y = mouseY;
  }
  move(friction) {
    // Aktualizacja pozycji kulki na podstawie prędkości
    this.x += this.vx;
    this.y += this.vy;

    // Zastosowanie tarcia (zmniejszanie prędkości)
    this.vx *= friction;
    this.vy *= friction;

    // Zatrzymanie kulki, gdy prędkość jest bardzo mała
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

    canvas.width = width * 2; // Wyższa rozdzielczość (retina)
    canvas.height = height * 2;

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Lista kulek
    const balls = [
      new Ball(100, 100, 20, "red"),
      new Ball(200, 150, 25, "blue"),
      new Ball(300, 200, 30, "green"),
      new Ball(300, 400, 30, "yellow"),
    ];

    let draggingBall = null; // Która kulka jest przeciągana
    const friction = 0.98;

    // Funkcja czyszczenia canvasu
    const clearCanvas = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    // Funkcja aktualizacji wszystkich kulek
    const updateBalls = () => {
      clearCanvas();
      balls.forEach((ball) => ball.draw(ctx)); // Rysowanie wszystkich kulek
    };

    // Pierwsze narysowanie kulek
    updateBalls();

    // Obsługa zdarzeń myszy
    const handleMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Sprawdź, czy kliknięto w którąś z kulek
      balls.forEach((ball) => {
        if (ball.isClicked(mouseX, mouseY)) {
          ball.isDragging = true;
          draggingBall = ball;
        }
      });
    };

    const handleMouseMove = (e) => {
      if (!draggingBall) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      draggingBall.updatePosition(mouseX, mouseY); // Aktualizuj pozycję przeciąganej kulki
      updateBalls(); // Odśwież canvas
    };

    const handleMouseUp = () => {
      if (draggingBall) {
        draggingBall.isDragging = false;
        draggingBall = null;
      }
    };

    // Funkcja obsługi kolizji
    const handleCollisions = () => {
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const ball1 = balls[i];
          const ball2 = balls[j];
    
          const dx = ball2.x - ball1.x;
          const dy = ball2.y - ball1.y;
          const distance = Math.sqrt(dx ** 2 + dy ** 2);
          const overlap = ball1.radius + ball2.radius - distance;
    
          // Sprawdzenie kolizji
          if (distance < ball1.radius + ball2.radius) {
            // Rozdzielenie kulek
            const angle = Math.atan2(dy, dx);
    
            const correctionX = (overlap / 2) * Math.cos(angle);
            const correctionY = (overlap / 2) * Math.sin(angle);
    
            ball1.x -= correctionX;
            ball1.y -= correctionY;
    
            ball2.x += correctionX;
            ball2.y += correctionY;
    
            // Obliczenie nowych prędkości po kolizji
            const speed1 = Math.sqrt(ball1.vx ** 2 + ball1.vy ** 2);
            const speed2 = Math.sqrt(ball2.vx ** 2 + ball2.vy ** 2);
    
            const direction1 = Math.atan2(ball1.vy, ball1.vx);
            const direction2 = Math.atan2(ball2.vy, ball2.vx);
    
            const velocityX1 = speed1 * Math.cos(direction1 - angle);
            const velocityY1 = speed1 * Math.sin(direction1 - angle);
            const velocityX2 = speed2 * Math.cos(direction2 - angle);
            const velocityY2 = speed2 * Math.sin(direction2 - angle);
    
            const finalVelocityX1 = velocityX2;
            const finalVelocityX2 = velocityX1;
    
            ball1.vx = Math.cos(angle) * finalVelocityX1 + Math.cos(angle + Math.PI / 2) * velocityY1;
            ball1.vy = Math.sin(angle) * finalVelocityX1 + Math.sin(angle + Math.PI / 2) * velocityY1;
    
            ball2.vx = Math.cos(angle) * finalVelocityX2 + Math.cos(angle + Math.PI / 2) * velocityY2;
            ball2.vy = Math.sin(angle) * finalVelocityX2 + Math.sin(angle + Math.PI / 2) * velocityY2;
          }
        }
      }
    };

    const handleWallCollisions = () => {
      balls.forEach((ball) => {
        // Sprawdzenie kolizji z lewą i prawą krawędzią
        if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= canvas.width / 2) {
          ball.vx *= -1; // Odwróć prędkość w kierunku x
          // Upewnij się, że kulka nie wychodzi poza krawędź
          if (ball.x - ball.radius <= 0) ball.x = ball.radius;
          if (ball.x + ball.radius >= canvas.width / 2) ball.x = canvas.width / 2 - ball.radius;
        }
    
        // Sprawdzenie kolizji z górną i dolną krawędzią
        if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= canvas.height / 2) {
          ball.vy *= -1; // Odwróć prędkość w kierunku y
          // Upewnij się, że kulka nie wychodzi poza krawędź
          if (ball.y - ball.radius <= 0) ball.y = ball.radius;
          if (ball.y + ball.radius >= canvas.height / 2) ball.y = canvas.height / 2 - ball.radius;
        }
      });
    };

    // Animacja ruchu kulek po puszczeniu
    const animate = () => {
      balls.forEach((ball) => {
        if (!ball.isDragging) {
          ball.move(friction); // Ruch kulki
        }
      });
      handleCollisions(); 
      handleWallCollisions();
      updateBalls();
      requestAnimationFrame(animate); // Rekurencyjne wywołanie animacji
    };

    // Start animacji
    animate();

    // Dodanie nasłuchiwania zdarzeń myszy
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);

    // Usunięcie zdarzeń po odmontowaniu komponentu
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
