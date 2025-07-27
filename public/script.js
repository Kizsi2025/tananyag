document.addEventListener('DOMContentLoaded', () => {

    // --- GLOBÁLIS VÁLTOZÓK ÉS ÁLLAPOTOK ---
    let innovationPoints = 60;
    const ipDisplay = document.getElementById('ip-display');

    // --- ELEMEK KIVÁLASZTÁSA ---
    const mainContent = document.getElementById('main-content');
    
    // Hitelesítési elemek
    const authContainer = document.querySelector('.auth-container');
    const loginForm = document.querySelector('.login-box');
    const signupForm = document.querySelector('.signup-box');
    const loginHeaderBtn = document.getElementById('login-header-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userNameSpan = document.getElementById('user-name');

    // --- SEGÉDFÜGGVÉNYEK ---
    function updateIPDisplay() {
        if (ipDisplay) {
            ipDisplay.textContent = innovationPoints;
        }
    }

    function addIP(amount) {
        innovationPoints += amount;
        updateIPDisplay();
    }

    function spendIP(amount) {
        if (innovationPoints >= amount) {
            innovationPoints -= amount;
            updateIPDisplay(); // JAVÍTÁS: Ez a sor hiányzott!
            return true;
        }
        alert("Nincs elég Innovációs Pontod!");
        return false;
    }

    function showUserName(name) {
        if (userNameSpan) {
            userNameSpan.textContent = `Üdv, ${name}!`;
            userNameSpan.classList.remove('hidden');
        }
    }

    function showMainContent() {
        if (mainContent) mainContent.classList.remove('hidden');
        if (loginHeaderBtn) loginHeaderBtn.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.remove('hidden');
        if (authContainer) authContainer.classList.add('hidden');
    }

    function hideMainContent() {
        if (mainContent) mainContent.classList.add('hidden');
        if (loginHeaderBtn) loginHeaderBtn.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        if (userNameSpan) userNameSpan.classList.add('hidden');
        /* --- FELHASZNÁLÓNÉV TÖRLÉSE A CÍMSORBÓL --- */
        if (userNameSpan) {
            userNameSpan.textContent = '';      // szöveg törlése
            userNameSpan.classList.add('hidden'); // elem elrejtése
    }
        if (authContainer) authContainer.classList.add('hidden');
        
    }

    // --- AUTOMATIKUS BEJELENTKEZÉS ELLENŐRZÉS ---
    const savedToken = localStorage.getItem('authToken');
    const savedName = localStorage.getItem('userName');
    
    if (savedToken && savedName) {
        // Token validálás
        fetch('/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${savedToken}` }
        })
        .then(response => {
            if (response.ok) {
                showMainContent();
                showUserName(savedName);
            } else {
                // Token érvénytelen, töröljük
                localStorage.removeItem('authToken');
                localStorage.removeItem('userName');
            }
        })
        .catch(() => {
            // Hálózati hiba esetén is töröljük
            localStorage.removeItem('authToken');
            localStorage.removeItem('userName');
        });
    }

    // --- BEJELENTKEZÉSI PANEL KEZELÉSE ---

    // Bejelentkezési panel megjelenítése
    if (loginHeaderBtn && authContainer) {
        loginHeaderBtn.addEventListener('click', () => {
            authContainer.classList.remove('hidden');
        });
    }

    // Panel bezárása háttérre kattintással
    if (authContainer) {
        authContainer.addEventListener('click', (event) => {
            if (event.target === authContainer) {
                authContainer.classList.add('hidden');
            }
        });
    }

    // --- BEJELENTKEZÉS ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const email = loginForm.elements[0].value;
            const password = loginForm.elements[1].value;

            try {
                const response = await fetch('/api/auth/signin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    alert(errorData.msg || 'Bejelentkezési hiba');
                    return;
                }

                const { token, user } = await response.json();

                // Token és felhasználói adatok mentése
                localStorage.setItem('authToken', token);
                localStorage.setItem('userName', user.name);

                // UI frissítése
                showMainContent();
                showUserName(user.name);

                // Űrlap visszaállítása
                loginForm.reset();

            } catch (error) {
                console.error('Bejelentkezési hiba:', error);
                alert('Hálózati hiba történt a bejelentkezés során.');
            }
        });
    }

    // --- REGISZTRÁCIÓ ---
    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const name = signupForm.elements[0].value;
            const email = signupForm.elements[1].value;
            const password = signupForm.elements[2].value;
            const confirmPassword = signupForm.elements[3].value;

            if (password !== confirmPassword) {
                alert('A jelszavak nem egyeznek!');
                return;
            }

            try {
                const response = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    alert(errorData.msg || 'Regisztrációs hiba');
                    return;
                }

                const { token, user } = await response.json();

                // Token és felhasználói adatok mentése
                localStorage.setItem('authToken', token);
                localStorage.setItem('userName', user.name);

                // UI frissítése
                showMainContent();
                showUserName(user.name);

                // Űrlap visszaállítása
                signupForm.reset();

                alert('Sikeres regisztráció!');

            } catch (error) {
                console.error('Regisztrációs hiba:', error);
                alert('Hálózati hiba történt a regisztráció során.');
            }
        });
    }

    // --- KIJELENTKEZÉS ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Tárolt adatok törlése
            localStorage.removeItem('authToken');
            localStorage.removeItem('userName');

            // UI visszaállítása
            hideMainContent();

            alert('Sikeresen kijelentkezett!');
        });
    }

    // --- CSÚSZKÁS VÁLTÁS A BEJELENTKEZÉSI PANELEN (HA VAN) ---
    const loginBtn = document.querySelector('.login-btn');
    const signupBtn = document.querySelector('.signup-btn');
    const authSlider = document.querySelector('.auth-slider');
    const formSection = document.querySelector('.auth-form-section');

    if (loginBtn && signupBtn && authSlider && formSection) {
        // Váltás a bejelentkezésre
        loginBtn.addEventListener('click', () => {
            authSlider.classList.remove('moves-right');
            formSection.classList.remove('moves-left');
        });

        // Váltás a regisztrációra
        signupBtn.addEventListener('click', () => {
            authSlider.classList.add('moves-right');
            formSection.classList.add('moves-left');
        });
    }

    // --- TARTALOM FELOLDÁSI RENDSZER ---
    const unlockButtons = document.querySelectorAll('.unlock-btn');
    unlockButtons.forEach(button => {
        button.addEventListener('click', () => {
            const cost = parseInt(button.dataset.cost);
            if (spendIP(cost)) {
                const targetContentId = button.dataset.target;
                if (targetContentId) {
                    const targetContent = document.getElementById(targetContentId);
                    if (targetContent) {
                        targetContent.style.display = 'block';
                    }
                }
                button.disabled = true;
                button.textContent = 'Feloldva';
                button.style.backgroundColor = '#95a5a6';
            }
        });
    });

    // --- KVÍZ RENDSZER ---

    // Első kvíz (MI alapok)
    const quizSubmitButton = document.getElementById('quiz-submit-btn');
    const quizForm = document.getElementById('quizForm');
    const resultDiv = document.getElementById('quizResult');
    
    if (quizSubmitButton && quizForm && resultDiv) {
        quizSubmitButton.addEventListener('click', () => {
            const correctAnswers = { q1: 'b', q2: 'b' };
            const totalQuestions = Object.keys(correctAnswers).length;
            let score = 0;

            for (const [question, correctAnswer] of Object.entries(correctAnswers)) {
                if (quizForm.elements[question] && quizForm.elements[question].value === correctAnswer) {
                    score++;
                }
            }

            const pointsEarned = score * 5;
            addIP(pointsEarned);
            
            resultDiv.style.display = 'block';
            resultDiv.textContent = `Találatok: ${score} / ${totalQuestions} | Szerzett pont: ${pointsEarned} IP`;
            
            quizSubmitButton.disabled = true;
            quizSubmitButton.textContent = 'Befejezve';
        });
    }

    // Második kvíz (miért van szükség MI-re)
    const secondQuizBtn = document.getElementById('fnQuiz-submit-btn');
    const secondQuizForm = document.getElementById('fundamentalsNeedQuizForm');
    const secondResultDiv = document.getElementById('fnQuizResult');
    
    if (secondQuizBtn && secondQuizForm && secondResultDiv) {
        secondQuizBtn.addEventListener('click', () => {
            const correctAnswers = { fnq1: 'b', fnq2: 'a', fnq3: 'a', fnq4: 'c' };
            const totalQuestions = Object.keys(correctAnswers).length;
            let score = 0;

            for (const [question, correctAnswer] of Object.entries(correctAnswers)) {
                if (secondQuizForm.elements[question] && secondQuizForm.elements[question].value === correctAnswer) {
                    score++;
                }
            }

            const pointsEarned = score * 5;
            addIP(pointsEarned);
            
            secondResultDiv.style.display = 'block';
            secondResultDiv.textContent = `Találatok: ${score} / ${totalQuestions} | Szerzett pont: ${pointsEarned} IP`;
            
            secondQuizBtn.disabled = true;
            secondQuizBtn.textContent = 'Befejezve';
        });
    }

    // Harmadik kvíz (Ipar 4.0 és AI kapcsolata)
    const thirdQuizBtn = document.getElementById('industry4-quiz-submit-btn');
    const thirdQuizForm = document.getElementById('industry4QuizForm');
    const thirdResultDiv = document.getElementById('industry4QuizResult');
    
    if (thirdQuizBtn && thirdQuizForm && thirdResultDiv) {
        thirdQuizBtn.addEventListener('click', () => {
            const correctAnswers = { 
                iq1: 'c', 
                iq2: 'b', 
                iq3: 'a', 
                iq4: 'b' 
            };
            const totalQuestions = Object.keys(correctAnswers).length;
            let score = 0;

            for (const [question, correctAnswer] of Object.entries(correctAnswers)) {
                if (thirdQuizForm.elements[question] && thirdQuizForm.elements[question].value === correctAnswer) {
                    score++;
                }
            }

            const pointsEarned = score * 5;
            addIP(pointsEarned);
            
            thirdResultDiv.style.display = 'block';
            thirdResultDiv.textContent = `Találatok: ${score} / ${totalQuestions} | Szerzett pont: ${pointsEarned} IP`;
            
            thirdQuizBtn.disabled = true;
            thirdQuizBtn.textContent = 'Befejezve';
        });
    }

    // Negyedik kvíz (IT technikus jövője)
    const fourthQuizBtn = document.getElementById('future-quiz-submit-btn');
    const fourthQuizForm = document.getElementById('futureQuizForm');
    const fourthResultDiv = document.getElementById('futureQuizResult');
    
    if (fourthQuizBtn && fourthQuizForm && fourthResultDiv) {
        fourthQuizBtn.addEventListener('click', () => {
            const correctAnswers = { 
                fq1: 'b', 
                fq2: 'c', 
                fq3: 'a', 
                fq4: 'b', 
                fq5: 'c' 
            };
            const totalQuestions = Object.keys(correctAnswers).length;
            let score = 0;

            for (const [question, correctAnswer] of Object.entries(correctAnswers)) {
                if (fourthQuizForm.elements[question] && fourthQuizForm.elements[question].value === correctAnswer) {
                    score++;
                }
            }

            const pointsEarned = score * 5;
            addIP(pointsEarned);
            
            fourthResultDiv.style.display = 'block';
            fourthResultDiv.textContent = `Találatok: ${score} / ${totalQuestions} | Szerzett pont: ${pointsEarned} IP`;
            
            fourthQuizBtn.disabled = true;
            fourthQuizBtn.textContent = 'Befejezve';
        });
    }

    // --- AI PITCH ÉRTÉKELŐ ---
    const submitBtn = document.getElementById('submit-pitch-btn');
    const pitchInput = document.getElementById('pitch-text');
    const pitchStatus = document.getElementById('pitch-status');

    if (submitBtn && pitchInput && pitchStatus) {
        submitBtn.addEventListener('click', async () => {
            const userPitch = pitchInput.value.trim();
            
            if (!userPitch) {
                alert("Kérlek írd be a pitch szövegét!");
                return;
            }

            // Indikátor megjelenítése
            pitchStatus.textContent = "Értékelés folyamatban...";
            pitchStatus.style.color = "#f39c12";
            submitBtn.disabled = true;

            try {
                const token = localStorage.getItem('authToken');
                const endpoint = token ? '/evaluate' : '/evaluate-public';
                const headers = { 'Content-Type': 'application/json' };
                
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({ prompt: userPitch })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Hiba történt az értékelés során');
                }

                const data = await response.json();
                
                // Eredmény megjelenítése
                pitchStatus.innerHTML = `<strong>AI Értékelés:</strong><br>${data.result.replace(/\n/g, '<br>')}`;
                pitchStatus.style.color = "#27ae60";

                // Pont jutalom sikeres értékelésért
                addIP(10);
                
            } catch (error) {
                console.error('Pitch értékelés hiba:', error);
                pitchStatus.textContent = `Hiba: ${error.message}`;
                pitchStatus.style.color = "#e74c3c";
            } finally {
                submitBtn.disabled = false;
            }
        });
    }

    // --- INICIALIZÁLÁS ---
    updateIPDisplay();

    // Console log debugging célokra
    console.log('Script.js sikeresen betöltődött');
    console.log('Innovációs pontok:', innovationPoints);
    console.log('Mentett token:', savedToken ? 'Van' : 'Nincs');

}); // DOMContentLoaded eseménykezelő vége