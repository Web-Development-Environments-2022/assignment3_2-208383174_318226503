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

async function isRecipeFavorite(user_id, recipe_id) {
  const favoriteRecipe = await DButils.execQuery(
    `select * from FavoriteRecipes where user_id='${user_id}' AND recipe_id='${recipe_id}'`
  );
  return favoriteRecipe.length !== 0;
}

async function isRecipeViewed(user_id, recipe_id) {
  const viewedRecipe = await DButils.execQuery(
    `select * from usersRecipesviews where user_id='${user_id}' AND recipe_id='${recipe_id}'`
  );
  return viewedRecipe.length !== 0;
}

async function viewRecipe(user_id, recipe_id) {
  if (isRecipeViewed(user_id, recipe_id)) {
    console.log(`the recipe was viewed`);
    await DButils.execQuery(
      `DELETE FROM usersRecipesviews where user_id='${user_id}' AND recipe_id='${recipe_id}'`
    );
  }
  await DButils.execQuery(
    `insert into usersRecipesviews values ('${user_id}',${recipe_id})`
  );
}

async function getNewestViewedRecipes(user_id, num_of_recipes) {
  const recipes_id = await DButils.execQuery(
    `SELECT recipe_id FROM  usersrecipesviews WHERE  user_id = ${user_id} ORDER  BY recipe_id DESC
    LIMIT ${num_of_recipes};
    `
  );
  return recipes_id;
}

exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.isRecipeFavorite = isRecipeFavorite;
exports.isRecipeViewed = isRecipeViewed;
exports.viewRecipe = viewRecipe;
exports.getNewestViewedRecipes = getNewestViewedRecipes;
