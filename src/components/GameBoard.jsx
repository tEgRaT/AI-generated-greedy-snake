import React, { useState, useEffect, useCallback } from 'react';
import './GameBoard.css';

const GameBoard = () => {
    const [snake, setSnake] = useState([]);
    const [food, setFood] = useState([]);
    const [direction, setDirection] = useState('');
    const [rows, setRows] = useState(20);
    const [columns, setColumns] = useState(20);
    const [score, setScore] = useState(0);
    const [message, setMessage] = useState('');
    const [isGameRunning, setIsGameRunning] = useState(false);
    const [isFlashing, setIsFlashing] = useState(false);
    const [speed, setSpeed] = useState(500); // Initial speed in milliseconds

    // Calculate the number of rows and columns based on the viewport size
    useEffect(() => {
        const updateGridSize = () => {
            const cellSize = Math.min(window.innerHeight, window.innerWidth - 250) / 20; // Adjusted for control component width
            const newRows = Math.floor((window.innerHeight) / cellSize); // Reduced rows by 1
            const newColumns = Math.floor((window.innerWidth - 250) / cellSize); // Reduced columns by 2
            setRows(newRows);
            setColumns(newColumns);
            document.documentElement.style.setProperty('--rows', newRows);
            document.documentElement.style.setProperty('--columns', newColumns);

            // Calculate the sidebar width dynamically
            const sidebarWidth = window.innerWidth - newColumns * cellSize;
            document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
        };

        updateGridSize();
        window.addEventListener('resize', updateGridSize);
        return () => window.removeEventListener('resize', updateGridSize);
    }, []);

    // Handle key press for direction change
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isGameRunning) return;
            switch (e.key) {
                case 'ArrowUp':
                    setDirection('UP');
                    break;
                case 'ArrowDown':
                    setDirection('DOWN');
                    break;
                case 'ArrowLeft':
                    setDirection('LEFT');
                    break;
                case 'ArrowRight':
                    setDirection('RIGHT');
                    break;
                default:
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isGameRunning]);

    const isFoodPositionValid = (newFood, snake) => {
        return !snake.some(segment => segment[0] === newFood[0] && segment[1] === newFood[1]);
    };

    const generateFoodPosition = useCallback((snake, columns, rows) => {
        let newFood;
        do {
            newFood = [Math.floor(Math.random() * (columns - 2)) + 1, Math.floor(Math.random() * (rows - 2)) + 1];
        } while (!isFoodPositionValid(newFood, snake));
        return newFood;
    }, []);

    const getRandomDirection = (initialPosition, columns, rows) => {
        const directions = [];
        if (initialPosition[1] > 1) directions.push('UP');
        if (initialPosition[1] < rows - 2) directions.push('DOWN');
        if (initialPosition[0] > 1) directions.push('LEFT');
        if (initialPosition[0] < columns - 2) directions.push('RIGHT');
        return directions[Math.floor(Math.random() * directions.length)];
    };

    // Move snake
    useEffect(() => {
        if (!isGameRunning) return;

        const moveSnake = () => {
            const newSnake = [...snake];
            const head = newSnake[0];

            let newHead;
            switch (direction) {
                case 'UP':
                    newHead = [head[0], head[1] - 1];
                    break;
                case 'DOWN':
                    newHead = [head[0], head[1] + 1];
                    break;
                case 'LEFT':
                    newHead = [head[0] - 1, head[1]];
                    break;
                case 'RIGHT':
                    newHead = [head[0] + 1, head[1]];
                    break;
                default:
                    return;
            }

            // Check for collision with walls
            if (newHead[0] === 0 || newHead[0] === columns - 1 || newHead[1] === 0 || newHead[1] === rows - 1) {
                setMessage('Game Over');
                setIsGameRunning(false);
                setIsFlashing(true);
                setTimeout(() => setIsFlashing(false), 1500); // Flash for 3 times (0.5s * 3)
                return;
            }

            // Check for collision with self
            if (newSnake.some(segment => segment[0] === newHead[0] && segment[1] === newHead[1])) {
                setMessage('Game Over');
                setIsGameRunning(false);
                setIsFlashing(true);
                setTimeout(() => setIsFlashing(false), 1500); // Flash for 3 times (0.5s * 3)
                return;
            }

            newSnake.unshift(newHead);

            // Check if the snake has eaten the food
            if (newHead[0] === food[0] && newHead[1] === food[1]) {
                setFood(generateFoodPosition(newSnake, columns, rows));
                setScore(score + 1);
                setSpeed(speed => Math.max(50, speed - 20)); // Increase speed, minimum speed is 50ms
            } else {
                newSnake.pop();
            }

            setSnake(newSnake);
        };

        const interval = setInterval(moveSnake, speed);
        return () => clearInterval(interval);
    }, [snake, direction, food, rows, columns, generateFoodPosition, score, isGameRunning, speed]);

    const createWallElement = (key, columnStart, rowStart) => (
        <div key={key} className="wall" style={{ gridColumnStart: columnStart, gridRowStart: rowStart }}></div>
    );

    const renderWalls = () => {
        const walls = [];
        for (let i = 0; i < columns; i++) {
            walls.push(createWallElement(`top-${i}`, i + 1, 1));
            walls.push(createWallElement(`bottom-${i}`, i + 1, rows));
        }
        for (let i = 0; i < rows; i++) {
            walls.push(createWallElement(`left-${i}`, 1, i + 1));
            walls.push(createWallElement(`right-${i}`, columns, i + 1));
        }
        return walls;
    };

    const renderSnake = () => {
        return snake.map((segment, index) => (
            <div
                key={index}
                className={`snake ${isFlashing ? 'flash' : ''}`}
                style={{
                    gridColumnStart: segment[0] + 1,
                    gridRowStart: segment[1] + 1,
                }}
            ></div>
        ));
    };

    const renderFood = () => {
        return (
            <div
                className="food"
                style={{
                    gridColumnStart: food[0] + 1,
                    gridRowStart: food[1] + 1,
                }}
            ></div>
        );
    };

    const startGame = () => {
        const initialPosition = [Math.floor(Math.random() * (columns - 2)) + 1, Math.floor(Math.random() * (rows - 2)) + 1];
        setSnake([initialPosition]);
        setFood(generateFoodPosition([initialPosition], columns, rows));
        setDirection(getRandomDirection(initialPosition, columns, rows));
        setScore(0);
        setMessage('');
        setSpeed(500); // Reset speed to initial value
        setIsGameRunning(true);
    };

    return (
        <div className="game-container">
            <div className="game-board">
                {columns && rows && renderWalls()}
                {snake.length > 0 && renderSnake()}
                {food.length > 0 && renderFood()}
            </div>
            <div className="sidebar">
                <div className="title">
                    <span className="icon">🌸</span>
                    送给
                    <span className="highlight">张梓萱</span>
                    小朋友
                </div>
                <button className="start-button" onClick={startGame} disabled={isGameRunning}>开始</button>
                <div className="scoreboard">{score}</div>
                <div className={`message ${isFlashing ? 'flash' : ''}`}>{message}</div>
                <div className="control-pad">
                    <button className="control-button up" onClick={() => setDirection('UP')}>↑</button>
                    <button className="control-button left" onClick={() => setDirection('LEFT')}>←</button>
                    <button className="control-button right" onClick={() => setDirection('RIGHT')}>→</button>
                    <button className="control-button down" onClick={() => setDirection('DOWN')}>↓</button>
                </div>
            </div>
        </div>
    );
};

export default GameBoard;