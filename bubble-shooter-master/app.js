
window.onload = () => {

    //cavas
    const canvas = document.getElementById("viewport");
    const context = canvas.getContext("2d");

    //fps
    let lastTimeStamp = 0,
        fpsTime = 0,
        frameCount = 0,
        fps = 0;

    let grid = null;
    let catcherCell = null;

    
    let gameOver = false;
    let addRowNumber = 0;
    let roundCount = 0;
    let bubbleSettled = false;
    let score = 0;

    
    let startRow = 6;
    
    let addRowBubble = true;

        
    let animationTime = 0;
    let animationFinish = false;
    let animationStart = false;
    let sameColorBubbles = null;
    let floatingBubbles = null;
    let duration = 0.3;

    
    const shooter = {
        originX: 0,
        originY: 0,
        arrowAngle: Math.PI / 2,
        arrowHeadX: 0,
        arrowHeadY: 0,
        arrowLength: 50,
        arrowHeadLX: 0,
        arrowHeadLY: 0,
        arrowHeadRX: 0,
        arrowHeadRY: 0,
        arrowArcLX: 0,
        arrowArcLY: 0,
        arrowTailX: 0,
        arrowTailY: 0
    };

    const playerBubble = {
        loading: null,
        nextOne: null
    };

    const colors = ["rgba(255,48,48,transparency)", "rgba(255,165,0,transparency)", "rgba(0,205,0,transparency)", "rgba(64,224,208,transparency)", "rgba(106,90,205,transparency)", "rgba(208,32,144,transparency)", "rgba(255,110,180,transparency)", "White"];

    
    const Grid = class {
        constructor(rows, columns, cellWidth, cellHeight) {
            this.columns = columns;
            this.rows = rows;
            this.cellWidth = cellWidth;
            this.cellHeight = cellHeight;
            this.cells = [];
        }
        
        init() {
            for (let i = 0; i <= this.rows - 1; i++) {
                this.cells[i] = [];
            }
        }
        
        fill() {
            let count = 0;
            let color = randomFrom(0, 6);
            for (let i = 0; i <= this.rows - 1; i++) {
                for (let j = 0; j <= this.columns - 1; j++) {
                    if (i < startRow) {
                        if (count >= 2) { 
                            let preColor = color;
                            color = randomFrom(0, 6);
                            if (color === preColor) {
                                color = (color + 1) % 7
                            }
                            count = 0;
                        }
                        this.cells[i][j] = new Cell(color, "bubble", i, j, 1, true, 0) 
                    } else {
                        this.cells[i][j] = new Cell(7, "empty", i, j, 1, false, 0)
                    }
                    count++;
                }
            }
        }
    };


    const Cell = class {
        constructor(color, type, i, j, transparency, visible, deviation) {
            this.color = color;
            this.type = type;
            this.i = i;
            this.j = j;
            this.transparency = transparency;
            this.visible = visible;
            this.deviation = deviation;
        }

        getCenter(cellWidth, cellHeight) {
            
            if ((addRowNumber + this.i) % 2 === 0) {
                return ({
                    x: (this.j + 0.5) * cellWidth,
                    y: (this.i + 0.5) * cellHeight + 5        
                })
            } else {
                return ({
                    x: (this.j + 1) * cellWidth,
                    y: (this.i + 0.5) * cellHeight + 5
                })
            }
        }
    };

 
    const PlayerBubble = class {
        constructor(x, y, prevX, prevY, color, speed = 1000, flyingAngle, trigger, reload) {
            this.x = x;
            this.y = y;
            this.prevX = prevX;
            this.prevY = prevY;
            this.color = color;
            this.speed = speed;
            this.flyingAngle = flyingAngle;
            this.trigger = trigger;
            this.reload = reload;
        }
    };

   
    const init = () => {
    
        canvas.addEventListener("mousedown", handleMouseDown);
        canvas.addEventListener("mousemove", handleMouseMove);
   
        document.addEventListener("keydown", handleKeyDown);

        newGame();

                  
        mainLoop(0);
    };

    const newGame = () => {
        
        grid = new Grid(15, 15, 40, 35);
        grid.init();
        grid.fill();

        //shooter
        shooter.originX = (grid.columns + 0.5) * grid.cellWidth / 2;
        shooter.originY = (grid.rows - 1) * grid.cellHeight - 5;

                
        updateShooter(Math.PI / 2);

        
        playerBubble.loading = new PlayerBubble(shooter.originX, shooter.originY, 0, 0, randomFrom(0, 6), undefined, 0, false, false);
        playerBubble.nextOne = new PlayerBubble(shooter.originX - grid.cellWidth * 3, shooter.originY, 0, 0, randomFrom(0, 6), undefined, 0, false, false);

        gameOver = false;
        addRowNumber = 0;
        roundCount = 0;
        bubbleSettled = false;
        score = 0;
    };

        
    const mainLoop = (timeStamp) => {
    
        window.requestAnimationFrame(mainLoop);
    
        update(timeStamp);
    
        render();
    };

    const update = (timeStamp) => {
           let realDeltaT = (timeStamp - lastTimeStamp) / 1000;
        let deltaT = realDeltaT;
        lastTimeStamp = timeStamp;
    
        if (realDeltaT > 0.02) {
            deltaT = 0.02
        }
    
        updateFps(realDeltaT);
    //shooter
        updateShooter(shooter.arrowAngle);
        
        updatePlayerBubble(deltaT);
        
        updateGridBubble(deltaT);
    };

    const updateFps = (deltaT) => {
        //0.1        
        if (fpsTime > 0.1) {
            fps = Math.round(frameCount / fpsTime);
            frameCount = 0;
            fpsTime = 0;
        } else {
            fpsTime += deltaT;
            frameCount++;
        }
    };

    const updateShooter = (arrowAngle) => {
        
        shooter.arrowHeadX = shooter.arrowLength * Math.cos(arrowAngle) + shooter.originX;
        shooter.arrowHeadY = -(shooter.arrowLength * Math.sin(arrowAngle) - shooter.originY);
        shooter.arrowHeadLX = (shooter.arrowLength - 10) * Math.cos(arrowAngle + 10 / 180 * Math.PI) + shooter.originX;
        shooter.arrowHeadLY = -((shooter.arrowLength - 10) * Math.sin(arrowAngle + 10 / 180 * Math.PI) - shooter.originY);
        shooter.arrowHeadRX = (shooter.arrowLength - 10) * Math.cos(arrowAngle - 10 / 180 * Math.PI) + shooter.originX;
        shooter.arrowHeadRY = -((shooter.arrowLength - 10) * Math.sin(arrowAngle - 10 / 180 * Math.PI) - shooter.originY);
        
        shooter.arrowArcLX = (shooter.arrowLength - 25) * Math.cos(arrowAngle + 45 / 180 * Math.PI) + shooter.originX;
        shooter.arrowArcLY = -((shooter.arrowLength - 25) * Math.sin(arrowAngle + 45 / 180 * Math.PI) - shooter.originY);
        shooter.arrowArcRX = (shooter.arrowLength - 25) * Math.cos(arrowAngle - 45 / 180 * Math.PI) + shooter.originX;
        shooter.arrowArcRY = -((shooter.arrowLength - 25) * Math.sin(arrowAngle - 45 / 180 * Math.PI) - shooter.originY);
        
        shooter.arrowTailX = (shooter.arrowLength - 25) * Math.cos(arrowAngle) + shooter.originX;
        shooter.arrowTailY = -((shooter.arrowLength - 25) * Math.sin(arrowAngle) - shooter.originY);
    };

    const updatePlayerBubble = (deltaT) => {
         
        updateLoadingBubble(deltaT);
        
        updateNextOne(deltaT);
    };

    const updateLoadingBubble = (deltaT) => {
        if (playerBubble.loading.trigger && playerBubble.loading.speed > 0) {
            
            let x = playerBubble.loading.x;
            let y = playerBubble.loading.y;
            let interpolationFactor = 0.85;
           
            playerBubble.loading.x += deltaT * playerBubble.loading.speed * Math.cos(playerBubble.loading.flyingAngle);
            playerBubble.loading.y -= deltaT * playerBubble.loading.speed * Math.sin(playerBubble.loading.flyingAngle);
          
            playerBubble.loading.prevX = interpolation(x, playerBubble.loading.x, interpolationFactor);
            playerBubble.loading.prevY = interpolation(y, playerBubble.loading.y, interpolationFactor);
           
            if (playerBubble.loading.x - grid.cellWidth / 2 < 0) {
                playerBubble.loading.prevY = interpolation(y, playerBubble.loading.y, interpolationFactor);
                playerBubble.loading.x = 0 + grid.cellWidth / 2;
                playerBubble.loading.prevX = x;
                playerBubble.loading.flyingAngle = Math.PI - playerBubble.loading.flyingAngle;
            }
            
            if (playerBubble.loading.x + grid.cellWidth / 2 > (grid.columns + 0.5) * grid.cellWidth) {
                playerBubble.loading.prevY = interpolation(y, playerBubble.loading.y, interpolationFactor);
                playerBubble.loading.x = grid.columns * grid.cellWidth;
                playerBubble.loading.prevX = x;
                playerBubble.loading.flyingAngle = Math.PI - playerBubble.loading.flyingAngle;
            }
           
            if (playerBubble.loading.y - grid.cellHeight / 2 < 0) {
                playerBubble.loading.x = x;
                playerBubble.loading.prevX = x;
                playerBubble.loading.y = grid.cellWidth / 2;
                playerBubble.loading.prevY = playerBubble.loading.y;
                playerBubble.loading.speed = 0;
                catchBubble(playerBubble.loading.prevX, playerBubble.loading.prevY);
                return;
            }
           
            playerBubble.loading.prevX = interpolation(x, playerBubble.loading.x, interpolationFactor);
            playerBubble.loading.prevY = interpolation(y, playerBubble.loading.y, interpolationFactor);
            let x1 = playerBubble.loading.x;
            let y1 = playerBubble.loading.y;
            let r1 = grid.cellWidth / 2;
           
            let currentIndex = calBubbleIndex(x1, y1);
            let left = currentIndex.j - 2;
            let right = currentIndex.j + 2;
            let top = currentIndex.i - 2;
            let bottom = currentIndex.i + 2;
            if (left < 0) {
                left = 0;
            }
            if (right > grid.columns) {
                right = grid.columns;
            }
            if (top < 0) {
                top = 0;
            }
            if (bottom > grid.rows) {
                bottom = grid.rows;
            }
                       
            for (let i = top; i < bottom; i++) {
                for (let j = left; j < right; j++) {
                                        
                    if (grid.cells[i][j].type === "empty") {
                        continue;
                    }
                    let x2 = grid.cells[i][j].getCenter(grid.cellWidth, grid.cellHeight).x;
                    let y2 = grid.cells[i][j].getCenter(grid.cellWidth, grid.cellHeight).y;
                    let r2 = grid.cellWidth / 2;
                    if (checkIntersection(x1, y1, r1, x2, y2, r2)) {
                        playerBubble.loading.speed = 0;
                        catchBubble(playerBubble.loading.prevX, playerBubble.loading.prevY);
                        return;
                    }
                }
            }
        }
    };

    const updateNextOne = (deltaT) => {
        if (playerBubble.nextOne.reload) {
            playerBubble.nextOne.x += playerBubble.nextOne.speed * deltaT;
            if (playerBubble.nextOne.x > shooter.originX) {
                playerBubble.nextOne.x = shooter.originX;
                nextShoot();
            }
        }
    };

    const nextShoot = () => {
        playerBubble.loading = playerBubble.nextOne;
        playerBubble.nextOne = new PlayerBubble(shooter.originX - grid.cellWidth * 3, shooter.originY, 0, 0, randomFrom(0, 6), undefined, 0, false, false);
    };

    
    const catchBubble = (x, y) => {
        let index = calBubbleIndex(x, y);
       
        if (index.i < 0) {
            index.i = 0;
        }
        if (index.i >= grid.columns) {
            index.i = grid.columns - 1;
        }
        if (index.j < 0) {
            index.j = 0;
        }
        if (index.j >= grid.rows) {
            index.j = grid.rows - 1;
        }

        catcherCell = grid.cells[index.i][index.j];
        catcherCell.type = "bubble";
        catcherCell.visible = true;
        catcherCell.color = playerBubble.loading.color;
       
        bubbleSettled = true;
    };

    
    const calBubbleIndex = (x, y) => {
        let i = Math.floor(y / grid.cellHeight);
        let j;
        if ((addRowNumber + i) % 2 === 0) {
            j = Math.floor(x / grid.cellWidth);
        } else {
            j = Math.floor((x - grid.cellWidth / 2) / grid.cellWidth);
        }
        return ({ i, j })
    };



    const checkIntersection = (x1, y1, r1, x2, y2, r2) => {
        let distance = Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
        if (r1 + r2 > distance) {
            return true;
        }
        return false;
    };

    const updateGridBubble = (deltaT) => {
        if (bubbleSettled) {
            animationTime += deltaT;
            if (animationTime > duration) {
                animationFinish = true;
            }
      
            if (!animationStart) {
                //计算相连泡泡                
                sameColorBubbles = findConnectedBubbles(true, catcherCell);
              
                if (sameColorBubbles.length >= 3) {
                    for (let i = 0; i < sameColorBubbles.length; i++) {
                        sameColorBubbles[i].type = "empty";
                        sameColorBubbles[i].transparency = 1;
                        score++;
                    }
                                    
                    floatingBubbles = findFloatingBubble();
                                   
                    for (let i = 0; i < floatingBubbles.length; i++) {
                        floatingBubbles[i].type = "empty";
                        floatingBubbles[i].transparency = 1;
                        score++;
                    }
                    
                    if (sameColorBubbles.length >= 3) {
                        animationStart = true;
                    }
                }
            }

      
            if (animationStart && !animationFinish) {
                         
                for (let i = 0; i < sameColorBubbles.length; i++) {
                    sameColorBubbles[i].transparency = 1 - animationTime / duration;
                }
                           
                for (let i = 0; i < floatingBubbles.length; i++) {
                    floatingBubbles[i].transparency = 1 - animationTime / duration;
                    floatingBubbles[i].deviation = 120 * animationTime / duration;   
                }
            }

     
            if (animationFinish || sameColorBubbles.length < 3) {
          
                if (animationFinish) {
                    for (let i = 0; i < sameColorBubbles.length; i++) {
                        sameColorBubbles[i].transparency = 1;
                        sameColorBubbles[i].visible = false;
                    }
                    for (let i = 0; i < floatingBubbles.length; i++) {
                        floatingBubbles[i].transparency = 1;
                        floatingBubbles[i].visible = false;
                        floatingBubbles[i].deviation = 0;
                    }
                }

         
                if (sameColorBubbles.length < 3) {
                    roundCount++;
                }

     
                checkGameOver();

          
                if (addRowBubble && roundCount > 6 && !gameOver) {
                    addBubble();
                    roundCount = 0;
                }

           
                sameColorBubbles = null;
                floatingBubbles = null;
                animationTime = 0;
                animationStart = false;
                animationFinish = false;
                bubbleSettled = false;
                playerBubble.nextOne.reload = true;

            }
        }
    };

   
    const findConnectedBubbles = (checkColor, targetCell) => {
      
        let toProccess = [targetCell];
        let color = targetCell.color;
        
        let proccessed = new Set();
     
        let connectedBubbles = [];
        while (toProccess.length > 0) {
         
            let current = toProccess.pop();
            
            if (!proccessed.has(current)) {
                connectedBubbles.push(current);
            } else {
                continue;
            }
            proccessed.add(current);
            let curNeighbor = findNeighbor(current);
            while (curNeighbor.length > 0) {
                let cell = curNeighbor.pop();
                // toProcess
                if (checkColor && !proccessed.has(cell) && cell.type === "bubble" && cell.color === color) {
                    toProccess.push(cell);
                } else if (!checkColor && !proccessed.has(cell) && cell.type === "bubble") {
                    toProccess.push(cell);
                }
            }
        }
        return connectedBubbles;

    };

    const findFloatingBubble = () => {
        let proccessed = new Set();
        let floatingBubbles = [];
        for (let i = 0; i < grid.rows; i++) {
            for (let j = 0; j < grid.columns; j++) {
                let currentBubble = grid.cells[i][j];
                let connectedBubbles = [];
                let floating = true;
                if (!proccessed.has(currentBubble) && grid.cells[i][j].type === "bubble") {
                    connectedBubbles = findConnectedBubbles(false, grid.cells[i][j]);
                    connectedBubbles.forEach((cell) => {
                        proccessed.add(cell);
                        if (cell.i === 0) {                 
                            floating = false;
                        }
                    });
                    if (floating) {
                        connectedBubbles.forEach((cell) => {
                            floatingBubbles.push(cell);
                        })
                    }
                }
            }
        }
        return [... new Set(floatingBubbles)];     
    };

    const findNeighbor = (cell) => {
        let i = cell.i;
        let j = cell.j;
        let possibleIndex = [];
        let neighbors = [];
 
        if ((addRowNumber + i) % 2 === 0) {
            possibleIndex = [[i, j - 1], [i, j + 1], [i - 1, j], [i - 1, j - 1], [i + 1, j], [i + 1, j - 1]];
        } else {
            possibleIndex = [[i, j - 1], [i, j + 1], [i - 1, j + 1], [i - 1, j], [i + 1, j + 1], [i + 1, j]];
        }
        for (let k = 0; k < possibleIndex.length; k++) {
            let nx = possibleIndex[k][0];
            let ny = possibleIndex[k][1];
            if (nx >= 0 && nx < grid.columns && ny >= 0 && ny < grid.rows) {
                neighbors.push(grid.cells[nx][ny]);
            }
        }
        return neighbors;
    };

    const addBubble = () => {
        
        for (let i = grid.rows - 1; i > 0; i--) {
            for (let j = 0; j < grid.columns; j++) {
                grid.cells[i][j].type = grid.cells[i - 1][j].type;
                grid.cells[i][j].color = grid.cells[i - 1][j].color;
                grid.cells[i][j].visible = grid.cells[i - 1][j].visible;
            }
        }

        for (let j = 0; j <= grid.columns - 1; j++) {
            color = randomFrom(0, 6);
            grid.cells[0][j] = new Cell(color, "bubble", 0, j, 1, true, 0)
        }
 
        addRowNumber++;
        checkGameOver();
    };

    const checkGameOver = () => {
        for (let j = 0; j < grid.columns; j++) {
            if (grid.cells[12][j].type === "bubble") {
                gameOver = true;
            }
        }
    };

    const render = () => {

        drawBackground();
        drawFps();
        drawScore();
  
        drawGridBubble();

        drawShooter();

        drawPlayerBubble();
  
        if (gameOver) {
            drawGameOver();
        }
    };

    const drawBackground = () => {
        context.fillStyle = "#E8E8E8";
        context.fillRect(0, 0, (grid.columns + 0.5) * grid.cellWidth, grid.rows * grid.cellHeight);
    };

    const drawFps = () => {
        context.fillStyle = "#696969";
        context.font = "14px Ariel";
        context.textAlign = "left";
        context.fillText("FPS: " + fps, 20, 505);
    };

    const drawScore = () => {
        context.fillStyle = "#696969";
        context.font = "18px Ariel";
        context.textAlign = "left";
        context.fillText("Score: " + score, 500, 500);
    };

    const drawGameOver = () => {
        context.fillStyle = "rgba(0, 0, 0, 0.5)";
        context.fillRect(0, 150, (grid.columns + 0.5) * grid.cellWidth, 220);
        context.fillStyle = "white";
        context.font = "bold 48px Ariel";
        context.textAlign = "center";
        context.fillText("Game Over", (grid.columns + 0.5) * grid.cellWidth / 2, grid.rows * grid.cellHeight / 2);
    };

    const drawGridBubble = () => {
        for (let i = 0; i < grid.rows; i++) {
            for (let j = 0; j < grid.columns; j++) {
                let cell = grid.cells[i][j];
                let color = colors[cell.color];
                let transparency = cell.transparency;
                let transColor = color.replace("transparency", transparency);
                if (cell.visible) {
                    context.beginPath();
                    let x = cell.getCenter(grid.cellWidth, grid.cellHeight).x;
                    let y = cell.getCenter(grid.cellWidth, grid.cellHeight).y + cell.deviation;
                    context.arc(x, y, grid.cellWidth / 2, 0, 2 * Math.PI, false);
                    context.fillStyle = transColor;
                    context.fill();
                }
            }
        }
    };

    const drawShooter = () => {

        context.beginPath();
        context.strokeStyle = "#8B8878";
        context.lineWidth = 2;
        context.moveTo(shooter.arrowTailX, shooter.arrowTailY);
        context.lineTo(shooter.arrowHeadX, shooter.arrowHeadY);
        context.moveTo(shooter.arrowHeadX, shooter.arrowHeadY);
        context.lineTo(shooter.arrowHeadLX, shooter.arrowHeadLY);
        context.moveTo(shooter.arrowHeadX, shooter.arrowHeadY);
        context.lineTo(shooter.arrowHeadRX, shooter.arrowHeadRY);

        context.moveTo(shooter.arrowArcRX, shooter.arrowArcRY);
        context.arc(shooter.originX, shooter.originY, 25, Math.PI * 1 / 4 - shooter.arrowAngle, -Math.PI * 1 / 4 - shooter.arrowAngle, true)
        context.stroke();
  
        context.beginPath();
        context.fillStyle = "rgba(193,205,205,0.5)";
        context.arc(shooter.originX, shooter.originY, 23, 0, 2 * Math.PI, false);
        context.arc(shooter.originX - grid.cellWidth * 3, shooter.originY, 23, 0, 2 * Math.PI, false);
        context.fill();
    };

    const drawPlayerBubble = () => {
 
        if (playerBubble.loading.speed > 0) {
            context.beginPath();
            let loadingColor = colors[playerBubble.loading.color];
            let transparency = 1;
            let transloadingColor = loadingColor.replace("transparency", transparency);
            context.fillStyle = transloadingColor;
            context.arc(playerBubble.loading.x, playerBubble.loading.y, grid.cellWidth / 2, 0, 2 * Math.PI, false);
            context.fill();
        }
        context.beginPath();
        let nextOneColor = colors[playerBubble.nextOne.color];
        let transNextOneColor = nextOneColor.replace("transparency", 1)
        context.fillStyle = transNextOneColor;
        context.arc(playerBubble.nextOne.x, playerBubble.nextOne.y, grid.cellWidth / 2, 0, 2 * Math.PI, false);
        context.fill();
    };

    const randomFrom = (low, high) => {
        return Math.floor(Math.random() * (high - low + 1) + low)
    };

    const interpolation = (x1, x2, factor) => {
        return (x1 + (x2 - x1) * factor)
    }

    const handleMouseDown = (event) => {
        if (event.button === 0) {
  
            if (!playerBubble.loading.trigger && !gameOver) {
                playerBubble.loading.trigger = true;
                playerBubble.loading.flyingAngle = shooter.arrowAngle;
            }

            if (gameOver) {
                newGame();
            }
        }
    };

    const handleMouseMove = (event) => {
        if (gameOver) {
            return;
        }

        let pos = getMousePos(event);
        //8-172°
        let low = 8 / 180 * Math.PI;
        let high = 172 / 180 * Math.PI;
        shooter.arrowAngle = Math.atan2(- (pos.y - shooter.originY), pos.x - shooter.originX);
        //3，4atan2-Pi
        if (shooter.arrowAngle < 0) {
            shooter.arrowAngle += 2 * Math.PI;
        }
        
        if (shooter.arrowAngle >= high && shooter.arrowAngle <= 1.5 * Math.PI) {
            shooter.arrowAngle = high;
        } else if (shooter.arrowAngle > 1.5 * Math.PI) {
            shooter.arrowAngle = low;
        } else if (shooter.arrowAngle < low) {
            shooter.arrowAngle = low;
        }
    };

    const getMousePos = (event) => {
        let rec = canvas.getBoundingClientRect();
        return {
            x: Math.round((event.clientX - rec.left) / (rec.right - rec.left) * canvas.width),
            y: Math.round((event.clientY - rec.top) / (rec.bottom - rec.top) * canvas.height)
        }
    };

    const handleKeyDown = (event) => {
        if (gameOver && event.keyCode === 27) {//ESC
            newGame();
        }
    };

    init();
}