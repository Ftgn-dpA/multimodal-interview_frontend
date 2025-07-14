import React, { useState, useEffect } from 'react';
import styles from './AuthBackground.module.css';
import { v4 as uuidv4 } from 'uuid';

const squareConfigs = [
  { left: '12%', width: 160, height: 160, duration: 7.5 },
  { right: '10%', width: 120, height: 120, duration: 10.1 },
  { left: '55%', width: 200, height: 200, duration: 8.2 }
];

// 生成更深的粉色到紫色之间的随机颜色
function randomPinkToPurple() {
  // #c0266c (192,38,108) 到 #5b21b6 (91,33,182)
  const lerp = Math.random();
  const r = Math.round(192 + (91 - 192) * lerp);
  const g = Math.round(38 + (33 - 38) * lerp);
  const b = Math.round(108 + (182 - 108) * lerp);
  return `rgb(${r},${g},${b})`;
}

const AuthBackground = ({ children }) => {
  const [pageHeight, setPageHeight] = useState(window.innerHeight);
  const [squares, setSquares] = useState([null, null, null]);

  useEffect(() => {
    const handleResize = () => setPageHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let timers = [];
    function spawnSquare(cfgIdx) {
      const cfg = squareConfigs[cfgIdx];
      const travel = pageHeight * 0.8 + cfg.height;
      const id = uuidv4();
      setSquares(sqs => {
        const newSqs = [...sqs];
        newSqs[cfgIdx] = {
          id,
          ...cfg,
          travel,
          duration: cfg.duration,
          born: Date.now(),
          cfgIdx
        };
        return newSqs;
      });
      timers[cfgIdx] = setTimeout(() => {
        setSquares(sqs => {
          const newSqs = [...sqs];
          newSqs[cfgIdx] = null;
          return newSqs;
        });
        spawnSquare(cfgIdx);
      }, cfg.duration * 1000);
    }
    squareConfigs.forEach((cfg, idx) => spawnSquare(idx));
    return () => timers.forEach(t => clearTimeout(t));
  }, [pageHeight]);

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <div className={styles.loginBeautifyBg}>
        {/* 圆形泡泡 - 优化每个圆的初始色和动画 */}
        <div className={styles.floatingCircle} style={{ width: 200, height: 200, left: '32%', top: '8%', background: randomPinkToPurple(), animation: 'floatCircleSin 10s cubic-bezier(0.4,0,0.2,1) 0.3s infinite alternate, circleColorFade1 12s linear 0.3s infinite' }} />
        <div className={styles.floatingCircle} style={{ width: 80, height: 80, left: '2%', top: '12%', background: randomPinkToPurple(), animation: 'floatCircleSin 7s cubic-bezier(0.4,0,0.2,1) 0.8s infinite alternate, circleColorFade1 8s linear 0.8s infinite' }} />
        <div className={styles.floatingCircle} style={{ width: 120, height: 120, right: '4%', top: '18%', background: randomPinkToPurple(), animation: 'floatCircleSin 9s cubic-bezier(0.4,0,0.2,1) 1.5s infinite alternate, circleColorFade2 8s linear 1.5s infinite' }} />
        <div className={styles.floatingCircle} style={{ width: 100, height: 100, left: '70%', bottom: '10%', background: randomPinkToPurple(), animation: 'floatCircleSin 8s cubic-bezier(0.4,0,0.2,1) 2.2s infinite alternate, circleColorFade3 8s linear 2.2s infinite' }} />
        <div className={styles.floatingCircle} style={{ width: 18, height: 18, left: '80%', top: '8%', background: randomPinkToPurple(), animation: 'floatCircleSin 6s cubic-bezier(0.4,0,0.2,1) 1.2s infinite alternate, circleColorFade2 8s linear 1.2s infinite' }} />
        <div className={styles.floatingCircle} style={{ width: 24, height: 24, left: '30%', bottom: '12%', background: randomPinkToPurple(), animation: 'floatCircleSin 5s cubic-bezier(0.4,0,0.2,1) 2.1s infinite alternate, circleColorFade1 8s linear 2.1s infinite' }} />
        <div className={styles.floatingCircle} style={{ width: 16, height: 16, right: '18%', bottom: '20%', background: randomPinkToPurple(), animation: 'floatCircleSin 7s cubic-bezier(0.4,0,0.2,1) 0.7s infinite alternate, circleColorFade3 8s linear 0.7s infinite' }} />
        <div className={styles.floatingCircle} style={{ width: 32, height: 32, left: '60%', top: '5%', background: randomPinkToPurple(), animation: 'floatCircleSin 8s cubic-bezier(0.4,0,0.2,1) 2.5s infinite alternate, circleColorFade2 8s linear 2.5s infinite' }} />
        <div className={styles.floatingCircle} style={{ width: 36, height: 36, right: '10%', top: '40%', background: randomPinkToPurple(), animation: 'floatCircleSin 6s cubic-bezier(0.4,0,0.2,1) 3.2s infinite alternate, circleColorFade1 8s linear 3.2s infinite' }} />
        <div className={styles.floatingCircle} style={{ width: 48, height: 48, left: '5%', top: '28%', background: randomPinkToPurple(), animation: 'floatCircleSin 7s cubic-bezier(0.4,0,0.2,1) 0.5s infinite alternate, circleColorFade3 8s linear 0.5s infinite' }} />
        <div className={styles.floatingCircle} style={{ width: 22, height: 22, left: '80%', bottom: '8%', background: randomPinkToPurple(), animation: 'floatCircleSin 5s cubic-bezier(0.4,0,0.2,1) 1.7s infinite alternate, circleColorFade2 8s linear 1.7s infinite' }} />
        <div className={styles.floatingCircle} style={{ width: 28, height: 28, right: '20%', top: '22%', background: randomPinkToPurple(), animation: 'floatCircleSin 8s cubic-bezier(0.4,0,0.2,1) 2.9s infinite alternate, circleColorFade1 8s linear 2.9s infinite' }} />
        {/* 动态正方形 */}
        {squares.filter(Boolean).map(sq => (
          <div
            key={sq.id}
            className={styles.squareAnimWrap}
            style={{ left: sq.left, right: sq.right, bottom: 0, width: sq.width, height: sq.height }}
          >
            <div
              className={styles.squareAnim}
              style={{
                width: sq.width,
                height: sq.height,
                animationDuration: `${sq.duration}s`,
                '--square-travel': `${sq.travel}px`
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
};

export default AuthBackground; 