document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.querySelector('.header-search form');
    const searchInput = document.querySelector('.header-search input');
    const resultsList = document.querySelector('.results-list');
    const loadMoreBtn = document.getElementById('load-more-btn');

    let nextPageToken = '';
    let currentQuery = '';

    const fetchChannels = async (query, pageToken = '') => {
        try {
            let url = `/api/search?query=${encodeURIComponent(query)}`;
            if (pageToken) {
                url += `&pageToken=${pageToken}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching channels:', error);
            resultsList.innerHTML = '<p style="text-align:center; padding: 2rem;">Failed to load channels. Please try again later.</p>';
        }
    };

    const renderChannels = (channels, append = false) => {
        if (!append) {
            resultsList.innerHTML = '';
        }

        if (!channels || channels.length === 0) {
            if (!append) {
                resultsList.innerHTML = '<p style="text-align:center; padding: 2rem;">No channels found.</p>';
            }
            loadMoreBtn.style.display = 'none';
            return;
        }

        const channelsHTML = channels.map(channel => {
            const subscriberCount = formatNumber(channel.statistics.subscriberCount);
            const videoCount = formatNumber(channel.statistics.videoCount);
            const viewCount = formatNumber(channel.statistics.viewCount);

            return `
                <li>
                    <a href="https://www.youtube.com/channel/${channel.id}" target="_blank" class="channel-list-item">
                        <div class="channel-avatar">
                            <div class="avatar-wrapper"><img src="${channel.snippet.thumbnails.high.url}" alt="${channel.snippet.title} avatar"></div>
                        </div>
                        <div class="channel-main-info">
                            <h2 class="channel-name">${channel.snippet.title}</h2>
                            <p class="description">${channel.snippet.description}</p>
                            <p class="metadata">${subscriberCount} subscribers, ${videoCount} videos</p>
                        </div>
                        <div class="channel-stats">
                            <div class="stat-item">
                                <span class="stat-label">Total Views</span>
                                <span class="stat-value">${viewCount}</span>
                            </div>
                        </div>
                    </a>
                </li>
            `;
        }).join('');

        if (append) {
            resultsList.insertAdjacentHTML('beforeend', channelsHTML);
        } else {
            resultsList.innerHTML = channelsHTML;
        }
    };

    const handleSearch = async (event) => {
        event.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            currentQuery = query;
            resultsList.innerHTML = '<p style="text-align:center; padding: 2rem;">Loading...</p>';
            const data = await fetchChannels(query);
            if (data) { // <-- ADD THIS CHECK
            renderChannels(data.items);
            nextPageToken = data.nextPageToken; 
            loadMoreBtn.style.display = nextPageToken ? 'inline-flex' : 'none';
            }
        }
    };

    const handleLoadMore = async () => {
        if (currentQuery && nextPageToken) {
            loadMoreBtn.disabled = true;
            loadMoreBtn.textContent = 'Loading...';
            const data = await fetchChannels(currentQuery, nextPageToken);
            renderChannels(data.items, true);
            nextPageToken = data.nextPageToken;
            loadMoreBtn.style.display = nextPageToken ? 'inline-flex' : 'none';
            loadMoreBtn.disabled = false;
            loadMoreBtn.innerHTML = 'Load More <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg>';
        }
    };

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num;
    };

    searchForm.addEventListener('submit', handleSearch);
    loadMoreBtn.addEventListener('click', handleLoadMore);

    // Initial message
    resultsList.innerHTML = '<p style="text-align:center; padding: 2rem;">Search for a YouTube channel to begin.</p>';
    loadMoreBtn.style.display = 'none';
});