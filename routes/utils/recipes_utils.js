const axios = require("axios");
const user_utils = require("./user_utils");
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
 * accessing spooncular for a random recipe
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
 * get the recipe preview information
 */
async function getRecipePreview(user_id, recipe_id) {
  let recipe_info = await getRecipeInformation(recipe_id);
  let is_favorite = await user_utils.isRecipeFavorite(user_id, recipe_id);
  let is_viewed = await user_utils.isRecipeViewed(user_id, recipe_id);
  let {
    id,
    title,
    readyInMinutes,
    image,
    aggregateLikes,
    vegan,
    vegetarian,
    glutenFree,
  } = recipe_info.data;

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
 * search for a list of recipes by id
 * the use of promise means that the order of return may change
 */
async function searchRecipes(user_id, recipes_ids_list) {
  let promises = [];
  recipes_ids_list.map((recipes_id) => {
    promises.push(getRecipePreview(user_id, recipes_id));
  });
  let info_res = await Promise.all(promises);
  return info_res;
}

/**
 * retrieving the wanted number of random recipes
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
 * getting the full wanted information about a recipe
 * this function does not contain the information from the preview
 */
async function getAdditionalInformation(recipe_id) {
  // TODO- make sure about the ingredient name & instructions
  let recipe_info = await getRecipeInformation(recipe_id);
  let extendedIngredients = recipe_info.data.extendedIngredients;
  let ingredientsAndQuantities = [];
  let { analyzedInstructions, servings } = recipe_info.data;
  for (let ingredient of extendedIngredients) {
    let { originalName, amount } = ingredient;
    ingredientsAndQuantities.push({
      originalName: originalName,
      amount: amount,
    });
  }
  return {
    ingredientsAndQuantities: ingredientsAndQuantities,
    instructions: analyzedInstructions,
    servings: servings,
  };
}

/**
 * getting the full recipe details by id
 * the details contains the preview plus the extra information
 */
async function getRecipeDetails(user_id, recipe_id) {
  let recipe_info = await getRecipePreview(user_id, recipe_id);
  let { ingredientsAndQuantities, instructions, servings } =
    await getAdditionalInformation(recipe_id);
  return {
    previewInfo: recipe_info,
    ingredientsAndQuantities: ingredientsAndQuantities,
    instructions: instructions,
    servingSize: servings,
  };
}

async function viewRecipe(user_id, recipe_id) {
  user_utils.viewRecipe(user_id, recipe_id);
  return getRecipeDetails(user_id, recipe_id);
}

exports.getRecipePreview = getRecipePreview;
exports.getRandomRecipies = getRandomRecipies;
exports.searchRecipes = searchRecipes;
exports.getRecipeDetails = getRecipeDetails;
exports.viewRecipe = viewRecipe;
