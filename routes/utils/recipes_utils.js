const axios = require("axios");
const dbFunctionality_utils = require("./DbFunctionality_utils");
const api_domain = "https://api.spoonacular.com/recipes";

/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 */
async function getRecipeInformation(recipe_id) {
  return await axios.get(`${api_domain}/${recipe_id}/information`, {
    params: {
      includeNutrition: false,
      apiKey: process.env.spooncular_apiKey,
    },
  });
}

/**
 * Accessing spooncular for a random recipe
 */
async function getRandomRecipiesFromSpooncular() {
  const response = await axios.get(`${api_domain}/random`, {
    params: {
      number: 10,
      apiKey: process.env.spooncular_apiKey,
    },
  });
  return response;
}

/**
 * Getting the recipe preview information
 */
async function getRecipePreview(user_id, recipe_id) {
  console.log("get recipe preview");
  let recipe_info = await getRecipeInformation(recipe_id);
  let is_favorite = false;
  let is_viewed = false;
  if (user_id != undefined) {
    is_favorite = await dbFunctionality_utils.isRecipeFavorite(
      user_id,
      recipe_id
    );
    is_viewed = await dbFunctionality_utils.isRecipeViewed(user_id, recipe_id);
  }
  return await createPreviewObject(recipe_info.data, is_favorite, is_viewed);
}

/**
 * Getting a personal recipe the recipe preview information
 */
async function getRecipePreviewPersonal(user_id, recipe_id) {
  console.log(`user id ` + user_id + " recpe id " + recipe_id);
  let recipe_info = await getPersonalRecipePreview(recipe_id);
  let { is_favorite, is_viewed } = false;
  if (user_id != undefined) {
    is_favorite = await dbFunctionality_utils.isRecipeFavorite(
      user_id,
      recipe_id
    );
    is_viewed = await dbFunctionality_utils.isRecipeViewed(user_id, recipe_id);
  }
  return await createPreviewObject(recipe_info, is_favorite, is_viewed);
}

/**
 * Creating preview object
 * This function is used for personal and not personal recipes
 */
async function createPreviewObject(recipe_info, is_favorite, is_viewed) {
  let {
    id,
    title,
    readyInMinutes,
    image,
    aggregateLikes,
    vegan,
    vegetarian,
    glutenFree,
  } = recipe_info;

  return {
    id: id,
    title: title,
    image: image,
    readyInMinutes: readyInMinutes,
    popularity: aggregateLikes,
    vegan: vegan,
    vegetarian: vegetarian,
    glutenFree: glutenFree,
    isFavorite: is_favorite,
    isViewed: is_viewed,
  };
}

/**
 * Dummy function for searching recipies
 * For now- getting random
 */
async function searchRecipes(
  user_id,
  search_term,
  cuisine,
  diet,
  intolerance,
  num_of_recipes,
  sort
) {
  if (num_of_recipes === undefined) {
    num_of_recipes = 5;
  }
  let search_pool = await getSearchSpooncular(
    search_term,
    cuisine,
    diet,
    intolerance,
    num_of_recipes,
    sort
  );
  let recipes = search_pool.data.results;

  let selected_recipes = [];
  for (let i = 0; i < num_of_recipes; i++) {
    let recipe_id = recipes[i].id;
    selected_recipes.push(getRecipePreview(user_id, recipe_id));
  }
  return await Promise.all(selected_recipes);
}

async function sortByReadyInMinutes() {}

function compareByReadyInMinutes(recipe_a, recipe_b) {
  console.log(`recipe a ${recipe_a}`);
  console.log(`recipe a readyInMinutes ${recipe_a.cookingMinutes}`);
  // console.log(
  //   `recipe a ${recipe_a.readyInMinutes} recipe b ${
  //     recipe_b.readyInMinutes
  //   } ans ${recipe_a.data.readyInMinutes - recipe_b.readyInMinutes}`
  // );
  return recipe_a.readyInMinutes - recipe_b.readyInMinutes;
}

async function getSearchSpooncular(
  search_term,
  cuisine,
  diet,
  intolerance,
  num_of_recipes,
  sort
) {
  let request_url = `${api_domain}/complexSearch?query=${search_term}`;
  if (cuisine !== undefined) {
    request_url = request_url.concat(`&cuisine=${cuisine}`);
  }
  if (diet !== undefined) {
    request_url = request_url.concat(`&diet=${diet}`);
  }
  if (intolerance !== undefined) {
    request_url = request_url.concat(`&intolerance=${intolerance}`);
  }
  if (sort === "time") {
    console.log("yse time");
    request_url = request_url.concat(`&sort=time`); // TODO- change lowest to higest
  }
  if (sort === "popularity") {
    console.log("yse popularity");
    request_url = request_url.concat(`&sort=popularity`);
  }
  const response = await axios.get(request_url, {
    params: {
      number: num_of_recipes,
      apiKey: process.env.spooncular_apiKey,
    },
  });
  return response;
}

async function getNewestViewed(user_id, num_of_recipes) {
  recipes_id = await dbFunctionality_utils.getNewestViewedRecipes(
    user_id,
    num_of_recipes
  );
  let recipes_details = [];
  for (let i = 0; i < num_of_recipes; i++) {
    recipes_details.push(getRecipePreview(user_id, recipes_id[i].recipe_id));
  }
  let info_res = await Promise.all(recipes_details);
  return info_res;
}

/**
 * Retrieving the wanted number of random recipes
 */
async function getRandomRecipies(user_id, num_of_recipes) {
  let random_pool = await getRandomRecipiesFromSpooncular();
  // TODO- additional line for filltering from lab8
  let recipes = random_pool.data.recipes;
  let selected_recipes = [];
  for (let i = 0; i < num_of_recipes; i++) {
    let recipe_id = recipes[i].id;
    selected_recipes.push(getRecipePreview(user_id, recipe_id));
  }
  return await Promise.all(selected_recipes);
}

/**
 * Getting the full wanted information about a recipe
 * Does not contain the information from the preview
 */
async function getAdditionalInformation(recipe_id) {
  // TODO- make sure about the ingredient name & instructions
  let recipe_info = await getRecipeInformation(recipe_id);
  let extendedIngredients = recipe_info.data.extendedIngredients;
  let analyzedInstructions = recipe_info.data.analyzedInstructions[0].steps;
  let ingredientsAndQuantities = [];
  let instructions = [];

  for (let ingredient of extendedIngredients) {
    let { originalName, amount } = ingredient;
    ingredientsAndQuantities.push({
      originalName: originalName,
      amount: amount,
    });
  }
  for (let instruction of analyzedInstructions) {
    let { number, step } = instruction;
    instructions.push({ number: number, step: step });
  }
  return {
    ingredientsAndQuantities: ingredientsAndQuantities,
    instructions: instructions,
    servings: recipe_info.data.servings,
  };
}

/**
 * Getting the full recipe details by id
 * The details contains the preview plus the extra information
 */
async function getRecipeDetails(user_id, recipe_id) {
  console.log("getting recipie info");
  let { ingredientsAndQuantities, instructions, servings } =
    await getAdditionalInformation(recipe_id);
  let preview = await getRecipePreview(user_id, recipe_id);

  return {
    previewInfo: preview,
    ingredientsAndQuantities: ingredientsAndQuantities,
    instructions: instructions,
    servingSize: servings,
  };
}

/**
 * Mark recipe as viewed and return it's details
 */
async function viewRecipe(user_id, recipe_id) {
  if (user_id != undefined) {
    await dbFunctionality_utils.viewRecipe(user_id, recipe_id);
  }
  return await getRecipeDetails(user_id, recipe_id);
}

/**
 * Adding new personal recipe by a user
 */
async function addNewRecipeByUser(user_id, recipe_info) {
  let {
    title,
    image,
    readyInMinutes,
    vegan,
    vegetarian,
    glutenFree,
    servingSize,
    ingredientsAndQuantities,
    instructions,
  } = recipe_info.body;

  await dbFunctionality_utils.addNewRecipeToDb(
    user_id,
    title,
    image,
    readyInMinutes,
    vegan,
    vegetarian,
    glutenFree,
    servingSize,
    ingredientsAndQuantities,
    instructions
  );
}

async function getRecipeAddedByUser(recipe_id) {
  let recipe = await dbFunctionality_utils.getPersonalRecipe(recipe_id);
  let recipe_info = {};
  let ingredients = await dbFunctionality_utils.getIngredients(recipe_id);
  let instructions = await dbFunctionality_utils.getInstructions(recipe_id);
}

/**
 * Getting the personal recipe preview information
 */
async function getPersonalRecipePreview(recipe_id) {
  let recipe = await dbFunctionality_utils.getPersonalRecipe(recipe_id);
  return {
    id: recipe.recipe_id,
    title: recipe.title,
    image: recipe.image,
    readyInMinutes: recipe.readyInMinutes,
    popularity: 0,
    vegan: recipe.vegan == 1,
    vegetarian: recipe.vegetarian == 1,
    glutenFree: recipe.glutenFree == 1,
  };
}

/**
 * Getting user's personal recipes
 */
async function getFavoriteRecipes(user_id) {
  let recipes_ids = await dbFunctionality_utils.getFavoriteRecipes(user_id);
  let recipes_preview = [];
  for (let recipe of recipes_ids) {
    recipes_preview.push(await getRecipePreview(user_id, recipe.recipe_id));
  }
  return recipes_preview;
}

async function getPersonalRecipes(user_id) {
  let recipes_ids = await dbFunctionality_utils.getPersonalRecipes(user_id);
  let recipes_preview = [];
  for (let recipe of recipes_ids) {
    recipes_preview.push(
      await getRecipePreviewPersonal(user_id, recipe.recipe_id)
    );
  }
  return recipes_preview;
}

exports.getRecipePreview = getRecipePreview;
exports.getRandomRecipies = getRandomRecipies;
exports.searchRecipes = searchRecipes;
exports.getRecipeDetails = getRecipeDetails;
exports.viewRecipe = viewRecipe;
exports.addNewRecipeByUser = addNewRecipeByUser;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.getPersonalRecipes = getPersonalRecipes;
exports.getNewestViewed = getNewestViewed;
