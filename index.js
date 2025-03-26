document.addEventListener("DOMContentLoaded", () => {
  
  // SECTION 1: DOM ELEMENTS & INITIALIZATION
 
  const elements = {
    workouts: document.getElementById("workout-lists"), 
    nutrition: document.getElementById("recipe-list"),
    products: document.getElementById("product-list"),
    recipeSearch: document.getElementById("recipe-research"),
    cartCounter: document.getElementById("cart-counter"),
    profile: document.getElementById("user-progress"),
    community: document.getElementById("community-section")
  };

  // Validation
  if (!elements.workouts || !elements.nutrition || !elements.products) {
    console.error("Missing critical DOM elements!");
  }

  const navButtons = document.querySelectorAll("nav button");
  const API_BASE_URL = "https://json-mock-api-vk2o.onrender.com/api";
  const validSections = ['workouts', 'nutrition', 'products', 'profile', 'community'];

  // Initialize data structures
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  let profileData = JSON.parse(localStorage.getItem('profile')) || {
    completedWorkouts: [],
    savedRecipes: [],
    savedRecipeDetails: [],
    completedWorkoutDetails: [],
    communityChallenges: [],
    friends: [],
    posts: []
  };

  // Initial setup
  updatedCartCount();
  setUpProfileSection();
  showSection("workouts");
  fetchSectionData("workouts");

  
  // SECTION 2: NAVIGATION HANDLING
  
  navButtons.forEach(button => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const buttonId = button.id.replace("nav-", "");
      const sectionId = buttonId === 'user-progress' ? 'profile' : 
                       buttonId === 'community' ? 'community' : buttonId;
      
      if (validSections.includes(sectionId)) {
        showSection(sectionId);

        if (sectionId === 'community') {
          if (!elements.community) {
            console.error("Community section element missing!");
            return;
          }
          updateCommunityDisplay();
        } 
        else if (sectionId !== 'profile') {
          fetchSectionData(sectionId);
        } else {
          updateProfileDisplay(profileData);
        }
      }
    });
  });

  
  // SECTION 3: WORKOUTS SECTION
  
  function initializeWorkoutFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const cardsContainer = elements.workouts.querySelector('.workout-cards-container');
    
    filterButtons.forEach(btn => {
      btn.addEventListener("click", function() {
        const wasActive = this.classList.contains("active");
        const allWorkouts = elements.workouts._workoutData || [];
        const category = this.dataset.category;
        
        if (wasActive) {
          cardsContainer.style.display = cardsContainer.style.display === 'none' ? 'block' : 'none';
          return;
        }
        
        if (cardsContainer.style.display === 'none') {
          cardsContainer.style.display = 'block';
        }
        
        const filtered = category === 'all' 
          ? allWorkouts 
          : allWorkouts.filter(w => w.category === category);
        
        filterButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        cardsContainer.innerHTML = filtered.map(item => `
          <div class="workout-card">
            <h3>${item.name}</h3>
            <p>Category: ${item.category}</p>
            <p>Duration: ${item.duration}</p>
            <p>${item.description}</p>
            <button class="complete-workout" data-id="${item.id}">Mark Complete</button>
          </div>
        `).join('');
        
        setUpWorkoutEventListener(filtered);
      });
    });
  }

  function setUpWorkoutEventListener(workoutsData) {
    document.querySelectorAll('.complete-workout').forEach(btn => {
      btn.addEventListener('click', () => {
        const workoutId = btn.dataset.id;
        const workout = workoutsData.find(w => w.id == workoutId);
        if (!profileData.completedWorkouts.includes(workoutId)) {
          profileData.completedWorkouts.push(workoutId);
          profileData.completedWorkoutDetails.push({
            id: workoutId,
            name: workout.name,
            date: new Date().toLocaleDateString()
          });
          localStorage.setItem('profile', JSON.stringify(profileData));
          updateProfileDisplay(profileData);
          
          if (profileData.communityChallenges.includes('30-Day Fitness Journey') && 
              document.getElementById('community').style.display === 'block') {
            updateCommunityDisplay();
          }
        }
      });
    });
  }


  // SECTION 4: NUTRITION SECTION
  
  function setupNutritionSearch(data) {
    if (elements.recipeSearch) {
      elements.recipeSearch.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = data.filter(item => 
          item.name.toLowerCase().includes(term) || 
          item.ingredients.some(i => i.toLowerCase().includes(term))
        );
        renderSectionContent('nutrition', filtered);
      });
    }
  }

  function setUpRecipeEventListeners(recipesData) {
    document.querySelectorAll('.save-recipe').forEach(btn => {
      btn.addEventListener('click', () => {
        const recipeId = btn.dataset.id;
        const recipe = recipesData.find(r => r.id == recipeId);
        if (!profileData.savedRecipes.includes(recipeId)) {
          profileData.savedRecipes.push(recipeId);
          profileData.savedRecipeDetails.push({
            id: recipeId,
            name: recipe.name,
            saveOn: new Date().toLocaleDateString()
          });
          localStorage.setItem('profile', JSON.stringify(profileData));
          updateProfileDisplay(profileData);
          
          if (profileData.communityChallenges.includes('Nutrition Master') && 
              document.getElementById('community').style.display === 'block') {
            updateCommunityDisplay();
          }
        }
      });
    });
  }

  
  // SECTION 5: PRODUCTS SECTION
 
  function setupProductCartButtons() {
    document.querySelectorAll(".add-to-cart").forEach(btn => {
      btn.addEventListener("click", addToCart);
    });
    document.querySelectorAll(".clear-cart").forEach(btn => {
      btn.addEventListener("click", removeFromCart);
    });
  }

  function removeFromCart(e) {
    e.preventDefault();
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updatedCartCount();
    
    e.target.textContent = "Cart Cleared!";
    setTimeout(() => {
      e.target.textContent = "Clear Cart";
    }, 1000);
  }

  function addToCart(e) {
    e.preventDefault();
    const productId = e.target.dataset.id;
    const productCard = e.target.closest('.product-card');
    const productData = {
      id: productId,
      name: productCard.querySelector('h3').textContent,
      price: productCard.querySelector('p').textContent
    };
    
    e.target.textContent = "Added!";
    setTimeout(() => {
      e.target.textContent = "Add to Cart";
    }, 1000);
    cart.push(productData);
    localStorage.setItem('cart', JSON.stringify(cart));
    updatedCartCount();
  }

  function setUpProductHoverEffect() {
    if (!elements.products._hoverEventsSet) {
      elements.products.addEventListener('mouseenter', (e) => {
        const card = e.target.closest('.product-card');
        if (card) {
          card.classList.add('highlight');
        }
      }, true);
      
      elements.products.addEventListener('mouseleave', (e) => {
        const card = e.target.closest('.product-card');
        if (card) {
          card.classList.remove('highlight');
        }
      }, true);
      
      elements.products._hoverEventsSet = true;
    }
  }

  function updatedCartCount() {
    elements.cartCounter.textContent = cart.length;
  }

  
  // SECTION 6: PROFILE SECTION
 
  function setUpProfileSection() {
    try {
      profileData = JSON.parse(localStorage.getItem('profile')) || {
        completedWorkouts: [],
        savedRecipes: [],
        savedRecipeDetails: [],
        completedWorkoutDetails: [],
        communityChallenges: [],
        friends: [],
        posts: []
      };
      updateProfileDisplay(profileData);
    } catch (error) {
      console.error("Error loading profile:", error);
      profileData = { 
        completedWorkouts: [],
        savedRecipes: [], 
        savedRecipeDetails: [], 
        completedWorkoutDetails: [],
        communityChallenges: [],
        friends: [],
        posts: []
      };
    }
  }

  function updateProfileDisplay(profileData) {
    const profileSection = document.getElementById('profile');
    if (profileSection) {
      profileSection.innerHTML = `
        <div class="profile-card">
          <h3>Your Progress</h3>
          <div class="stats">
            <div class="stat">
              <span class="label">Workouts</span>
              <span class="count">${profileData.completedWorkouts.length}</span>
            </div>
            <div class="stat">
              <span class="label">Recipes</span>
              <span class="count">${profileData.savedRecipes.length}</span>
            </div>
            <div class="stat">
              <span class="label">Challenges</span>
              <span class="count">${profileData.communityChallenges.length}</span>
            </div>
            <div class="stat">
              <span class="label">Friends</span>
              <span class="count">${profileData.friends.length}</span>
            </div>
          </div>
          
          <div class="recent-activity">
            <h4>Recent Activity</h4>
            <ul>
              ${profileData.completedWorkoutDetails.slice(-3).map(workout => `
                <li>
                  <span class="activity-icon">🏋️</span>
                  Completed ${workout.name}
                </li>
              `).join('')}
              ${profileData.savedRecipeDetails.slice(-3).map(recipe => `
                <li>
                  <span class="activity-icon">🍲</span>
                  Saved ${recipe.name}
                </li>
              `).join('')}
              ${profileData.communityChallenges.slice(-1).map(challenge => `
                <li>
                  <span class="activity-icon">🏆</span>
                  Joined ${challenge}
                </li>
              `).join('')}
              ${profileData.posts.slice(-1).map(post => `
                <li>
                  <span class="activity-icon">💬</span>
                  Posted: "${post.content.substring(0, 20)}..."
                </li>
              `).join('')}
            </ul>
        </div>
      `;
    }
  }

 
  // SECTION 7: COMMUNITY SECTION
 
  function updateCommunityDisplay() {
    if (!elements.community) {
      console.error("Community section element not found!");
      return;
    }

    elements.community.innerHTML = `
      <div class="community-container">
        <div class="community-header">
          <h2>GymHum Community</h2>
          <p>Connect with fellow fitness enthusiasts</p>
        </div>
        
        <div class="community-challenges">
          <h3>Current Challenges</h3>
          <div class="challenges-grid">
            <div class="challenge-card">
              <h4>30-Day Fitness Journey</h4>
              <p>Complete workouts for 30 days straight</p>
              <div class="progress-container">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${Math.min(100, (profileData.completedWorkouts.length / 30 * 100))}%"></div>
                </div>
                <span class="progress-text">${profileData.completedWorkouts.length}/30 days</span>
              </div>
              <button class="join-challenge" data-challenge="30-Day Fitness Journey">
                ${profileData.communityChallenges.includes('30-Day Fitness Journey') ? 'Joined ✓' : 'Join Challenge'}
              </button>
            </div>
            
            <div class="challenge-card">
              <h4>Nutrition Master</h4>
              <p>Try 10 healthy recipes this month</p>
              <div class="progress-container">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${Math.min(100, (profileData.savedRecipes.length / 10 * 100))}%"></div>
                </div>
                <span class="progress-text">${profileData.savedRecipes.length}/10 recipes</span>
              </div>
              <button class="join-challenge" data-challenge="Nutrition Master">
                ${profileData.communityChallenges.includes('Nutrition Master') ? 'Joined ✓' : 'Join Challenge'}
              </button>
            </div>
          </div>
        </div>
        
        <div class="community-feed">
          <h3>Community Feed</h3>
          <div class="posts-container">
            ${generateCommunityPosts()}
          </div>
          <div class="create-post">
            <textarea placeholder="Share your progress with the community..."></textarea>
            <button class="post-button">Post</button>
          </div>
        </div>
        
        <div class="friends-section">
          <h3>Connect With Friends</h3>
          <div class="friend-search">
            <input type="text" placeholder="Search for friends...">
            <button class="search-button">Search</button>
          </div>
          <div class="friend-suggestions">
            <h4>People You May Know</h4>
            ${generateFriendSuggestions()}
          </div>
        </div>
      </div>
    `;

    setupCommunityFeatures();
  }

  function generateCommunityPosts() {
    const allPosts = [
      {
        user: "FitnessFanatic",
        avatar: "🏋️",
        content: "Just completed the 30-day challenge! Feeling amazing!",
        likes: 24,
        comments: 5,
        time: "2 hours ago"
      },
      ...profileData.posts,
      {
        user: "HealthyEater",
        avatar: "🍏",
        content: "Tried the protein smoothie recipe from the nutrition section - delicious!",
        likes: 18,
        comments: 3,
        time: "5 hours ago"
      },
      {
        user: "YogaMaster",
        avatar: "🧘",
        content: "Morning yoga session with the sunrise. Perfect start to the day!",
        likes: 32,
        comments: 7,
        time: "1 day ago"
      }
    ];
    
    return allPosts.map(post => `
      <div class="community-post">
        <div class="post-header">
          <span class="user-avatar">${post.avatar}</span>
          <span class="user-name">${post.user}</span>
          <span class="post-time">${post.time}</span>
        </div>
        <div class="post-content">
          <p>${post.content}</p>
        </div>
        <div class="post-actions">
          <button class="like-btn">👍 ${post.likes}</button>
          <button class="comment-btn">💬 ${post.comments}</button>
          <button class="share-btn">↗️ Share</button>
        </div>
      </div>
    `).join('');
  }

  function generateFriendSuggestions() {
    const suggestions = [
      { name: "GymBuddy42", mutualFriends: 3 },
      { name: "FitLife", mutualFriends: 5 },
      { name: "WellnessWarrior", mutualFriends: 2 }
    ].filter(friend => !profileData.friends.includes(friend.name));
    
    return suggestions.map(friend => `
      <div class="friend-suggestion">
        <span class="friend-name">${friend.name}</span>
        <span class="mutual-friends">${friend.mutualFriends} mutual friends</span>
        <button class="add-friend" data-user="${friend.name}">Add Friend</button>
      </div>
    `).join('');
  }

  function setupCommunityFeatures() {
    document.querySelectorAll('.join-challenge').forEach(btn => {
      btn.addEventListener('click', function() {
        const challenge = this.getAttribute('data-challenge');
        if (!profileData.communityChallenges.includes(challenge)) {
          profileData.communityChallenges.push(challenge);
          localStorage.setItem('profile', JSON.stringify(profileData));
          this.textContent = 'Joined ✓';
          showCommunityMessage(`You've joined the ${challenge}!`);
          updateProfileDisplay(profileData);
        }
      });
    });
    
    const postButton = document.querySelector('.post-button');
    if (postButton) {
      postButton.addEventListener('click', function() {
        const textarea = document.querySelector('.create-post textarea');
        if (textarea && textarea.value.trim()) {
          const newPost = {
            user: "You",
            avatar: "😊",
            content: textarea.value.trim(),
            likes: 0,
            comments: 0,
            time: "Just now"
          };
          
          profileData.posts.unshift(newPost);
          localStorage.setItem('profile', JSON.stringify(profileData));
          
          showCommunityMessage('Your post has been shared with the community!');
          textarea.value = '';
          updateCommunityDisplay();
        }
      });
    }
    
    document.querySelectorAll('.add-friend').forEach(btn => {
      btn.addEventListener('click', function() {
        const friendName = this.getAttribute('data-user');
        if (!profileData.friends.includes(friendName)) {
          profileData.friends.push(friendName);
          localStorage.setItem('profile', JSON.stringify(profileData));
          this.textContent = 'Request Sent';
          this.disabled = true;
          showCommunityMessage(`Friend request sent to ${friendName}`);
        }
      });
    });
    
    document.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const currentLikes = parseInt(this.textContent.match(/\d+/)[0]);
        this.textContent = `👍 ${currentLikes + 1}`;
      });
    });
  }

  function showCommunityMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'community-message';
    messageElement.textContent = message;
    elements.community.prepend(messageElement);
    
    setTimeout(() => {
      messageElement.remove();
    }, 3000);
  }

  
  // SECTION 8: CORE UTILITIES (SHARED FUNCTIONS)
 
  function showSection(sectionId) {
    document.querySelectorAll("main section").forEach((section) => {
      section.style.display = "none";
    });
    const sectionElement = document.getElementById(sectionId);
    if (sectionElement) {
      sectionElement.style.display = "block";
    }
  }

  function fetchSectionData(section) {
    elements[section].innerHTML = `
      <div class="loading">
        <img src="https://c.tenor.com/apFJBGf4LZ0AAAAC/tenor.gif" 
             alt="Loading..." 
             style="width: 100px; height: 100px;">
        <p>Loading your ${section} data...</p>
      </div>
    `;
    
    fetch(`${API_BASE_URL}/${section}`)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (elements[section] && data) {
          renderSectionContent(section, data);
          if (section === 'nutrition') setupNutritionSearch(data);
          if (section === 'products') setupProductCartButtons();
        }
      })
      .catch(error => {
        console.error(`Failed loading ${section}:`, error);
        if (elements[section]) {
          elements[section].innerHTML = `<p>Error loading data. Please try again later.</p>`;
        }
      });
  }

  function renderSectionContent(section, items) {
    if (section === 'workouts') {
      elements.workouts._workoutData = items;
      elements.workouts.innerHTML = `
        <div class="filters">
          <button class="filter-btn" data-category="Full Body">Full Body</button>
          <button class="filter-btn" data-category="Yoga">Yoga</button>
          <button class="filter-btn active" data-category="all">All</button>
        </div>
        <div class="workout-cards-container" style="display:none;"></div>
      `;
    
      initializeWorkoutFilters();
      setUpWorkoutEventListener(items);
    } 
    else if (section == 'nutrition') {
      elements.nutrition.innerHTML = items.map(item => createCard(section, item)).join('');
      setUpRecipeEventListeners(items);
    } 
    else {
      elements[section].innerHTML = items.length > 0 ?
        items.map(item => createCard(section, item)).join('') :
        `<p>No ${section} available currently</p>`;

      if (section === 'products') {
        setUpProductHoverEffect();
      }
    }
  }

  function createCard(section, item) {
    const templates = {
      workouts: () => `
        <div class="card">
          <h3>${item.name}</h3>
          <p>Category: ${item.category}</p>
          <p>Duration: ${item.duration}</p>
          <p>${item.description}</p>
          <button class="complete-workout" data-id="${item.id}">Mark Complete</button>
        </div>
      `,
      nutrition: () => `
        <div class="card">
          <h3>${item.name}</h3>
          <p>Calories: ${item.calories}</p>
          <ul>${item.ingredients.map(i => `<li>${i}</li>`).join("")}</ul>
          <button class="save-recipe" data-id="${item.id}">Save Recipe</button>
        </div>
      `,
      products: () => `
        <div class="product-card">
          <img src="${item.image}" 
          alt="${item.name}"
          onerror="this.onerror=null; this.src='fallback.jpg'">
          <h3>${item.name}</h3>
          <p>$${item.price}</p>
          <button class="add-to-cart" data-id="${item.id}">Add to Cart</button>
          <button class="clear-cart" data-id="${item.id}">Clear Cart</button>
        </div>
      `,
    };
    return templates[section] ? templates[section]() : '';
  }
});