<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test API Share - Debug</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #1a1f35;
            color: #fff;
        }
        .test-section {
            background: rgba(255,255,255,0.05);
            padding: 20px;
            margin: 20px 0;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover {
            background: #2563eb;
        }
        pre {
            background: #000;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            font-size: 12px;
        }
        .error {
            color: #ef4444;
        }
        .success {
            color: #10b981;
        }
        input {
            padding: 8px;
            border-radius: 5px;
            border: 1px solid rgba(255,255,255,0.2);
            background: rgba(255,255,255,0.1);
            color: white;
            width: 300px;
        }
    </style>
</head>
<body>
    <h1>🔍 Debug API Share Endpoint</h1>
    
    <div class="test-section">
        <h2>Test 1: Verifica Endpoint API</h2>
        <p>Testa se l'endpoint /api/share risponde correttamente</p>
        
        <div>
            <label>Player ID:</label>
            <input type="text" id="playerId" placeholder="Inserisci un player ID valido">
            <button onclick="testPlayerEndpoint()">Test Player</button>
        </div>
        
        <div style="margin-top: 10px;">
            <label>Team ID:</label>
            <input type="text" id="teamId" placeholder="Inserisci un team ID valido">
            <button onclick="testTeamEndpoint()">Test Team</button>
        </div>
        
        <div id="result1" style="margin-top: 20px;"></div>
    </div>

    <div class="test-section">
        <h2>Test 2: Verifica Struttura Risposta</h2>
        <p>Verifica che la risposta JSON sia corretta</p>
        <button onclick="testResponseStructure()">Test Struttura</button>
        <div id="result2" style="margin-top: 20px;"></div>
    </div>

    <div class="test-section">
        <h2>Test 3: Verifica URL Share.html</h2>
        <p>Testa la pagina share.html con parametri</p>
        <button onclick="testSharePage()">Apri Share Page</button>
        <div id="result3" style="margin-top: 20px;"></div>
    </div>

    <div class="test-section">
        <h2>📋 Console Log</h2>
        <div id="consoleLog"></div>
    </div>

    <script>
        const log = (message, type = 'info') => {
            const consoleLog = document.getElementById('consoleLog');
            const timestamp = new Date().toLocaleTimeString();
            const color = type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#64748b';
            consoleLog.innerHTML += `<div style="color: ${color}; margin: 5px 0;">[${timestamp}] ${message}</div>`;
            console.log(message);
        };

        async function testPlayerEndpoint() {
            const playerId = document.getElementById('playerId').value;
            const result1 = document.getElementById('result1');
            
            if (!playerId) {
                result1.innerHTML = '<p class="error">❌ Inserisci un Player ID!</p>';
                return;
            }

            result1.innerHTML = '<p>⏳ Testing...</p>';
            log(`Testing player endpoint with ID: ${playerId}`);

            try {
                const url = `/api/share?type=player&id=${playerId}`;
                log(`Calling: ${url}`);
                
                const response = await fetch(url);
                log(`Response status: ${response.status}`);
                log(`Response headers: ${JSON.stringify([...response.headers])}`);
                
                const text = await response.text();
                log(`Response text length: ${text.length}`);
                
                try {
                    const data = JSON.parse(text);
                    result1.innerHTML = `
                        <p class="success">✅ Success! Status: ${response.status}</p>
                        <pre>${JSON.stringify(data, null, 2)}</pre>
                    `;
                    log('Response is valid JSON', 'success');
                } catch (e) {
                    result1.innerHTML = `
                        <p class="error">❌ Response is not JSON!</p>
                        <p>Status: ${response.status}</p>
                        <p>Response Type: ${response.headers.get('content-type')}</p>
                        <pre>${text.substring(0, 500)}</pre>
                    `;
                    log('Response is NOT valid JSON!', 'error');
                    log(`First 200 chars: ${text.substring(0, 200)}`);
                }
            } catch (error) {
                result1.innerHTML = `<p class="error">❌ Error: ${error.message}</p>`;
                log(`Error: ${error.message}`, 'error');
            }
        }

        async function testTeamEndpoint() {
            const teamId = document.getElementById('teamId').value;
            const result1 = document.getElementById('result1');
            
            if (!teamId) {
                result1.innerHTML = '<p class="error">❌ Inserisci un Team ID!</p>';
                return;
            }

            result1.innerHTML = '<p>⏳ Testing...</p>';
            log(`Testing team endpoint with ID: ${teamId}`);

            try {
                const url = `/api/share?type=team&id=${teamId}`;
                log(`Calling: ${url}`);
                
                const response = await fetch(url);
                log(`Response status: ${response.status}`);
                
                const text = await response.text();
                
                try {
                    const data = JSON.parse(text);
                    result1.innerHTML = `
                        <p class="success">✅ Success! Status: ${response.status}</p>
                        <pre>${JSON.stringify(data, null, 2)}</pre>
                    `;
                    log('Response is valid JSON', 'success');
                } catch (e) {
                    result1.innerHTML = `
                        <p class="error">❌ Response is not JSON!</p>
                        <p>Status: ${response.status}</p>
                        <pre>${text.substring(0, 500)}</pre>
                    `;
                    log('Response is NOT valid JSON!', 'error');
                }
            } catch (error) {
                result1.innerHTML = `<p class="error">❌ Error: ${error.message}</p>`;
                log(`Error: ${error.message}`, 'error');
            }
        }

        async function testResponseStructure() {
            const result2 = document.getElementById('result2');
            result2.innerHTML = '<p>⏳ Testing response structure...</p>';
            
            log('Testing if endpoint returns HTML or JSON');

            try {
                const response = await fetch('/api/share?type=player&id=invalid');
                const contentType = response.headers.get('content-type');
                
                log(`Content-Type: ${contentType}`);
                
                if (contentType && contentType.includes('application/json')) {
                    result2.innerHTML = '<p class="success">✅ Endpoint returns JSON</p>';
                    log('Correct: Endpoint returns JSON', 'success');
                } else if (contentType && contentType.includes('text/html')) {
                    result2.innerHTML = '<p class="error">❌ PROBLEMA: Endpoint returns HTML instead of JSON!</p>';
                    log('ERROR: Endpoint returns HTML!', 'error');
                } else {
                    result2.innerHTML = `<p class="error">❌ Unknown content type: ${contentType}</p>`;
                    log(`Unknown content type: ${contentType}`, 'error');
                }
            } catch (error) {
                result2.innerHTML = `<p class="error">❌ Error: ${error.message}</p>`;
                log(`Error: ${error.message}`, 'error');
            }
        }

        function testSharePage() {
            const playerId = document.getElementById('playerId').value;
            if (!playerId) {
                alert('Inserisci prima un Player ID nel Test 1!');
                return;
            }
            
            const url = `/share.html?type=player&id=${playerId}`;
            log(`Opening: ${url}`);
            window.open(url, '_blank');
        }

        // Log iniziale
        log('Debug page loaded', 'success');
        log('Current URL: ' + window.location.href);
    </script>
</body>
</html>
