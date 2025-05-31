// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCLrrkbXcW-exG8_n4kOEmzA-SETMWqo-0",
    authDomain: "feedbackapp-5904d.firebaseapp.com",
    databaseURL: "https://feedbackapp-5904d-default-rtdb.firebaseio.com",
    projectId: "feedbackapp-5904d",
    storageBucket: "feedbackapp-5904d.firebasestorage.app",
    messagingSenderId: "620175464767",
    appId: "1:620175464767:web:8054286a27a26210619b8a",
    measurementId: "G-QH8JN7TE0J"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    
    // Set persistence to none to prevent auto sign-in after creating users
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE)
        .catch(error => {
            console.error('Error setting auth persistence:', error);
        });
}

// Store telecaller names from Firebase
let telecallerNames = {};

// Fetch telecaller names from Firebase
function fetchTelecallerNames() {
    const namesRef = firebase.database().ref('telecallerNames');
    namesRef.once('value')
        .then(snapshot => {
            telecallerNames = snapshot.val() || {};
            console.log('Fetched telecaller names:', telecallerNames);
        })
        .catch(error => {
            console.error('Error fetching telecaller names:', error);
        });
}

// Fetch clients from Firebase and display them
function fetchClients() {
    const clientsRef = firebase.database().ref('clients');
    clientsRef.once('value')
        .then(snapshot => {
            const clients = snapshot.val() || {};
            const clientsList = document.getElementById('existingClientsList');
            
            // Clear the current list
            clientsList.innerHTML = '';
            
            // Add each client to the list
            Object.keys(clients).forEach(clientId => {
                const client = clients[clientId];
                const li = document.createElement('li');
                li.className = 'client-item';
                li.setAttribute('data-client-id', clientId);
                li.onclick = function() { selectClient(clientId); };
                
                li.innerHTML = `
                    <div class="client-name">${client.name}</div>
                    <div class="client-phone">${client.phoneNumber}</div>
                `;
                
                clientsList.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Error fetching clients:', error);
        });
}

// Convert number to word for telecaller keys (1 -> One, 2 -> Two, etc.)
function getNumberWord(num) {
    const words = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 
                  'Nineteen', 'Twenty'];
                  
    if (num <= 20) return words[num];
    return num.toString();
}

// Update the displayed telecaller names based on selected buttons
function updateSelectedTelecallersList(selectedIds) {
    const container = document.getElementById('selectedTelecallersContainer');
    const list = document.getElementById('selectedTelecallersList');
    
    // Clear the existing list
    list.innerHTML = '';
    
    if (selectedIds.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    // Sort the IDs numerically
    selectedIds.sort((a, b) => a - b);
    
    // Create list items for each selected telecaller
    selectedIds.forEach(id => {
        const nameKey = `telecaller${getNumberWord(id)}`;
        const displayName = telecallerNames[nameKey] || `Telecaller ${id}`;
        
        const listItem = document.createElement('li');
        listItem.style.padding = '8px 10px';
        listItem.style.marginBottom = '5px';
        listItem.style.backgroundColor = '#333';
        listItem.style.borderRadius = '4px';
        listItem.style.display = 'flex';
        listItem.style.justifyContent = 'space-between';
        listItem.style.alignItems = 'center';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = `${id}: ${displayName}`;
        
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
            <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
        </svg>`;
        removeBtn.style.background = 'none';
        removeBtn.style.border = 'none';
        removeBtn.style.color = '#ff6b6b';
        removeBtn.style.cursor = 'pointer';
        removeBtn.style.padding = '0 5px';
        removeBtn.style.display = 'flex';
        removeBtn.style.alignItems = 'center';
        removeBtn.title = 'Remove telecaller';
        
        // Add click event to remove this telecaller with CAPTCHA verification
        removeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Show confirmation message with CAPTCHA
            const captcha = generateMathCaptcha(false); // Use subtraction for deletion
            
            // Show detailed confirmation
            const confirmMsg = `Are you absolutely sure you want to remove Telecaller #${id} (${displayName}) from this client?\n\nThis action will unassign this telecaller.\n\nTo confirm, please solve: ${captcha.question}`;
            
            const userAnswer = prompt(confirmMsg);
            
            // Verify answer
            if (userAnswer === null) {
                // User cancelled
                return;
            }
            
            const numAnswer = parseInt(userAnswer.trim());
            if (isNaN(numAnswer) || numAnswer !== captcha.answer) {
                alert('Incorrect answer. Telecaller was not removed.');
                return;
            }
            
            // Correct answer, proceed with removal
            // Find and unselect the corresponding button in the grid
            const button = document.querySelector(`#updateClientTelecallerGrid [data-telecaller-id="${id}"]`);
            if (button) {
                button.classList.remove('selected');
                button.classList.add('available');
            }
            
            // Update the list
            const newSelectedIds = selectedIds.filter(selectedId => selectedId !== id);
            updateSelectedTelecallersList(newSelectedIds);
            
            // Update telecaller counts
            updateTelecallerCounts('existingClientsContent');
        });
        
        listItem.appendChild(nameSpan);
        listItem.appendChild(removeBtn);
        list.appendChild(listItem);
    });
    
    // Show the container
    container.style.display = 'block';
}

// Toggle card expand/collapse
function toggleCard(contentId, event) {
    if (event) {
        event.stopPropagation();
    }
    
    // Close all other cards first
    if (contentId === 'addClientContent') {
        document.getElementById('existingClientsContent').classList.remove('active');
        document.getElementById('telecallerSettingsContent').classList.remove('active');
        
        // When opening Add New Client card, freeze all already assigned telecaller buttons
        freezeAssignedTelecallerButtons();
        
        // Update telecaller counts
        updateTelecallerCounts('addClientContent');
    } else if (contentId === 'existingClientsContent') {
        document.getElementById('addClientContent').classList.remove('active');
        document.getElementById('telecallerSettingsContent').classList.remove('active');
        // Hide the client update form when toggling the existing clients card
        document.getElementById('clientUpdateForm').style.display = 'none';
    } else if (contentId === 'telecallerSettingsContent') {
        document.getElementById('addClientContent').classList.remove('active');
        document.getElementById('existingClientsContent').classList.remove('active');
    }
    
    // Toggle the requested card
    const content = document.getElementById(contentId);
    content.classList.toggle('active');
}

// Store all assigned telecaller buttons globally
let globalAssignedTelecallers = new Set();

// Collect all assigned telecaller buttons and freeze them in the Add New Client card
function freezeAssignedTelecallerButtons() {
    // First reset all buttons to available state
    resetTelecallerButtons('newClientTelecallerGrid');
    
    // Use the globally stored assigned telecallers
    console.log('Using globally stored assigned telecallers:', Array.from(globalAssignedTelecallers));
    
    // Freeze all assigned telecaller buttons
    globalAssignedTelecallers.forEach(buttonId => {
        const button = document.querySelector(`#newClientTelecallerGrid [data-telecaller-id="${buttonId}"]`);
        if (button) {
            button.classList.remove('available');
            button.classList.add('frozen');
        }
    });
    
    // Update telecaller counts
    updateTelecallerCounts('addClientContent');
}

// Fetch all assigned telecaller buttons from all clients
function fetchAllAssignedTelecallers() {
    // Clear the global set first
    globalAssignedTelecallers.clear();
    
    // Fetch all clients to collect assigned telecallers
    return firebase.database().ref('clients').once('value')
        .then(snapshot => {
            const clients = snapshot.val() || {};
            
            // Collect all assigned telecallers from all clients
            Object.values(clients).forEach(client => {
                if (client.includedButtons && Array.isArray(client.includedButtons)) {
                    client.includedButtons.forEach(buttonId => {
                        globalAssignedTelecallers.add(buttonId);
                    });
                }
            });
            
            console.log('Fetched all assigned telecallers:', Array.from(globalAssignedTelecallers));
            return globalAssignedTelecallers; // Return the set for chaining
        })
        .catch(error => {
            console.error('Error fetching assigned telecallers:', error);
            return new Set(); // Return empty set on error
        });
}

// Select client for updating
function selectClient(clientId) {
    // Get the clicked client element
    const clickedClientElement = document.querySelector(`.client-item[data-client-id="${clientId}"]`);
    
    // Check if this client is already selected
    const isAlreadySelected = clickedClientElement.classList.contains('active');
    
    // If already selected, toggle off the form and remove active class
    if (isAlreadySelected) {
        document.getElementById('clientUpdateForm').style.display = 'none';
        clickedClientElement.classList.remove('active');
        return;
    }
    
    // Immediately show visual feedback by adding active class
    if (clickedClientElement) {
        clickedClientElement.classList.add('active');
    }
    
    // Remove any "active" class from previously selected client
    const activeClients = document.querySelectorAll('.client-item.active');
    activeClients.forEach(client => {
        if (client !== clickedClientElement) {
            client.classList.remove('active');
        }
    });
    
    // Immediately show the update form with a loading indicator
    const updateForm = document.getElementById('clientUpdateForm');
    updateForm.style.display = 'block';
    
    // Create and show a loading message
    const loadingMsg = document.createElement('div');
    loadingMsg.id = 'telecaller-loading';
    loadingMsg.style.padding = '15px';
    loadingMsg.style.color = '#fff';
    loadingMsg.style.backgroundColor = 'rgba(0,0,0,0.3)';
    loadingMsg.style.borderRadius = '4px';
    loadingMsg.style.textAlign = 'center';
    loadingMsg.style.margin = '10px 0';
    loadingMsg.textContent = 'Loading client data...';
    
    // Find where to insert the loading message
    const formGroups = updateForm.querySelectorAll('.form-group');
    if (formGroups.length >= 2) {
        formGroups[1].after(loadingMsg);
    }
    
    // Load client data from Firebase
    firebase.database().ref('clients/' + clientId).once('value')
        .then(snapshot => {
            const clientData = snapshot.val();
            if (clientData) {
                // Populate form with client data
                document.getElementById('updateClientName').value = clientData.name || '';
                document.getElementById('updateClientPhone').value = clientData.phoneNumber || '';
        
                // Reset all buttons and prepare to assign states
                resetTelecallerButtons('updateClientTelecallerGrid');
                
                // Get this client's assigned telecallers
                const assignedTelecallers = clientData.includedButtons || [];
                
                // Mark telecallers assigned to OTHER clients as frozen
                // First get the global assigned telecallers
                const otherClientsAssignedTelecallers = Array.from(globalAssignedTelecallers)
                    .filter(id => !assignedTelecallers.includes(Number(id)));
                
                // Freeze telecallers assigned to other clients
                otherClientsAssignedTelecallers.forEach(id => {
                    const button = document.querySelector(`#updateClientTelecallerGrid [data-telecaller-id="${id}"]`);
                    if (button) {
                        button.classList.remove('available');
                        button.classList.add('frozen');
                    }
                });
                
                // Mark this client's telecallers as selected
                selectTelecallerButtons('updateClientTelecallerGrid', assignedTelecallers);
                
                // Update the telecaller names list
                updateSelectedTelecallersList(assignedTelecallers);
                
                // Update telecaller counts
                updateTelecallerCounts('existingClientsContent');
                
                // Store the client ID for update
                document.getElementById('updateClientBtn').setAttribute('data-client-id', clientId);
            } else {
                console.error('Client not found:', clientId);
                alert('Client not found');
            }
        })
        .catch(error => {
            console.error('Error loading client data:', error);
            alert('Error loading client data: ' + error.message);
        })
        .finally(() => {
            // Remove the loading message
            const loadingElement = document.getElementById('telecaller-loading');
            if (loadingElement) {
                loadingElement.remove();
            }
        });
}

// Reset all telecaller buttons to available
function resetTelecallerButtons(containerId) {
    const buttons = document.querySelectorAll(`#${containerId} .telecaller-button`);
    buttons.forEach(button => {
        button.classList.remove('selected', 'frozen');
        button.classList.add('available');
    });
}

// Select specific telecaller buttons
function selectTelecallerButtons(containerId, telecallerIds) {
    telecallerIds.forEach(id => {
        const button = document.querySelector(`#${containerId} [data-telecaller-id="${id}"]`);
        if (button) {
            button.classList.remove('available');
            button.classList.add('selected');
        }
    });
}

// Generate telecaller buttons (1-50)
function generateTelecallerButtons(containerId, limit) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    for (let i = 1; i <= (limit || 50); i++) {
        const button = document.createElement('button');
        button.className = 'telecaller-button available';
        button.setAttribute('data-telecaller-id', i);
        button.textContent = i;
        
        // Set all buttons initially to light grey (opacity 0.5)
        button.style.opacity = '0.5';
        
        // Add long-press event for credentials popup
        addLongPressEvent(button, i);
        
        // Add click event to toggle selection
        button.addEventListener('click', function() {
            // Don't allow clicking frozen buttons
            if (this.classList.contains('frozen')) return;
            
            // For update client grid, require CAPTCHA verification
            if (containerId === 'updateClientTelecallerGrid') {
                const isCurrentlyAvailable = this.classList.contains('available');
                const captcha = generateMathCaptcha(isCurrentlyAvailable); // Addition for selecting, subtraction for deselecting
                
                // Show the CAPTCHA alert
                const userAnswer = prompt(`Security Check: Please solve this math problem to ${isCurrentlyAvailable ? 'add' : 'remove'} telecaller #${i}\n\n${captcha.question}`);
                
                // Verify answer
                if (userAnswer === null) {
                    // User cancelled
                    return;
                }
                
                const numAnswer = parseInt(userAnswer.trim());
                if (isNaN(numAnswer) || numAnswer !== captcha.answer) {
                    alert('Incorrect answer. Telecaller was not ' + (isCurrentlyAvailable ? 'added' : 'removed') + '.');
                    return;
                }
                
                // Correct answer, proceed with toggle
                this.classList.toggle('selected');
                this.classList.toggle('available');
                
                const selectedButtons = document.querySelectorAll('#updateClientTelecallerGrid .telecaller-button.selected');
                const selectedIds = Array.from(selectedButtons).map(btn => 
                    parseInt(btn.getAttribute('data-telecaller-id'))
                );
                
                updateSelectedTelecallersList(selectedIds);
                
                // Update telecaller counts for update client
                updateTelecallerCounts('existingClientsContent');
            } else {
                // For new client grid, no CAPTCHA needed
                this.classList.toggle('selected');
                this.classList.toggle('available');
                
                // Update telecaller counts for new client
                updateTelecallerCounts('addClientContent');
            }
        });
        
        container.appendChild(button);
    }
    
    // Update initial counts
    if (containerId === 'newClientTelecallerGrid') {
        updateTelecallerCounts('addClientContent');
    } else {
        updateTelecallerCounts('existingClientsContent');
    }
}

// Migrate existing clients to new format
function migrateExistingClients() {
    firebase.database().ref('clients').once('value')
        .then(snapshot => {
            const clients = snapshot.val() || {};
            const updates = {};
            const removes = [];
            let needsUpdate = false;
            let maxClientNumber = 0;
            
            // First pass: find highest client number
            Object.keys(clients).forEach(clientId => {
                if (clientId.match(/^client\d+$/)) {
                    const clientNumber = parseInt(clientId.replace('client', ''));
                    if (!isNaN(clientNumber) && clientNumber > maxClientNumber) {
                        maxClientNumber = clientNumber;
                    }
                }
            });
            
            // Second pass: process each client
            Object.keys(clients).forEach(clientId => {
                const client = clients[clientId];
                
                // Fix includedButtons format if needed
                if (client.includedButtons && typeof client.includedButtons === 'object' && !Array.isArray(client.includedButtons)) {
                    const buttonArray = Object.values(client.includedButtons).map(val => parseInt(val));
                    
                    // If clientId already has correct format, just update includedButtons
                    if (clientId.match(/^client\d+$/)) {
                        updates['clients/' + clientId + '/includedButtons'] = buttonArray;
                        needsUpdate = true;
                    } else {
                        // We'll create a new client with correct ID format below
                        client.includedButtons = buttonArray;
                    }
                }
                
                // If client ID doesn't match required format, create a new one with correct format
                if (!clientId.match(/^client\d+$/)) {
                    maxClientNumber++;
                    const newClientId = 'client' + maxClientNumber;
                    
                    // Add the client with new ID
                    updates['clients/' + newClientId] = client;
                    
                    // Mark old client for removal
                    removes.push(clientId);
                    
                    needsUpdate = true;
                }
            });
            
            // Apply updates if needed
            if (needsUpdate) {
                return firebase.database().ref().update(updates)
                    .then(() => {
                        // Remove old clients that were migrated
                        const removePromises = removes.map(oldClientId => {
                            return firebase.database().ref('clients/' + oldClientId).remove();
                        });
                        
                        return Promise.all(removePromises);
                    });
            }
            
            return Promise.resolve();
        })
        .then(() => {
            console.log('Migration completed successfully (if needed)');
        })
        .catch(error => {
            console.error('Error during migration:', error);
        });
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Immediately start fetching assigned telecallers (moved to the top for priority)
    const assignedTelecallersPromise = fetchAllAssignedTelecallers();
    
    // Fetch telecaller names from Firebase
    fetchTelecallerNames();
    
    // Migrate existing clients to new format
    migrateExistingClients();
    
    // Fetch existing clients from Firebase
    fetchClients();
    
    // Fetch telecaller settings and generate telecaller buttons with assigned ones frozen
    firebase.database().ref('telecaller_settings').once('value')
        .then(snapshot => {
            const settings = snapshot.val() || {};
            const totalTelecallers = settings.total_telecallers_count || 50;
            
            // Wait for assigned telecallers to be fetched before generating buttons
            return assignedTelecallersPromise.then(() => {
                // Generate telecaller buttons with the limit from settings
                generateTelecallerButtons('newClientTelecallerGrid', totalTelecallers);
                generateTelecallerButtons('updateClientTelecallerGrid', totalTelecallers);
                
                // Generate buttons for the monitor grid
                generateMonitorTelecallerGrid(totalTelecallers);
                
                // Pre-freeze assigned buttons for faster response when card is opened
                freezeAssignedTelecallerButtons();
                
                // Check for existing credentials in Firebase Authentication
                for (let i = 1; i <= totalTelecallers; i++) {
                    checkTelecallerCredentials(i);
                }
            });
        })
        .catch(error => {
            console.error('Error fetching telecaller settings:', error);
            // Fallback to default 50 if settings can't be fetched
            assignedTelecallersPromise.then(() => {
                generateTelecallerButtons('newClientTelecallerGrid', 50);
                generateTelecallerButtons('updateClientTelecallerGrid', 50);
                
                // Generate buttons for the monitor grid
                generateMonitorTelecallerGrid(50);
                
                // Pre-freeze assigned buttons for faster response when card is opened
                freezeAssignedTelecallerButtons();
                
                // Check for existing credentials in Firebase Authentication
                for (let i = 1; i <= 50; i++) {
                    checkTelecallerCredentials(i);
                }
            });
        });
    
    // Add client button
    document.getElementById('addClientBtn').addEventListener('click', function() {
        // Get selected telecaller IDs
        const selectedButtons = document.querySelectorAll('#newClientTelecallerGrid .telecaller-button.selected');
        const includedButtons = Array.from(selectedButtons).map(button => 
            parseInt(button.getAttribute('data-telecaller-id'))
        );
        
        // Get form values
        const clientName = document.getElementById('clientName').value;
        const clientPhone = document.getElementById('clientPhone').value;
        
        // Validate form
        if (!clientName || !clientPhone || includedButtons.length === 0) {
            alert('Please fill in all fields and select at least one telecaller');
            return;
        }
        
        // Get the next client ID (client1, client2, etc.)
        firebase.database().ref('clients').once('value')
            .then(snapshot => {
                const clients = snapshot.val() || {};
                let maxClientNumber = 0;
                
                // Find the highest client number
                Object.keys(clients).forEach(key => {
                    if (key.startsWith('client')) {
                        const clientNumber = parseInt(key.replace('client', ''));
                        if (!isNaN(clientNumber) && clientNumber > maxClientNumber) {
                            maxClientNumber = clientNumber;
                        }
                    }
                });
                
                // Create the new client ID
                const clientId = 'client' + (maxClientNumber + 1);
                
                // Create a proper array structure for includedButtons
                const clientData = {
                    name: clientName,
                    phoneNumber: clientPhone
                };
                
                // First save the client without includedButtons
                firebase.database().ref('clients/' + clientId).set(clientData)
                    .then(() => {
                        // Then add includedButtons as a separate operation to maintain array format
                        const updates = {};
                        updates['clients/' + clientId + '/includedButtons'] = includedButtons;
                        
                        return firebase.database().ref().update(updates);
                    })
                    .then(() => {
                        alert('Client added successfully!');
        
                        // Reset form
                        document.getElementById('clientName').value = '';
                        document.getElementById('clientPhone').value = '';
                        resetTelecallerButtons('newClientTelecallerGrid');
                        
                        // Collapse the card
                        document.getElementById('addClientContent').classList.remove('active');
                        
                        // Refresh the clients list
                        fetchClients();
                        
                        // Update global assigned telecallers
                        fetchAllAssignedTelecallers().then(() => {
                            // Update the monitor grid to reflect new assignments
                            updateMonitorTelecallerGrid();
                        });
                    })
                    .catch((error) => {
                        console.error('Error adding client:', error);
                        alert('Error adding client: ' + error.message);
                    });
            })
            .catch(error => {
                console.error('Error getting client count:', error);
                alert('Error adding client: ' + error.message);
            });
    });
    
    // Update client button
    document.getElementById('updateClientBtn').addEventListener('click', function() {
        // Get the client ID from the button attribute
        const clientId = this.getAttribute('data-client-id');
        if (!clientId) {
            alert('No client selected');
            return;
        }
        
        // Get selected telecaller IDs
        const selectedButtons = document.querySelectorAll('#updateClientTelecallerGrid .telecaller-button.selected');
        const includedButtons = Array.from(selectedButtons).map(button => 
            parseInt(button.getAttribute('data-telecaller-id'))
        );
        
        // Get form values
        const clientName = document.getElementById('updateClientName').value;
        const clientPhone = document.getElementById('updateClientPhone').value;
        
        // Validate form
        if (!clientName || !clientPhone || includedButtons.length === 0) {
            alert('Please fill in all fields and select at least one telecaller');
            return;
        }
        
        // First update the basic client data
        firebase.database().ref('clients/' + clientId).update({
            name: clientName,
            phoneNumber: clientPhone
        })
        .then(() => {
            // Then update includedButtons separately to maintain array format
            const updates = {};
            updates['clients/' + clientId + '/includedButtons'] = includedButtons;
            
            return firebase.database().ref().update(updates);
        })
        .then(() => {
            alert('Client updated successfully!');
        
            // Update the telecaller names list to reflect any changes
            updateSelectedTelecallersList(includedButtons);
            
            // Refresh the clients list
            fetchClients();
            
            // Update global assigned telecallers
            fetchAllAssignedTelecallers().then(() => {
                // Update the monitor grid to reflect new assignments
                updateMonitorTelecallerGrid();
            });
        })
        .catch((error) => {
            console.error('Error updating client:', error);
            alert('Error updating client: ' + error.message);
        });
    });
    
    // Fetch current telecaller limit
    fetchTelecallerSettings();
    
    // Update Telecaller Settings button
    document.getElementById('updateTelecallerLimitBtn').addEventListener('click', function() {
        const limitInput = document.getElementById('telecallerLimit');
        const newLimit = parseInt(limitInput.value);
        
        if (isNaN(newLimit) || newLimit < 1) {
            alert('Please enter a valid telecaller limit (minimum 1)');
            return;
        }
        
        // Create number words mapping based on the limit
        const numberWords = generateNumberWords(newLimit);
        
        // Save settings to Firebase
        const updates = {};
        updates['telecaller_settings/total_telecallers_count'] = newLimit;
        updates['telecaller_settings/number_words'] = numberWords;
        
        firebase.database().ref().update(updates)
            .then(() => {
                alert('Telecaller settings updated successfully!');
                document.getElementById('currentTelecallerLimit').textContent = newLimit;
                
                // Collapse the card
                document.getElementById('telecallerSettingsContent').classList.remove('active');
                
                // Regenerate telecaller buttons with new limit
                generateTelecallerButtons('newClientTelecallerGrid', newLimit);
                generateTelecallerButtons('updateClientTelecallerGrid', newLimit);
                
                // Regenerate monitor grid with new limit
                generateMonitorTelecallerGrid(newLimit);
                
                // Pre-freeze assigned buttons
                freezeAssignedTelecallerButtons();
            })
            .catch((error) => {
                console.error('Error updating telecaller settings:', error);
                alert('Error updating telecaller settings: ' + error.message);
            });
    });
    
    // Refresh Assignment button
    document.getElementById('refreshAssignmentsBtn').addEventListener('click', function() {
        // Show loading state
        this.disabled = true;
        this.textContent = "Refreshing...";
        
        fetchAllAssignedTelecallers().then(() => {
            // Update the monitor grid with latest data
            updateMonitorTelecallerGrid();
            
            // Reset button state
            this.disabled = false;
            this.textContent = "Refresh Assignments";
        }).catch(error => {
            console.error('Error refreshing assignments:', error);
            
            // Reset button state
            this.disabled = false;
            this.textContent = "Refresh Assignments";
        });
    });
});

// Fetch telecaller settings from Firebase
function fetchTelecallerSettings() {
    firebase.database().ref('telecaller_settings').once('value')
        .then(snapshot => {
            const settings = snapshot.val() || {};
            const totalTelecallers = settings.total_telecallers_count || 50;
            
            // Update displayed limit
            document.getElementById('currentTelecallerLimit').textContent = totalTelecallers;
            
            // Update input field with current value
            document.getElementById('telecallerLimit').value = totalTelecallers;
        })
        .catch(error => {
            console.error('Error fetching telecaller settings:', error);
        });
}

// Generate number words mapping
function generateNumberWords(limit) {
    const numberWords = {};
    
    // Add basic words
    numberWords["0"] = "Zero";
    numberWords["1"] = "One";
    numberWords["2"] = "Two";
    numberWords["3"] = "Three";
    numberWords["4"] = "Four";
    numberWords["5"] = "Five";
    numberWords["6"] = "Six";
    numberWords["7"] = "Seven";
    numberWords["8"] = "Eight";
    numberWords["9"] = "Nine";
    numberWords["10"] = "Ten";
    numberWords["11"] = "Eleven";
    numberWords["12"] = "Twelve";
    numberWords["13"] = "Thirteen";
    numberWords["14"] = "Fourteen";
    numberWords["15"] = "Fifteen";
    numberWords["16"] = "Sixteen";
    numberWords["17"] = "Seventeen";
    numberWords["18"] = "Eighteen";
    numberWords["19"] = "Nineteen";
    numberWords["20"] = "Twenty";
    
    // Process all numbers up to the limit
    if (limit > 20) {
        const tens = ["Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
        
        // Helper function to convert any number to words
        const convertNumberToWord = (num) => {
            if (num <= 20) {
                return numberWords[num.toString()];
            } else if (num < 100) {
                const tensDigit = Math.floor(num / 10);
                const onesDigit = num % 10;
                
                if (onesDigit === 0) {
                    return tens[tensDigit - 2];
                } else {
                    return tens[tensDigit - 2] + numberWords[onesDigit.toString()];
                }
            } else if (num < 1000) {
                const hundredsDigit = Math.floor(num / 100);
                const remainder = num % 100;
                
                if (remainder === 0) {
                    return numberWords[hundredsDigit.toString()] + "Hundred";
                } else {
                    return numberWords[hundredsDigit.toString()] + "Hundred" + convertNumberToWord(remainder);
                }
            } else if (num < 100000) {
                const thousands = Math.floor(num / 1000);
                const remainder = num % 1000;
                
                if (remainder === 0) {
                    return convertNumberToWord(thousands) + "Thousand";
                } else {
                    return convertNumberToWord(thousands) + "Thousand" + convertNumberToWord(remainder);
                }
            } else if (num < 10000000) {
                // Handle lakhs (Indian system) or hundred thousands
                const lakhs = Math.floor(num / 100000);
                const remainder = num % 100000;
                
                if (remainder === 0) {
                    return convertNumberToWord(lakhs) + "Lakh";
                } else {
                    return convertNumberToWord(lakhs) + "Lakh" + convertNumberToWord(remainder);
                }
            } else {
                // Handle millions/crores
                const millions = Math.floor(num / 1000000);
                const remainder = num % 1000000;
                
                if (remainder === 0) {
                    return convertNumberToWord(millions) + "Million";
                } else {
                    return convertNumberToWord(millions) + "Million" + convertNumberToWord(remainder);
                }
            }
        };
        
        // Generate words for all numbers up to the limit
        for (let i = 21; i <= limit; i++) {
            numberWords[i.toString()] = convertNumberToWord(i);
        }
    }
    
    return numberWords;
}

// Update telecaller counts for a specific container
function updateTelecallerCounts(containerId) {
    const container = document.getElementById(containerId);
    const gridId = containerId === 'addClientContent' ? 'newClientTelecallerGrid' : 'updateClientTelecallerGrid';
    const countPrefix = containerId === 'addClientContent' ? 'newClient' : 'updateClient';
    
    const totalButtons = document.querySelectorAll(`#${gridId} .telecaller-button`).length;
    const availableButtons = document.querySelectorAll(`#${gridId} .telecaller-button.available`).length;
    const selectedButtons = document.querySelectorAll(`#${gridId} .telecaller-button.selected`).length;
    const frozenButtons = document.querySelectorAll(`#${gridId} .telecaller-button.frozen`).length;
    
    // Update the count displays
    document.getElementById(`${countPrefix}AvailableCount`).textContent = availableButtons;
    document.getElementById(`${countPrefix}SelectedCount`).textContent = selectedButtons;
    document.getElementById(`${countPrefix}AssignedCount`).textContent = frozenButtons;
}

// Generate simple math CAPTCHA for telecaller selection security
function generateMathCaptcha(isAddition) {
    // Generate single-digit numbers
    const num1 = Math.floor(Math.random() * 9) + 1; // 1-9
    const num2 = Math.floor(Math.random() * 9) + 1; // 1-9
    
    // For addition
    if (isAddition) {
        return {
            question: `${num1} + ${num2} = ?`,
            answer: num1 + num2
        };
    } 
    // For subtraction (ensure positive result)
    else {
        const larger = Math.max(num1, num2);
        const smaller = Math.min(num1, num2);
        return {
            question: `${larger} - ${smaller} = ?`,
            answer: larger - smaller
        };
    }
}

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}

// Add offline detection
window.addEventListener('online', handleConnectionChange);
window.addEventListener('offline', handleConnectionChange);

function handleConnectionChange(event) {
    if (navigator.onLine) {
        document.body.classList.remove('offline');
        // Resync with Firebase when coming back online
        fetchAllAssignedTelecallers().then(() => {
            fetchClients();
            fetchTelecallerNames();
        });
    } else {
        document.body.classList.add('offline');
        // Add a notification that the app is offline
        showOfflineNotification();
    }
}

function showOfflineNotification() {
    const notification = document.createElement('div');
    notification.textContent = 'You are currently offline. Some features may be limited.';
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = '#e74c3c';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '1000';
    notification.id = 'offline-notification';
    
    // Remove any existing notification first
    const existingNotification = document.getElementById('offline-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    document.body.appendChild(notification);
}

// Add "Add to Home Screen" promotion
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 76+ from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Show the install button after a delay
    setTimeout(() => {
        showInstallPromotion();
    }, 3000);
});

function showInstallPromotion() {
    if (!deferredPrompt) return;
    
    const promotion = document.createElement('div');
    promotion.innerHTML = `
       
    `;
    promotion.style.position = 'fixed';
    promotion.style.top = '20px';
    promotion.style.left = '50%';
    promotion.style.transform = 'translateX(-50%)';
    promotion.style.backgroundColor = '#333';
    promotion.style.color = 'white';
    promotion.style.padding = '15px 20px';
    promotion.style.borderRadius = '5px';
    promotion.style.zIndex = '1000';
    promotion.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    promotion.id = 'install-promotion';
    
    // Remove any existing promotion first
    const existingPromotion = document.getElementById('install-promotion');
    if (existingPromotion) {
        existingPromotion.remove();
    }
    
    document.body.appendChild(promotion);
    
    // Set up button event listeners
    document.getElementById('install-button').addEventListener('click', () => {
        // Hide the promotion
        promotion.style.display = 'none';
        // Show the browser install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            // Clear the deferred prompt variable
            deferredPrompt = null;
        });
    });
    
    document.getElementById('close-promo-button').addEventListener('click', () => {
        promotion.style.display = 'none';
    });
}

// Generate the monitor telecaller grid with buttons showing assignment status
function generateMonitorTelecallerGrid(limit) {
    const container = document.getElementById('monitorTelecallerGrid');
    
    // Clear existing content
    container.innerHTML = '';
    
    for (let i = 1; i <= limit; i++) {
        const button = document.createElement('button');
        button.className = 'telecaller-button available';
        button.setAttribute('data-telecaller-id', i);
        button.textContent = i;
        
        // Set all buttons initially to light grey (opacity 0.5)
        button.style.opacity = '0.5';
        
        // Add long-press event for credentials popup
        addLongPressEvent(button, i);
        
        // Add click event to show assignment details
        button.addEventListener('click', function() {
            showTelecallerAssignmentDetails(i);
        });
        
        container.appendChild(button);
    }
    
    // Update the grid with current assignments
    updateMonitorTelecallerGrid();
}

// Update the monitor telecaller grid to reflect current assignments
function updateMonitorTelecallerGrid() {
    // Reset all buttons to available state
    const buttons = document.querySelectorAll('#monitorTelecallerGrid .telecaller-button');
    buttons.forEach(button => {
        button.classList.remove('frozen');
        button.classList.add('available');
    });
    
    // Mark assigned telecallers
    globalAssignedTelecallers.forEach(buttonId => {
        const button = document.querySelector(`#monitorTelecallerGrid [data-telecaller-id="${buttonId}"]`);
        if (button) {
            button.classList.remove('available');
            button.classList.add('frozen');
        }
    });
    
    // Update stats display
    const totalCount = buttons.length;
    const assignedCount = globalAssignedTelecallers.size;
    const availableCount = totalCount - assignedCount;
    
    document.getElementById('totalTelecallerCount').textContent = totalCount;
    document.getElementById('monitorAssignedCount').textContent = assignedCount;
    document.getElementById('monitorAvailableCount').textContent = availableCount;
}

// Display details about which client a telecaller is assigned to
function showTelecallerAssignmentDetails(telecallerId) {
    const detailsContainer = document.getElementById('assignmentDetailsContainer');
    const detailsList = document.getElementById('assignmentDetailsList');
    
    // Clear existing details
    detailsList.innerHTML = '';
    
    // Check if this telecaller is assigned
    if (globalAssignedTelecallers.has(telecallerId)) {
        // Fetch all clients to find which ones have this telecaller assigned
        firebase.database().ref('clients').once('value')
            .then(snapshot => {
                const clients = snapshot.val() || {};
                const assignedToClients = [];
                
                Object.entries(clients).forEach(([clientId, client]) => {
                    if (client.includedButtons && client.includedButtons.includes(telecallerId)) {
                        assignedToClients.push({
                            id: clientId,
                            name: client.name,
                            phoneNumber: client.phoneNumber
                        });
                    }
                });
                
                // Display assignment details
                if (assignedToClients.length > 0) {
                    const nameKey = `telecaller${getNumberWord(telecallerId)}`;
                    const telecallerName = telecallerNames[nameKey] || `Telecaller ${telecallerId}`;
                    
                    // Create header
                    const header = document.createElement('li');
                    header.style.padding = '10px';
                    header.style.marginBottom = '10px';
                    header.style.backgroundColor = '#333';
                    header.style.borderRadius = '4px';
                    header.style.fontWeight = '500';
                    header.innerHTML = `<strong>Telecaller #${telecallerId}</strong> (${telecallerName}) is assigned to:`;
                    detailsList.appendChild(header);
                    
                    // Add each client
                    assignedToClients.forEach(client => {
                        const item = document.createElement('li');
                        item.style.padding = '8px 12px';
                        item.style.marginBottom = '6px';
                        item.style.backgroundColor = '#444';
                        item.style.borderRadius = '4px';
                        item.style.display = 'flex';
                        item.style.justifyContent = 'space-between';
                        
                        const clientInfo = document.createElement('div');
                        clientInfo.innerHTML = `
                            <div><strong>${client.name}</strong></div>
                            <div style="color: #bbb; font-size: 0.9em;">${client.phoneNumber}</div>
                        `;
                        
                        item.appendChild(clientInfo);
                        detailsList.appendChild(item);
                    });
                    
                    // Show the container
                    detailsContainer.style.display = 'block';
                }
            })
            .catch(error => {
                console.error('Error fetching telecaller assignment details:', error);
            });
    } else {
        // Show that this telecaller is not assigned
        const item = document.createElement('li');
        item.style.padding = '12px 15px';
        item.style.backgroundColor = '#333';
        item.style.borderRadius = '4px';
        item.innerHTML = `<strong>Telecaller #${telecallerId}</strong> is currently not assigned to any client.`;
        
        detailsList.appendChild(item);
        detailsContainer.style.display = 'block';
    }
}

// Add long-press event to a button to show credentials popup
function addLongPressEvent(button, telecallerId) {
    let pressTimer;
    let isLongPress = false;
    
    button.addEventListener('touchstart', function(e) {
        isLongPress = false;
        pressTimer = setTimeout(function() {
            isLongPress = true;
            showCredentialsPopup(telecallerId);
        }, 800); // 800ms long press
    });
    
    button.addEventListener('mousedown', function(e) {
        isLongPress = false;
        pressTimer = setTimeout(function() {
            isLongPress = true;
            showCredentialsPopup(telecallerId);
        }, 800); // 800ms long press
    });
    
    // Clear the timer if the user releases before the long press threshold
    button.addEventListener('touchend', function(e) {
        clearTimeout(pressTimer);
        if (isLongPress) {
            e.preventDefault(); // Prevent normal click if this was a long press
        }
    });
    
    button.addEventListener('mouseup', function(e) {
        clearTimeout(pressTimer);
        if (isLongPress) {
            e.preventDefault(); // Prevent normal click if this was a long press
        }
    });
    
    // Also clear the timer if the user moves their finger/mouse
    button.addEventListener('touchmove', function(e) {
        clearTimeout(pressTimer);
    });
    
    button.addEventListener('mouseleave', function(e) {
        clearTimeout(pressTimer);
    });
}

// Show credentials popup for a telecaller
function showCredentialsPopup(telecallerId) {
    // Populate the modal with telecaller-specific credentials
    document.getElementById('credentialsModalTitle').textContent = `Telecaller #${telecallerId} Credentials`;
    
    // Generate the default credentials
    const telecallerEmail = `telecaller${telecallerId}@gmail.com`;
    const telecallerPassword = 'telecaller@123';
    
    const adminEmail = `admin${telecallerId}@gmail.com`;
    const adminPassword = 'admin@123';
    
    // Set values in the form with default values
    document.getElementById('telecallerEmail').value = telecallerEmail;
    document.getElementById('telecallerPassword').value = telecallerPassword;
    document.getElementById('adminEmail').value = adminEmail;
    document.getElementById('adminPassword').value = adminPassword;
    
    // Show the modal
    const modal = document.getElementById('credentialsModal');
    modal.style.display = 'flex';
    
    // Setup save button event
    document.getElementById('saveCredentialsBtn').onclick = function() {
        saveCredentials(telecallerId);
    };
}

// Close the credentials modal
function closeCredentialsModal() {
    document.getElementById('credentialsModal').style.display = 'none';
}

// Save credentials to Firebase
function saveCredentials(telecallerId) {
    const telecallerEmail = document.getElementById('telecallerEmail').value;
    const telecallerPassword = document.getElementById('telecallerPassword').value;
    const adminEmail = document.getElementById('adminEmail').value;
    const adminPassword = document.getElementById('adminPassword').value;
    
    if (!telecallerEmail || !telecallerPassword || !adminEmail || !adminPassword) {
        alert('Please enter all credential fields');
        return;
    }
    
    // Show loading indicator on the save button
    const saveButton = document.getElementById('saveCredentialsBtn');
    const originalButtonText = saveButton.textContent;
    saveButton.textContent = 'Saving...';
    saveButton.disabled = true;
    
    // Create objects to track status of each account with symbols
    const statusData = {
        telecaller: { status: '', isNew: false },
        admin: { status: '', isNew: false }
    };
    
    // Create authentication accounts directly without saving to Realtime Database
    checkAndCreateAuthUser(telecallerEmail, telecallerPassword)
        .then(telecallerStatus => {
            // Check if this is a new registration or existing account
            statusData.telecaller.isNew = telecallerStatus === "Successfully registered new account";
            statusData.telecaller.status = telecallerStatus;
            return checkAndCreateAuthUser(adminEmail, adminPassword);
        })
        .then(adminStatus => {
            // Check if this is a new registration or existing account
            statusData.admin.isNew = adminStatus === "Successfully registered new account";
            statusData.admin.status = adminStatus;
            
            // Create professional alert message with symbols
            const successSymbol = "✅";
            const infoSymbol = "ℹ️";
            
            let alertMessage = "Credentials Saved Successfully!\n\n";
            
            // Add telecaller status with appropriate symbol
            alertMessage += statusData.telecaller.isNew ? 
                `${successSymbol} Telecaller: New account created\n` : 
                `${infoSymbol} Telecaller: Account already exists\n`;
            
            // Add admin status with appropriate symbol
            alertMessage += statusData.admin.isNew ? 
                `${successSymbol} Admin: New account created` : 
                `${infoSymbol} Admin: Account already exists`;
            
            // Store registration status in Firebase Realtime Database
            firebase.database().ref(`registered_telecallers/${telecallerId}`).set(true);
            
            // Show enhanced alert
            alert(alertMessage);
            closeCredentialsModal();
            
            // Update telecaller button style to show it's registered
            updateTelecallerButtonStyle(telecallerId, true);
        })
        .catch(error => {
            console.error('Error saving credentials:', error);
            alert('❌ Error: ' + error.message);
        })
        .finally(() => {
            // Reset button state
            saveButton.textContent = originalButtonText;
            saveButton.disabled = false;
        });
}

// Delete credentials from Firebase
function deleteCredentials(telecallerId) {
    // Get the current email values for deletion from Authentication
    const telecallerEmail = document.getElementById('telecallerEmail').value;
    const adminEmail = document.getElementById('adminEmail').value;
    
    if (!telecallerEmail || !adminEmail) {
        alert('Email fields cannot be empty');
        return;
    }
    
    // Show confirmation dialog
    const confirmed = confirm(`Are you sure you want to delete the credentials for Telecaller #${telecallerId}?\n\nThis will remove:\n- ${telecallerEmail}\n- ${adminEmail}\n\nfrom Firebase Authentication and mark this telecaller as unregistered.`);
    
    if (!confirmed) {
        return;
    }
    
    // Create array to track status messages
    const statusMessages = [];
    
    // Try to delete from Authentication by signing in and deleting account
    deleteAuthUser(telecallerEmail)
        .then(telecallerStatus => {
            statusMessages.push(`Telecaller: ${telecallerStatus}`);
            return deleteAuthUser(adminEmail);
        })
        .then(adminStatus => {
            statusMessages.push(`Admin: ${adminStatus}`);
            
            // Remove registration status from Firebase Realtime Database
            firebase.database().ref(`registered_telecallers/${telecallerId}`).remove();
            
            // Show success message
            alert(`Credentials deleted!\n\n${statusMessages.join('\n')}`);
            closeCredentialsModal();
            
            // Update telecaller button style to show it's unregistered
            updateTelecallerButtonStyle(telecallerId, false);
        })
        .catch(error => {
            console.error('Error deleting credentials:', error);
            alert(`Error: ${error.message}`);
        });
}

// Update telecaller button style based on registration status
function updateTelecallerButtonStyle(telecallerId, isRegistered) {
    // Find the telecaller button in all grids
    const buttons = document.querySelectorAll(`[data-telecaller-id="${telecallerId}"]`);
    buttons.forEach(button => {
        if (isRegistered) {
            // If registered, ensure it doesn't have a light grey appearance
            button.style.opacity = '1';
        } else {
            // If unregistered, make it light grey
            button.style.opacity = '0.5';
        }
    });
}

// Function to delete a user from Firebase Authentication 
// Note: This requires server-side code with Admin SDK for full implementation
// Here we'll implement a client-side attempt that will work for newly created accounts only
function deleteAuthUser(email) {
    return new Promise((resolve) => {
        // Check if the user exists first
        firebase.auth().fetchSignInMethodsForEmail(email)
            .then(methods => {
                if (methods.length === 0) {
                    // User doesn't exist
                    resolve("Account not found in Authentication");
                } else {
                    resolve("Account exists but requires Admin SDK to delete");
                    
                    // Note: To properly delete accounts, you need Firebase Admin SDK on the server
                    // Client-side deletion is limited to the current signed-in user
                    // For security reasons, Firebase doesn't allow deleting other users from client-side
                }
            })
            .catch(error => {
                console.error(`Error checking user ${email}:`, error);
                resolve(`Error: ${error.message}`);
            });
    });
}

// Check if a user exists in Firebase Auth and create if not
function checkAndCreateAuthUser(email, password) {
    return new Promise((resolve, reject) => {
        // First check if user exists
        firebase.auth().fetchSignInMethodsForEmail(email)
            .then(methods => {
                if (methods.length === 0) {
                    // User doesn't exist, create a new one
                    return firebase.auth().createUserWithEmailAndPassword(email, password)
                        .then(() => {
                            console.log(`User created successfully: ${email}`);
                            // Sign out after creating user to prevent staying logged in
                            return firebase.auth().signOut().then(() => {
                                resolve("Successfully registered new account");
                            });
                        })
                        .catch(error => {
                            if (error.code === 'auth/email-already-in-use') {
                                // User exists but we couldn't detect it with fetchSignInMethodsForEmail
                                console.log(`User already exists: ${email}`);
                                resolve("Account already registered");
                            } else {
                                console.error(`Error creating user ${email}:`, error);
                                resolve(`Error: ${error.message}`);
                            }
                        });
                } else {
                    // User already exists
                    console.log(`User already exists: ${email}`);
                    resolve("Account already registered");
                }
            })
            .catch(error => {
                console.error(`Error checking user ${email}:`, error);
                resolve(`Error: ${error.message}`);
            });
    });
}

// Check if telecaller has credentials in Firebase Authentication
function checkTelecallerCredentials(telecallerId) {
    // First check Firebase Realtime Database for cached credential status
    firebase.database().ref(`registered_telecallers/${telecallerId}`).once('value')
        .then(snapshot => {
            if (snapshot.exists() && snapshot.val() === true) {
                // We have a record that this telecaller was registered
                updateTelecallerButtonStyle(telecallerId, true);
                return; // Exit early to reduce Firebase Authentication queries
            }
            
            // If no record in database, check Authentication directly
            const telecallerEmail = `telecaller${telecallerId}@gmail.com`;
            
            return firebase.auth().fetchSignInMethodsForEmail(telecallerEmail)
                .then(methods => {
                    if (methods.length > 0) {
                        // Account exists, update button style and save to Realtime Database
                        updateTelecallerButtonStyle(telecallerId, true);
                        firebase.database().ref(`registered_telecallers/${telecallerId}`).set(true);
                    }
                });
        })
        .catch(error => {
            console.error(`Error checking telecaller credentials:`, error);
        });
}