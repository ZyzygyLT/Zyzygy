let generatedNumber;
let attempts;

function generateUniqueNumber() {
    let digits = [];
    while (digits.length < 4) {
        let randomDigit = Math.floor(Math.random() * 10);
        if (!digits.includes(randomDigit) && !(digits.length === 0 && randomDigit === 0)) {
            digits.push(randomDigit);
        }
    }
    return digits.join('');
}

function setDifficulty() {
    const difficulty = document.querySelector('input[name="difficulty"]:checked');
    if (!difficulty) {
        alert("Por favor, selecciona una dificultad.");
        return;
    }

    switch (difficulty.value) {
        case 'easy':
            attempts = 12;
            break;
        case 'normal':
            attempts = 10;
            break;
        case 'hard':
            attempts = 8;
            break;
    }
    document.getElementById('difficultySection').style.display = 'none'; // Ocultar sección de dificultad
    document.getElementById('gameSection').style.display = 'block'; // Mostrar sección del juego
    startGame();
}

function startGame() {
    generatedNumber = generateUniqueNumber();
    document.getElementById('result').textContent = '';
    document.getElementById('history').innerHTML = '';
    document.getElementById('userInput').disabled = false;
    document.getElementById('checkButton').disabled = false;
    document.getElementById('userInput').value = '';
    document.getElementById('restartButton').style.display = 'none';
}

function checkNumber() {
    const userInput = document.getElementById('userInput').value;
    const resultDiv = document.getElementById('result');
    const historyDiv = document.getElementById('history');

    if (!isValidInput(userInput)) {
        resultDiv.textContent = "Por favor, ingresa un número de 4 cifras sin cifras repetidas y que no empiece con 0.";
        return;
    }

    attempts--;
    let toroCount = 0;
    let vacaCount = 0;

    for (let i = 0; i < 4; i++) {
        if (userInput[i] === generatedNumber[i]) {
            toroCount++;
        } else if (generatedNumber.includes(userInput[i])) {
            vacaCount++;
        }
    }

    if (toroCount === 4) {
        resultDiv.textContent = "¡Felicidades! Adivinaste el número: " + generatedNumber;
        historyDiv.innerHTML += `<p>${userInput} - ¡Felicidades!</p>`;
        document.getElementById('userInput').disabled = true;
        document.getElementById('checkButton').disabled = true;
        document.getElementById('restartButton').style.display = 'block';
    } else {
        resultDiv.textContent = `${toroCount} TORO(s), ${vacaCount} VACA(s).`;
        historyDiv.innerHTML += `<p>${userInput} - ${toroCount} TORO(s), ${vacaCount} VACA(s)</p>`;

        if (attempts > 0) {
            resultDiv.textContent += ` Intentos restantes: ${attempts}`;
        } else {
            resultDiv.textContent += ` Has agotado tus intentos. El número era: ${generatedNumber}`;
            document.getElementById('userInput').disabled = true;
            document.getElementById('checkButton').disabled = true;
            document.getElementById('restartButton').style.display = 'block';
        }
    }

    document.getElementById('userInput').value = ''; // Limpiar el campo de entrada
}

function isValidInput(input) {
    return /^[1-9][0-9]{3}$/.test(input) && new Set(input).size === 4; // Asegurarse de que no comience con 0
}

function restartGame() {
    document.getElementById('difficultySection').style.display = 'block'; // Volver a mostrar la sección de dificultad
    document.getElementById('gameSection').style.display = 'none'; // Ocultar sección del juego
    document.getElementById('userInput').disabled = true; // Deshabilitar el campo de entrada
    document.getElementById('checkButton').disabled = true; // Deshabilitar botón de comprobación
}