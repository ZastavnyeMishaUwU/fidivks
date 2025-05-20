 const canvas = document.getElementById('simulationCanvas');
        const ctx = canvas.getContext('2d');
        
       
        let mass1 = 1.5;
        let mass2 = 2.0;
        let velocity1 = { x: 2.0, y: 0 };
        let velocity2 = { x: -1.0, y: 0 };
        let elasticity = 1.0;
        let impactType = 'central';
        
       
        const ballRadius = 25;
        let ball1 = { x: 200, y: 200 };
        let ball2 = { x: 500, y: 200 };
        
        
        let animationId = null;
        let isRunning = false;
        let collisionType = 'head';
        
        
        const mass1Input = document.getElementById('mass1');
        const mass2Input = document.getElementById('mass2');
        const velocity1Input = document.getElementById('velocity1');
        const velocity2Input = document.getElementById('velocity2');
        const angle1Input = document.getElementById('angle1');
        const angle2Input = document.getElementById('angle2');
        const elasticityInput = document.getElementById('elasticity');
        const elasticityValue = document.getElementById('elasticityValue');
        const impactTypeSelect = document.getElementById('impactType');
        const startBtn = document.getElementById('startBtn');
        const resetBtn = document.getElementById('resetBtn');
        const randomBtn = document.getElementById('randomBtn');
        const kineticEnergyDisplay = document.getElementById('kineticEnergy');
        const momentumXDisplay = document.getElementById('momentumX');
        const momentumYDisplay = document.getElementById('momentumY');
        const comVelocityXDisplay = document.getElementById('comVelocityX');
        const comVelocityYDisplay = document.getElementById('comVelocityY');
        const collisionAngleDisplay = document.getElementById('collisionAngle');
        const collisionTypeRadios = document.querySelectorAll('input[name="collisionType"]');
        
     
        startBtn.addEventListener('click', startSimulation);
        resetBtn.addEventListener('click', resetSimulation);
        randomBtn.addEventListener('click', setRandomParameters);
        elasticityInput.addEventListener('input', updateElasticity);
        impactTypeSelect.addEventListener('change', updateImpactType);
        
        collisionTypeRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                collisionType = this.value;
                setupCollisionScenario();
            });
        });
        
        function updateElasticity() {
            elasticity = elasticityInput.value / 100;
            elasticityValue.textContent = `${elasticityInput.value}%`;
        }
        
        function updateImpactType() {
            impactType = impactTypeSelect.value;
        }
        
        function setupCollisionScenario() {
            switch(collisionType) {
                case 'head':
                    angle1Input.value = 0;
                    angle2Input.value = 180;
                    break;
                case 'oblique':
                    angle1Input.value = 30;
                    angle2Input.value = 210;
                    break;
                case 'rightAngle':
                    angle1Input.value = 0;
                    angle2Input.value = 90;
                    break;
            }
        }
        
        function setRandomParameters() {
            //маси
            mass1Input.value = (Math.random() * 4 + 0.5).toFixed(1);
            mass2Input.value = (Math.random() * 4 + 0.5).toFixed(1);
            
            //швидкості
            velocity1Input.value = (Math.random() * 5 + 0.5).toFixed(1);
            velocity2Input.value = (Math.random() * 5 + 0.5).toFixed(1);
            
            //кути
            angle1Input.value = Math.floor(Math.random() * 360);
            angle2Input.value = Math.floor(Math.random() * 360);
            
            //пружність
            elasticityInput.value = Math.floor(Math.random() * 100);
            updateElasticity();
            
            //тип поштовху
            const impactTypes = ['central', 'glancing', 'partial'];
            impactTypeSelect.value = impactTypes[Math.floor(Math.random() * impactTypes.length)];
            updateImpactType();
            
            //тип зіткнення
            const types = ['head', 'oblique', 'rightAngle'];
            const randomType = types[Math.floor(Math.random() * types.length)];
            document.querySelector(`input[value="${randomType}"]`).checked = true;
            collisionType = randomType;
        }
        
        function startSimulation() {
            if (isRunning) return;
            
       
            mass1 = parseFloat(mass1Input.value);
            mass2 = parseFloat(mass2Input.value);
            
            const speed1 = parseFloat(velocity1Input.value);
            const angle1 = parseFloat(angle1Input.value) * Math.PI / 180;
            velocity1 = {
                x: speed1 * Math.cos(angle1),
                y: speed1 * Math.sin(angle1)
            };
            
            const speed2 = parseFloat(velocity2Input.value);
            const angle2 = parseFloat(angle2Input.value) * Math.PI / 180;
            velocity2 = {
                x: speed2 * Math.cos(angle2),
                y: speed2 * Math.sin(angle2)
            };
            
            elasticity = parseFloat(elasticityInput.value) / 100;
            impactType = impactTypeSelect.value;
            
            // Початкові позиції
            ball1 = { x: 200, y: canvas.height / 2 };
            ball2 = { x: 600, y: canvas.height / 2 };
            
            isRunning = true;
            startBtn.disabled = true;
            animate();
        }
        
        function resetSimulation() {
            isRunning = false;
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
            startBtn.disabled = false;
            

            ball1 = { x: 200, y: canvas.height / 2 };
            ball2 = { x: 600, y: canvas.height / 2 };
            
          
            drawBalls();
            updatePhysicsInfo();
        }
        
        function animate() {
            // Рух 
            ball1.x += velocity1.x;
            ball1.y += velocity1.y;
            ball2.x += velocity2.x;
            ball2.y += velocity2.y;
            
            // Перевірка на зіткнення
            const dx = ball1.x - ball2.x;
            const dy = ball1.y - ball2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= ballRadius * 2) {
                // Кут зіткнення
                const collisionAngle = Math.atan2(dy, dx);
                collisionAngleDisplay.textContent = (collisionAngle * 180 / Math.PI).toFixed(1);
                
                // Розрахунок після зіткнення
                const rotatedV1 = rotate(velocity1, -collisionAngle);
                const rotatedV2 = rotate(velocity2, -collisionAngle);
                
                //різні типи поштовхів
                let impactFactor = 1.0;
                if (impactType === 'glancing') impactFactor = 0.5;
                if (impactType === 'partial') impactFactor = 0.7 + Math.random() * 0.3;
                
                
                const v1f = ((mass1 - elasticity * impactFactor * mass2) * rotatedV1.x + 
                            (1 + elasticity * impactFactor) * mass2 * rotatedV2.x) / (mass1 + mass2);
                const v2f = ((mass2 - elasticity * impactFactor * mass1) * rotatedV2.x + 
                            (1 + elasticity * impactFactor) * mass1 * rotatedV1.x) / (mass1 + mass2);
                
                // Нові швидкості
                rotatedV1.x = v1f;
                rotatedV2.x = v2f;
                
                velocity1 = rotate(rotatedV1, collisionAngle);
                velocity2 = rotate(rotatedV2, collisionAngle);
                
                // Розділяємо кулі
                const overlap = ballRadius * 2 - distance;
                const moveX = (overlap / 2) * Math.cos(collisionAngle);
                const moveY = (overlap / 2) * Math.sin(collisionAngle);
                
                ball1.x += moveX;
                ball1.y += moveY;
                ball2.x -= moveX;
                ball2.y -= moveY;
            }
            
            // Перевірка меж 
            handleBoundaryCollision(ball1, velocity1);
            handleBoundaryCollision(ball2, velocity2);
            
            drawBalls();
            updatePhysicsInfo();
            
            if (isRunning) {
                animationId = requestAnimationFrame(animate);
            }
        }
        
        function handleBoundaryCollision(ball, velocity) {
            if (ball.x - ballRadius < 0) {
                ball.x = ballRadius;
                velocity.x = -velocity.x * elasticity;
            }
            if (ball.x + ballRadius > canvas.width) {
                ball.x = canvas.width - ballRadius;
                velocity.x = -velocity.x * elasticity;
            }
            if (ball.y - ballRadius < 0) {
                ball.y = ballRadius;
                velocity.y = -velocity.y * elasticity;
            }
            if (ball.y + ballRadius > canvas.height) {
                ball.y = canvas.height - ballRadius;
                velocity.y = -velocity.y * elasticity;
            }
        }
        
        function rotate(vector, angle) {
            return {
                x: vector.x * Math.cos(angle) - vector.y * Math.sin(angle),
                y: vector.x * Math.sin(angle) + vector.y * Math.cos(angle)
            };
        }
        
        function drawBalls() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            //куля 1
            ctx.beginPath();
            ctx.arc(ball1.x, ball1.y, ballRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#4a8fd7';
            ctx.fill();
            ctx.strokeStyle = '#2a5885';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Підпис для кулі 1
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${mass1} кг`, ball1.x, ball1.y);
            
            //куля 2
            ctx.beginPath();
            ctx.arc(ball2.x, ball2.y, ballRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#ff6b6b';
            ctx.fill();
            ctx.strokeStyle = '#d43f3f';
            ctx.stroke();
            
            // Підпис для кулі 2
            ctx.fillStyle = 'white';
            ctx.fillText(`${mass2} кг`, ball2.x, ball2.y);
            
            //вектори швидкостей
            drawVector(ball1.x, ball1.y, velocity1.x * 20, velocity1.y * 20, '#2a5885');
            drawVector(ball2.x, ball2.y, velocity2.x * 20, velocity2.y * 20, '#d43f3f');
            
            //лінію центру мас
            const comX = (mass1 * ball1.x + mass2 * ball2.x) / (mass1 + mass2);
            const comY = (mass1 * ball1.y + mass2 * ball2.y) / (mass1 + mass2);
            ctx.beginPath();
            ctx.arc(comX, comY, 5, 0, Math.PI * 2);
            ctx.fillStyle = 'green';
            ctx.fill();
        }
        
        function drawVector(x, y, dx, dy, color) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + dx, y + dy);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // стрілочки
            const angle = Math.atan2(dy, dx);
            ctx.beginPath();
            ctx.moveTo(x + dx, y + dy);
            ctx.lineTo(x + dx - 10 * Math.cos(angle - Math.PI/6), y + dy - 10 * Math.sin(angle - Math.PI/6));
            ctx.moveTo(x + dx, y + dy);
            ctx.lineTo(x + dx - 10 * Math.cos(angle + Math.PI/6), y + dy - 10 * Math.sin(angle + Math.PI/6));
            ctx.strokeStyle = color;
            ctx.stroke();
        }
        
        function updatePhysicsInfo() {
            // Розрахунок кінетичної енергії
            const speed1 = Math.sqrt(velocity1.x * velocity1.x + velocity1.y * velocity1.y);
            const speed2 = Math.sqrt(velocity2.x * velocity2.x + velocity2.y * velocity2.y);
            const ke1 = 0.5 * mass1 * speed1 * speed1;
            const ke2 = 0.5 * mass2 * speed2 * speed2;
            const totalKE = ke1 + ke2;
            
            // Розрахунок імпульсу
            const p1x = mass1 * velocity1.x;
            const p1y = mass1 * velocity1.y;
            const p2x = mass2 * velocity2.x;
            const p2y = mass2 * velocity2.y;
            const totalPx = p1x + p2x;
            const totalPy = p1y + p2y;
            
            // Розрахунок швидкості центру мас
            const comVx = totalPx / (mass1 + mass2);
            const comVy = totalPy / (mass1 + mass2);
            
            //відображення даних
            kineticEnergyDisplay.textContent = totalKE.toFixed(2);
            momentumXDisplay.textContent = totalPx.toFixed(2);
            momentumYDisplay.textContent = totalPy.toFixed(2);
            comVelocityXDisplay.textContent = comVx.toFixed(2);
            comVelocityYDisplay.textContent = comVy.toFixed(2);
        }
        
        // Ініціалізація
        drawBalls();
        updatePhysicsInfo();
