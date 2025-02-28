const axios = require('axios');

const NEWS_API_KEY = 'YOUR_NEWS_API_KEY';
const GUARDIAN_API_KEY = 'YOUR_GUARDIAN_API_KEY';

class NewsAggregator {
    constructor() {
        this.sources = {
            newsApi: 'https://newsapi.org/v2/top-headlines',
            guardian: 'https://content.guardianapis.com/search'
        };
        this.categories = ['business', 'technology', 'sports', 'entertainment', 'health', 'science', 'politics'];
        // Add cache for articles
        this.cache = new Map();
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
    }

    // Helper method to standardize article format
    _formatArticle(article, category, source) {
        return {
            title: source === 'NewsAPI' ? article.title : article.fields.headline,
            author: source === 'NewsAPI' ? article.author : article.fields.byline,
            description: source === 'NewsAPI' ? article.description : article.fields.trailText,
            url: source === 'NewsAPI' ? article.url : article.webUrl,
            category,
            source,
            publishedAt: source === 'NewsAPI' ? article.publishedAt : article.webPublicationDate
        };
    }

    async _fetchWithCache(key, fetchFunction) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            return cached.data;
        }

        const data = await fetchFunction();
        this.cache.set(key, { data, timestamp: Date.now() });
        return data;
    }

    async fetchFromNewsAPI(category) {
        const cacheKey = `newsapi-${category}`;
        return this._fetchWithCache(cacheKey, async () => {
            try {
                const { data } = await axios.get(this.sources.newsApi, {
                    params: {
                        category,
                        apiKey: NEWS_API_KEY,
                        language: 'en'
                    }
                });
                
                return data.articles.map(article => 
                    this._formatArticle(article, category, 'NewsAPI')
                );
            } catch (error) {
                console.error(`Error fetching from NewsAPI: ${error.message}`);
                return [];
            }
        });
    }

    async fetchFromGuardian(category) {
        const cacheKey = `guardian-${category}`;
        return this._fetchWithCache(cacheKey, async () => {
            try {
                const { data } = await axios.get(this.sources.guardian, {
                    params: {
                        section: category,
                        'api-key': GUARDIAN_API_KEY,
                        'show-fields': 'headline,byline,trailText'
                    }
                });

                return data.response.results.map(article =>
                    this._formatArticle(article, category, 'The Guardian')
                );
            } catch (error) {
                console.error(`Error fetching from Guardian: ${error.message}`);
                return [];
            }
        });
    }

    // ... rest of the code remains the same ...
}

// Export the NewsAggregator class for use in other files
module.exports = NewsAggregator;
