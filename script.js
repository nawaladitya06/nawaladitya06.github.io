/**
 * Enhanced Portfolio Review System
 * Features:
 * - Tab navigation
 * - Star rating system with hover effects
 * - Review submission with validation
 * - Review sorting and filtering
 * - Local storage persistence
 * - Review deletion with confirmation
 * - Responsive animations and feedback
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the review system
    const ReviewSystem = (function() {
        // Cache DOM elements
        const elements = {
            tabButtons: document.querySelectorAll('.tab-button'),
            tabContents: document.querySelectorAll('.tab-content'),
            reviewForm: document.getElementById('reviewForm'),
            reviewsList: document.getElementById('reviewsList'),
            noReviewsMessage: document.querySelector('.no-reviews-message'),
            deleteModal: document.getElementById('deleteModal'),
            cancelDelete: document.getElementById('cancelDelete'),
            confirmDelete: document.getElementById('confirmDelete'),
            filterSelect: document.getElementById('filterReviews'),
            sortSelect: document.getElementById('sortReviews'),
            searchInput: document.getElementById('searchReviews'),
            clearFiltersBtn: document.getElementById('clearFilters'),
            formInputs: {
                username: document.getElementById('username'),
                rating: document.querySelectorAll('input[name="rating"]'),
                comment: document.getElementById('comment')
            },
            stats: {
                avgRating: document.getElementById('avgRating'),
                avgRatingStars: document.getElementById('avgRatingStars'),
                totalReviews: document.getElementById('totalReviews'),
                ratingsBreakdown: document.getElementById('ratingsBreakdown')
            }
        };

        // State management
        let state = {
            reviews: [],
            filteredReviews: [],
            reviewToDelete: null,
            filter: {
                rating: 0,
                search: '',
                sort: 'newest'
            }
        };

        // Load reviews from localStorage
        function loadReviews() {
            try {
                const savedReviews = localStorage.getItem('portfolioReviews');
                state.reviews = savedReviews ? JSON.parse(savedReviews) : [];
                state.filteredReviews = [...state.reviews];
            } catch (error) {
                console.error('Error loading reviews:', error);
                state.reviews = [];
                state.filteredReviews = [];
            }
        }

        // Save reviews to localStorage
        function saveReviews() {
            try {
                localStorage.setItem('portfolioReviews', JSON.stringify(state.reviews));
            } catch (error) {
                console.error('Error saving reviews:', error);
                showNotification('Error saving your review. Please try again.', 'error');
            }
        }

        // Calculate review statistics
        function calculateStats() {
            const reviews = state.reviews;
            const totalReviews = reviews.length;
            
            if (totalReviews === 0) {
                return {
                    average: 0,
                    total: 0,
                    breakdown: [0, 0, 0, 0, 0]
                };
            }
            
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            const average = totalRating / totalReviews;
            
            // Calculate ratings breakdown (how many 1-star, 2-star, etc.)
            const breakdown = [0, 0, 0, 0, 0]; // Index 0 = 1 star, index 4 = 5 stars
            reviews.forEach(review => {
                breakdown[review.rating - 1]++;
            });
            
            return {
                average: parseFloat(average.toFixed(1)),
                total: totalReviews,
                breakdown: breakdown
            };
        }

        // Update review statistics display
        function updateStatsDisplay() {
            const stats = calculateStats();
            
            // Update average rating
            elements.stats.avgRating.textContent = stats.average;
            elements.stats.avgRatingStars.style.width = `${(stats.average / 5) * 100}%`;
            
            // Update total reviews count
            elements.stats.totalReviews.textContent = 
                `${stats.total} ${stats.total === 1 ? 'review' : 'reviews'}`;
            
            // Update ratings breakdown if element exists
            if (elements.stats.ratingsBreakdown) {
                elements.stats.ratingsBreakdown.innerHTML = '';
                
                for (let i = 5; i >= 1; i--) {
                    const percentage = stats.total > 0 
                        ? Math.round((stats.breakdown[i-1] / stats.total) * 100) 
                        : 0;
                    
                    const breakdownItem = document.createElement('div');
                    breakdownItem.className = 'rating-breakdown-item';
                    breakdownItem.innerHTML = `
                        <div class="star-count">${i} <span class="star">â˜…</span></div>
                        <div class="rating-bar-container">
                            <div class="rating-bar" style="width: ${percentage}%"></div>
                        </div>
                        <div class="rating-percentage">${percentage}%</div>
                    `;
                    
                    elements.stats.ratingsBreakdown.appendChild(breakdownItem);
                }
            }
        }

        // Apply filters and sorting to reviews
        function applyFilters() {
            const { rating, search, sort } = state.filter;
            
            state.filteredReviews = state.reviews.filter(review => {
                // Apply rating filter
                if (rating > 0 && review.rating !== rating) {
                    return false;
                }
                
                // Apply search filter
                if (search && !review.comment.toLowerCase().includes(search.toLowerCase()) && 
                   !review.username.toLowerCase().includes(search.toLowerCase())) {
                    return false;
                }
                
                return true;
            });
            
            // Apply sorting
            state.filteredReviews.sort((a, b) => {
                switch (sort) {
                    case 'newest':
                        return b.id - a.id;
                    case 'oldest':
                        return a.id - b.id;
                    case 'highest':
                        return b.rating - a.rating || b.id - a.id;
                    case 'lowest':
                        return a.rating - b.rating || b.id - a.id;
                    default:
                        return b.id - a.id;
                }
            });
        }

        // Update reviews display
        function updateReviewsDisplay() {
            elements.reviewsList.innerHTML = '';
            
            applyFilters();
            updateStatsDisplay();
            
            if (state.filteredReviews.length === 0) {
                const noReviewsEl = elements.noReviewsMessage.cloneNode(true);
                noReviewsEl.style.display = 'block';
                
                // If we have reviews but none match the filter
                if (state.reviews.length > 0) {
                    noReviewsEl.textContent = 'No reviews match your current filters.';
                }
                
                elements.reviewsList.appendChild(noReviewsEl);
            } else {
                state.filteredReviews.forEach(review => {
                    const reviewItem = createReviewElement(review);
                    elements.reviewsList.appendChild(reviewItem);
                });
            }
        }

        // Create a review DOM element
        function createReviewElement(review) {
            const reviewItem = document.createElement('div');
            reviewItem.className = 'review-item';
            reviewItem.setAttribute('data-review-id', review.id);
            
            // Create review header
            const reviewHeader = document.createElement('div');
            reviewHeader.className = 'review-header';
            
            const reviewAuthor = document.createElement('div');
            reviewAuthor.className = 'review-author';
            reviewAuthor.textContent = review.username;
            
            const reviewDate = document.createElement('div');
            reviewDate.className = 'review-date';
            reviewDate.textContent = review.date;
            
            reviewHeader.appendChild(reviewAuthor);
            reviewHeader.appendChild(reviewDate);
            
            // Add delete button
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-review';
            deleteButton.innerHTML = '&times;'; // Ã— symbol
            deleteButton.setAttribute('aria-label', 'Delete review');
            deleteButton.addEventListener('click', function(e) {
                e.stopPropagation();
                state.reviewToDelete = review.id;
                openDeleteModal();
            });
            
            // Create rating display
            const reviewRating = document.createElement('div');
            reviewRating.className = 'review-rating';
            
            // Add stars based on rating
            const starsContainer = document.createElement('div');
            starsContainer.className = 'stars-container';
            
            const starsBackground = document.createElement('div');
            starsBackground.className = 'stars-background';
            starsBackground.textContent = 'â˜†â˜†â˜†â˜†â˜†';
            
            const starsForeground = document.createElement('div');
            starsForeground.className = 'stars-foreground';
            starsForeground.textContent = 'â˜…â˜…â˜…â˜…â˜…';
            starsForeground.style.width = `${(review.rating / 5) * 100}%`;
            
            starsContainer.appendChild(starsBackground);
            starsContainer.appendChild(starsForeground);
            reviewRating.appendChild(starsContainer);
            
            // Create review content
            const reviewContent = document.createElement('div');
            reviewContent.className = 'review-content';
            reviewContent.textContent = review.comment;
            
            // Assemble the review element
            reviewItem.appendChild(deleteButton);
            reviewItem.appendChild(reviewHeader);
            reviewItem.appendChild(reviewRating);
            reviewItem.appendChild(reviewContent);
            
            // Add enter animation
            reviewItem.style.animation = 'fadeIn 0.3s ease forwards';
            
            return reviewItem;
        }

        // Form validation
        function validateForm() {
            const username = elements.formInputs.username.value.trim();
            const rating = document.querySelector('input[name="rating"]:checked');
            const comment = elements.formInputs.comment.value.trim();
            
            // Clear previous error messages
            document.querySelectorAll('.error-message').forEach(el => el.remove());
            
            let isValid = true;
            
            if (!username) {
                showInputError(elements.formInputs.username, 'Please enter your name');
                isValid = false;
            }
            
            if (!rating) {
                const ratingContainer = document.querySelector('.star-rating');
                showInputError(ratingContainer, 'Please select a rating');
                isValid = false;
            }
            
            if (!comment) {
                showInputError(elements.formInputs.comment, 'Please enter your review');
                isValid = false;
            }
            
            return isValid;
        }

        // Show input error message
        function showInputError(inputElement, message) {
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = message;
            
            // Insert error message after the input
            inputElement.parentNode.insertBefore(errorMessage, inputElement.nextSibling);
            
            // Highlight the input
            inputElement.classList.add('error');
            
            // Remove error class when input changes
            inputElement.addEventListener('input', function() {
                this.classList.remove('error');
                if (errorMessage.parentNode) {
                    errorMessage.parentNode.removeChild(errorMessage);
                }
            }, { once: true });
        }

        // Show notification
        function showNotification(message, type = 'success') {
            // Check if notification element exists
            let notification = document.querySelector('.notification');
            
            // If not, create it
            if (!notification) {
                notification = document.createElement('div');
                notification.className = 'notification';
                document.body.appendChild(notification);
            }
            
            // Clear existing classes and add type class
            notification.className = 'notification';
            notification.classList.add(type);
            
            // Set message and show
            notification.textContent = message;
            notification.classList.add('show');
            
            // Hide after 3 seconds
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }

        // Modal functions
        function openDeleteModal() {
            elements.deleteModal.classList.add('show');
        }
        
        function closeDeleteModal() {
            elements.deleteModal.classList.remove('show');
            state.reviewToDelete = null;
        }

        // Delete a review
        function deleteReview(reviewId) {
            // Find the review element
            const reviewElement = document.querySelector(`.review-item[data-review-id="${reviewId}"]`);
            
            // Add animation
            if (reviewElement) {
                reviewElement.style.animation = 'fadeOut 0.3s ease forwards';
                
                // Wait for animation to complete before removing
                setTimeout(() => {
                    // Filter out the deleted review
                    state.reviews = state.reviews.filter(review => review.id !== reviewId);
                    
                    // Save updated reviews to localStorage
                    saveReviews();
                    
                    // Update display
                    updateReviewsDisplay();
                    
                    // Show notification
                    showNotification('Review deleted successfully');
                }, 300);
            }
        }

        // Initialize tab functionality
        function initTabs() {
            elements.tabButtons.forEach(button => {
                button.addEventListener('click', function() {
                    // Remove active class from all buttons and contents
                    elements.tabButtons.forEach(btn => btn.classList.remove('active'));
                    elements.tabContents.forEach(content => content.classList.remove('active'));
                    
                    // Add active class to clicked button and corresponding content
                    button.classList.add('active');
                    const tabId = button.getAttribute('data-tab');
                    document.getElementById(tabId).classList.add('active');
                });
            });
        }

        // Initialize filter functionality
        function initFilters() {
            if (elements.filterSelect) {
                elements.filterSelect.addEventListener('change', function() {
                    state.filter.rating = parseInt(this.value) || 0;
                    updateReviewsDisplay();
                });
            }
            
            if (elements.sortSelect) {
                elements.sortSelect.addEventListener('change', function() {
                    state.filter.sort = this.value;
                    updateReviewsDisplay();
                });
            }
            
            if (elements.searchInput) {
                elements.searchInput.addEventListener('input', debounce(function() {
                    state.filter.search = this.value.trim();
                    updateReviewsDisplay();
                }, 300));
            }
            
            if (elements.clearFiltersBtn) {
                elements.clearFiltersBtn.addEventListener('click', function() {
                    // Reset filter state
                    state.filter = {
                        rating: 0,
                        search: '',
                        sort: 'newest'
                    };
                    
                    // Reset form elements
                    if (elements.filterSelect) elements.filterSelect.value = '0';
                    if (elements.sortSelect) elements.sortSelect.value = 'newest';
                    if (elements.searchInput) elements.searchInput.value = '';
                    
                    // Update display
                    updateReviewsDisplay();
                });
            }
        }

        // Initialize star rating animation
        function initStarRating() {
            const starLabels = document.querySelectorAll('.star-rating label');
            
            starLabels.forEach(star => {
                star.addEventListener('mouseenter', function() {
                    this.style.transform = 'scale(1.2)';
                    this.style.transition = 'transform 0.2s ease';
                });
                
                star.addEventListener('mouseleave', function() {
                    this.style.transform = 'scale(1)';
                });
            });
        }

        // Initialize event listeners
        function initEventListeners() {
            // Form submission
            elements.reviewForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                if (!validateForm()) {
                    return;
                }
                
                // Get form values
                const username = elements.formInputs.username.value.trim();
                const rating = parseInt(document.querySelector('input[name="rating"]:checked').value);
                const comment = elements.formInputs.comment.value.trim();
                
                // Create new review object
                const newReview = {
                    id: Date.now(),
                    username: username,
                    rating: rating,
                    comment: comment,
                    date: new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    })
                };
                
                // Add to reviews array
                state.reviews.push(newReview);
                
                // Save to localStorage
                saveReviews();
                
                // Update display
                updateReviewsDisplay();
                
                // Reset form
                this.reset();
                
                // Show success message
                showNotification('Thank you for your review!');
                
                // Switch to view reviews tab after a short delay
                setTimeout(() => {
                    document.querySelector('.tab-button[data-tab="view-reviews"]').click();
                }, 1500);
            });
            
            // Delete modal events
            elements.cancelDelete.addEventListener('click', closeDeleteModal);
            
            elements.confirmDelete.addEventListener('click', function() {
                if (state.reviewToDelete) {
                    deleteReview(state.reviewToDelete);
                    closeDeleteModal();
                }
            });
            
            // Close modal if clicked outside
            elements.deleteModal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeDeleteModal();
                }
            });
            
            // Close modal with Escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && elements.deleteModal.classList.contains('show')) {
                    closeDeleteModal();
                }
            });
        }

        // Initialize the review system
        function init() {
            loadReviews();
            initTabs();
            initStarRating();
            initFilters();
            initEventListeners();
            updateReviewsDisplay();
        }

        // Return public methods
        return {
            init: init
        };
    })();

    // Helper function: Debounce
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    // Initialize review system
    ReviewSystem.init();
});