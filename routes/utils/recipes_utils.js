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

async function searchRecipes(user_id, num_of_recipes) {
  return getRandomRecipies(user_id, num_of_recipes);
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

async function viewRecipe(user_id, recipe_id) {
  if (user_id != undefined) {
    console.log("defined " + user_id);
    await dbFunctionality_utils.viewRecipe(user_id, recipe_id);
  }
  console.log("getRecipeDetails ");
  return await getRecipeDetails(user_id, recipe_id);
}

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

async function getRecipeAddedByUser(user_id, recipe_id) {
  let recipe = await dbFunctionality_utils.getRecipe(user_id, recipe_id);
  let ingredients = dbFunctionality_utils.getIngredients(recipe_id);
  let instructionsawait = dbFunctionality_utils.getInstructions(recipe_id);
  console.log(recipe);
  console.log(ingredients);
  console.log(instructionsawait);
}

exports.getRecipePreview = getRecipePreview;
exports.getRandomRecipies = getRandomRecipies;
exports.searchRecipes = searchRecipes;
exports.getRecipeDetails = getRecipeDetails;
exports.viewRecipe = viewRecipe;
exports.addNewRecipeByUser = addNewRecipeByUser;
exports.getRecipeAddedByUser = getRecipeAddedByUser;
