const DButils = require("./DButils");

async function markAsFavorite(user_id, recipe_id) {
  await DButils.execQuery(
    `insert into FavoriteRecipes values ('${user_id}',${recipe_id})`
  );
}

async function getFavoriteRecipes(user_id) {
  const recipes_id = await DButils.execQuery(
    `select recipe_id from FavoriteRecipes where user_id='${user_id}'`
  );
  return recipes_id;
}

async function getPersonalRecipes(user_id) {
  const recipes_id = await DButils.execQuery(
    `select recipe_id from usersPersonalRecipes where user_id='${user_id}'`
  );
  return recipes_id;
}

async function isRecipeFavorite(user_id, recipe_id) {
  const favoriteRecipe = await DButils.execQuery(
    `select * from FavoriteRecipes where user_id='${user_id}' AND recipe_id='${recipe_id}'`
  );
  return favoriteRecipe.length !== 0;
}

async function isRecipeViewed(user_id, recipe_id) {
  const viewedRecipe = await DButils.execQuery(
    `select * from usersRecipesViews where user_id='${user_id}' AND recipe_id='${recipe_id}'`
  );
  return !(viewedRecipe.length === 0);
}

async function viewRecipe(user_id, recipe_id) {
  let isViewed = await isRecipeViewed(user_id, recipe_id);
  if (isViewed) {
    await DButils.execQuery(
      `DELETE FROM usersRecipesviews where user_id='${user_id}' AND recipe_id='${recipe_id}'`
    );
  }
  await DButils.execQuery(
    `insert into usersrecipesviews values ('${user_id}',${recipe_id})`
  );
}

async function getNewestViewedRecipes(user_id, num_of_recipes) {
  const recipes_id = await DButils.execQuery(
    `SELECT recipe_id FROM usersrecipesviews WHERE user_id = ${user_id} ORDER BY recipe_id DESC
    LIMIT ${num_of_recipes};
    `
  );
  return recipes_id;
}

async function addNewRecipeToDb(
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
) {
  popularity = 0;
  const newRecipe = await DButils.execQuery(
    `INSERT INTO usersPersonalRecipes (user_id, title, image, readyInMinutes, popularity, vegan, vegetarian, glutenFree, servingSize) VALUES ('${user_id}','${title}','${image}','${readyInMinutes}','${popularity}','${vegan}','${vegetarian}','${glutenFree}', '${servingSize}')`
  );
  let id = newRecipe.insertId;
  await addIngredientsAndQuantities(id, ingredientsAndQuantities);
  await addInstructions(id, instructions);
}

async function addInstructions(recipe_id, instructions) {
  for (let instruction of instructions) {
    let { number, step } = instruction;
    await DButils.execQuery(
      `insert into instructions values ('${number}','${step}','${recipe_id}')`
    );
  }
}

async function addIngredientsAndQuantities(
  recipe_id,
  ingredientsAndQuantities
) {
  for (let ingredient of ingredientsAndQuantities) {
    let { originalName, amount } = ingredient;
    await DButils.execQuery(
      `insert into ingredientsAndQuantities values ('${originalName}','${amount}','${recipe_id}')`
    );
  }
}

async function getPersonalRecipe(recipe_id) {
  const personalRecipe = await DButils.execQuery(
    `SELECT * FROM usersPersonalRecipes WHERE recipe_id = ${recipe_id}`
  );
  return personalRecipe[0];
}

async function getIngredients(recipe_id) {
  return await DButils.execQuery(
    `SELECT * FROM ingredientsAndQuantities WHERE recipe_id_ingredients = ${recipe_id}`
  );
}

async function getInstructions(recipe_id) {
  return await DButils.execQuery(
    `SELECT * FROM instructions WHERE recipe_id_instructions = ${recipe_id}`
  );
}

exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.isRecipeFavorite = isRecipeFavorite;
exports.isRecipeViewed = isRecipeViewed;
exports.viewRecipe = viewRecipe;
exports.getNewestViewedRecipes = getNewestViewedRecipes;
exports.addNewRecipeToDb = addNewRecipeToDb;
exports.getPersonalRecipe = getPersonalRecipe;
exports.getIngredients = getIngredients;
exports.getInstructions = getInstructions;
exports.getPersonalRecipes = getPersonalRecipes;
