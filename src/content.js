let prevText = '';

// This variable is used to prevent the textarea from being updated
function startSpeechRecognition(micButton) {
    let textArea = document.getElementById('prompt-textarea');
    let recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;
    let timeout;

    function setupRecognition(recognition) {
        recognition.onstart = function () {
            let newImageUrl = chrome.runtime.getURL("/src/assets/mic-active.png");
            micButton.style.backgroundImage = `url('${newImageUrl}')`;
            micButton.classList.add('active');
            currSpeech = '';
            prevText = textArea.value + ' ';
            micActive = true;
        }

        // Update the textarea with the latest interim transcript
        recognition.onresult = function (event) {
            clearTimeout(timeout); // Cancel the timer if the user starts speaking again
            timeout = setTimeout(() => {
                recognition.stop();
                micButton.classList.remove('active');
                let newImageUrl = chrome.runtime.getURL("./src/assets/mic.png");
                micButton.style.backgroundImage = `url('${newImageUrl}')`;
                textArea.focus();
                micActive = false;  // set micActive to false
            }, 3000); // 3000ms = 3s

            currSpeech = '';

            for (var i = 0; i < event.results.length; i++) {
                for (var j = 0; j < event.results[i].length; j++) {
                    currSpeech += event.results[i][j].transcript;
                }
            }
            textArea.value = prevText + currSpeech;

            let button = document.querySelectorAll('button.absolute.p-1')[0];
            // console.log(button);

            textArea.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    setupRecognition(recognition);
    recognition.start();

    // Stop the recognition when the mic button is clicked while active
    micButton.onclick = (e) => {
        e.preventDefault();
        if (micButton.classList.contains('active')) {
            recognition.abort();
            clearTimeout(timeout);
            micButton.classList.remove('active');
            let newImageUrl = chrome.runtime.getURL("./src/assets/mic.png");
            micButton.style.backgroundImage = `url('${newImageUrl}')`;
            textArea.focus();
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


async function main() {
    // If the mic button already exists, don't do anything
    let micButton = document.getElementById('mic-button');
    if (micButton) {
        return;
    }
    micButton = createMicButton();

    // If the textArea doesnt exist, dont do anything 
    let textArea = document.getElementById('prompt-textarea');
    if (!textArea) {
        return;
    }
    let submitButton = textArea.parentNode.querySelector('button');
    console.log(submitButton.disabled);

    // Load the CSS for the mic button
    try {
        const response = await fetch(chrome.runtime.getURL('./src/assets/styles.css'));
        const data = await response.text();
        let style = document.createElement('style');
        style.innerHTML = data;
        document.head.appendChild(style);
    } catch (error) {
        console.error('Error fetching CSS file:', error);
    }

    // Turn off speech recognition on enter (but not shift + enter)
    textArea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            micButton.style.display = 'inline-block'; // Show the mic button
        }
    });

    // Display the mic button at the start of the textarea  
    let parentElement = textArea.parentElement;
    let wrapperDiv = document.createElement('div');
    wrapperDiv.classList.add('wrapper-div');
    parentElement.removeChild(textArea);
    wrapperDiv.appendChild(micButton);
    wrapperDiv.appendChild(textArea);
    parentElement.appendChild(wrapperDiv);
    textArea.focus();
}

main();
