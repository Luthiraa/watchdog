// Watchdog Extension Popup
document.addEventListener('DOMContentLoaded', function() {
    console.log('🐕 Watchdog popup loaded');
    
    // Get DOM elements
    const openWebAppBtn = document.getElementById('openWebApp');
    const captureTabBtn = document.getElementById('captureTab');
    const viewHistoryBtn = document.getElementById('viewHistory');
    const syncNowBtn = document.getElementById('syncNow');
    
    // Stats elements
    const userEmailElement = document.getElementById('userEmail');
    const connectionStatusElement = document.getElementById('connectionStatus');
    const localMemoriesElement = document.getElementById('localMemories');
    const visitedUrlsElement = document.getElementById('visitedUrls');
    const unsyncedCountElement = document.getElementById('unsyncedCount');
    
    // Open web app in new tab
    openWebAppBtn?.addEventListener('click', function() {
        chrome.tabs.create({
            url: 'http://localhost:3001'
        });
        window.close();
    });
    
    // Capture current tab manually
    captureTabBtn?.addEventListener('click', async function() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Inject content script and capture content
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['src/content.js']
            });
            
            // Show feedback
            captureTabBtn.textContent = '✅ CAPTURED';
            setTimeout(() => {
                captureTabBtn.innerHTML = '<span>📸</span> CAPTURE TAB';
                loadStats(); // Refresh stats
            }, 2000);
            
        } catch (error) {
            console.error('Error capturing tab:', error);
            captureTabBtn.textContent = '❌ FAILED';
            setTimeout(() => {
                captureTabBtn.innerHTML = '<span>📸</span> CAPTURE TAB';
            }, 2000);
        }
    });
    
    // View history - open web app
    viewHistoryBtn?.addEventListener('click', function() {
        chrome.tabs.create({
            url: 'http://localhost:3001'
        });
        window.close();
    });
    
    // Manual sync to server
    syncNowBtn?.addEventListener('click', function() {
        syncNowBtn.disabled = true;
        syncNowBtn.textContent = '🔄 SYNCING...';
        
        chrome.runtime.sendMessage({ type: 'syncToServer' }, (response) => {
            if (response && response.success) {
                syncNowBtn.innerHTML = '<span>✅</span> SYNCED';
                setTimeout(() => {
                    syncNowBtn.innerHTML = '<span>🌐</span> SYNC NOW';
                    syncNowBtn.disabled = false;
                    loadStats(); // Refresh stats
                }, 2000);
            } else {
                syncNowBtn.innerHTML = '<span>❌</span> FAILED';
                setTimeout(() => {
                    syncNowBtn.innerHTML = '<span>🌐</span> SYNC NOW';
                    syncNowBtn.disabled = false;
                }, 2000);
            }
        });
    });
    
    // Load and display stats on popup open
    loadStats();
    loadLocalMemories();
    
    // Refresh stats every 3 seconds while popup is open
    const statsInterval = setInterval(loadStats, 3000);
    
    // Clear interval when popup closes
    window.addEventListener('beforeunload', () => {
        clearInterval(statsInterval);
    });
});

async function loadStats() {
    try {
        // Get stats from background script
        chrome.runtime.sendMessage({ type: 'getStats' }, (response) => {
            if (response && response.success) {
                updateStatsDisplay(response.stats);
            } else {
                console.log('No stats available yet');
            }
        });
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadLocalMemories() {
    try {
        // Get memories from local storage
        const result = await chrome.storage.local.get(['watchdog_memories']);
        const memories = result.watchdog_memories || [];
        
        console.log('💾 Local memories loaded:', memories.length);
        
        // Create or get the memories container
        let memoriesContainer = document.getElementById('localMemoriesContainer');
        if (!memoriesContainer) {
            // Create the container if it doesn't exist
            memoriesContainer = document.createElement('div');
            memoriesContainer.id = 'localMemoriesContainer';
            memoriesContainer.className = 'local-memories-section';
            
            // Insert after the quick-actions section
            const quickActions = document.querySelector('.quick-actions');
            if (quickActions && quickActions.parentNode) {
                quickActions.parentNode.insertBefore(memoriesContainer, quickActions.nextSibling);
            }
        }
        
        // Display memories
        if (memories.length > 0) {
            let html = '<div class="memories-header">📚 LOCAL MEMORIES</div>';
            html += '<div class="memories-list">';
            
            // Show most recent 5 memories
            memories.slice(0, 5).forEach((memory, index) => {
                const timestamp = new Date(memory.timestamp);
                const timeAgo = getTimeAgo(timestamp);
                const title = memory.metadata?.title || 'Untitled';
                const content = memory.content?.substring(0, 100) || 'No content';
                const synced = memory.synced ? '✅' : '⏳';
                
                html += `
                    <div class="memory-item">
                        <div class="memory-header">
                            <span class="memory-sync-status">${synced}</span>
                            <span class="memory-title">${title}</span>
                        </div>
                        <div class="memory-content">${content}${memory.content?.length > 100 ? '...' : ''}</div>
                        <div class="memory-meta">${timeAgo}</div>
                    </div>
                `;
            });
            
            html += '</div>';
            memoriesContainer.innerHTML = html;
            memoriesContainer.style.display = 'block';
        } else {
            memoriesContainer.innerHTML = '<div class="memories-header">📚 NO LOCAL MEMORIES YET</div>';
            memoriesContainer.style.display = 'block';
        }
        
    } catch (error) {
        console.error('❌ Error loading local memories:', error);
    }
}

function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

function updateStatsDisplay(stats) {
    console.log('📊 Stats received:', stats);
    
    // Update DOM elements
    const userEmailElement = document.getElementById('userEmail');
    const connectionStatusElement = document.getElementById('connectionStatus');
    const localMemoriesElement = document.getElementById('localMemories');
    const visitedUrlsElement = document.getElementById('visitedUrls');
    const unsyncedCountElement = document.getElementById('unsyncedCount');
    const syncNowBtn = document.getElementById('syncNow');
    
    // User info
    if (userEmailElement) {
        if (stats.user) {
            userEmailElement.textContent = stats.user;
            userEmailElement.style.color = '#00ff88';
        } else {
            userEmailElement.textContent = 'NOT AUTHENTICATED';
            userEmailElement.style.color = '#ff6666';
        }
    }
    
    // Connection status
    if (connectionStatusElement) {
        if (stats.user) {
            connectionStatusElement.textContent = 'CONNECTED';
            connectionStatusElement.style.color = '#00ff88';
        } else {
            connectionStatusElement.textContent = 'DISCONNECTED';
            connectionStatusElement.style.color = '#ff6666';
        }
    }
    
    // Memory counts
    if (localMemoriesElement) {
        localMemoriesElement.textContent = stats.localMemories || 0;
    }
    
    if (visitedUrlsElement) {
        visitedUrlsElement.textContent = stats.visitedUrls || 0;
    }
    
    if (unsyncedCountElement) {
        const unsyncedCount = stats.unsyncedMemories || 0;
        unsyncedCountElement.textContent = unsyncedCount;
        
        // Change color based on unsynced count
        if (unsyncedCount > 20) {
            unsyncedCountElement.style.color = '#ff6666';
        } else if (unsyncedCount > 10) {
            unsyncedCountElement.style.color = '#ff8800';
        } else {
            unsyncedCountElement.style.color = '#00ff88';
        }
    }
    
    // Enable/disable sync button
    if (syncNowBtn) {
        const unsyncedCount = stats.unsyncedMemories || 0;
        const hasUser = !!stats.user;
        
        if (hasUser && unsyncedCount > 0) {
            syncNowBtn.disabled = false;
            syncNowBtn.style.opacity = '1';
        } else {
            syncNowBtn.disabled = true;
            syncNowBtn.style.opacity = '0.5';
        }
    }
}