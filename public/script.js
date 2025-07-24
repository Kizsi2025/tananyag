document.addEventListener('DOMContentLoaded', () => {

    // --- KÖZÖS VÁLTOZÓK ÉS ÁLLAPOTOK ---
    let innovationPoints = 60; // Kezdőpontok
    const ipDisplay = document.getElementById('ip-display');

    // --- ALAPVETŐ FÜGGVÉNYEK ---
    function updateIPDisplay() {
        ipDisplay.textContent = innovationPoints;
    }

    function addIP(amount) {
        innovationPoints += amount;
        updateIPDisplay();
    }

    function spendIP(amount) {
        if (innovationPoints >= amount) {
            innovationPoints -= amount;
            updateIPDisplay();
            return true;
        }
        alert("Nincs elég Innovációs Pontod!");
        return false;
    }

    // --- MODUL: TARTALOM FELOLDÁSA ---
    const unlockButtons = document.querySelectorAll('.unlock-btn');
    unlockButtons.forEach(button => {
        button.addEventListener('click', () => {
            const cost = parseInt(button.dataset.cost);
            if (spendIP(cost)) {
                document.getElementById('ai-fundamentals').style.display = 'block';
                document.getElementById('why-ai-needed').style.display = 'block';
                button.disabled = true;
                button.textContent = 'Feloldva';
            }
        });
    });

    // --- MODUL: ELSŐ KVÍZ ---
    const quizSubmitButton = document.getElementById('quiz-submit-btn');
    const quizForm = document.getElementById('quizForm');
    const resultDiv = document.getElementById('quizResult');
    if (quizSubmitButton) {
        quizSubmitButton.addEventListener('click', () => {
            const correctAnswers = { q1: 'b', q2: 'b' };
            const totalQuestions = Object.keys(correctAnswers).length;
            let score = 0;
            for (const [question, correctAnswer] of Object.entries(correctAnswers)) {
                if (quizForm.elements[question].value === correctAnswer) {
                    score++;
                }
            }
            const pointsEarned = score * 5;
            addIP(pointsEarned);
            resultDiv.style.display = 'block';
            resultDiv.textContent = `Találatok: ${score} / ${totalQuestions} | Szerzett pont: ${pointsEarned} IP`;
        });
    }

    // --- MODUL: MÁSODIK KVÍZ ---
    const secondQuizBtn = document.getElementById('fnQuiz-submit-btn');
    const secondQuizForm = document.getElementById('fundamentalsNeedQuizForm');
    const secondResultDiv = document.getElementById('fnQuizResult');
    if (secondQuizBtn) {
        secondQuizBtn.addEventListener('click', () => {
            const correctAnswers = { fnq1: 'b', fnq2: 'a', fnq3: 'a', fnq4: 'c' };
            const totalQuestions = Object.keys(correctAnswers).length;
            let score = 0;
            for (const [question, correctAnswer] of Object.entries(correctAnswers)) {
                if (secondQuizForm.elements[question].value === correctAnswer) {
                    score++;
                }
            }
            const pointsEarned = score * 5;
            addIP(pointsEarned);
            secondResultDiv.style.display = 'block';
            secondResultDiv.textContent = `Találatok: ${score} / ${totalQuestions} | Szerzett pont: ${pointsEarned} IP`;
        });
    }

    // --- MODUL: VÉGSŐ PROJEKT ÉRTÉKELÉSE ---
    const submitBtn = document.getElementById('submit-pitch-btn');
    const pitchInput = document.getElementById('pitch-text');
    const pitchStatus = document.getElementById('pitch-status');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const userPitch = pitchInput.value.trim();
            if (!userPitch) {
                alert("Kérlek írd be a pitch szövegét!");
                return;
            }

            submitBtn.disabled = true;
            pitchStatus.innerHTML = "⏳ Értékelés folyamatban… (kb. 15-20 mp)";
            pitchStatus.style.display = 'block';

            try {
                const response = await fetch('/evaluate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: `Értékeld a következő ipari MI modernizációs pitch-et a megadott szempontok szerint.\n\nPitch:\n${userPitch}`
                    })
                });

                if (!response.ok) {
                    throw new Error(`API hiba, státuszkód: ${response.status}`);
                }

                const data = await response.json();
                const evaluationResult = data.result;

                const pointsEarned = 10; // Fix 10 pont minden sikeres értékelésért
                addIP(pointsEarned); // Itt már működni fog!

                pitchStatus.innerHTML = `
                    ✔️ Értékelés kész! Szerzett IP: ${pointsEarned}
                    <br><br>
                    <strong>MI visszajelzése:</strong>
                    <pre style="white-space: pre-wrap; background-color: #f4f4f9; padding: 10px; border-radius: 5px; font-family: inherit;">${evaluationResult}</pre>
                `;

            } catch (err) {
                pitchStatus.innerHTML = `❌ Hiba történt az értékelésnél. Próbáld újra később.`;
                console.error('Frontend hiba:', err);
            } finally {
                submitBtn.disabled = false;
            }
        });
    }

    // --- INICIALIZÁLÁS ---
    updateIPDisplay();
});
