// Watchdog Memory Agent - Extension Popup JavaScript
console.log('Watchdog Memory Agent popup loaded');

class WatchdogPopup {
    constructor() {
        this.ctaButton = document.getElementById('openConsole');
        this.sessionCountElement = document.getElementById('sessionCount');
        this.memoryCountElement = document.getElementById('memoryCount');
        this.lastActiveElement = document.getElementById('lastActive');
        this.statusElement = document.getElementById('systemStatus');
        this.loadingIndicator = document.getElementById('loading');
        
        this.initializeEventListeners();
        this.updateStatus();
        this.loadMemoryStats();
    }

    initializeEventListeners() {
        // Main CTA button to open web console
        this.ctaButton.addEventListener('click', () => this.openWebConsole());

        // Secondary action buttons
        const settingsBtn = document.getElementById('settings');
        const syncBtn = document.getElementById('sync');

        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openSettings());
        }

        if (syncBtn) {
            syncBtn.addEventListener('click', () => this.syncMemories());
        }
    }

    openWebConsole() {
        console.log('Opening Watchdog web console...');
        
        // Show loading state
        this.showLoading();
        
        // Open the Watchdog web application
        chrome.tabs.create({ 
            url: 'http://localhost:3000',
            active: true 
        }, (tab) => {
            if (chrome.runtime.lastError) {
                console.error('Error opening web console:', chrome.runtime.lastError);
                this.hideLoading();
                return;
            }
            
            console.log('Watchdog web console opened in tab:', tab.id);
            
            // Close the popup after a brief delay
            setTimeout(() => {
                window.close();
            }, 500);
        });
    }

    openSettings() {
        console.log('Opening Watchdog settings...');
        // For now, open the web console to the settings page
        chrome.tabs.create({ 
            url: 'http://localhost:3000#settings',
            active: true 
        });
        window.close();
    }

    async syncMemories() {
        console.log('Syncing memories with Watchdog...');
        
        this.showLoading();
        
        try {
            // Get stored data from extension
            const result = await chrome.storage.local.get(['memory_agent_vectors', 'memory_agent_events']);
            
            // Send sync message to background script
            const response = await this.sendMessageToBackground({
                type: 'sync_memories',
                data: {
                    vectors: result.memory_agent_vectors || [],
                    events: result.memory_agent_events || []
                }
            });

            this.hideLoading();

            if (response.success) {
                console.log('Memories synced successfully');
                this.updateStatus();
                this.loadMemoryStats();
            } else {
                console.error('Sync failed:', response.error);
            }
        } catch (error) {
            console.error('Sync error:', error);
            this.hideLoading();
        }
    }

    sendMessageToBackground(message) {
        return new Promise((resolve) => {
            console.log('Sending message to background:', message);
            chrome.runtime.sendMessage(message, (response) => {
                console.log('Received response:', response);
                if (chrome.runtime.lastError) {
                    console.error('Runtime error:', chrome.runtime.lastError);
                    resolve({ success: false, error: chrome.runtime.lastError.message });
                } else {
                    resolve(response || { success: false, error: 'No response received' });
                }
            });
        });
    }

    showLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.classList.add('active');
        }
    }

    hideLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.classList.remove('active');
        }
    }

    updateStatus() {
        // Update system status indicator
        if (this.statusElement) {
            this.statusElement.textContent = 'ONLINE';
        }
        
        // Update last active time
        if (this.lastActiveElement) {
            this.lastActiveElement.textContent = this.formatTimeAgo(Date.now());
        }
    }

    async loadMemoryStats() {
        try {
            // Get vector storage stats
            const vectorResult = await chrome.storage.local.get(['memory_agent_vectors', 'memory_agent_events']);
            const vectors = vectorResult.memory_agent_vectors || [];
            const events = vectorResult.memory_agent_events || [];
            
            // Update session count (unique domains)
            const uniqueDomains = new Set();
            vectors.forEach(vector => {
                if (vector.metadata?.url) {
                    try {
                        const domain = new URL(vector.metadata.url).hostname;
                        uniqueDomains.add(domain);
                    } catch (e) {
                        // Invalid URL, skip
                    }
                }
            });

            if (this.sessionCountElement) {
                this.sessionCountElement.textContent = uniqueDomains.size.toString();
            }

            // Update memory count
            if (this.memoryCountElement) {
                this.memoryCountElement.textContent = vectors.length.toString();
            }

            console.log(`Loaded stats: ${uniqueDomains.size} sessions, ${vectors.length} memories`);
        } catch (error) {
            console.error('Error loading memory stats:', error);
        }
    }

    // Utility functions
    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }

    // Utility functions
    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }
}

// Initialize the popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Watchdog popup...');
    new WatchdogPopup();
});