"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/** Handle submitting new story form, add story to the list */
async function submitNewStory(evt) {
  console.debug("submitNewStory", evt);
  evt.preventDefault();  // Prevent the default form submission behavior

  // Get story data from the form
  const title = $("#story-title").val();
  const author = $("#story-author").val();
  const url = $("#story-url").val();

  // Add the new story via the storyList.addStory method
  const newStory = await storyList.addStory(currentUser, { title, author, url });

  // Add the new story to the top of the page
  const $storyMarkup = generateStoryMarkup(newStory);
  $allStoriesList.prepend($storyMarkup);

  // Reset the form and hide it after submission
  $("#story-form").trigger("reset");
  $("#submit-story-form").hide();
}

$("#story-form").on("submit", submitNewStory);  // Event listener for form submission

/** Handle favorite/unfavorite a story */
async function toggleStoryFavorite(evt) {
  console.debug("toggleStoryFavorite");

  const $tgt = $(evt.target);
  const $storyLi = $tgt.closest("li");
  const storyId = $storyLi.attr("id");
  const story = storyList.stories.find(s => s.storyId === storyId);

  // Check if the story is already favorited
  if ($tgt.hasClass("fas")) {
    // Currently a favorite, so unfavorite it
    await currentUser.removeFavorite(story);
    $tgt.removeClass("fas").addClass("far");  // Change icon to outline
  } else {
    // Not a favorite, so favorite it
    await currentUser.addFavorite(story);
    $tgt.removeClass("far").addClass("fas");  // Change icon to solid
  }
}

$allStoriesList.on("click", ".fa-heart", toggleStoryFavorite);  // Event listener for heart icon


/** Handle deleting a story when the delete button is clicked */
async function handleDeleteStory(evt) {
  console.debug("handleDeleteStory", evt);

  const $storyLi = $(evt.target).closest("li");
  const storyId = $storyLi.attr("id");

  // Call the removeStory method to delete the story from the API and story list
  await storyList.removeStory(currentUser, storyId);

  // Remove the story from the DOM
  $storyLi.remove();
}

$allStoriesList.on("click", ".delete-story-btn", handleDeleteStory);  // Event listener for delete button

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, isOwnStory = false) {
  const hostName = story.getHostName();
  const isFavorite = currentUser && currentUser.favorites.some(fav => fav.storyId === story.storyId);
  const heartType = isFavorite ? "fas" : "far";  // "fas" for filled heart, "far" for outline
  const showDeleteBtn = isOwnStory ? `<button class="delete-story-btn">Delete</button>` : "";

  return $(`
    <li id="${story.storyId}">
      <div class="story">
        <span class="favorite">
          <i class="${heartType} fa-heart"></i>
        </span>
        <a href="${story.url}" target="a_blank" class="story-link">${story.title}</a>
        <div class="story-details">
          <small class="story-hostname">(${hostName})</small>
          <small class="story-author">by ${story.author}</small>
          <small class="story-user">posted by ${story.username}</small>
          ${showDeleteBtn}
        </div>
        <hr class="story-divider">
      </div>
    </li>
  `);
}


/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // Loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const isOwnStory = currentUser && story.username === currentUser.username;
    const $story = generateStoryMarkup(story, isOwnStory);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

/** Display favorite stories */
function putFavoritesOnPage() {
  console.debug("putFavoritesOnPage");

  $allStoriesList.empty();

  if (currentUser.favorites.length === 0) {
    $allStoriesList.append("<h5>No favorites added yet!</h5>");
  } else {
    // Loop through all favorite stories and generate HTML
    for (let story of currentUser.favorites) {
      const $story = generateStoryMarkup(story);
      $allStoriesList.append($story);
    }
  }

  $allStoriesList.show();
}

