"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, showDelete = false) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  const showFave = Boolean(currentUser);
  return $(`
      <li id="${story.storyId}">
      ${showDelete ? getDeleteBtnHTML() : ""}
      ${showFave ? getFaveHTML(story, currentUser) : ""}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

function getDeleteBtnHTML() {
  return `<span class="trash-can"> <i class="fas fa-trash-alt"></i> </span>`;
}

function getFaveHTML(story, user) {
  const isFavorite = user.isFavorite(story);
  const starType = isFavorite ? "fas" : "far";
  return `
      <span class="star">
        <i class="${starType} fa-star"></i>
      </span>`;
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

function putUserStoriesOnPage() {
    $userStories.empty();

    if(currentUser.ownStories.length == 0) {
      $userStories.append("<p>No user stories submited</p>")
    } else {
      for(let story of currentUser.ownStories) {
        let $story =  generateStoryMarkup(story, true);
        $userStories.append($story);
      }
    }
    $userStories.show();
}

function putFavoritedStoriesOnPage() {
  $favoritedStories.empty();

  if(currentUser.favorites.length == 0) {
    $favoritedStories.append("<p>No stories have been favorited</p>");
  } else {
    for(let story of currentUser.favorites) {
      let $story =  generateStoryMarkup(story);
      $favoritedStories.append($story);
    }
  }
  $favoritedStories.show();
}

  async function submitNewStory(evt) {
  evt.preventDefault();

  const title = $("#story-title").val();
  const author = $("#story-author").val();
  const url = $("#story-url").val();
  const username = currentUser.username;
  const storyInfo = {title, author, url, username};

  const newStory =  await storyList.addStory(currentUser, storyInfo);
  const $newStory =  generateStoryMarkup(newStory);
  $allStoriesList.prepend($newStory);
  hidePageComponents();
  putStoriesOnPage();
}

$storyAddForm.on("submit", submitNewStory);

async function toggleStoryFavorite(evt) {
  console.debug("toggleStoryFavorite");

  const $tgt = $(evt.target);
  const $closestLi = $tgt.closest("li");
  const storyId = $closestLi.attr("id");
  const story = storyList.stories.find(s => s.storyId === storyId);

  // see if the item is already favorited (checking by presence of star)
  if ($tgt.hasClass("fas")) {
    // currently a favorite: remove from user's fav list and change star
    await currentUser.removeFavorite(story);
    $tgt.closest("i").toggleClass("fas far");
  } else {
    // currently not a favorite: do the opposite
    await currentUser.addFavorite(story);
    $tgt.closest("i").toggleClass("fas far");
  }
}

$allStoriesList.on("click", ".star", toggleStoryFavorite);

async function deleteStory(evt) {

  const $tgt = $(evt.target);
  const $closestLi = $tgt.closest("li");
  const storyId = $closestLi.attr("id");
  
  await storyList.removeStory(currentUser,storyId);

  await putUserStoriesOnPage();
}

$userStories.on("click", ".trash-can", deleteStory)