// Memory Agent Popup JavaScript
console.log('Memory Agent popup loaded');

class MemoryAgentPopup {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.searchButton = document.getElementById('searchButton');
        this.resultsContainer = document.getElementById('results');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.emptyState = document.getElementById('emptyState');
        this.pageCountElement = document.getElementById('pageCount');
        this.lastUpdateElement = document.getElementById('lastUpdate');
        
        this.initializeEventListeners();
        this.loadStats();
    }

    initializeEventListeners() {
        // Search functionality
        this.searchButton.addEventListener('click', () => this.performSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // Quick action buttons
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const query = e.target.getAttribute('data-query');
                this.searchInput.value = query;
                this.performSearch();
            });
        });

        // Footer buttons
        document.getElementById('clearData').addEventListener('click', () => this.clearAllData());
        document.getElementById('exportData').addEventListener('click', () => this.exportData());

        // Focus search input on load
        this.searchInput.focus();
    }

    async performSearch() {
        const query = this.searchInput.value.trim();
        if (!query) return;

        this.showLoading();
        
        try {
            const response = await this.sendMessageToBackground({
                type: 'search',
                query: query,
                limit: 10
            });

            if (response.success) {
                this.displayResults(response.results, query);
            } else {
                this.showError('Search failed: ' + response.error);
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Search failed. Please try again.');
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
        this.loadingIndicator.classList.remove('hidden');
        this.resultsContainer.innerHTML = '';
        this.emptyState.classList.add('hidden');
    }

    hideLoading() {
        this.loadingIndicator.classList.add('hidden');
    }

    displayResults(results, query) {
        this.hideLoading();
        
        if (results.length === 0) {
            this.showNoResults(query);
            return;
        }

        this.emptyState.classList.add('hidden');
        this.resultsContainer.innerHTML = '';

        results.forEach(result => {
            const resultElement = this.createResultElement(result);
            this.resultsContainer.appendChild(resultElement);
        });
    }

    createResultElement(result) {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'result-item';
        
        const title = result.metadata?.title || 'Untitled Page';
        const url = result.metadata?.url || '#';
        const snippet = this.highlightQuery(result.content, this.searchInput.value);
        const similarity = (result.similarity * 100).toFixed(1);
        const timeAgo = this.formatTimeAgo(result.timestamp);

        resultDiv.innerHTML = `
            <div class="result-title">${this.escapeHtml(title)}</div>
            <div class="result-url">${this.truncateUrl(url)}</div>
            <div class="result-snippet">${snippet}</div>
            <div class="result-meta">
                <span class="similarity-score">${similarity}% match</span>
                <span class="result-time">${timeAgo}</span>
            </div>
        `;

        resultDiv.addEventListener('click', () => {
            chrome.tabs.create({ url: url });
            window.close();
        });

        return resultDiv;
    }

    highlightQuery(text, query) {
        if (!query) return this.escapeHtml(text.slice(0, 150)) + '...';
        
        const words = query.toLowerCase().split(/\s+/);
        let highlightedText = this.escapeHtml(text);
        
        words.forEach(word => {
            if (word.length > 2) {
                const regex = new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'gi');
                highlightedText = highlightedText.replace(regex, `<mark>$&</mark>`);
            }
        });
        
        return highlightedText.slice(0, 200) + '...';
    }

    showNoResults(query) {
        this.emptyState.innerHTML = `
            <div class="empty-icon">🤔</div>
            <h3>No results found</h3>
            <p>I couldn't find anything matching "${this.escapeHtml(query)}" in your browsing history. Try a different search term or browse more pages to build your memory.</p>
        `;
        this.emptyState.classList.remove('hidden');
    }

    showError(message) {
        this.hideLoading();
        this.emptyState.innerHTML = `
            <div class="empty-icon">⚠️</div>
            <h3>Search Error</h3>
            <p>${this.escapeHtml(message)}</p>
        `;
        this.emptyState.classList.remove('hidden');
    }

    async loadStats() {
        try {
            // Get vector storage stats
            const vectorResult = await chrome.storage.local.get(['memory_agent_vectors']);
            const vectors = vectorResult.memory_agent_vectors || [];
            
            this.pageCountElement.textContent = vectors.length;
            
            // Get last update time
            if (vectors.length > 0) {
                const lastTimestamp = Math.max(...vectors.map(v => v.timestamp));
                this.lastUpdateElement.textContent = this.formatTimeAgo(lastTimestamp);
            } else {
                this.lastUpdateElement.textContent = 'Never';
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async clearAllData() {
        if (confirm('Are you sure you want to clear all stored memory data? This action cannot be undone.')) {
            try {
                await chrome.storage.local.clear();
                this.loadStats();
                this.resultsContainer.innerHTML = '';
                this.emptyState.classList.remove('hidden');
                this.emptyState.innerHTML = `
                    <div class="empty-icon">✅</div>
                    <h3>Data Cleared</h3>
                    <p>All memory data has been successfully cleared.</p>
                `;
                console.log('All data cleared');
            } catch (error) {
                console.error('Error clearing data:', error);
                alert('Failed to clear data. Please try again.');
            }
        }
    }

    async exportData() {
        try {
            const result = await chrome.storage.local.get(['memory_agent_vectors', 'memory_agent_events']);
            const data = {
                vectors: result.memory_agent_vectors || [],
                events: result.memory_agent_events || [],
                exportDate: new Date().toISOString(),
                version: '1.0'
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `memory-agent-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('Data exported successfully');
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('Failed to export data. Please try again.');
        }
    }

    // Utility functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    truncateUrl(url) {
        if (url.length <= 50) return url;
        try {
            const urlObj = new URL(url);
            return urlObj.hostname + (urlObj.pathname.length > 20 ? urlObj.pathname.slice(0, 20) + '...' : urlObj.pathname);
        } catch {
            return url.slice(0, 50) + '...';
        }
    }

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
    new MemoryAgentPopup();
});