
    // Game State
    let gameState = {
        teamABudget: 100.0,
        teamBBudget: 100.0,
        teamASquad: [],
        teamBSquad: [],
        currentSection: null,
        currentPlayer: null,
        biddingActive: false,
        currentBids: { A: 0, B: 0 },
        highestBidder: null,
        unsoldPlayers: []
    };

    // Player Database
    let players = {
        Batsmen: [],
        Bowlers: [],
        Allrounders: []
    };

    // Available players (copy of original for manipulation)
    let availablePlayers = {
        Batsmen: [],
        Bowlers: [],
        Allrounders: []
    };

    // Store original default players for reset functionality
    let defaultPlayers = {
        Batsmen: [],
        Bowlers: [],
        Allrounders: []
    };

    // API functions
    const url ='http://localhost:3000'
    async function fetchGameData() {
        try {
            const response = await fetch(`${url}/api/data`);
            const data = await response.json();
            
            gameState.teamABudget = data.teamABudget;
            gameState.teamBBudget = data.teamBBudget;
            gameState.teamASquad = data.teamASquad;
            gameState.teamBSquad = data.teamBSquad;
            gameState.unsoldPlayers = data.unsoldPlayers;
            
            players = JSON.parse(JSON.stringify(data.defaultPlayers));
            availablePlayers = JSON.parse(JSON.stringify(data.availablePlayers));
            defaultPlayers = JSON.parse(JSON.stringify(data.defaultPlayers));
            
            updateTeamDisplay('A');
            updateTeamDisplay('B');
            updateUnsoldDisplay();
            updateSectionCounts();
            
            return true;
        } catch (error) {
            console.error('Error fetching game data:', error);
            return false;
        }
    }

    async function saveGameData() {
        try {
            const dataToSave = {
                teamABudget: gameState.teamABudget,
                teamBBudget: gameState.teamBBudget,
                teamASquad: gameState.teamASquad,
                teamBSquad: gameState.teamBSquad,
                unsoldPlayers: gameState.unsoldPlayers,
                availablePlayers: availablePlayers,
                defaultPlayers: defaultPlayers
            };
            
            const response = await fetch(`${url}/api/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToSave)
            });
            
            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Error saving game data:', error);
            return false;
        }
    }

    async function resetAuctionData() {
        try {
            const response = await fetch(`${url}/api/reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            if (result.success) {

                gameState.teamABudget = 100.0;
                gameState.teamBBudget = 100.0;
                await fetchGameData();
                resetAuctionState();
                addToLog('🔄 Auction has been reset to initial state', 'text-yellow-400');
            }
            return result.success;
        } catch (error) {
            console.error('Error resetting auction data:', error);
            return false;
        }
    }

    // Add reset button functionality
    function addResetButton() {
        const resetButton = document.createElement('button');
        resetButton.textContent = '🔄 Reset Auction';
        resetButton.className = 'w-full bg-gradient-to-r from-gray-500 to-gray-700 hover:from-gray-600 hover:to-gray-800 px-4 py-3 rounded-xl font-semibold transition-all mt-4';
        resetButton.onclick = resetAuctionData;
        
        // Add it to your sidebar
        document.querySelector('.border-t.border-gray-700.pt-4.mt-6').appendChild(resetButton);
    }

    // Initialize the app
    document.addEventListener('DOMContentLoaded', async function() {
        // Add reset button first
        addResetButton();
        
        // Then fetch game data
        const success = await fetchGameData();
        if (success) {
            addToLog('🏏 Cricket Auction App initialized. Referee, please select a section to begin!', 'text-yellow-400');
        } else {
            addToLog('❌ Failed to load auction data. Please refresh the page.', 'text-red-400');
        }
    });

    // Now include all your original functions here (they must be defined before being called)
    function selectSection(section) {
        // Your original selectSection function code
        // Check if section is empty and try to refill with unsold players
        if (availablePlayers[section].length === 0) {
            const unsoldFromSection = gameState.unsoldPlayers.filter(player => player.category === section);
            
            if (unsoldFromSection.length > 0) {
                // Refill section with unsold players
                availablePlayers[section] = unsoldFromSection.map(player => ({
                    name: player.name,
                    basePrice: player.basePrice
                }));
                
                // Remove these players from unsold list
                gameState.unsoldPlayers = gameState.unsoldPlayers.filter(player => player.category !== section);
                
                addToLog(`🔄 ${section} section refilled with ${unsoldFromSection.length} unsold players!`, 'text-cyan-400');
                updateSectionCounts();
            } else {
                addToLog(`❌ No players left in ${section} section!`, 'text-red-400');
                return;
            }
        }
        
        gameState.currentSection = section;
        document.getElementById('wheelTitle').textContent = `${section} Section Selected`;
        document.getElementById('spinBtn').disabled = false;
        
        generateWheel(section);
        addToLog(`🎯 Referee selected ${section} section`, 'text-yellow-400');
    }

    function generateWheel(section) {
        // Your original generateWheel function code
        const svg = document.getElementById('wheelSvg');
        const players = availablePlayers[section];
        const anglePerSegment = 360 / players.length;
        
        // Clear existing segments
        svg.innerHTML = '<circle cx="150" cy="150" r="140" fill="none" stroke="#374151" stroke-width="4"/>';
        
        const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
        
        players.forEach((player, index) => {
            const startAngle = index * anglePerSegment - 90;
            const endAngle = (index + 1) * anglePerSegment - 90;
            
            const x1 = 150 + 130 * Math.cos(startAngle * Math.PI / 180);
            const y1 = 150 + 130 * Math.sin(startAngle * Math.PI / 180);
            const x2 = 150 + 130 * Math.cos(endAngle * Math.PI / 180);
            const y2 = 150 + 130 * Math.sin(endAngle * Math.PI / 180);
            
            const largeArcFlag = anglePerSegment > 180 ? 1 : 0;
            
            const pathData = `M 150 150 L ${x1} ${y1} A 130 130 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.setAttribute('fill', colors[index % colors.length]);
            path.setAttribute('stroke', '#1f2937');
            path.setAttribute('stroke-width', '2');
            svg.appendChild(path);
            
            // Add text
            const textAngle = startAngle + anglePerSegment / 2;
            const textX = 150 + 90 * Math.cos(textAngle * Math.PI / 180);
            const textY = 150 + 90 * Math.sin(textAngle * Math.PI / 180);
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', textX);
            text.setAttribute('y', textY);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', 'white');
            text.setAttribute('font-size', '10');
            text.setAttribute('font-weight', 'bold');
            text.textContent = player.name.split(' ')[0];
            svg.appendChild(text);
        });
    }

    function spinWheel() {
        // Your original spinWheel function code
        if (!gameState.currentSection || availablePlayers[gameState.currentSection].length === 0) return;
        
        const players = availablePlayers[gameState.currentSection];
        const randomIndex = Math.floor(Math.random() * players.length);
        const selectedPlayer = players[randomIndex];
        
        // Calculate spin rotation to land on the correct player
        const anglePerSegment = 360 / players.length;
        // The pointer is at the top (12 o'clock), so we need to account for that
        // Each segment starts at index * anglePerSegment - 90 degrees
        const targetAngle = randomIndex * anglePerSegment + (anglePerSegment / 2);
        
        // Add random variations for unpredictability but ensure correct landing
        const randomSpins = 8 + Math.floor(Math.random() * 5); // 8-12 full rotations
        const randomVariation = (Math.random() - 0.5) * anglePerSegment * 0.3; // Small variation within the segment
        
        // Calculate final rotation: we want the selected segment to be at the top (0 degrees)
        // So we rotate to bring that segment to the top
        const finalRotation = randomSpins * 360 + (360 - targetAngle) + randomVariation;
        
        const wheel = document.getElementById('wheelSvg');
        
        // Add random duration between 3-5 seconds
        const spinDuration = 3000 + Math.random() * 2000;
        wheel.style.transition = `transform ${spinDuration}ms cubic-bezier(0.23, 1, 0.32, 1)`;
        wheel.style.transform = `rotate(${finalRotation}deg)`;
        
        document.getElementById('spinBtn').disabled = true;
        
        setTimeout(() => {
            gameState.currentPlayer = selectedPlayer;
            showPlayerDetails(selectedPlayer);
            
            // Remove player from available pool
            availablePlayers[gameState.currentSection].splice(randomIndex, 1);
            
            // Regenerate wheel without the selected player
            if (availablePlayers[gameState.currentSection].length > 0) {
                generateWheel(gameState.currentSection);
            } else {
                // Clear wheel if no players left
                const svg = document.getElementById('wheelSvg');
                svg.innerHTML = '<circle cx="150" cy="150" r="140" fill="#374151" stroke="#6b7280" stroke-width="4"/><text x="150" y="150" text-anchor="middle" dominant-baseline="middle" fill="#9ca3af" font-size="16">Section Complete</text>';
            }
            
            document.getElementById('startBidBtn').disabled = false;
            document.getElementById('unsoldBtn').disabled = false;
            
            addToLog(`🎰 Wheel selected: ${selectedPlayer.name} (${gameState.currentSection})`, 'text-green-400');
            
            // Reset transition for next spin
            wheel.style.transition = 'transform 3s cubic-bezier(0.23, 1, 0.32, 1)';
        }, spinDuration);
    }

    function showPlayerDetails(player) {
        // Your original showPlayerDetails function code
        // Reset animations by hiding and showing the display
        const playerDisplay = document.getElementById('playerDisplay');
        playerDisplay.style.display = 'none';
        
        // Force reflow to reset animations
        playerDisplay.offsetHeight;
        
        // Show with animations
        playerDisplay.style.display = 'block';
        
        // Update player details
        document.getElementById('playerName').textContent = player.name;
        document.getElementById('playerCategory').textContent = gameState.currentSection;
        document.getElementById('playerBasePrice').textContent = `₹${player.basePrice} Cr`;
        document.getElementById('playerStatus').textContent = 'Status: Available for Bidding';
        
        // Update player image with enhanced reveal
        const playerImage = document.getElementById('playerImage');
        const playerFallback = document.getElementById('playerFallback');
        
        // Reset image states
        playerImage.style.display = 'none';
        playerFallback.style.display = 'flex';
        
        // Try to load player image
        const img = new Image();
        img.onload = function() {
            // Image loaded successfully - show it with animation
            setTimeout(() => {
                playerImage.src = `images/${player.name}.png`;
                playerImage.alt = player.name;
                playerImage.style.display = 'block';
                playerFallback.style.display = 'none';
            }, 800); // Delay to sync with container animation
        };
        
        img.onerror = function() {
            // Image failed to load - enhance fallback with player initials
            const initials = player.name.split(' ').map(n => n[0]).join('');
            playerFallback.innerHTML = `
                <div class="text-center">
                    <div class="text-4xl mb-2">🏏</div>
                    <div class="text-2xl font-bold">${initials}</div>
                </div>
            `;
        };
        
        // Start loading the image
        img.src = `images/${player.name}.png`;
    }

    function startBidding() {
        // Your original startBidding function code
        if (!gameState.currentPlayer) return;
        
        gameState.biddingActive = true;
        gameState.currentBids = { A: 0, B: 0 };
        gameState.highestBidder = null;
        
        document.getElementById('biddingSection').style.display = 'grid';
        document.getElementById('startBidBtn').disabled = true;
        document.getElementById('unsoldBtn').disabled = true;
        
        // Set minimum bid amounts
        document.getElementById('teamABid').value = gameState.currentPlayer.basePrice;
        document.getElementById('teamBBid').value = gameState.currentPlayer.basePrice;
        
        addToLog(`💰 Bidding started for ${gameState.currentPlayer.name} (Base: ₹${gameState.currentPlayer.basePrice} Cr)`, 'text-blue-400');
    }

    function placeBid(team) {
        // Your original placeBid function code
        if (!gameState.biddingActive) return;
        
        const bidInput = document.getElementById(`team${team}Bid`);
        const bidAmount = parseFloat(bidInput.value);
        const teamBudget = team === 'A' ? gameState.teamABudget : gameState.teamBBudget;
        
        // Validation
        if (isNaN(bidAmount) || bidAmount < gameState.currentPlayer.basePrice) {
            alert(`Minimum bid is ₹${gameState.currentPlayer.basePrice} Cr`);
            return;
        }
        
        if (bidAmount > teamBudget) {
            alert(`Insufficient budget! Available: ₹${teamBudget} Cr`);
            return;
        }
        
        const otherTeam = team === 'A' ? 'B' : 'A';
        const otherTeamBid = gameState.currentBids[otherTeam];
        
        if (bidAmount <= otherTeamBid) {
            alert(`Bid must be higher than ₹${otherTeamBid} Cr`);
            return;
        }
        
        // Place bid
        gameState.currentBids[team] = bidAmount;
        gameState.highestBidder = team;
        
        document.getElementById(`team${team}CurrentBid`).textContent = `₹${bidAmount} Cr`;
        document.getElementById(`team${team}CurrentBid`).classList.add('bid-animation');
        
        // Update other team's minimum bid
        document.getElementById(`team${otherTeam}Bid`).value = bidAmount + 0.25;
        
        document.getElementById('confirmBtn').disabled = false;
        
        addToLog(`🔥 Team ${team} bids ₹${bidAmount} Cr for ${gameState.currentPlayer.name}`, team === 'A' ? 'text-red-400' : 'text-blue-400');
        
        setTimeout(() => {
            document.getElementById(`team${team}CurrentBid`).classList.remove('bid-animation');
        }, 500);
    }

    async function confirmWinner() {
        // Modified confirmWinner function with save to backend
        if (!gameState.highestBidder || !gameState.currentPlayer) return;
        
        const winningTeam = gameState.highestBidder;
        const winningBid = gameState.currentBids[winningTeam];
        const player = { ...gameState.currentPlayer, soldPrice: winningBid };
        
        // Add category info to player
        player.category = gameState.currentSection;
        
        // Add to team and deduct budget
        if (winningTeam === 'A') {
            gameState.teamASquad.push(player);
            gameState.teamABudget -= winningBid;
            updateTeamDisplay('A');
        } else {
            gameState.teamBSquad.push(player);
            gameState.teamBBudget -= winningBid;
            updateTeamDisplay('B');
        }
        
        addToLog(`✅ ${gameState.currentPlayer.name} SOLD to Team ${winningTeam} for ₹${winningBid} Cr`, 'text-green-400');
        
        // Save to backend
        await saveGameData();
        
        resetAuctionState();
    }

    async function markUnsold() {
        // Modified markUnsold function with save to backend
        if (!gameState.currentPlayer) return;
        
        // Add category info to unsold player
        const unsoldPlayer = { ...gameState.currentPlayer, category: gameState.currentSection };
        gameState.unsoldPlayers.push(unsoldPlayer);
        addToLog(`❌ ${gameState.currentPlayer.name} marked as UNSOLD`, 'text-red-400');
        
        // Update unsold players display
        updateUnsoldDisplay();
        
        // Save to backend
        await saveGameData();
        
        resetAuctionState();
    }

    function resetAuctionState() {
        // Your original resetAuctionState function code
        gameState.biddingActive = false;
        gameState.currentPlayer = null;
        gameState.currentBids = { A: 0, B: 0 };
        gameState.highestBidder = null;
        
        document.getElementById('playerDisplay').style.display = 'none';
        document.getElementById('biddingSection').style.display = 'none';
        
        document.getElementById('teamACurrentBid').textContent = '-';
        document.getElementById('teamBCurrentBid').textContent = '-';
        document.getElementById('teamABid').value = '';
        document.getElementById('teamBBid').value = '';
        
        document.getElementById('spinBtn').disabled = false;
        document.getElementById('startBidBtn').disabled = true;
        document.getElementById('unsoldBtn').disabled = true;
        document.getElementById('confirmBtn').disabled = true;
        
        // Update section counts
        updateSectionCounts();
        
        // Check if section is empty
        if (gameState.currentSection && availablePlayers[gameState.currentSection].length === 0) {
            document.getElementById('wheelTitle').textContent = 'Section completed! Select another section.';
            document.getElementById('spinBtn').disabled = true;
            gameState.currentSection = null;
        }
    }

    function updateSectionCounts() {
        // Your original updateSectionCounts function code
        document.getElementById('batsmenCount').textContent = availablePlayers.Batsmen.length;
        document.getElementById('bowlersCount').textContent = availablePlayers.Bowlers.length;
        document.getElementById('allroundersCount').textContent = availablePlayers.Allrounders.length;
    }

    function updateUnsoldDisplay() {
        // Your original updateUnsoldDisplay function code
        const unsoldSection = document.getElementById('unsoldSection');
        const unsoldCount = document.getElementById('unsoldCount');
        const unsoldList = document.getElementById('unsoldPlayersList');
        
        if (gameState.unsoldPlayers.length === 0) {
            unsoldSection.style.display = 'none';
            return;
        }
        
        unsoldSection.style.display = 'block';
        unsoldCount.textContent = gameState.unsoldPlayers.length;
        
        // Group unsold players by category
        const groupedUnsold = {
            Batsmen: gameState.unsoldPlayers.filter(p => p.category === 'Batsmen'),
            Bowlers: gameState.unsoldPlayers.filter(p => p.category === 'Bowlers'),
            Allrounders: gameState.unsoldPlayers.filter(p => p.category === 'Allrounders')
        };
        
        let html = '';
        
        Object.entries(groupedUnsold).forEach(([category, players]) => {
            if (players.length > 0) {
                const categoryColors = {
                    Batsmen: 'from-orange-500 to-red-500',
                    Bowlers: 'from-purple-500 to-blue-500',
                    Allrounders: 'from-green-500 to-emerald-500'
                };
                
                const categoryIcons = {
                    Batsmen: '🏏',
                    Bowlers: '⚡',
                    Allrounders: '🎯'
                };
                
                html += `
                    <div class="col-span-full">
                        <div class="flex items-center gap-2 mb-3">
                            <div class="w-6 h-6 bg-gradient-to-r ${categoryColors[category]} rounded-lg flex items-center justify-center text-sm">
                                ${categoryIcons[category]}
                            </div>
                            <h4 class="text-lg font-semibold text-white">${category}</h4>
                            <span class="text-sm text-gray-400">(${players.length} players)</span>
                        </div>
                    </div>
                `;
                
                players.forEach(player => {
                    html += `
                        <div class="glass-card rounded-xl p-4 border border-gray-600/50">
                            <div class="flex items-center gap-3">
                                <div class="relative">
                                    <img src="images/${player.name}.png" alt="${player.name}" class="w-10 h-10 rounded-full object-cover border-2 border-gray-500" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                    <div class="w-10 h-10 bg-gradient-to-r from-gray-500 to-slate-500 rounded-full flex items-center justify-center text-sm font-bold" style="display: none;">
                                        ${player.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                </div>
                                <div class="flex-1">
                                    <div class="font-semibold text-white">${player.name}</div>
                                    <div class="text-sm text-gray-400">₹${player.basePrice} Cr</div>
                                </div>
                                <div class="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
                                    UNSOLD
                                </div>
                            </div>
                        </div>
                    `;
                });
            }
        });
        
        if (html === '') {
            html = `
                <div class="col-span-full text-gray-400 text-center py-8">
                    <div class="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        ✅
                    </div>
                    <div class="text-lg font-semibold mb-2">No unsold players</div>
                    <div class="text-sm">All players have been successfully auctioned!</div>
                </div>
            `;
        }
        
        unsoldList.innerHTML = html;
    }

    function updateTeamDisplay(team) {
        // Your original updateTeamDisplay function code
        const squad = team === 'A' ? gameState.teamASquad : gameState.teamBSquad;
        const budget = team === 'A' ? gameState.teamABudget : gameState.teamBBudget;
        
        // Update budget display
        document.getElementById(`team${team}Budget`).textContent = `₹${budget.toFixed(1)} Cr`;
        
        // Update squad display
        const squadContainer = document.getElementById(`team${team}Squad`);
        
        if (squad.length === 0) {
            squadContainer.innerHTML = `
                <div class="text-gray-400 text-center py-8">
                    <div class="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        👥
                    </div>
                    <div class="text-lg font-semibold mb-2">No players yet</div>
                    <div class="text-sm">Players will appear here after successful bids</div>
                </div>
            `;
            return;
        }
        
        squadContainer.innerHTML = squad.map(player => `
            <div class="glass-card rounded-xl p-4 hover-lift">
                <div class="flex items-center gap-4">
                    <div class="relative">
                        <img src="images/${player.name}.png" alt="${player.name}" class="w-12 h-12 rounded-full object-cover border-2 border-purple-500" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-lg font-bold" style="display: none;">
                            ${player.name.split(' ').map(n => n[0]).join('')}
                        </div>
                    </div>
                    <div class="flex-1">
                        <div class="font-bold text-white text-lg">${player.name}</div>
                        <div class="text-sm text-gray-400">${player.category || 'Unknown'}</div>
                    </div>
                    <div class="text-right">
                        <div class="font-bold text-green-400 text-lg">₹${player.soldPrice} Cr</div>
                        <div class="text-xs text-gray-500">Base: ₹${player.basePrice} Cr</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function addToLog(message, className = 'text-white') {
        // Your original addToLog function code
        const log = document.getElementById('auctionLog');
        const timestamp = new Date().toLocaleTimeString();
        
        if (log.children.length === 1 && log.children[0].textContent.includes('Auction log will appear here')) {
            log.innerHTML = '';
        }
        
        const logEntry = document.createElement('div');
        logEntry.className = `${className} text-sm`;
        logEntry.innerHTML = `<span class="text-gray-400">[${timestamp}]</span> ${message}`;
        
        log.appendChild(logEntry);
        log.scrollTop = log.scrollHeight;
    }

    function downloadAuctionData() {
        // Your original downloadAuctionData function code
        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // Team A data
        const teamAData = gameState.teamASquad.map((player, index) => ({
            'S.No': index + 1,
            'Player Name': player.name,
            'Category': player.category || getPlayerCategory(player.name),
            'Base Price (Cr)': player.basePrice,
            'Sold Price (Cr)': player.soldPrice,
            'Profit/Loss (Cr)': (player.soldPrice - player.basePrice).toFixed(1)
        }));
        
        // Add team summary for Team A
        teamAData.push({
            'S.No': '',
            'Player Name': 'TEAM A SUMMARY',
            'Category': '',
            'Base Price (Cr)': '',
            'Sold Price (Cr)': '',
            'Profit/Loss (Cr)': ''
        });
        teamAData.push({
            'S.No': '',
            'Player Name': 'Total Players',
            'Category': gameState.teamASquad.length,
            'Base Price (Cr)': '',
            'Sold Price (Cr)': '',
            'Profit/Loss (Cr)': ''
        });
        teamAData.push({
            'S.No': '',
            'Player Name': 'Total Spent',
            'Category': `₹${gameState.teamASquad.reduce((sum, p) => sum + p.soldPrice, 0).toFixed(1)} Cr`,
            'Base Price (Cr)': '',
            'Sold Price (Cr)': '',
            'Profit/Loss (Cr)': ''
        });
        teamAData.push({
            'S.No': '',
            'Player Name': 'Remaining Budget',
            'Category': `₹${gameState.teamABudget.toFixed(1)} Cr`,
            'Base Price (Cr)': '',
            'Sold Price (Cr)': '',
            'Profit/Loss (Cr)': ''
        });
        
        // Team B data
        const teamBData = gameState.teamBSquad.map((player, index) => ({
            'S.No': index + 1,
            'Player Name': player.name,
            'Category': player.category || getPlayerCategory(player.name),
            'Base Price (Cr)': player.basePrice,
            'Sold Price (Cr)': player.soldPrice,
            'Profit/Loss (Cr)': (player.soldPrice - player.basePrice).toFixed(1)
        }));
        
        // Add team summary for Team B
        teamBData.push({
            'S.No': '',
            'Player Name': 'TEAM B SUMMARY',
            'Category': '',
            'Base Price (Cr)': '',
            'Sold Price (Cr)': '',
            'Profit/Loss (Cr)': ''
        });
        teamBData.push({
            'S.No': '',
            'Player Name': 'Total Players',
            'Category': gameState.teamBSquad.length,
            'Base Price (Cr)': '',
            'Sold Price (Cr)': '',
            'Profit/Loss (Cr)': ''
        });
        teamBData.push({
            'S.No': '',
            'Player Name': 'Total Spent',
            'Category': `₹${gameState.teamBSquad.reduce((sum, p) => sum + p.soldPrice, 0).toFixed(1)} Cr`,
            'Base Price (Cr)': '',
            'Sold Price (Cr)': '',
            'Profit/Loss (Cr)': ''
        });
        teamBData.push({
            'S.No': '',
            'Player Name': 'Remaining Budget',
            'Category': `₹${gameState.teamBBudget.toFixed(1)} Cr`,
            'Base Price (Cr)': '',
            'Sold Price (Cr)': '',
            'Profit/Loss (Cr)': ''
        });
        
        // Unsold players data
        const unsoldData = gameState.unsoldPlayers.map((player, index) => ({
            'S.No': index + 1,
            'Player Name': player.name,
            'Category': player.category || getPlayerCategory(player.name),
            'Base Price (Cr)': player.basePrice,
            'Status': 'UNSOLD'
        }));
        
        // Create worksheets
        const wsTeamA = XLSX.utils.json_to_sheet(teamAData);
        const wsTeamB = XLSX.utils.json_to_sheet(teamBData);
        const wsUnsold = XLSX.utils.json_to_sheet(unsoldData);
        
        // Add worksheets to workbook
        XLSX.utils.book_append_sheet(wb, wsTeamA, "Team A");
        XLSX.utils.book_append_sheet(wb, wsTeamB, "Team B");
        if (unsoldData.length > 0) {
            XLSX.utils.book_append_sheet(wb, wsUnsold, "Unsold Players");
        }
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `Cricket_Auction_Results_${timestamp}.xlsx`;
        
        // Download file
        XLSX.writeFile(wb, filename);
        
        addToLog(`📊 Auction data downloaded as ${filename}`, 'text-indigo-400');
    }
    
    function getPlayerCategory(playerName) {
        // Your original getPlayerCategory function code
        for (const [category, playerList] of Object.entries(players)) {
            if (playerList.some(p => p.name === playerName)) {
                return category;
            }
        }
        return 'Unknown';
    }

    // Player Customization Functions
    function openCustomizeModal() {
        // Your original openCustomizeModal function code
        document.getElementById('customizeModal').classList.remove('hidden');
        populateCustomizeModal();
    }

    function closeCustomizeModal() {
        // Your original closeCustomizeModal function code
        document.getElementById('customizeModal').classList.add('hidden');
    }

    function populateCustomizeModal() {
        // Your original populateCustomizeModal function code
        ['Batsmen', 'Bowlers', 'Allrounders'].forEach(section => {
            const container = document.getElementById(`${section.toLowerCase()}Customize`);
            container.innerHTML = '';
            
            players[section].forEach((player, index) => {
                const playerDiv = document.createElement('div');
                playerDiv.className = 'glass-card p-3 rounded-lg';
                playerDiv.innerHTML = `
                    <div class="flex gap-2 mb-2">
                        <input type="text" value="${player.name}" 
                               class="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                               placeholder="Player Name"
                               onchange="updatePlayerName('${section}', ${index}, this.value)">
                        <button onclick="removePlayer('${section}', ${index})" 
                                class="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm font-semibold transition-colors">
                            🗑️
                        </button>
                    </div>
                    <div class="flex gap-2">
                        <span class="text-sm text-gray-400 flex items-center">₹</span>
                        <input type="number" value="${player.basePrice}" step="0.1" min="0.1"
                               class="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                               placeholder="Base Price (Cr)"
                               onchange="updatePlayerPrice('${section}', ${index}, parseFloat(this.value))">
                        <span class="text-sm text-gray-400 flex items-center">Cr</span>
                    </div>
                `;
                container.appendChild(playerDiv);
            });
        });
    }

    function addPlayer(section) {
        // Your original addPlayer function code
        const newPlayer = {
            name: `New ${section.slice(0, -1)}`,
            basePrice: 1.0
        };
        players[section].push(newPlayer);
        populateCustomizeModal();
    }

    function removePlayer(section, index) {
        // Your original removePlayer function code
        if (players[section].length > 1) {
            players[section].splice(index, 1);
            populateCustomizeModal();
        } else {
            alert(`At least one ${section.slice(0, -1).toLowerCase()} must remain!`);
        }
    }

    function updatePlayerName(section, index, newName) {
        // Your original updatePlayerName function code
        if (newName.trim()) {
            players[section][index].name = newName.trim();
        }
    }

    function updatePlayerPrice(section, index, newPrice) {
        // Your original updatePlayerPrice function code
        if (newPrice >= 0.1) {
            players[section][index].basePrice = newPrice;
        }
    }

    async function saveCustomPlayers() {
        // Modified saveCustomPlayers function with save to backend
        // Validate that all sections have at least one player
        const sections = ['Batsmen', 'Bowlers', 'Allrounders'];
        for (const section of sections) {
            if (players[section].length === 0) {
                alert(`${section} section cannot be empty!`);
                return;
            }
            
            // Validate that all players have names and valid prices
            for (const player of players[section]) {
                if (!player.name.trim()) {
                    alert(`All players must have names!`);
                    return;
                }
                if (player.basePrice < 0.1) {
                    alert(`All players must have a base price of at least ₹0.1 Cr!`);
                    return;
                }
            }
        }
        
        // Update default players
        defaultPlayers = JSON.parse(JSON.stringify(players));
        
        // Reset available players with new data
        availablePlayers = JSON.parse(JSON.stringify(players));
        
        // Update section counts
        updateSectionCounts();
        
        // Reset game state if auction is in progress
        if (gameState.currentSection || gameState.currentPlayer) {
            resetAuctionState();
            gameState.currentSection = null;
            document.getElementById('wheelTitle').textContent = 'Select a section to begin';
            
            // Clear wheel
            const svg = document.getElementById('wheelSvg');
            svg.innerHTML = '<circle cx="150" cy="150" r="140" fill="none" stroke="#374151" stroke-width="4"/>';
        }
        
        // Save to backend
        await saveGameData();
        
        closeCustomizeModal();
        addToLog('⚙️ Player database updated successfully!', 'text-green-400');
    }

    function resetToDefault() {
        // Your original resetToDefault function code
        if (confirm('Are you sure you want to reset to default players? This will clear any customizations.')) {
            // Reset to original default players
            Object.keys(players).forEach(section => {
                players[section] = JSON.parse(JSON.stringify(defaultPlayers[section]));
            });
            
            populateCustomizeModal();
            addToLog('🔄 Players reset to default database', 'text-yellow-400');
        }
    }

    // Close modal when clicking outside
    document.getElementById('customizeModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeCustomizeModal();
        }
    });