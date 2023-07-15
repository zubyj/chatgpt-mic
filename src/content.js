// Listens to the user voice input and appends result to the GPT textarea
function startSpeechRecognition(micButton) {
    let recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    let textArea = document.getElementById('prompt-textarea');
    let timeout;

    recognition.onstart = function () {
        let newImageUrl = chrome.runtime.getURL("/src/assets/mic-active.png");
        micButton.style.backgroundImage = `url('${newImageUrl}')`;
        micButton.classList.add('active');
    }

    recognition.onspeechstart = function () {
        clearTimeout(timeout);  // Clear the timeout when speech starts
    }

    recognition.onspeechend = function () {
        // Start a timeout to stop recognition after 5 seconds of no speech
        timeout = setTimeout(() => {
            recognition.stop();
        }, 5000);
    }

    recognition.onresult = function (event) {
        let transcript = event.results[0][0].transcript;
        textArea.value = transcript;
        micButton.classList.remove('active');  // Remove 'active' class
        let newImageUrl = chrome.runtime.getURL("./src/assets/mic.png");
        micButton.style.backgroundImage = `url('${newImageUrl}')`;
    }

    recognition.onend = function () {
        micButton.classList.remove('active');  // Remove 'active' class
        let newImageUrl = chrome.runtime.getURL("./src/assets/mic.png");
        micButton.style.backgroundImage = `url('${newImageUrl}')`;
    }

    recognition.start();

    // Stop the recognition when the mic button is clicked while active
    micButton.onclick = () => {
        if (micButton.classList.contains('active')) {
            recognition.stop();
            clearTimeout(timeout);  // Clear the timeout
            micButton.classList.remove('active');  // Remove 'active' class
            let newImageUrl = chrome.runtime.getURL("./src/assets/mic.png");
            micButton.style.backgroundImage = `url('${newImageUrl}')`;
        } else {
            startSpeechRecognition(micButton);
        }
    };
}

// Creates and returns a mic button
function createMicButton() {
    let micButton = document.createElement('button');
    micButton.id = 'mic-button';
    let imageUrl = chrome.runtime.getURL("./src/assets/mic.png");
    micButton.style.backgroundImage = `url('${imageUrl}')`;
    micButton.onclick = () => startSpeechRecognition(micButton);
    return micButton;
}

chrome.runtime.onMessage.addListener((request) => {
    if (request.message === 'TabUpdated') {
        setTimeout(() => {
            if (document.getElementById('mic-button')) {
                return;
            }
            fetch(chrome.runtime.getURL('./src/assets/styles.css'))
                .then(response => response.text())
                .then(data => {
                    let style = document.createElement('style');
                    style.innerHTML = data;
                    document.head.appendChild(style);
                });

            let textArea = document.getElementById('prompt-textarea');
            let parentElement = textArea.parentElement;
            let wrapperDiv = document.createElement('div');
            wrapperDiv.classList.add('wrapper-div');

            const micButton = createMicButton();
            parentElement.removeChild(textArea);
            wrapperDiv.appendChild(micButton);
            wrapperDiv.appendChild(textArea);

            parentElement.appendChild(wrapperDiv);

            // Add input event listener to textArea
            textArea.addEventListener('input', () => {
                // If user starts typing, hide the mic button
                if (textArea.value !== '') {
                    micButton.style.display = 'none';
                } else {
                    // Show the mic button if textArea is empty
                    micButton.style.display = 'inline-block';
                }
            });
        }, 500);
    }
});
